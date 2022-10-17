"use strict";

import $ from './libs/jquery';
import _ from './libs/lodash';
import _eq from './libs/eq';

const partials = require("./classes/partials-template"),
    tagsToReplace = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;"
    };

let visibleSections = {
    all: true,
    global: true,
    reference: true,
    component: true,
    modifier: true
};

_.mixin({
    sortKeysBy: function(obj, comparator) {
        let keys = _.sortBy(_.keys(obj), function(key) {
            return comparator ? comparator(obj[key], key) : key;
        });

        let sortedObject = {};
        _.each(keys, key => {
            sortedObject[key] = obj[key];
        });

        return sortedObject;
    }
});

let safeTagReplace = (str) => {
    return str.replace(/[&<>]/g, tag => {
        return tagsToReplace[tag] || tag;
    });
};

/**
 * Discover declared elements
 * 
 * @param {*} Elements block
 * @param {*} includeHTML 
 * @param {*} index 
 */
let discoverElements = ($elements, includeHTML, index) => {

    _.each($elements, element => {
        let $el = $(element);
        let className = $el.attr("class");
        let classes = className.split(" ");
        
        let isIgnored = _.indexOf(classes, "--ignore") > -1,
            shouldExplore = _.indexOf(classes, "--explore") > -1;

        let name = $el.attr("data-name");

        className = typeof name !== "undefined" ? name : className;

        if (!isIgnored) {
            
            let $wrappedEl = $el.wrap(`<div class="--element" data-class-name="${className}"/>`);

            $el = $el.wrap('<div class="--wrap"/>');
            
            let isComponent = false,
                indexDetail = {
                    name: className
                };

             $el.before(`<a name="${className}" />`);

            // Include HTML as output
            if (includeHTML) {
                let html = safeTagReplace(
                    window.html_beautify($el[0].outerHTML, {
                        indent_size: 4,
                        end_with_newline: true,
                        wrap_line_length: 40
                    })
                );

                $wrappedEl
                    .parent()
                    .after(partials.codeView(html));
                isComponent = true;
            }

            index.push(indexDetail);
        }

        if (shouldExplore) {
            discoverElements($el.find("> *"), includeHTML, index);
        }
    });

    return index;
};

/**
 * Add Elements to index
 * 
 * @param {*}  
 * @param {*} classIndex 
 */
let addIndex = ($indexEl, classIndex) => {
    _.each(classIndex, index => {
        $indexEl.append(partials.indexItem(index.name));
    });
};

/**
 * Group mixins based on components (for component modifiers)
 * 
 * @param {*} mixins 
 */
let groupMixins = (mixins) => {
    let modifierPattern = /(.+)?\-\-(.+)?/gi;

    let mixinsGroup = {
        globals: [],
        modifiers: {}
    };

    _.each(mixins, mixin => {
        if (mixin.name.match(modifierPattern)) {

            let mixinDetail = modifierPattern.exec(mixin.name),
                component = mixinDetail[1];

            if (!mixinsGroup.modifiers.hasOwnProperty(component)) {
                mixinsGroup.modifiers[component] = [];
            }

            mixinsGroup.modifiers[component].push(mixin);
        } else {
            mixinsGroup.globals.push(mixin);
        }
    });

    mixinsGroup.modifiers = _.sortKeysBy(mixinsGroup.modifiers);
    
    return mixinsGroup;
};

/*-----------------------------------------------------------------------------*/
/**
 * Rendering partial and injecting it into the DOM
 * 
 * @param {*} selector 
 * @param {*} renderedPartial 
 */
let renderPartial = (selector, renderedPartial) => {
    $(selector)
        .find(".section-content")
        .append(renderedPartial);
};

/**
 * Join rendered partials and stringify it's content
 * 
 * @param {*} partials 
 */
let renderPartialBlocks = (partials) => {
    return partials.join("");
};

/**
 * Render mixin and it's parameters
 * 
 * @param {*} mixin 
 */
let renderMixinItem = (mixin) => {

    let parameters = renderPartialBlocks(
        _.map(mixin.parameters, param => {
            return `<span>${param}</span>`;
        })
    );
    
    return partials.mixinItem({
        name: mixin.name,
        parameter: parameters
    });
};

/**
 * Render a list of mixins
 * 
 * @param {*} mixins 
 */
let renderMixinTable = (mixins) => {
    return renderPartialBlocks(
        _.map(mixins, mixin => renderMixinItem(mixin))
    );
};

/**
 * Render sections from the Design Guidelines
 */
