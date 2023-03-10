let GlobalCity = ''
let GlobalRegion = ''

const fetchProducts = async () => {
  try {
    const response = await fetch('https://lxpocampofrost.github.io/gcash-stylesheet/assets/billers.json');
    const data = await response.json();
    
    // var ul_data = data.slice(0, 5);
    return data;
  } catch (error) {
    return [];
  }
};

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
  function renderRoutes(directions) {
    $('#steps-sidebar').empty();
    directions.forEach((direction) => {
      $('#steps-sidebar').append(
        `
        <div class="steps">
          <div class="adp-maneuver-icon adp-${direction.maneuver}"></div>
          <div class="content">
            <p class="instructions">${direction.instructions}</p>
            <span class="distance">${direction.distance.value}m</span>
          </div>
        </div>
        `
      );
    });
  }
  function calculateAndDisplayRoute(directionsService, directionsRenderer,coordinates) {
    console.log('running..')
    const start = coordinates.lat + ',' + coordinates.lng;
    const end = document.getElementById("end").value;
    const selectedMode = document.getElementById("mode").value;
    const data = null;
    directionsService
      .route({
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode[selectedMode],
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
        let directions = directionsRenderer.getDirections()
        renderRoutes(directions.routes[0].legs[0].steps);
      })
      .catch((e) =>
        window.alert("Directions request failed due to " + status)
      );
  }
  const onChangeHandler = function (coords) {
    let endInput = $('#end');
    let startInput = $('#start');
    let startLocation = $('.starting-point .highlight.start-address');
    startLocation.text(startInput.val());
    calculateAndDisplayRoute(directionsService, directionsRenderer, coords);
  };
  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
      infoWindow.setPosition(pos);
      infoWindow.setContent(
          browserHasGeolocation
              ? 'Error: The Geolocation service failed. Check if browser was allowed to get location.'
              : "Error: Your browser doesn't support geolocation."
      );
      infoWindow.open(map);
      $('.map_location-tag-result').text('Geolocation failed');
  }
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
  function getDistances(requestObj) {
    if(Object.keys(pos).length != 0) {
        service.getDistanceMatrix(requestObj).then((response) => {
            response.rows[0].elements.forEach(function(element, i) {
                let distance = element.distance.text.replace(/\s/g, '');
                $('.map_search-results .map_search-item-distance').eq(i).text(distance);
            });
        });
    }
  }
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const directionsService = new google.maps.DirectionsService();
  directionsRenderer.setMap(map);

  const control = document.getElementById("floating-panel");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);
  const service = new google.maps.DistanceMatrixService();
  let pos = {};
  let destination_array = [];
  $('.map_search-results').children().each(function() {
      destination_array.push($(this).text());
  });
  let request = {
    origins: [pos],
    destinations: destination_array,
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.METRIC,
    avoidHighways: false,
    avoidTolls: false,         
  }
 

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            // Get the current position in longitude and latitude format
            var url =
                'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + pos.lat +',' + pos.lng +
                '&key=AIzaSyD1lDeWCObDolArPKOXaO2OeQxAlgZBZGY&region=US&language=en';

            //Gets address Data
            fetch(url)
            .then((response) => response.json())
            .then((data) => {         
              let jsonData = [];
              let partnerData = fetchProducts();
              let templateElement = document.getElementById("map_search-item");
              //Sets initial address of user
              let userAddress = data.results[0].formatted_address;

              //Gets the locality/city name, if not available gets administrative_area_level_2 instead
              let addresObj = data.results.find(item => item.types[0]  === 'locality' );
              city = addresObj.address_components[0].long_name;
              
              //Finds object with the array that has the 'administrative_area_level_1' value
              let regionObj = data.results.find(item => item.types[0]  === 'administrative_area_level_1' );
              
              //Updates HTML with the values for city and region
              $('.map_location-tag-result').text(city + ", " + convertRegion(regionObj.address_components[0].short_name));
              $('.outlets_highlight.start-address').text(userAddress);

         
              partnerData.then(function(result) {     
                destination_array = [];

                let initialFilter = result.filter((item) => 
                    item.city.toLowerCase().includes(city.toLowerCase()) &&
                    item.region.toLowerCase().includes(regionObj.address_components[0].short_name.toLowerCase())
                );

                $('.map_filtered-items-number').text(initialFilter.length);

                let initialResults = initialFilter.map((item) => createItem(item, templateElement));
                let end = 4;

                //Appends initial items, filtered based on location
                $('.map_search-results').empty();
                initialResults.slice(0, 4).map(item => {
                  $('.map_search-results').append(item);
                })

                //Infinite scroll, Adds items when scroll reaches bottom;
                $('.map_search-results').on('scroll', function(){
                  var $el = $(this);
                
                  if( $el.innerHeight()+$el.scrollTop() >= this.scrollHeight-5 ){
                    end++;
                    $('.map_search-results').append(initialResults[end]);
                  }
                });
                
                //Filter on input
                $( ".map_search-input.w-input" ).on("input", function() {
                  let inputValue = $(this).val().toLowerCase();
                  
                  filteredData = initialFilter.filter((item) => 
                    item.name.toLowerCase().includes(inputValue) ||
                    item.city.toLowerCase().includes(inputValue) ||
                    item.address.toLowerCase().includes(inputValue)
                  );
                
                  let resultItems = filteredData.map((item) => createItem(item, templateElement));
                  $('.map_search-results').empty();

                  resultItems.slice(0,end).map(item => {
                    $('.map_search-results').append(item);
                  })
                  
                  scroll = 4;
                  $('.map_search-results').scrollTop(0);

                  //Infinite scroll, Adds items when scroll reaches bottom;
                  $('.map_search-results').on('scroll', function(){
                    var $el = $(this);
                  
                    if( $el.innerHeight()+$el.scrollTop() >= this.scrollHeight-5 ){
                      end++;
                      $('.map_search-results').append(resultItems[end]);
                    }
                  });

                  $('.map_search-results').children().each(function() {
                    destination_array.push($(this).text());
                    console.log('Items: ',$(this));
                  });

                  //Distance matrix 
                  request = { ...request, origins: [pos], destinations: destination_array};
                  
                  //console.log('distance request...', request);
                  // get distance matrix response
                  setTimeout( getDistances(request), 5000);


                  //Get directions on click
                  $('.map_dir-btn').on('click', function() {
                    console.log('clicking..');
                    let directionsBtn = $(this);
                    let endInput = $('#end');
                    let partnerName = $('.outlets_sidebar-location > .outlets_sidebar-destination');
                    let partnerAddress = $('.outlets_sidebar-location > .outlets_sidebar-address');
                    $('.outlets_sidebar-wrapper').css('display', 'flex');

                    partnerName.text(directionsBtn.parent().siblings('.map_search-item-destination').text());
                    partnerAddress.text(directionsBtn.parent().siblings('.map_search-item-address').text());
                    endInput.attr('value', directionsBtn.parent().siblings('.map_search-item-address').text());
                    onChangeHandler(pos);
                  });
                });

                
                //Get distance for each item
                $('.map_search-results').children().each(function() {
                    destination_array.push($(this).text());
                });

                //Distance matrix 
                request = { ...request, origins: [pos], destinations: destination_array};
                
                //console.log('distance request...', request);
                // get distance matrix response
               
                setTimeout( getDistances(request), 5000);

                //Checks for changes to direction to start,end input
                // document
                // .getElementById("start")
                // .addEventListener("change", onChangeHandler(pos));
                // document
                //   .getElementById("end")
                //   .addEventListener("change", onChangeHandler(pos));
                // document
                //   .getElementById("mode")
                //   .addEventListener("change", onChangeHandler(pos));

                //Get directions on click
                $('.map_dir-btn').on('click', function() {
                  console.log('clicking..');
                  let directionsBtn = $(this);
                  //Targets direction services end input
                  let endInput = $('#end');
                  //Elmenent - Sidebar location name
                  let partnerName = $('.outlets_sidebar-location > .outlets_sidebar-destination');
                  //Elmenent - Sidebar location address
                  let partnerAddress = $('.outlets_sidebar-location > .outlets_sidebar-address');
                  $('.outlets_sidebar-wrapper').css('display', 'flex');

                  partnerName.text(directionsBtn.parent().siblings('.map_search-item-destination').text());
                  partnerAddress.text(directionsBtn.parent().siblings('.map_search-item-address').text());
                  endInput.attr('value', directionsBtn.parent().siblings('.map_search-item-address').text());
                  onChangeHandler(pos);
                });
              });
            });

            map.setZoom(15);
            map.setCenter(pos);
        },
        () => {
            handleLocationError(true, infoWindow, map.getCenter());
        }
    );
  } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
  } 
  const targetNode = document.getElementById('map_results');
  const config = { childList: true };
  const attachIndexHeaders = (mutationList, observer) => {
      let newAddresses = []
      $('.map_search-results').children().each(function() {
          newAddresses.push($(this).text());
      });
      request = { ...request, destinations: newAddresses};
      setTimeout( getDistances(request), 5000);
  };
  const observer = new MutationObserver(attachIndexHeaders);
  observer.observe(targetNode, config);     
}        


