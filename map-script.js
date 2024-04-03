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
    center: [49, 7.2],
    zoom: 10,
    contextmenu: true,
    contextmenuWidth: 180,
    contextmenuItems: [{
            text: 'Démarrer Streetview ici',
            callback: StartStreetview
        },
        {
            text: 'Ajouter point d\'itinéraire',
            callback: AddWaypoint
        },
        {
            text: 'Ajouter marqueur',
            callback: AddMarker
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

// Create a custom control
var CustomControl = L.Control.extend({
    options: {
        position: 'topleft',
    },

    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'custom-control-container');
        var button1 = L.DomUtil.create('button', 'custom-control-button', container);
        button1.innerHTML = 'Importer fichier GPX';

        button1.onclick = function() {
            document.getElementById('file-input').click();
        };

        var button2 = L.DomUtil.create('button', 'custom-control-button', container);
        button2.innerHTML = 'Télécharger marqueurs';

        // Add your custom action here
        button2.onclick = function() {
            downloadMarkers('waypoints.gpx', 'text/csv;encoding:utf-8')
        };

        var button3 = L.DomUtil.create('button', 'custom-control-button', container);
        button3.innerHTML = 'Télécharger trace GPX';

        // Add your custom action here
        button3.onclick = function() {
            downloadTrack('track.gpx', 'text/csv;encoding:utf-8')
        };

        var button4 = L.DomUtil.create('button', 'custom-control-button', container);
        button4.innerHTML = 'À propos';

        // Add your custom action here
        button4.onclick = function() {
            showInfo()
        };

        return container;
    },

    onRemove: function(map) {
        // Cleanup when removed
    }
});

  // Add the custom control to the map
(new CustomControl()).addTo(map);

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
var markers = [];
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
    lineOptions : { addWaypoints: false,
                    styles: [{color: 'black', opacity: 0.15, weight: 9}, {color: 'white', opacity: 0.8, weight: 6}, {color: 'blue', opacity: 1, weight: 2}] }
    }).addTo(map);


routeControl.hide();

