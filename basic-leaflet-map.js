var mylat = '50.58007';
var mylong = '-3.75578';
var myzoom = '10';
var map = L.map('map').setView([mylat, mylong], myzoom);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
 
L.marker([mylat, mylong]).addTo(map).bindPopup("<b>This is Haytor!</b>").openPopup();
L.circle([mylat, mylong], 500, {
    color: 'red',
    fillColor: '#f2d5df',
    fillOpacity: 0.2
}).addTo(map).bindPopup("");
 
markers = [{
    "name": "Supermarket",
    "url": "",
    "lat": 50.54086,
    "lng": -3.60219
}, {
    "name": "Information Centre",
    "url": "http://www.dartmoor.gov.uk/",
    "lat": 50.58093,
    "lng": -3.7453
}];
for (var i = 0; i < markers.length; ++i) {
    L.marker([markers[i].lat, markers[i].lng], {
        icon: new L.DivIcon({
            className: 'my-div-icon',
            html: '<span class="my-map-label">' + markers[i].name + '</span>'
        })
    }).addTo(map);
 
    L.marker([markers[i].lat, markers[i].lng]).addTo(map).bindPopup(markers[i].name);
}
