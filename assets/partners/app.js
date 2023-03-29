import { createItem, fetchPartners, renderItems } from './utility/utility'


(async function () {
  const template_element = document.querySelector('.biller-result-card.hidden');
  const results_area = document.querySelector('.biller-result');
  const search_input = $('#field-2');

  results_area.style.opacity = '1';
  //Get the data from URL source
  let partnersData = await fetchPartners('https://lxpocampofrost.github.io/gcash-stylesheet/assets/partners.json');
  //Initialize an empty array
  let filterd_items = [];

  //Display the data
  let domItems = partnersData.map((item) => createItem(item, template_element));

  domItems.map((item) => results_area.append(item));

  //Create search functionality
  search_input.on("input", function () {
    let inputValue = $(this).val().toLowerCase();

    filterd_items = partnersData.filter((item) =>
      item.name.toLowerCase().includes(inputValue)
    );

    renderItems(results_area, filterd_items, template_element);
  });


  //Create pagination


})();