function AddWaypoint (e) {
    var newMarker = new L.marker(e.latlng, {
        draggable: 'true',
        contextmenu: true,
        contextmenuItems: [{
            text: 'Supprimer point d\'itinéraire',
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
    console.log("Waypoint added. Waypoints array updated. ID: " + newMarker._leaflet_id + ", Lat: " + e.latlng.lat + ", Long: " + e.latlng.lng);

    if(markerGroup.getLayers().length > 1)
    { 
        routeControl.setWaypoints(waypoints);
        console.log("Route has been updated");
    }
}

function DeleteWaypoint (e) {
    console.log("Waypoint deleted. ID: " + e.relatedTarget._leaflet_id + ", Lat: " + e.relatedTarget._latlng.lat + ", Long: " + e.relatedTarget._latlng.lat);
    markerGroup.removeLayer(e.relatedTarget._leaflet_id);
    const index = waypoints.findIndex(p => p.ID == e.relatedTarget._leaflet_id);
    waypoints.splice(index, 1);
    routeControl.setWaypoints(waypoints);
    console.log("Route has been updated");
}

function dragEndHandler(e) {
    console.log("Draging of waypoint ended. ID is " + e.target._leaflet_id + ". New position is " + e.target._latlng.lat + "," + e.target._latlng.lng);
    const index = waypoints.findIndex(p => p.ID == e.target._leaflet_id);
    waypoints[index] = {"ID": e.target._leaflet_id, "lat": e.target._latlng.lat, "lng": e.target._latlng.lng};
    routeControl.setWaypoints(waypoints);
    console.log("Route has been updated");
}

function AddMarker (e) {
    var customIcon = L.icon({
        iconUrl: 'res/marker-i-50x50_Orange.png', // Chemin de l'image sur le serveur. src: https://icons8.com/icons/set/marker--static
        iconSize: [38, 38], // Taille de l'icône [largeur, hauteur]
        iconAnchor: [22, 34], // Point d'ancrage de l'icône par rapport à son coin supérieur gauche
        popupAnchor: [-3, -30] // Point d'ancrage de la fenêtre contextuelle par rapport à l'icône
        });
    var newMarker = new L.marker(e.latlng, {
        draggable: 'true',
        icon: customIcon,
        contextmenu: true,
        contextmenuItems: [{
            text: 'Supprimer marqueur',
            callback: DeleteMarker,
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

    markers.push({"ID": newMarker._leaflet_id, "lat": e.latlng.lat, "lng": e.latlng.lng});
    console.log("Marker added. Markers array updated. ID: " + newMarker._leaflet_id + ", Lat: " + e.latlng.lat + ", Long: " + e.latlng.lng);
}

function DeleteMarker (e) {
    console.log("Marker deleted. ID: " + e.relatedTarget._leaflet_id + ", Lat: " + e.relatedTarget._latlng.lat + ", Long: " + e.relatedTarget._latlng.lat);
    markerGroup.removeLayer(e.relatedTarget._leaflet_id);
    const index = markers.findIndex(p => p.ID == e.relatedTarget._leaflet_id);
    markers.splice(index, 1);
}

//************************************ */
//Load GPX database files
var gpx = GPXDebug; // GPX as string used for debugging


// Sections Autorisées/praticable par tout temps            => DB - Tout Schuss (Vert)
// Sections Autorisées/praticable par temps sec uniquement  => DB - Ça glisse! (Orange)
// Sections Tolérées                                        => DB - Tolérées (Rouge)
// Sections Interdites                                      => DB - Verboten! (Noir)
var fileArray = [
    ["tracks/db/OK_Anytime.gpx", "#159917"],
    ["tracks/db/OK_OnlyDry.gpx", "#f2ab11"],
    ["tracks/db/Tolerated.gpx", "#f70a0a"],
    ["tracks/db/Verboten.gpx", "#000000"]
];

for (const file of fileArray) {
    new L.GPXHelper(file[0], {
        polyline_options : {color: file[1]}
    }).on('loaded', function(e) {
        var gpx = e.target;
        layerControl.addOverlay(gpx, gpx.get_name());
    }).addTo(map);
}

//Add Markers
new L.GPXHelper("tracks/db/Markers.gpx", {
        marker_options : {
            wptIconUrl : 'res/marker-i-50x50_Bleu.png',
        }
    }).on('loaded', function(e) {
    }).addTo(map);

/*new L.GPX(gpx, {async: true, gpx_options:{ joinTrackSegments: false}}).on('loaded', function(e) {
    var gpx = e.target;
    layerControl.addOverlay(gpx, gpx.get_name());
}).addTo(map);*/

/*new L.GPXHelper(GPXDebug, {
    polyline_options : {color: "#159917"}
    }).on('loaded', function(e) {
        var gpx = e.target;
        layerControl.addOverlay(gpx, gpx.get_name());
    }).addTo(map);*/


// Attendre que les overlays soient chargés
setTimeout(function() {
    // Accédez aux éléments DOM des étiquettes de couche d'overlay
    var overlayLabels = document.querySelectorAll('.leaflet-control-layers-overlays label');

    // Changez les couleurs des étiquettes de couche d'overlay
    for (let i = 0; i < fileArray.length; i++) {
        overlayLabels[i].style.color = fileArray[i][1]; 
    }
    // Changez les couleurs d'autres couches d'overlay comme souhaité
}, 1000); // Attendez 1000 millisecondes (1 seconde) avant d'exécuter le code

//************************************ */
//Import GPX Button
document.getElementById('file-input')
    .addEventListener('change', function (e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var gpxContent = e.target.result;;
            new L.GPXHelper(gpxContent, {
                marker_options : {
                    addStartEndIcons: true,
                    wptIconUrl : 'res/marker-i-50x50_Violet.png',
                },
                polyline_options : {
                    color: '#a00af7'  //Violet
                }
                }).on('loaded', function(e) {
                var gpx = e.target;
                map.fitBounds(gpx.getBounds());
                layerControl.addOverlay(gpx, gpx.get_name() + " (" + "Violet" + ")");
            }).addTo(map);
        }

        reader.readAsText(file);
    })

//************************************ */
//Download GPX Button
var downloadTrack = function (fileName, mimeType) {
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

//************************************ */
//Download Markers Button
var downloadMarkers = function (fileName, mimeType) {
    gpxmarkers = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<gpx xmlns="https://www.topografix.com/GPX/1/1"  creator="Nicks" version="1.1" xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://www.topografix.com/GPX/1/1 https://www.topografix.com/GPX/1/1/gpx.xsd">\n';

    for (var i = 0; i < markers.length; i++) {
        gpxmarkers += '<wpt lat="' + markers[i].lat + '" lon="' + markers[i].lng + '">\n\t<name></name>\n\t<desc></desc>\n</wpt>\n';
    }
    gpxmarkers += '</gpx>';

    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob([gpxmarkers], {
            type: mimeType
        }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
        a.href = URL.createObjectURL(new Blob([gpxmarkers], {
            type: mimeType
        }));
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(gpxmarkers); // only this mime type is supported
    }
}

//About button
function showInfo() {
    alert("Version: 0.3.0")
}
