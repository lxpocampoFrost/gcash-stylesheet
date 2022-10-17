const path = require('path');

module.exports = {
    experiments: {
        outputModule: true,
    },
    entry : {
       ds : "./sources/js-source/design-system/design-system.js",
       app: "./sources/js-source/app/app-ts.ts",
   },
   mode  : 'production',
   output: {
        filename: "[name].js",
        path    : path.resolve(__dirname, 'assets/js'),
        clean   : true
   },
   resolve: {
       extensions: [".ts", ".js"]
   },
   module: {
       rules: [{ test: /\.ts$/, loader: "ts-loader" }]
   }
}