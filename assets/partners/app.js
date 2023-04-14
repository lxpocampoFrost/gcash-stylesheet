/**
 * Creates an item from the template element.
 * @param product The product data to create the item from.
 * @param templateElement The template element.
 *
 * @returns A new Collection Item element.
 */
const createItem = (item, templateElement) => {


    // Clone the template element
    const newItem = templateElement.cloneNode(true);
    newItem.classList.remove('hidden');

    // Query inner elements
    const name = newItem.querySelector('.biller-item-title');
    const payment_date = newItem.querySelector('.biller-item-description');
    const gcredit = newItem.querySelector('[data-element="gcredit"]');
    const fee = newItem.querySelector('[data-element="gcredit"]');


    // Populate inner elements
    if (name) name.textContent = item.name || item.Name;
    if (payment_date) payment_date.textContent = item.payment_date;


    return newItem;
};

/**
* Methods to fetch Partners data
* @method fetchPartners() Returns Array from API that uses JSON
*/
async function fetchPartners(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();

        return data;
    } catch (error) {
        console.log('fetchPartners(): ', error.message);
        return [];
    }
};
/**
* Creates an item from the template element.
* @param results_area The element where results are displayed
* @param filter_data Filtered data to be converted 
*
* @returns A collection of dom elements.
*/
function renderItems(results_area, filter_data, template_element) {
    //Clear the children of results
    results_area.textContent = '';

    //Get converted items
    let newItems = filter_data.map((item) => createItem(item, template_element));

    //Append new filtered itesm to HTML
    newItems.map((item) => results_area.append(item));

    results_area.animate(
        {
            opacity: [0, 1]
        },
        300
    )
}



(async function () {
    const template_element = document.querySelector('.biller-result-card.hidden');
    const results_area = document.querySelector('.biller-result.billers_collection-list');
    const search_input = $('#field-2');
    const pagination_container = $('#pagination-area');
    let arrowSVG = `<svg width="41" height="41" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20.5" cy="20.4922" r="19" stroke="#025AE9" stroke-width="2"/>
    <path d="M19 24L23 20L19 16" stroke="#025AE9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    `

    console.log(results_area);

    results_area.style.opacity = '1';
    //Get the data from URL source
    let partnersData = await fetchPartners('https://lxpocampofrost.github.io/gcash-stylesheet/assets/partners.json');
    //Initialize an empty array
    let filterd_items = [];

    //Converts data to node elements
    // let domItems = partnersData.map((item) => createItem(item, template_element));

    //Appends newly converted elements to results area
    // domItems.map((item) => results_area.append(item));

    //Input search functionality
    search_input.on("input", function () {
        let inputValue = $(this).val().toLowerCase();

        filterd_items = partnersData.filter((item) =>
            item.name.toLowerCase().includes(inputValue)
        );
        // updatePagination(filterd_items);
        // renderItems(results_area, filterd_items, template_element);
        pagination_container.pagination('destroy');
        pagination_container.pagination({
            ulClassName: 'pagination-list-wrapper',
            dataSource: filterd_items,
            prevText: arrowSVG,
            nextText: arrowSVG,
            pageSize: 15,
            callback: function (data, pagination) {
                console.log(pagination);
                // template method of yourself
                renderItems(results_area, data, template_element);
            }
        })

    });

    pagination_container.pagination({
        ulClassName: 'pagination-list-wrapper',
        dataSource: partnersData,
        prevText: arrowSVG,
        nextText: arrowSVG,
        pageSize: 15,
        callback: function (data, pagination) {

            // template method of yourself
            renderItems(results_area, data, template_element);
        }
    })


    /*
        ToDo: 
        - Search input and billers dropdown should filter from filtered_items
        - Pagination gets from filtered items
    */


    //Create pagination
})();



