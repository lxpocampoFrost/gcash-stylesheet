/**
 * Map Methods and variables
 * @var map The global GMaps object
 * 
 * @method initMap() Initialized the map UI of Google Maps
*/
let map;

//Saves a copy of the template element


function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: { lat: 14.40, lng: 121.03 },
    disableDefaultUI: true,
    styles: [
      {
      "featureType": "poi",
      "stylers": [
        { "visibility": "off" }
      ]
      },
    ]
  });
}

/**
 * Creates an item from the template element.
 * @param product The product data to create the item from.
 * @param templateElement The template element.
 *
 * @returns A new Collection Item element.
 */
const createItem = (product, templateElement) => {

  // Clone the template element
  const newItem = templateElement.cloneNode(true);
  // Query inner elements
  const name = newItem.querySelector('[data-element="name"]');
  const address = newItem.querySelector('[data-element="address"]');
  const city = newItem.querySelector('[data-element="city"]');
  const distance = newItem.querySelector('[data-element="distance"]');

  // Populate inner elements
  if (name) name.textContent = product.name || product.Name;
  if (address) address.textContent = product.address || product.Address;
  if (city) city.textContent = product.city || product.City;

  return newItem;
};

/**
 * Method to render data to HTML
 * @param  partnerData 
 *  Array that holds filtered data
 * @param  templateElementID
 *  ID of the element that holds the base structure 
 * @method renderDataToHTML
 *  Renders items to the results panel
 * 
*/ 
function renderDataToHTML(partnerData, templateElement) {
  let newItems = partnerData.map((item) => createItem(item, templateElement));

  //Clear initial elements
  $('.map_search-results').empty();

  //Append to HTML
  newItems.slice(0, 4).map(item => {
    $('.map_search-results').append(item);
  });

  $('.map_filtered-items-number').text(partnerData.length);
}

function filterByInput(partnerData, templateElement) {
  $( ".map_search-input.w-input" ).on("input", function() {
    let inputValue = $(this).val().toLowerCase();
    
    filteredData = partnerData.filter((item) => 
      item.name.toLowerCase().includes(inputValue) ||
      item.city.toLowerCase().includes(inputValue) ||
      item.address.toLowerCase().includes(inputValue)
    );

    if (filteredData.length != 0) {
      renderDataToHTML(filteredData, templateElement);
    } else {
      $('.map_search-results').empty();
    }
  });
}


/**
 * Methods to filter incoming data based on user position 
 * @param  regionStr 
 *  A string that resembles the 
 *  numbered region's name in word form
 * @method convertToRegion
 *  Converts google's naming of regions, 
 *  to the numbered version ex. Region IX, Region I
 * 
 * @param coords 
 *  An object with lat and lng values
 * @method getUserLocationData 
 *  Returns array that contains user's city, region and address
 * 
 * @param userLocation 
 *  An object that holds details 
 *  of users location, city, region and address
 * @param partnersData
 *  An Array that holds objects with values of partners
 * @method getUserLocationData 
 *  Returns array that contains user's city, region and address
 * 
*/ 
function convertRegion(regionString) {   
  switch(regionString.toLowerCase()) {
      case 'ilocos region': 
          regionString = 'Region I';
          break
      case 'cagayan valley': 
          regionString = 'Region II';
          break
      case 'central luzon': 
          regionString = 'Region III';
          break
      case 'calabarzon': 
          regionString = 'Region IV-A';
          break
      case 'mimaropa': 
          regionString = 'Region IV-B';
          break
      case 'bicol': 
          regionString = 'Region V';
          break
      case 'western visayas': 
          regionString = 'Region VI';
          break
      case 'central visayas': 
          regionString = 'Region VII';
          break
      case 'eastern visayas': 
          regionString = 'Region VIII';
          break
      case 'zamboanga peninsula': 
          regionString = 'Region IX';
          break
      case 'northern mindanao': 
          regionString = 'Region X';
          break
      case 'davao region': 
          regionString = 'Region XI';
          break
      case 'soccsksargen': 
          regionString = 'Region XII';
          break
      case 'caraga': 
          regionString = 'Region XIII';
          break
      case 'armm':
          regionString = 'BARMM';
      default:
          regionString = regionString;
  }

  return regionString;
}

async function getUserLocationData(coords) {
  let url ='https://maps.googleapis.com/maps/api/geocode/json?latlng=' + coords.lat +',' + coords.lng +
  '&key=AIzaSyD1lDeWCObDolArPKOXaO2OeQxAlgZBZGY&region=US&language=en';

  try {
    let response = await fetch(url).then((response) => response.json());
    let city = response.results.find(item => item.types[0]  === 'locality');
    let region = response.results.find(item => item.types[0]  === 'administrative_area_level_1');
    let addresObj = {
      city: city.address_components[0].long_name,
      region: convertRegion(region.address_components[0].short_name),
      address: response.results[0].formatted_address
    }

    $('.map_location-tag-result').text(addresObj.city + ", " + addresObj.region);

    return addresObj;
  } catch (error) {
    console.log('user location data: ', error.message);
  }
}

function filterByLocation(userLocation, partnersData) {

  let initialFilter = partnersData.filter((item) => 
    item.city.toLowerCase().includes(userLocation.city.toLowerCase()) &&
    item.region.toLowerCase().includes(userLocation.region.toLowerCase())
  );

  return initialFilter;
}



/**
 * Methods to get user position
 * @method getPosition() Gets user position and returns promise from navigator
 * @method getCoordinates() Returns object with lat and long values
*/ 
function getPosition(options) {
  return new Promise((resolve, reject) => 
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
      })
  );
}

async function getCoordinates() {
  try {
    const response = await getPosition();
    let coordinates = {
      lat: response.coords.latitude,
      lng: response.coords.longitude,
    }

    return coordinates;
  } catch (error) {
    console.log('getCoordinates(): ', error.message);
  }
}

/**
 * Methods to fetch Partners data
 * @method fetchPartners() Returns Array from API that uses JSON
*/ 
async function fetchPartners () {
  try {
    const response = await fetch('https://lxpocampofrost.github.io/gcash-stylesheet/assets/billers.json');
    const data = await response.json();

    return data;
  } catch (error) {
    console.log('fetchPartners(): ', error.message);
    return [];
  }
};

//Our Main method where all other functions are called
async function initializeFilterData() {
  try {
    //Save a copy of the template element
    let templateElement = document.getElementById('map_search-item');

    //Get partners data
    let partnersData = await fetchPartners();
    //Get user coodinates
    let coordinates = await getCoordinates();
    //Get location from coordinates
    let userLocation = await getUserLocationData(coordinates);
    
    //Filter partners data based on user location
    let filteredPartners = filterByLocation(userLocation , partnersData);

    //Render the data to HTML 
    renderDataToHTML(filteredPartners, templateElement);
    filterByInput(filteredPartners, templateElement);
    


  } catch (error) {
    console.log('Main method: ', error.message);
  }
}

initializeFilterData();

window.initMap = initMap;