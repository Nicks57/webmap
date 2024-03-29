//Sample GPX as string for debugging purposes
const GPXDebug = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
'<gpx xmlns="https://www.topografix.com/GPX/1/1"  creator="Nicks" version="1.1" xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://www.topografix.com/GPX/1/1 https://www.topografix.com/GPX/1/1/gpx.xsd">\n' +
'<trk><name>GPX Debug Tracks</name>\n' +
'<trkseg>\n' +
'<trkpt lat="49.19648" lon="6.87825"></trkpt>\n' +
'<trkpt lat="49.19652" lon="6.8781"></trkpt>\n' +
'<trkpt lat="49.1966" lon="6.87799"></trkpt>\n' +
'<trkpt lat="49.19615" lon="6.87726"></trkpt>\n' +
'<trkpt lat="49.19494" lon="6.87891"></trkpt>\n' +
'<trkpt lat="49.19494" lon="6.87892"></trkpt>\n' +
'</trkseg>\n' +
'<trkseg>\n' +
'<trkpt lat="49.18578" lon="6.93061"></trkpt>\n' +
'<trkpt lat="49.18577" lon="6.93061"></trkpt>\n' +
'<trkpt lat="49.18578" lon="6.93084"></trkpt>\n' +
'<trkpt lat="49.18632" lon="6.93772"></trkpt>\n' +
'<trkpt lat="49.18648" lon="6.93912"></trkpt>\n' +
'<trkpt lat="49.18646" lon="6.9393"></trkpt>\n' +
'<trkpt lat="49.18643" lon="6.93948"></trkpt>\n' +
'<trkpt lat="49.18638" lon="6.93959"></trkpt>\n' +
'<trkpt lat="49.18543" lon="6.94096"></trkpt>\n' +
'<trkpt lat="49.18388" lon="6.943"></trkpt>\n' +
'<trkpt lat="49.18271" lon="6.9446"></trkpt>\n' +
'<trkpt lat="49.18035" lon="6.94773"></trkpt>\n' +
'<trkpt lat="49.1799" lon="6.9486"></trkpt>\n' +
'<trkpt lat="49.17887" lon="6.95088"></trkpt>\n' +
'</trkseg>\n' +
'</trk>\n' +
'</gpx>';
//************* */

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

//************************************ */
//Google StreetView
function StartStreetview (e) {
    let lat = e.latlng.lat.toPrecision(8);
    let lon = e.latlng.lng.toPrecision(8);
    window.open("https://maps.google.com/maps?q=&layer=c&cbll=" + lat + "," + lon + "&cbp=11,0,0,0", "_blank");
}

//************************************ */
//Routing Machine
var waypoints = [];
var markerGroup = L.layerGroup().addTo(map);

//Demo version with OSM Demo servers. Use it for some debugging tasks
/*var routeControl = L.Routing.control({
    createMarker: function() { return null; },
    lineOptions : { addWaypoints: false }
    }).addTo(map);
*/
var routeControl = L.Routing.control({
    router: L.Routing.graphHopper('939a6776-5fa7-4366-be32-1c53dd09de4f', {
        urlParameters: {
            vehicle: 'foot'
        }
    }),
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

//************************************ */
//Load GPX database files
var gpx = GPXDebug; // GPX as string used for debugging

var fileArray = [
    ["tracks/db/Validated-Anytime.gpx", "#159917", "Vert"]
];

for (const file of fileArray) {
    new L.GPXHelper(file[0], file[1]).on('loaded', function(e) {
        var gpx = e.target;
        layerControl.addOverlay(gpx, gpx.get_name() + " (" + file[2] + ")");
    }).addTo(map);
}

/*new L.GPX(gpx, {async: true, gpx_options:{ joinTrackSegments: false}}).on('loaded', function(e) {
    var gpx = e.target;
    layerControl.addOverlay(gpx, gpx.get_name());
}).addTo(map);*/

/*new L.GPXHelper(GPXDebug).on('loaded', function(e) {
    var gpx = e.target;
    layerControl.addOverlay(gpx, gpx.get_name());
}).addTo(map);*/


//************************************ */
//Download GPX Button
var download = function (fileName, mimeType) {
    var coord = [];
    for(let i = 0; i < routeControl._routes.length; i++) {
        for (let j = 0; j < routeControl._routes[i].coordinates.length; j++) {
            coord.push(routeControl._routes[i].coordinates[j]);
        }
    }

    var timestamp = new Date().toLocaleString('en-GB');
    gpxtrack = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<gpx xmlns="https://www.topografix.com/GPX/1/1"  creator="Nicks" version="1.1" xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://www.topografix.com/GPX/1/1 https://www.topografix.com/GPX/1/1/gpx.xsd">\n<trk><name>' + timestamp + '</name>\n<trkseg>\n';

    for (var i = 0; i < coord.length; i++) {
        gpxtrack += '<trkpt lat="' + coord[i].lat + '" lon="' + coord[i].lng + '"></trkpt>\n';
    }
    gpxtrack += '</trkseg>\n</trk>\n</gpx>';

    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob([gpxtrack], {
            type: mimeType
        }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
        a.href = URL.createObjectURL(new Blob([gpxtrack], {
            type: mimeType
        }));
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(gpxtrack); // only this mime type is supported
    }
}

//About button
function showInfo() {
    alert("Version: 0.1.0")
}
