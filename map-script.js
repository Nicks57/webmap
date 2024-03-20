var gpxtrack = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?><gpx xmlns="https://www.topografix.com/GPX/1/1"  creator="peter-thomson.com" version="1.1" xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://www.topografix.com/GPX/1/1 https://www.topografix.com/GPX/1/1/gpx.xsd"><trk><name>28-MAR-18 04:04:44 PM</name><trkseg>';

//Create Map layers
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'});

var googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']});

var googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']});

var googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']});

var IGN = L.tileLayer('https://wxs.ign.fr/essentiels/geoportail/wmts?service=WMTS&request=GetTile&version=1.0.0&tilematrixset=PM&tilematrix={z}&tilecol={x}&tilerow={y}&layer=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&format=image/png&style=normal', {
    minZoom: 0,
    maxZoom: 18,
    tileSize: 256});

var map = L.map('map', {
    center: [49.18, 6.9],
    zoom: 13,
    contextmenu: true,
    contextmenuWidth: 180,
    contextmenuItems: [{
        text: 'Démarrer Streetview ici',
        callback: StartStreetview
    }],
    layers: [osm]});

var baseMaps = {
"OpenStreetMap": osm,
"Google Hybrid": googleHybrid,
"Google Streets": googleStreets,
"Google Terrain": googleTerrain,
"IGN": IGN
};

var layerControl = L.control.layers(baseMaps).addTo(map);

//Context Menu
function StartStreetview (e) {
    let lat = e.latlng.lat.toPrecision(8);
    let lon = e.latlng.lng.toPrecision(8);
    window.open("https://maps.google.com/maps?q=&layer=c&cbll=" + lat + "," + lon + "&cbp=11,0,0,0", "_blank");
}


//Create Polyline for GPX tracks
var polyline = L.polyline([]).addTo(map);
var markerGroup = L.layerGroup().addTo(map);

//Right click handler
function onMapClick(e) {
    var newMarker = new L.marker(e.latlng, {
        draggable: 'true',
    }).addTo(markerGroup);
    console.log(newMarker._leaflet_id);
    newMarker
        .on('dragstart', dragStartHandler)
        .on('click', dragStartHandler)
        .on('drag', dragHandler)
        .on('dragend', dragEndHandler);
    polyline.addLatLng(L.latLng(e.latlng));
    map.setView((e.latlng));
    displaylatlong();
}

//map.on('contextmenu', onMapClick);


//https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
var download = function (content, fileName, mimeType) {
    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob([content], {
            type: mimeType
        }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
        a.href = URL.createObjectURL(new Blob([content], {
            type: mimeType
        }));
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
    }
}
