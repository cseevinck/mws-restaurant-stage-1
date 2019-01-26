let restaurants;
let neighborhoods;
let cuisines;
var newMap;
var markers = [];
const newCtrl = true;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap(); // added 
    fetchNeighborhoods();
    fetchCuisines();

    // set listeners for input field changes 
    document.getElementById('neighborhoodsInput').addEventListener("focusout", function(evt) {
        updateRestaurants();
    }, false);
    document.getElementById('cuisinesInput').addEventListener("focusout", function(evt) {
        updateRestaurants();
    }, false);
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const parentUl = document.getElementById('neighborhoods-selector');
    neighborhoods.forEach(neighborhood => {
        const li = document.createElement('li');
        li.setAttribute("role", "option");
        li.innerHTML = neighborhood;
        parentUl.appendChild(li);
    });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    const parentUl = document.getElementById('cuisines-selector');
    cuisines.forEach(cuisine => {
        const li = document.createElement('li');
        li.setAttribute("role", "option");
        li.innerHTML = cuisine;
        parentUl.appendChild(li);
    });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
        self.newMap = L.map('map', {
            center: [40.722216, -73.987501],
            zoom: 12,
            scrollWheelZoom: false
        });
        let tile_layer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
            mapboxToken: 'pk.eyJ1IjoiY3NlZXZpbmNrIiwiYSI6ImNqcjZoMHVtaTA0Nm80OW5zY3lqcmJtMjEifQ.TDeqQvgLyoP0CNO1WO6qmg',
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox.streets'
        });
        tile_layer.addTo(newMap);
        tile_layer.on("load", function() {
            startComboBox();
        });

        updateRestaurants();
    }
    /* window.initMap = () => {
      let loc = {
        lat: 40.722216,
        lng: -73.987501
      };
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
      });
      updateRestaurants();
    } */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    let neighborhood;
    let cuisine;
    if (newCtrl) {
        neighborhood = document.getElementById('neighborhoodsInput').value;
        cuisine = document.getElementById('cuisinesInput').value;
    } else {
        const cSelect = document.getElementById('cuisines-select');
        const nSelect = document.getElementById('neighborhoods-select');
        const cIndex = cSelect.selectedIndex;
        const nIndex = nSelect.selectedIndex;

        cuisine = cSelect[cIndex].value;
        neighborhood = nSelect[nIndex].value;
    }
    if (neighborhood == 'All Neighborhoods') {
        neighborhood = 'all';
    }
    if (cuisine == 'All Cuisines') {
        cuisine = 'all';
    }
    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(marker => marker.remove());
    }
    self.markers = [];
    self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    li.append(image);
    image.setAttribute('alt', 'photo of ' + restaurant.name + ' restaurant ')

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.setAttribute('aria-label', 'Details of ' + restaurant.name);
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more)

    return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
        restaurants.forEach(restaurant => {
            // Add marker to the map
            const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
            marker.on("click", onClick);

            function onClick() {
                window.location.href = marker.options.url;
            }
            self.markers.push(marker);
        });

    }
    /* addMarkersToMap = (restaurants = self.restaurants) => {
      restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', () => {
          window.location.href = marker.url
        });
        self.markers.push(marker);
      });
    } */