window.initMap = initMap;




//Global
/**
 * Fetches fake products from Fake Store API.
 * @returns An array of {@link Product}.
 */


//Get data from JSON
// let jsonData = [];
// let data = fetchProducts();
// let templateElement = document.getElementById("map_search-item");

//console.log('the data: ', data);

 //Filter data based on User location, input text 
// data.then(function(result) {
//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition((position) => {
//         pos = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//         };

//         var url =
//         'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + pos.lat +',' + pos.lng +
//         '&key=AIzaSyD1lDeWCObDolArPKOXaO2OeQxAlgZBZGY&region=US&language=en';

//         fetch(url).then((response) => response.json()).then((data) => {         
//           //Gets the locality/city name, if not available gets administrative_area_level_2 instead
//           let addresObj = data.results.find(item => item.types[0]  === 'locality' );
//           city = addresObj.address_components[0].long_name;
          
//           //Finds object with the array that has the 'administrative_area_level_1' value
//           let regionObj = data.results.find(item => item.types[0]  === 'administrative_area_level_1' );

//           let initialFilter = result.filter((item) => 
//             item.city.toLowerCase().includes(city.toLowerCase()) &&
//             item.region.toLowerCase().includes(regionObj.address_components[0].short_name.toLowerCase())
//           );

