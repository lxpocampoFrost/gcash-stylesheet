module.exports = {
    color: data => {
        return `<div class="data" data-name="$${data.name}-color" data-value="${data.value}">
            <span style="background-color:${data.value}" 
                    data-value="${data.value}">
            </span>
        </div>`;
    },

    space: data => {
        return `
        <div class="data" data-name="$${data.name}-space" data-value="${data.value}">
            <span style="width:${data.value}; height:${data.value};"></span>
        </div>`;
    },

    "icon-size": data => {
        return `
        <div class="data" data-name="$${data.name}-icon-size" data-value="${data.value}">
            <span style="width:${data.value}; height:${data.value}"></span>
        </div>`;
    },

    "font-size": data => {
        return `
        <div class="data" data-name="$${data.name}-font-size">
            <span style="font-size:${data.value}" data-value="${data.value}">Design System</span>
        </div>`;
    },

    codeView: html => {
        return `
            <div class="code-viewer"></div>
            <div class="--code">
                <pre>${html}</pre>
            </div>
        `;
    },

    indexItem: name => {
        return `
        <li class="index-item">
            <a href="#${name}">${name}</a>
        </li>`;
    },

    tokenBlock: data => {
        return `
            <div class="section-content">${data.tpl}</div>
        `;
    },

    variableItem: data => {
        return `<div class="item">
            <span class="name">${data.variable}</span>
            <span class="value">${data.compiledValue}</span>
        </div>`;
    },

    mixinItem: data => {
        return `<div class="item">
            <span class="name">${data.name}</span>
            <span class="parameters">${data.parameter}</span>
        </div>`;
    },

    groupTableBlock: data => {
        return `
            <strong class="section-sub-heading">${data.group}</strong>
            <div class="table-group">${data.tpl}</div>
        `;
    },

    tableDataBlock: data => {
        return `<div class="table-group">${data.tpl}</div>`;
    }
    
};