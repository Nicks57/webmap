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
        },
        {
            text: 'Ajouter point',
            callback: AddWaypoint
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

//Google StreetView
function StartStreetview (e) {
    let lat = e.latlng.lat.toPrecision(8);
    let lon = e.latlng.lng.toPrecision(8);
    window.open("https://maps.google.com/maps?q=&layer=c&cbll=" + lat + "," + lon + "&cbp=11,0,0,0", "_blank");
}

//Routing Machine
var waypoints = [];

var routeControl = L.Routing.control({
    createMarker: function() { return null; },
    lineOptions : { addWaypoints: false }
    }).addTo(map);

routeControl.hide();

function AddWaypoint (e) {
    var newMarker = new L.marker(e.latlng, {
        draggable: 'true',
        contextmenu: true,
        contextmenuItems: [{
            text: 'Supprimer point',
            callback: DeleteWaypoint,
            index: 0
        }, {
            separator: true,
            index: 1
        }]
    }).addTo(markerGroup);
    newMarker
        .on('dragend', dragEndHandler);

    let lat = e.latlng.lat.toPrecision(8);
    let lng = e.latlng.lng.toPrecision(8);

    waypoints.push({"ID": newMarker._leaflet_id, "lat": e.latlng.lat, "lng": e.latlng.lng});
    console.log("Marker added. Waypoints array updated. ID: " + newMarker._leaflet_id + ", Lat: " + e.latlng.lat + ", Long: " + e.latlng.lng);

    if(markerGroup.getLayers().length > 1)
    { 
        routeControl.setWaypoints(waypoints);
        console.log("Route has been updated");
    }
}

function DeleteWaypoint (e) {
    console.log("Marker deleted. ID: " + e.relatedTarget._leaflet_id + ", Lat: " + e.relatedTarget._latlng.lat + ", Long: " + e.relatedTarget._latlng.lat);
    markerGroup.removeLayer(e.relatedTarget._leaflet_id);
    const index = waypoints.findIndex(p => p.ID == e.relatedTarget._leaflet_id);
    waypoints.splice(index, 1);
    routeControl.setWaypoints(waypoints);
    console.log("Route has been updated");
}

function dragEndHandler(e) {
    console.log("Draging of marker ended. ID is " + e.target._leaflet_id + ". New position is " + e.target._latlng.lat + "," + e.target._latlng.lng);
    const index = waypoints.findIndex(p => p.ID == e.target._leaflet_id);
    waypoints[index] = {"ID": e.target._leaflet_id, "lat": e.target._latlng.lat, "lng": e.target._latlng.lng};
    routeControl.setWaypoints(waypoints);
    console.log("Route has been updated");
}


//Create Polyline for GPX tracks
var polyline = L.polyline([]).addTo(map);
var markerGroup = L.layerGroup().addTo(map);


//Download GPX Button
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
