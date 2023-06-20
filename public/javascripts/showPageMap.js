const fixedCoord = coordinate.split(',');
mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: fixedCoord, // starting position [lng, lat]
    zoom: 9 // starting zoom
});

new mapboxgl.Marker().setLngLat(fixedCoord).addTo(map);