const fs = require('fs');
const COMPONENTS_FOLDER = 'sources/sass/page/components/';
const GLOBAL_COMPONENTS_FOLDER = 'sources/sass/page/components/global-components/';
const MODIFIER_FOLDER = 'sources/sass/page/components/modifiers/';

// Write all components into a components file
let writeIntoFile = (source, type) => {
    
    let buffer = [
        '// This is an AUTO-GENERATED file',
        '// Don\'t overwrite. Use #beebop command instead.\n'
    ],

    file = discover(source, type);

    // Add the modifiers list into the list if
    // type type is set as components
    if (type === 'components') {
        buffer.push('// Component modifiers');
        buffer.push('@import \'modifiers/modifiers-list\';\n');
        // buffer.push('@import \'responsive-modifiers/responsive-modifiers-list\';\n');
    }

    file.forEach(item => {
        buffer.push('@import \'' + item + '\';');
    });

    // write to file
    fs.writeFileSync(source + '_' + type + '-list.scss', buffer.join('\n'));
};

// Discover all known components found
let discover = (source, type) => {
    let components = [];
    fs.readdirSync(source).forEach(file => {
        let match = /_(.+)\.scss/.exec(file);

        if (file === '_' + type + '-list.scss') {
            return;
        }

        // only include valid components
        if (match) {
            let component = match[1];
            components.push(component);
        }
    });

    return components;
};

////////////////////////////////////////////////////////////////////////////////////
// Read the list of components
let arguments = process.argv.splice(2);

// switch between commands
let command = arguments[0];

switch (command) {
    
    case 'create-component':
        let componentName = arguments[1];
        console.log('Creating a new component:', componentName);

        // Create a blank file with the component scss file
        fs.writeFileSync(
            COMPONENTS_FOLDER + '_' + componentName + '.scss', 
            '// Declare your components here'
        );

        writeIntoFile(COMPONENTS_FOLDER, 'components');
        console.log('Done.');
    break;

    case 'create-modifier':
        let modifierName = arguments[1];
        console.log('Creating a new component modifier:', modifierName);

        // Create a blank file with the component scss file
        fs.writeFileSync(
            MODIFIER_FOLDER + '_' + modifierName + '-modifiers.scss',
            '// Declare your component modifier here'
        );
        writeIntoFile(MODIFIER_FOLDER, 'modifiers');
        console.log('Done.');
    break;

    case 'create-package':
        let packageName = arguments[1];
        console.log('Creating a new component package:', packageName);

        fs.writeFileSync(
            COMPONENTS_FOLDER + '_' + packageName + '.scss',
            '// Declare your component here'
        );
        fs.writeFileSync(
            MODIFIER_FOLDER + '_' + packageName + '-modifiers.scss',
            '// Declare your component modifier here'
        );

        writeIntoFile(COMPONENTS_FOLDER, 'components');
        writeIntoFile(MODIFIER_FOLDER, 'modifiers');
        
        console.log('Done.');
    break;

    case 'rebuild':
        console.log('Rebuilding components and modifiers list file...');

        writeIntoFile(COMPONENTS_FOLDER, 'components');
        writeIntoFile(MODIFIER_FOLDER, 'modifiers');
        
        writeIntoFile(GLOBAL_COMPONENTS_FOLDER, 'global-components');

        console.log('Done.');
    break;

    
}