let renderSections = () => {

    let designTokens = _.sortKeysBy(require("./design-token.json")),
        sassReferences = require("./exodus-references.json");

        sassReferences.mixins = _.sortKeysBy(sassReferences.mixins);
        
    let $elementGroups = $(".element-group"),
        $indexes = $(".index-group"),
        variables = sassReferences.globals,
        groupedMixins = groupMixins(sassReferences.mixins),
        mixins = groupedMixins.globals,
        modifiers = groupedMixins.modifiers,
        $tokenGroups = $(".--map-to-tokens");

    /* Add section block title */
    _.each($('.section-block'), section => {
        let $section = $(section),
            name = $section.attr('data-name');
            $section.prepend(`<div class="name">${name}</div>`);
    });

    /* Generate elements block */
    _.each($elementGroups, (group) => {
        let $group = $(group),
            name = $group.attr('data-name'),
            showCode = $group.hasClass('--show-code');
        
        let $elements = $group.find('.element > *');
        let index = discoverElements($elements, showCode, []);

        $indexes.append(`<ul class="index-list" data-label="${name}"></ul>`);

        addIndex($('.index-list[data-label="' + name + '"]'), index);
    });

    ////////////////////////////////////////////////////////
    /* Design Token specific block */
    _.each($tokenGroups, (group) => {
        let $group = $(group),
            name = $group.attr("data-name"),
            tokenIndex = $group.attr("data-token-index"),
            tokens = [];

        _.each(designTokens[tokenIndex], (value, name) => {
            value = _.find(variables, {
                variable: "$" + name + "-" + tokenIndex
            });

            tokens.push({ name: name, value: value.compiledValue });
        });

        // if there is a token block
        if (partials.hasOwnProperty(tokenIndex)) {
            $group.append(
                partials.tokenBlock({
                    name: name,
                    tpl: renderPartialBlocks(_.map(tokens, token => {
                        return partials[tokenIndex](token);
                    }))
                })
            );
        }        
    });

    ////////////////////////////////////////////////////////
    /** Global Variable block  */
    renderPartial(".global-variables", 
        renderPartialBlocks(
            _.map(designTokens, (tokens, scope) => {

                tokens = _.map(tokens, (value, variable) => {
                    variable = _.find(variables, {
                        variable: `$${variable}` + ((scope != '') ? `-${scope}` : '')
                    });

                    if (variable.compiledValue.match(/solid/)) {
                        variable.compiledValue = variable.compiledValue.replace('solid', ' solid ');
                    }

                    return partials.variableItem(variable);
                });

                return partials.groupTableBlock({
                    group: (scope) ? scope : '&mdash;',
                    tpl: renderPartialBlocks(tokens)
                });
            })
        )
    );

    ////////////////////////////////////////////////////////
    /** Global mixins block */
    renderPartial(".global-mixins", 
        partials.tableDataBlock({
            tpl: renderMixinTable(mixins)
        })
    );
    
    ////////////////////////////////////////////////////////
    /** Component Modifiers block */
    renderPartial(".component-modifiers", 
        renderPartialBlocks(_.map(
            modifiers,
            (componentModifiers, component) => {
                return partials.groupTableBlock({
                    group: component,
                    tpl: renderMixinTable(componentModifiers)
                });
            }
        ))
    );
};

let toggleSectionVisibility = (targetSection) => {

    let $displayPanels = $('.display-panels');

    if (targetSection === 'all') {
        // activate all blocks
        _.each(
            visibleSections,
            (isVisible, section) => {
                visibleSections[section] = true;
            }
        );

        $displayPanels.addClass('-show-index');
    } else {
        // reset view first
        _.each(
            visibleSections,
            (isVisible, section) => {
                visibleSections[section] = false;
            }
        );

        // toggle visibility of that section
        visibleSections[targetSection] = true;
        // only show index if the target section is: component
        $displayPanels.toggleClass('-show-index', (targetSection === 'component'));
    }

    // show only the visible sections
    _.each(visibleSections, (isVisible, section) => {
        $(`.section-link[data-target="${section}"]`).toggleClass('-active', isVisible);
        $(`.section-block.-${section}`).toggleClass('-section-is-hidden', !isVisible);
    });

    $('body,html').scrollTop(0);
};

/**
 * Bind Events
 */
let bindEvents = () => {

    // time to read all the classes
    let $previewPane = $(".preview-pane");

    ////////////////////////////////////////////////////////
    // toggle global code view
    $('.toggle-code-view')
        .on('click', (e) => {
            let $el = $(e.currentTarget).find(".switch"),
                codeIsVisible = $el.hasClass("-active");

            $el.toggleClass("-active");
            $previewPane.toggleClass('-hide-code', codeIsVisible);
            $(".--element").removeClass("-code-visible");            
        });

    $('.code-viewer')
        .on('click', (e) => {
            if ($previewPane.hasClass('-hide-code')) {
                let $el = $(e.currentTarget).parent();
                $el.toggleClass("-code-visible");
            }
        });  

    $('.section-link-group > .section-link')
        .on('click', e => {
            let $el = $(e.currentTarget);

            toggleSectionVisibility($el.attr("data-target"));
        });

    $('.toggle-sidebar').on('click', function(e) {
        let $el = $(e.currentTarget).find(".switch");

        $el.toggleClass("-active");
        $(".index-group").toggleClass('-hide-index');
        $(".control-bar").toggleClass('-full-width');
        $(".preview-pane").toggleClass('-full-width');
    })
};

(() => {
    renderSections();
    toggleSectionVisibility('all');
    bindEvents();
})();