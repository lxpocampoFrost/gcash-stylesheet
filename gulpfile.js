"use strict";

const _             = require("lodash");
const gulp          = require("gulp");
const sass          = require("gulp-sass");
const sourcemaps    = require("gulp-sourcemaps");
const autoprefixer  = require("gulp-autoprefixer");
const sassExport    = require('gulp-sass-export');
const log           = require('fancy-log');
const beautify      = require("js-beautify").html;
const ncp           = require('ncp').ncp;
const glob          = require("glob");
const path          = require("path");
const webpack       = require("webpack");
const webpackStream = require('webpack-stream');
const fs            = require('fs');
const exec          = require('child_process').exec;

const jsSource   = "./sources/js-source";
const sassSource = "./sources/sass";
const assets     = "./assets";
const js         = assets + "/js/";
const css        = assets + "/css/";

const webpackConfig = require("./webpack.config.js");

ncp.limit = 16;

async function generateSassReference() {

    let sourceFiles = [
        sassSource + "/page/common/globals/_token-variables.scss",
        sassSource + "/page/common/globals/_mixins.scss",
        sassSource + "/page/components/modifiers/*.scss",
    ];

    gulp
        .src(sourceFiles)
        .pipe(sassExport({
                fileName: "exodus-references.json",
                dependencies: [
                    sassSource + "/page/common/globals/",
                    sassSource + "/page/components/modifiers/",
                    sassSource + "/page/components/"
                ]
            }))
        .pipe(gulp.dest(jsSource + "/app/"));
        
    log("-- SASS Reference successfully generated");
}

/*----------------------------------------
 SOURCE DIRECTORIES
 *---------------------------------------- */

gulp.task("default", gulp.parallel(watch));

function watch(done) {
    
    log('-- Awaiting changes...');
    gulp.watch(sassSource + "/**/*.scss", {usePolling: true}, buildSass)

    gulp.watch(jsSource + "/**/*.js", {usePolling: true}, buildJsViaWebpack);
    gulp.watch(jsSource + "/**/*.ts", {usePolling: true}, buildJsViaWebpack);

    gulp.watch("./templates/**/*.tpl", {usePolling: true}, buildTemplates);
    gulp.watch("./_*.tpl", {usePolling: true}, buildTemplates);

    // Watch for any changes on the javascript for
    // both classes, libs and pages
    gulp.watch("./sources/design-token.json", {usePolling: true}, gulp.series(generateSassFromToken, buildJsViaWebpack));

    done();
}

gulp.task("build-tpl", gulp.series(buildTemplates));
gulp.task("build-js", gulp.series(buildJsViaWebpack));

// Do a clean rebuild
gulp.task("rebuild", 
    gulp.series(
        generateSassFromToken,
        gulp.parallel(buildSass, buildJsViaWebpack, buildTemplates)
    )
);

gulp.task("release", gulp.series(async () => {
    console.log('Preparing components for release');

    // Create a template refereces for interpolation
    let templateFiles = glob.sync("templates/**/*.tpl"),
        templates     = {};

    // Discover all templates
    for (let file in templateFiles) {
        file = templateFiles[file];

        let template = /templates\/(.+?)\.tpl/gi.exec(file)[1],
            text = fs.readFileSync(file, "utf8");

        template = path.basename(file, '.tpl');
        templates[template] = text;
    }

    // --------------------------------------------------------
    // Visible templates:
    _.each(templates, (partial, name) => {
        interpolateTemplate(partial, name, templates);
    });

    let components = fs.readFileSync('component-lists', 'utf8').split('\n');
    components.forEach(component => {
        let componentDirectory = `./release/${component}`;

        if (!fs.existsSync(componentDirectory)) {
            fs.mkdirSync(componentDirectory, { recursive: true });
        }

        // SCSS file to be created
        let globalMixins = fs.readFileSync(`${sassSource}/page/common/globals/_utility-mixins.scss`, "utf8");
        let componentScss = fs.readFileSync(`${sassSource}/page/components/_${component}.scss`, "utf8");

        // Create the SCSS file with the mixin included
        fs.writeFileSync(`${componentDirectory}/_${component}.scss`, `${globalMixins}\n\n ${componentScss}`, "utf8");

        // Creat the html file in their own folder
        fs.writeFileSync(`${componentDirectory}/${component}.html`, beautify(templates[component]), "utf8");

    })
}));