//           let initialResults = initialFilter.map((item) => createItem(item, templateElement));
//           let end = 4;

//           $('.map_search-results').empty();
//           initialResults.slice(0, 4).map(item => {
//             $('.map_search-results').append(item);
//           })

//           //Infinite scroll, Adds items when scroll reaches bottom;
//           $('.map_search-results').on('scroll', function(){
//             var $el = $(this);
          
//             if( $el.innerHeight()+$el.scrollTop() >= this.scrollHeight-5 ){
//               end++;
//               $('.map_search-results').append(initialResults[end]);
//             }
//           });

        
//           $( ".map_search-input.w-input" ).on("input", function() {
//             let inputValue = $(this).val().toLowerCase();
            
//             //console.log($(this).val());
//             filteredData = initialFilter.filter((item) => 
//               item.name.toLowerCase().includes(inputValue) ||
//               item.city.toLowerCase().includes(inputValue) ||
//               item.address.toLowerCase().includes(inputValue)
//             );
//             //console.log('The filter result', filteredData);
            
//             let resultItems = filteredData.map((item) => createItem(item, templateElement));
//             $('.map_search-results').empty();

//             resultItems.slice(0,end).map(item => {
//               $('.map_search-results').append(item);
//             })
//             scroll = 4;
//             $('.map_search-results').scrollTop(0);

//             //Infinite scroll, Adds items when scroll reaches bottom;
//             $('.map_search-results').on('scroll', function(){
//               var $el = $(this);
            
//               if( $el.innerHeight()+$el.scrollTop() >= this.scrollHeight-5 ){
//                 end++;
//                 $('.map_search-results').append(resultItems[end]);
//               }
//             });
//           });

//         });
//       }
//     );
//   }
// });

 

  //Render results in batches of 4s



// /**
//  * Collects all the categories from the products' data.
//  * @param products The products' data.
//  *
//  * @returns An array of {@link Product} categories.
//  */
// const collectCategories = (products) => {
//   const categories = new Set();

//   for (const { category } of products) {
//     categories.add(category);
//   }

//   return [...categories];
// };

// /**
//  * Creates a new radio filter from the template element.
//  * @param category The filter value.
//  * @param templateElement The template element.
//  *
//  * @returns A new category radio filter.
//  */
// const createFilter = (category, templateElement) => {
//   // Clone the template element
//   const newFilter = templateElement.cloneNode(true);

//   // Query inner elements
//   const label = newFilter.querySelector('span');
//   const radio = newFilter.querySelector('input');

//   if (!label || !radio) return;

//   // Populate inner elements
//   label.textContent = category;
//   radio.value = category;

//   return newFilter;
// };


/**
 *  
 * Maps functions
 * 
 * */
//console.log(getDistanceFromLatLonInKm(14.646875,121.057295,14.644775,121.057409));

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}