/*---------- CSS Pre-processor: SASS ----------*/

async function buildSass() {
    log('-- Building SASS files');

    gulp
        .src(sassSource + "/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: "compressed" }))
        .on("error", error => {
            // Would like to catch the error here
            console.log(error);
        })
        .pipe(
            autoprefixer({
                browsers: [
                    "last 2 version",
                    "safari 5",
                    "ie 8",
                    "ie 9",
                    "opera 12.1",
                    "ios 6",
                    "android 4"
                ],
                cascade: false
            })
        )
        .pipe(sourcemaps.write("/maps"))
        .pipe(gulp.dest(css));
}

/*------------------- JS ----------------------*/
/* JS Are bundling into browserify and uses a class format
 * with one-to-one file name to class name assignment
 * This makes code management easy for developers to call
 * and control
 * */

async function buildJsViaWebpack(done) {
    log('-- Building JS via Webpack');

    gulp
        .src('/script.dummy.js', {allowEmpty: true})
        .pipe(webpackStream(webpackConfig))
        .on('error', function(error) {    // Error reporting
            log(error.message);
            this.emit('end'); /* Allow Webpack to continue watching on error */
        });

    done();
}

/*
    This generate a sass file based on the design token
    files (design-token.json). These tokens are used to
    centralize variable declaration that can be shared to
    other digital assets
 */

 async function generateSassFromToken() {

    let tokenFile = "./sources/design-token.json";
    let tokens = JSON.parse(fs.readFileSync(tokenFile));
    let buffer = ["/* This file is generated through a design token. Don't edit this file */"];
    
    log("-- Generating Design tokens...");
    _.each(tokens, (values, scope) => {
        
        buffer.push(
            "/*---------------------------------------------------\n  " + 
            ((scope !== '') ? scope.toUpperCase() : 'NON-SCOPED VARIABLES') + 
            "\n---------------------------------------------------*/");

        _.each(values, (value, name) => {
            // for non scoped variables
            if (scope === "") {
                buffer.push("$" + name + ": " + value + ";");
            } else {
                buffer.push("$" + name + "-" + scope + ": " + value + ";");
            }
        });

        buffer.push("\n");
    });

    fs.writeFileSync(sassSource + "/page/common/globals/_token-variables.scss", buffer.join("\n"));

    // duplicate it on js-source folder as well
    fs.createReadStream(tokenFile)
        .pipe(fs.createWriteStream(jsSource+"/app/design-token.json"));

    log('-- SASS Token successfully created.');
    await generateSassReference();
};


let interpolateTemplate = (partial, name, templates) => {

    let exp = /{@([\w\-\d]+)?}/gi;
    let match = exp.exec(partial);

    if (match) {
        let target = match[1];
        partial = partial.replace(new RegExp(`{@${target}}`), templates[target]);
        templates[name] = partial;

        // re-iterpolate if there's still need to iterpolate
        if (exp.exec(partial)) {
            interpolateTemplate(partial, name, templates);
        }
    }
};

/*------------------ INDEX -------------------*/
/* Build index file for the final HTML form   */
async function buildTemplates(done) {
    log('-- Building HTML Files');

    let buildableTemplatesFiles = glob.sync("./_*.tpl"),
        templateFiles           = glob.sync("templates/**/*.tpl"),
        templates               = {};

    // Discover all templates
    for (let file in templateFiles) {
        file = templateFiles[file];

        let template = /templates\/(.+?)\.tpl/gi.exec(file)[1],
            text     = fs.readFileSync(file, "utf8");

        template = path.basename(file, '.tpl');
        templates[template] = text;
    }

    // --------------------------------------------------------
    // Visible templates:
    _.each(templates, (partial, name) => {
        interpolateTemplate(partial, name, templates);
    });

    // Find all buildable templates that will be interpolated
    _.each(buildableTemplatesFiles, (tpl) => {
        let templateName = tpl.match(/_(.+)\.tpl/)[1];
        let templateFile = fs.readFileSync(tpl, 'utf8');

        _.each(templates, (tpl, name) => {
            templateFile = templateFile.replace(new RegExp(`{[@$]${name}}`, "g"), tpl);
        });

        fs.writeFileSync(`${templateName}.html`, beautify(templateFile), "utf8");
    });

    // Rebuild the templates and fill in the variables
    log('Running template generator...');
    exec('php generator.php');

    done();
};