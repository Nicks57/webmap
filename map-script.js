const Version = '0.8.0 (2024-05-18)'


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

//Global variables
var waypoints = [];
var markers = [];
var markerGroup = L.layerGroup();
var OSMDataLayer = L.layerGroup();
var OSMDataMarkers = L.markerClusterGroup({
	spiderfyOnMaxZoom: false,
	showCoverageOnHover: false,
	zoomToBoundsOnClick: false
});
var routeCoords = [];
let routePolyline = null;
var OSMDataHidden = true;
var buttonDisplayOSMData;
var OSMDataDateTime;

//************* */

//Map layers
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
    center: [49, 6.9],
    zoom: 10,
    zoomControl: false,
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

L.control.zoom({
    position: 'topright'
}).addTo(map);

markerGroup.addTo(map);

//************************************ */


//Controls *************************** */
// Custom control with buttons
var CustomControl = L.Control.extend({
    options: {
        position: 'topleft',
    },

    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'custom-control-container');

        var buttonImportGPX = L.DomUtil.create('button', 'custom-control-button2', container);
        buttonImportGPX.innerHTML = 'Importer fichier GPX';
        buttonImportGPX.onclick = function() {
            document.getElementById('gpx-input').click();
        };

        var buttonDownloadGPX = L.DomUtil.create('button', 'custom-control-button2', container);
        buttonDownloadGPX.innerHTML = 'Télécharger fichier GPX';
        buttonDownloadGPX.onclick = function() {
            downloadTrack('track.gpx', 'text/csv;encoding:utf-8')
        };

        var buttonImportProject = L.DomUtil.create('button', 'custom-control-button', container);
        buttonImportProject.innerHTML = 'Importer projet';
        buttonImportProject.onclick = function() {
            document.getElementById('project-input').click();
        };

        var buttonDownloadProject = L.DomUtil.create('button', 'custom-control-button', container);
        buttonDownloadProject.innerHTML = 'Télécharger projet';
        buttonDownloadProject.onclick = function() {
            downloadProject('Trail_Webmap_Project.twp', 'text/csv;encoding:utf-8')
        };

        buttonDisplayOSMData = L.DomUtil.create('button', 'custom-control-button', container);
        buttonDisplayOSMData.innerHTML = 'Afficher données OSM';
        buttonDisplayOSMData.onclick = function() {
            displayOSMData()
        };

        var buttonDownloadOSMData = L.DomUtil.create('button', 'custom-control-button', container);
        buttonDownloadOSMData.innerHTML = 'Télécharger données OSM';
        buttonDownloadOSMData.onclick = function() {
            downloadOSMData('OSM_Data.xml', 'text/csv;encoding:utf-8')
        };

        var buttonAbout = L.DomUtil.create('button', 'custom-control-button', container);
        buttonAbout.innerHTML = 'Infos';
        buttonAbout.onclick = function() {
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


// Geo Search Bar
var geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
  })
    .on('markgeocode', function(e) {
      var bbox = e.geocode.bbox;
      var poly = L.polygon([
        bbox.getSouthEast(),
        bbox.getNorthEast(),
        bbox.getNorthWest(),
        bbox.getSouthWest()
      ]);
      map.fitBounds(poly.getBounds());
    })
    .addTo(map);


// Geolocalization
L.control.locate({position: "topright", strings:{title:"Position actuelle"}, showPopup : false}).addTo(map);


//************************************ */

// Buttons
// Import GPX Button
document.getElementById('gpx-input')
    .addEventListener('change', function (e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var gpxContent = e.target.result;;
            new L.GPXHelper(gpxContent, {
                marker_options : {
                    addStartEndIcons: true,
                    wptIconUrl : 'res/marker-i-50x50_Violet.png',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                },
                polyline_options : {
                    color: '#a00af7',  //Violet
                    weight: 3
                }
                }).on('loaded', function(e) {
                var gpx = e.target;
                map.fitBounds(gpx.getBounds());
                layerControl.addOverlay(gpx, gpx.get_name() + " (" + "Violet" + ")");
            }).addTo(map);
        }

        reader.readAsText(file);
    })


// Download GPX Button
var downloadTrack = function (fileName, mimeType) {
    var coord = [];

    if(routeCoords.length !== 0)
    {
        for(let i = 0; i < routeCoords.length; i++) {
            for (let j = 0; j < routeCoords[i].coords.length; j++)
                coord.push(routeCoords[i].coords[j]);
        }
    }
    else
        console.log("no routes to export");

    var timestamp = new Date().toLocaleString('en-GB');
    gpxcontent = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<gpx xmlns="https://www.topografix.com/GPX/1/1"  creator="Nicks" version="1.1" xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://www.topografix.com/GPX/1/1 https://www.topografix.com/GPX/1/1/gpx.xsd">\n';

    for (var i = 0; i < markers.length; i++) {
        gpxcontent += '<wpt lat="' + markers[i].lat + '" lon="' + markers[i].lng + '">\n\t<name></name>\n\t<desc></desc>\n</wpt>\n';
    }

    if(coord.length !== 0) {
        gpxcontent += "<trk>\n\t<name>" + timestamp + "</name>\n";
        gpxcontent += "\t<trkseg>\n";
        for (var i = 0; i < coord.length; i++) {
            gpxcontent += '\t<trkpt lat="' + coord[i].lat + '" lon="' + coord[i].lng + '"></trkpt>\n';
        }
        gpxcontent += '\t</trkseg>\n</trk>\n';
    }

    gpxcontent += "</gpx>";

    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob([gpxcontent], {
            type: mimeType
        }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
        a.href = URL.createObjectURL(new Blob([gpxcontent], {
            type: mimeType
        }));
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(gpxcontent); // only this mime type is supported
    }
}


// Import Project Button
document.getElementById('project-input')
    .addEventListener('change', function (e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var filecontent = e.target.result;
            var parser = new DOMParser();
            setTimeout(function() 
                {
                    parseFile(parser.parseFromString(filecontent, "text/xml"));
                });
        }
        reader.readAsText(file);
    })

var parseFile = function(file)
{
    var layers = [];

    // parse markers
    el = file.getElementsByTagName('marker');
    for (i = 0; i < el.length; i++) {
      var ll = new L.LatLng(
          el[i].getAttribute('lat'),
          el[i].getAttribute('lon'));

      var nameEl = el[i].getElementsByTagName('name');
      var name = nameEl.length > 0 ? nameEl[0].textContent : '';

      var descEl = el[i].getElementsByTagName('desc');
      var desc = descEl.length > 0 ? descEl[0].textContent : '';  

      var marker = {"latlng": ll};
      AddMarker(marker);
    }

    var routeCoords = file.getElementsByTagName('rte');
    var dataCoords = [];
    for (i = 0; i < routeCoords.length; i++) 
    {
        var routeCoord = routeCoords[i];
        var segments = routeCoord.getElementsByTagName('rteseg');
        for (j = 0; j < segments.length; j++) 
        {
            var el = segments[j].getElementsByTagName('rtept');
            if (!el.length) return [];

            var data = [];
            for (var i = 0; i < el.length; i++) 
            {
                var ll = new L.LatLng(
                    el[i].getAttribute('lat'),
                    el[i].getAttribute('lon'));
                data.push(ll);
            }

            dataCoords.push(data);

            if(j === 0)
            {
                var wpt = {"latlng": data[0]};
                AddWaypoint(wpt);
            }
            else if(j === segments.length - 1)
            {
                var wpt = {"latlng": data[0]};
                AddWaypoint(wpt, dataCoords[dataCoords.length - 2]);
                wpt = {"latlng": data[data.length - 1]};
                AddWaypoint(wpt, dataCoords[dataCoords.length - 1]);
                map.fitBounds([dataCoords[0][0], dataCoords[dataCoords.length - 1][dataCoords[dataCoords.length - 1].length - 1]]);
            }
            else
            {
                var wpt = {"latlng": data[0]};
                AddWaypoint(wpt, dataCoords[dataCoords.length - 2]);     
            }
        }
    }
}


// Download Project Button
var downloadProject = function (fileName, mimeType) 
{
    var timestamp = new Date().toLocaleString('en-GB');
    fileContent = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<twp>\n';

    for (var i = 0; i < markers.length; i++) {
        fileContent += '<marker lat="' + markers[i].lat + '" lon="' + markers[i].lng + '">\n\t<name></name>\n\t<desc></desc>\n</marker>\n';
    }

    if(routeCoords.length !== 0) {
        fileContent += '<rte>\n';
        for(let i = 0; i < routeCoords.length; i++) 
        {
            fileContent += '\t<rteseg>\n';
            for (let j = 0; j < routeCoords[i].coords.length; j++) 
                fileContent += '\t\t<rtept lat="' + routeCoords[i].coords[j].lat + '" lon="' + routeCoords[i].coords[j].lng + '"></rtept>\n';
            
            fileContent += '\t</rteseg>\n';
        }

        fileContent += '</rte>\n';
    }

    fileContent += '</twp>';

    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob([gpxcontent], {
            type: mimeType
        }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
        a.href = URL.createObjectURL(new Blob([fileContent], {
            type: mimeType
        }));
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(fileContent); // only this mime type is supported
    }
}


//************************************ */
//Load database files
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
        polyline_options : {color: file[1], weight: 7, interactive: false}
    }).on('loaded', function(e) {
        var gpx = e.target;
        layerControl.addOverlay(gpx, gpx.get_name());
    }).addTo(map);
}

//Add Markers
new L.GPXHelper("tracks/db/Markers.gpx", {
        marker_options : {
            wptIconUrl : 'res/marker-i-50x50_Orange.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
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
}, 1000); // Attendre 1000 millisecondes (1 seconde) avant d'exécuter le code


//OSM Data
var file = "tracks/db/OSM_Data.xml";
var req = new window.XMLHttpRequest();
req.open('GET', file, true);
try {
    req.overrideMimeType('text/xml'); // unsupported by IE
} catch(e) {}
req.onreadystatechange = function() {
    if (req.readyState != 4) return;
    if(req.status == 200) 
    {
        console.log(req.responseXML);
        parseOSMDataFile(req.responseXML);
    }
};
req.send(null);

function parseOSMDataFile(input)
{
    var metadata = input.getElementsByTagName('metadata');
    OSMDataDateTime = metadata[0].getAttribute('creationtime');

    // Définir l'icône personnalisée pour les marqueurs de barrières
    var customIcon = L.icon({
        iconUrl: 'res/round_red_blk_light.png', // Chemin de l'image sur le serveur. src: https://icons8.com/icons/set/marker--static
        iconSize: [20, 20], // Taille de l'icône [largeur, hauteur]
        //iconAnchor: [0, 0], // Point d'ancrage de l'icône par rapport à son coin supérieur gauche
        popupAnchor: [0, 0] // Point d'ancrage de la fenêtre contextuelle par rapport à l'icône
        });

    // Ajouter les barrières à la carte
    var barriers = input.getElementsByTagName('barrier');
    for (var i = 0; i < barriers.length; i++) {
        var lat = barriers[i].getAttribute('lat');
        var lon = barriers[i].getAttribute('lon');
        var desc = barriers[i].getAttribute('desc');

        var newMarker = L.marker([lat, lon], {
            draggable: false,
            icon: customIcon,
        });

        newMarker.bindPopup("<p><span style=\"text-decoration: underline;\"><strong>Barrière</strong></span>: " + desc + "</p>");
        OSMDataMarkers.addLayer(newMarker);
    }

    // Ajouter les chemins à la carte en tant que polylignes
    var ways = input.getElementsByTagName('way');
    for (var i = 0; i < ways.length; i++) {
        var waypts = ways[i].getElementsByTagName('waypt');
        var coords = [];
        for (var j = 0; j < waypts.length; j++) {
            var lat = waypts[j].getAttribute('lat');
            var lon = waypts[j].getAttribute('lon');
            coords.push([lat, lon]);
        }

        OSMDataMarkers.addLayer(L.polyline(coords, {
            color: '#972B14',  // Couleur de la ligne
            weight: 5,      // Épaisseur de la ligne
            dashArray: '10, 10'  // Alternance de traits rouges et espaces blancs
        }));
    }
} 

//************************************ */


// Google StreetView
function StartStreetview (e) {
    let lat = e.latlng.lat.toPrecision(8);
    let lon = e.latlng.lng.toPrecision(8);
    window.open("https://maps.google.com/maps?q=&layer=c&cbll=" + lat + "," + lon + "&cbp=11,0,0,0", "_blank");
}

//************************************ */
// Routing


//Demo version with OSM Demo servers. Use it for some debugging tasks
/*var routeControl = L.Routing.control({
    createMarker: function() { return null; },
    lineOptions : { addWaypoints: false,
        styles: [{color: 'black', opacity: 0.15, weight: 9}, {color: 'white', opacity: 0.8, weight: 6}, {color: 'blue', opacity: 1, weight: 2}] }
    }).addTo(map);

routeControl.getRouter().options.profile = 'foot';

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


routeControl.hide();*/

function AddWaypoint (e, routeCoordsData) {
    var iconPath = "";
    if(waypoints.length === 0)  //premier waypoint
        iconPath = "res/pin-icon-start.png";
    else
        iconPath = "res/pin-icon-end.png";

    var customIcon = L.icon({
        iconUrl: iconPath, // Chemin de l'image sur le serveur. src: https://icons8.com/icons/set/marker--static
        iconSize: [30, 30], // Taille de l'icône [largeur, hauteur]
        iconAnchor: [15, 30], // Point d'ancrage de l'icône par rapport à son coin supérieur gauche
        popupAnchor: [-3, -30] // Point d'ancrage de la fenêtre contextuelle par rapport à l'icône
        });

    var newMarker = new L.marker(e.latlng, {
        draggable: 'true',
        icon: customIcon,
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
        .on('dragend', dragEndWaypointHandler);

    let lat = e.latlng.lat.toPrecision(8);
    let lng = e.latlng.lng.toPrecision(8);

    waypoints.push({"ID": newMarker._leaflet_id, "lat": lat, "lng": lng, "LFMarker": newMarker});
    console.log("Waypoint with ID "  + newMarker._leaflet_id + " added to array");

    if(waypoints.length > 2)   //on modifie l'icone du marquer pour qu'il devienne un point à la place du marqueur de fin d'itinéraire
    {
        customIcon = L.icon({
            iconUrl: "res/dot-icon.png", // Chemin de l'image sur le serveur. src: https://icons8.com/icons/set/marker--static
            iconSize: [20, 20], // Taille de l'icône [largeur, hauteur]
            iconAnchor: [9, 12], // Point d'ancrage de l'icône par rapport à son coin supérieur gauche
            });

        var SndLastMarker = waypoints[waypoints.length - 2].LFMarker;
        SndLastMarker.setIcon(customIcon);
    }

    if (waypoints.length > 1)
    {
        if(routeCoordsData !== undefined)
        {
            routeCoords.push({"WPStartID" : waypoints[waypoints.length - 2].ID, "WPEndID" : waypoints[waypoints.length - 1].ID, "coords" : routeCoordsData});
            UpdateRoutePolyline(routeCoords);
        }
        else
        {
            var wps = [];
            wps.push({"lat" : waypoints[waypoints.length - 2].lat, "lng" : waypoints[waypoints.length - 2].lng});
            wps.push({"lat" : waypoints[waypoints.length - 1].lat, "lng" : waypoints[waypoints.length - 1].lng});
            GetRouteCoords(wps)
            .then(data => {
                routeCoords.push({"WPStartID" : waypoints[waypoints.length - 2].ID, "WPEndID" : waypoints[waypoints.length - 1].ID, "coords" : data[0]});
                UpdateRoutePolyline(routeCoords);

                //correction de la position du marqueur pour être bien au milieu de la route:
                var lastcoordsidx = routeCoords[routeCoords.length - 1].coords.length - 1;
                var correctedCoords = routeCoords[routeCoords.length - 1].coords[lastcoordsidx];
                newMarker.setLatLng(correctedCoords);
                waypoints[waypoints.length - 1] = {"ID": newMarker._leaflet_id, "lat": correctedCoords.lat, "lng": correctedCoords.lng, "LFMarker": newMarker};
            })
            .catch(error => {
                console.error('Erreur:', error);
                //markerGroup.removeLayer(e.relatedTarget._leaflet_id);
                //waypoints.splice(0, -1);
            });
        }
    }
}

function DeleteWaypoint (e) {
    var bLastWaypoint = false;
    var bFirstWaypoint = false;
    var ID = e.relatedTarget._leaflet_id;
    markerGroup.removeLayer(ID);
    const WPindex = waypoints.findIndex(p => p.ID == ID);
    if(WPindex === 0)
        bFirstWaypoint = true;
    else if(WPindex === waypoints.length - 1)
        bLastWaypoint = true;

    waypoints.splice(WPindex, 1);
    console.log("Waypoint with ID " + ID + " deleted.");

    if(bFirstWaypoint)
    {
        routeCoords.shift();
        UpdateRoutePolyline(routeCoords);

        customIcon = L.icon({
            iconUrl: "res/pin-icon-start.png", // Chemin de l'image sur le serveur. src: https://icons8.com/icons/set/marker--static
            iconSize: [30, 30], // Taille de l'icône [largeur, hauteur]
            iconAnchor: [15, 30], // Point d'ancrage de l'icône par rapport à son coin supérieur gauche
            });

        waypoints[0].LFMarker.setIcon(customIcon);
    }
    else if(bLastWaypoint)
    {
        routeCoords.pop();
        UpdateRoutePolyline(routeCoords);
    }
    else
    {
        routeCoords.splice(WPindex, 1);   //On supprime la route qui a pour point de départ le waypoint supprimé
        if (waypoints.length > 1)
        {
            var wps = [];
            wps.push({"lat" : waypoints[WPindex - 1].lat, "lng" : waypoints[WPindex - 1].lng});
            wps.push({"lat" : waypoints[WPindex].lat, "lng" : waypoints[WPindex].lng});

            GetRouteCoords(wps)
                .then(data => {
                    routeCoords[WPindex-1] = {"WPStartID" : waypoints[WPindex - 1].ID, "WPEndID" : waypoints[WPindex].ID, "coords" : data[0]};

                    UpdateRoutePolyline(routeCoords);
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    //markerGroup.removeLayer(e.relatedTarget._leaflet_id);
                    //waypoints.splice(0, -1);
                });
        }
        /*else  //Il ne reste plus qu'un marqueur sur la map -> on supprime la route
        {
            if (routePolyline !== null) 
            {
                routePolyline.removeFrom(map);
                routePolyline = null;
            }
        }*/
    }
}

function dragEndWaypointHandler(e) {
    var bLastWaypoint = false;
    var bFirstWaypoint = false;
    var ID = e.target._leaflet_id;
    let lat = e.target._latlng.lat.toPrecision(8);
    let lng = e.target._latlng.lng.toPrecision(8);

    console.log("Waypoint with ID " + ID + " dragged");
    const WPindex = waypoints.findIndex(p => p.ID == e.target._leaflet_id);
    waypoints[WPindex] = {"ID": ID, "lat": lat, "lng": lng, "LFMarker": e.target};
    if(WPindex === 0)
        bFirstWaypoint = true;
    else if(WPindex === waypoints.length - 1)
        bLastWaypoint = true;

    
    if (waypoints.length > 1)
    {
        if(bFirstWaypoint)
        {
            var wps = [];
            wps.push({"lat" : waypoints[WPindex].lat, "lng" : waypoints[WPindex].lng});
            wps.push({"lat" : waypoints[WPindex + 1].lat, "lng" : waypoints[WPindex + 1].lng});

            GetRouteCoords(wps)
                .then(data => {
                    routeCoords[WPindex] = {"WPStartID" : waypoints[WPindex].ID, "WPEndID" : waypoints[WPindex + 1].ID, "coords" : data[0]}
                    UpdateRoutePolyline(routeCoords);
                    })
                .catch(error => {
                    console.error('Erreur:', error);
                    //markerGroup.removeLayer(e.relatedTarget._leaflet_id);
                    //waypoints.splice(0, -1);
                }); 
        }
        else if(bLastWaypoint)
        {
            var wps = [];
            wps.push({"lat" : waypoints[WPindex - 1].lat, "lng" : waypoints[WPindex - 1].lng});
            wps.push({"lat" : waypoints[WPindex].lat, "lng" : waypoints[WPindex].lng});

            GetRouteCoords(wps)
                .then(data => {
                    routeCoords[WPindex - 1] = {"WPStartID" : waypoints[WPindex - 1].ID, "WPEndID" : waypoints[WPindex].ID, "coords" : data[0]}
                    UpdateRoutePolyline(routeCoords);
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    //markerGroup.removeLayer(e.relatedTarget._leaflet_id);
                    //waypoints.splice(0, -1);
                }); 
        }
        else
        {
            var wps = [];
            wps.push({"lat" : waypoints[WPindex - 1].lat, "lng" : waypoints[WPindex - 1].lng});
            wps.push({"lat" : waypoints[WPindex].lat, "lng" : waypoints[WPindex].lng});
            wps.push({"lat" : waypoints[WPindex + 1].lat, "lng" : waypoints[WPindex + 1].lng});

            GetRouteCoords(wps)
            .then(data => {
                routeCoords[WPindex - 1] = {"WPStartID" : waypoints[WPindex - 1].ID, "WPEndID" : waypoints[WPindex].ID, "coords" : data[0]}
                routeCoords[WPindex] = {"WPStartID" : waypoints[WPindex].ID, "WPEndID" : waypoints[WPindex + 1].ID, "coords" : data[1]}

                UpdateRoutePolyline(routeCoords);

                //correction de la position du marqueur pour être bien au milieu de la route:
                var correctedCoords = routeCoords[WPindex].coords[0];
                e.target.setLatLng(correctedCoords);
                waypoints[WPindex] = {"ID": ID, "lat": correctedCoords.lat, "lng": correctedCoords.lng, "LFMarker": e.target};
            })
            .catch(error => {
                console.error('Erreur:', error);
                //markerGroup.removeLayer(e.relatedTarget._leaflet_id);
                //waypoints.splice(0, -1);
            });
        }
    }
}
//*************************** */

function AddMarker (e) {
    var customIcon = L.icon({
        iconUrl: 'res/marker-i-50x50_Bleu.png', // Chemin de l'image sur le serveur. src: https://icons8.com/icons/set/marker--static
        iconSize: [30, 30], // Taille de l'icône [largeur, hauteur]
        iconAnchor: [15, 30], // Point d'ancrage de l'icône par rapport à son coin supérieur gauche
        popupAnchor: [-3, -30] // Point d'ancrage de la fenêtre contextuelle par rapport à l'icône
        });
    var newMarker = new L.marker(e.latlng, {
        draggable: true,
        editable: true, // Permet l'édition de texte sur clic
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
        .on('dragend', dragEndMarkerHandler);

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

function dragEndMarkerHandler(e) {
    console.log("Draging of marker ended. ID is " + e.target._leaflet_id + ". New position is " + e.target._latlng.lat + "," + e.target._latlng.lng);
    const index = markers.findIndex(p => p.ID == e.target._leaflet_id);
    markers[index] = {"ID": e.target._leaflet_id, "lat": e.target._latlng.lat, "lng": e.target._latlng.lng};
    console.log("Markers array updated");
}


//*************************************/
//Implementation Routing Perso GraphHoper
function UpdateRoutePolyline(coordinates)
{
    var coords = [];
    for(var i = 0; i < coordinates.length; i++)
        coords.push(coordinates[i].coords);

    if (routePolyline !== null) 
    {
        routePolyline.removeFrom(map);
        routePolyline = null;
    }

    routePolyline = L.polyline(coords, {color: 'blue', opacity: 1, weight: 2}).addTo(map);
}


function GetRouteCoords(wps)
{
    if(wps.lengh > 5)
    {
        alert("There are more than 5 waypoints. This is not acceptable for GraphHoper")
        exit;
    }
    const apiKey = "939a6776-5fa7-4366-be32-1c53dd09de4f";

    locs = [];
    for(i = 0; i < wps.length; i++)
    {
        locs.push('point=' + wps[i].lat + ',' + wps[i].lng);;
    }


    var points = locs.join('&');
    const apiUrl = `https://graphhopper.com/api/1/route?${points}&profile=bike&key=${apiKey}&instructions=false`;
    console.log(apiUrl);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("GET", apiUrl, true);

        // Onload is called when response is fully loaded
        xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            var RemainingCredits = xhr.getResponseHeader('X-RateLimit-Remaining');
            var Cost = xhr.getResponseHeader('X-RateLimit-Credits');
            console.log('Crédits restants : ' + RemainingCredits);

            const coordinates = DecodePolyline(response.paths[0].points);  //Il ne devrait y avoir qu'un seul path dans la réponse!
            const snappedwps = DecodePolyline(response.paths[0].snapped_waypoints);

            var res = [];
            var idx = 0;
            var previdx = 0;
            var found = false;

            for(i = 0; i < snappedwps.length - 1; i++)
            {
                for(j = 0; j < coordinates.length; j++)
                {
                    if(snappedwps[i+1].lat === coordinates[j].lat && snappedwps[i+1].lng === coordinates[j].lng)
                    {
                        idx = j;
                        found = true;
                        break;
                    }
                }
                if(found === false)
                    reject("Snapped waypoint non trouvé dans le tableau coordinates");

                res.push(coordinates.slice(previdx, idx + 1));
                previdx = idx;
            }


            resolve(res);

        } else
            reject('Erreur lors de la requête:', xhr.statusText);
        };

        // Error handling
        xhr.onerror = function() 
        {
            reject('Erreur réseau lors de la requête');
        };

        // Timeout handler
        xhr.timeout = 30000; //30 seconds
        xhr.ontimeout = function () 
        {
            reject('GraphHopper request timed out.');
        };

        // Send request
        xhr.send();
    });
}

function DecodePolyline (geometry) 
{
    var coords = Decode(geometry, 5),
        latlngs = new Array(coords.length),
        i;
    for (i = 0; i < coords.length; i++) {
        latlngs[i] = new L.LatLng(coords[i][0], coords[i][1]);
    }

    return latlngs;
}

// This is adapted from the implementation in Project-OSRM
// https://github.com/DennisOSRM/Project-OSRM-Web/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
function Decode (str, precision) 
{
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

//*************************************/

//*************************************/
var downloadOSMData = function (fileName, mimeType) 
{
    var overpassQuery = `[out:json][timeout:60];
    area[name="Moselle"]->.moselleArea;
    area[name="Vosges"]->.vosgesArea;
    area[name="Meurthe-et-Moselle"]->.meurtheetmoselleArea;
    area[name="Alsace"]->.alsaceArea;
    (
        node(area.moselleArea)[barrier~"chain|jersey_barrier|horse_stile|kissing_gate|stile|block|turnstile|bus_trap|cycle_barrier|fence|debris|lift_gate|bollard|swing_gate|yes|gate|entrance|ditch"];
        node(area.vosgesArea)[barrier~"chain|jersey_barrier|horse_stile|kissing_gate|stile|block|turnstile|bus_trap|cycle_barrier|fence|debris|lift_gate|bollard|swing_gate|yes|gate|entrance|ditch"];
        node(area.meurtheetmoselleArea)[barrier~"chain|jersey_barrier|horse_stile|kissing_gate|stile|block|turnstile|bus_trap|cycle_barrier|fence|debris|lift_gate|bollard|swing_gate|yes|gate|entrance|ditch"];
        node(area.alsaceArea)[barrier~"chain|jersey_barrier|horse_stile|kissing_gate|stile|block|turnstile|bus_trap|cycle_barrier|fence|debris|lift_gate|bollard|swing_gate|yes|gate|entrance|ditch"];
        way(area.moselleArea)[motorcar~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.moselleArea)[motor_vehicle~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.moselleArea)[vehicle~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.moselleArea)[access~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.moselleArea)[bicycle~"designated"][!"amenity=parking"];
        way(area.vosgesArea)[motorcar~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.vosgesArea)[motor_vehicle~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.vosgesArea)[vehicle~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.vosgesArea)[access~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.vosgesArea)[bicycle~"designated"]["amenity"!="parking"];
        way(area.meurtheetmoselleArea)[motorcar~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.meurtheetmoselleArea)[motor_vehicle~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.meurtheetmoselleArea)[vehicle~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.meurtheetmoselleArea)[access~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.meurtheetmoselleArea)[bicycle~"designated"]["amenity"!="parking"];
        way(area.alsaceArea)[motorcar~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.alsaceArea)[motor_vehicle~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.alsaceArea)[vehicle~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.alsaceArea)[access~"no|destination|customers|agricultural|forestry"]["amenity"!="parking"];
        way(area.alsaceArea)[bicycle~"designated"]["amenity"!="parking"];
    );
    out geom;
    >;
    out skel qt;`;

    // URL de l'API Overpass
    var overpassUrl = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(overpassQuery);
    console.log("Overpass URL:", overpassUrl);

    fetch(overpassUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la requête à l\'API Overpass');
        }
        return response.json();
    })
    .then(data => {
        // Traitement des données en cas de succès
        var barriers = [];

        data.elements.forEach(function(element) {
            if (element.type === 'node' && element.tags && element.tags.barrier) {
                barriers.push({"lat": element.lat, "lon": element.lon, "desc": element.tags.barrier});
            }
        });

        var timestamp = new Date().toLocaleString('en-GB');
        var fileContent = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<osmdata>\n\t<metadata creationtime="' + timestamp + '"></metadata>\n\t<barriers>\n';

        barriers.forEach(function(barrier) {
            if(isOutsideRadius(barrier.lat, barrier.lon))
                fileContent += '\t\t<barrier lat="' + barrier.lat + '" lon="' + barrier.lon + '" desc="' + barrier.desc + '"></barrier>\n';
        });

        fileContent += '\t</barriers>\n\t<ways>\n';

        var ways = data.elements
            .filter(element => element.type === 'way')
            .map(element => element.geometry.map(coord => ({ lat: coord.lat, lon: coord.lon })));

            ways.forEach(function(path) {
                fileContent += '\t\t<way>\n';
                path.forEach(function(point) {
                    if(isOutsideRadius(point.lat, point.lon))
                        fileContent += '\t\t\t<waypt lat="' + point.lat + '" lon="' + point.lon + '"></waypt>\n';
                });
                fileContent += '\t\t</way>\n';
            });
    
            fileContent += '\t</ways>\n</osmdata>';

        //Constitution du fichier et download
        var fileName = 'OSM_Data.xml';
        var mimeType = 'application/xml';

        var a = document.createElement('a');
        if (navigator.msSaveBlob) { // IE10
            navigator.msSaveBlob(new Blob([fileContent], { type: mimeType }), fileName);
        } else if (URL && 'download' in a) { //html5 A[download]
            a.href = URL.createObjectURL(new Blob([fileContent], { type: mimeType }));
            a.setAttribute('download', fileName);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            location.href = 'data:application/octet-stream,' + encodeURIComponent(fileContent); // only this mime type is supported
        }
        })

        .catch(error => {
            // Gestion des erreurs
            alert("Une erreur s'est produite lors de la requête Overpass: " + error.message);
        });
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degree) => degree * (Math.PI / 180);
    const R = 6371e3; // Rayon de la Terre en mètres

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
}

function isOutsideRadius(lat, lon) {
    const metzLatitude = 49.1193;
    const metzLongitude = 6.1757;
    const metzRadiusMeters = 10 * 1000;

    const nancyLatitude = 48.6921;
    const nancyLongitude = 6.1844;
    const nancyRadiusMeters = 10 * 1000;

    const strasbourgLatitude = 48.5734;
    const strasbourgLongitude = 7.7521;
    const strasbourgRadiusMeters = 10 * 1000;

    const mulhouseLatitude = 47.7508;
    const mulhouseLongitude = 7.3359;
    const mulhouseRadiusMeters = 10 * 1000;

    
    if(haversineDistance(metzLatitude, metzLongitude, lat, lon) < metzRadiusMeters)
        return false;

    if(haversineDistance(nancyLatitude, nancyLongitude, lat, lon) < nancyRadiusMeters)
        return false;

    if(haversineDistance(strasbourgLatitude, strasbourgLongitude, lat, lon) < strasbourgRadiusMeters)
        return false;

    if(haversineDistance(mulhouseLatitude, mulhouseLongitude, lat, lon) < mulhouseRadiusMeters)
        return false;

    return true;
}
//

function displayOSMData()
{
    if(OSMDataHidden)
    {
        OSMDataMarkers.addTo(map);
        buttonDisplayOSMData.innerHTML = 'Masquer données OSM';
        OSMDataHidden = false;
    }
    else
    {
        OSMDataMarkers.removeFrom(map);
        buttonDisplayOSMData.innerHTML = 'Afficher données OSM';
        OSMDataHidden = true;
    }
}

//About button
function showInfo() {
    var content = '<p>Originator: Nicks<br />Version: ' + Version + '<br />Donn&eacute;es OSM: ' + OSMDataDateTime + '</p>' + 
    '<h2>Routing</h2>' + 
    '<p>Le routing utilise l\'API Graphhoper (<a href="https://www.graphhopper.com/">GraphHopper Directions API with Route Optimization</a>).</p>' + 
    '<h2>Donn&eacute;es OSM</h2>' + 
    '<p>Les donn&eacute;es ci-dessous sont r&eacute;cup&eacute;r&eacute;es de la base de donn&eacute;es Open Street Map via Overpass. Elle couvre les zones des d&eacute;partements de la Moselle, Meurthe-et-Moselle, Vosges, Haut-Rhin et Bas-Rhin.</p>' + 
    '<h4>Barri&egrave;res:</h4>' + 
    '<p>Les types de barri&egrave;res suivantes sont affich&eacute;es.</p>' + 
    '<table style="height: 450px; width: 80%; border-collapse: collapse; margin-left: auto; margin-right: auto;" border="1">' + 
    '<tbody>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">chain</td>' + 
    '<td style="width: 85%; height: 18px;">Chaine tendue emp&ecirc;chant le passage des v&eacute;hicules motoris&eacute;s.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">swing_gate</td>' + 
    '<td style="width: 85%; height: 18px;">Barri&egrave;re tournante.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">gate</td>' + 
    '<td style="width: 85%; height: 18px;">Partie contig&uuml;e &agrave; un mur ou une cl&ocirc;ture qui peut &ecirc;tre ouverte pour permettre le passage: barri&egrave;re, portail.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">lift_gate</td>' + 
    '<td style="width: 85%; height: 18px;">Une barri&egrave;re levante est une perche pivotante de mani&egrave;re &agrave; pouvoir bloquer l\'acc&egrave;s des v&eacute;hicules par un point contr&ocirc;l&eacute;.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">cycle_barrier</td>' + 
    '<td style="width: 85%; height: 18px;">Barri&egrave;res sur la voie destin&eacute;es &agrave; ralentir voire interdire l\'acc&egrave;s aux cyclistes.</td>' + 
    '</tr>' + 
    '<tr style="height: 54px;">' + 
    '<td style="width: 15%; height: 54px;">bollard</td>' + 
    '<td style="width: 85%; height: 54px;">Obstacles solides de petite taille (poteau, borne...), habituellement en b&eacute;ton ou m&eacute;tal et plac&eacute;s au travers de la route (fr&eacute;quemment en plastique lorsqu\'ils bordent des voies) et destin&eacute;s &agrave; emp&ecirc;cher l\'acc&egrave;s &agrave; certains v&eacute;hicules.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">jersey_barrier</td>' + 
    '<td style="width: 85%; height: 18px;">barri&egrave;re compos&eacute;e de blocs pr&eacute;fabriqu&eacute;s lourds.</td>' + 
    '</tr>' + 
    '<tr style="height: 36px;">' + 
    '<td style="width: 15%; height: 36px;">block</td>' + 
    '<td style="width: 85%; height: 36px;">Un ou plusieurs gros bloc(s) immobile(s) emp&ecirc;chant l\'acc&egrave;s libre le long d\'un chemin.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">debris</td>' + 
    '<td style="width: 85%; height: 18px;">D&eacute;bris, gravats, avec ou sans terre bloquant une route.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">stile</td>' + 
    '<td style="width: 85%; height: 18px;">&Eacute;chalier</td>' + 
    '</tr>' + 
    '<tr style="height: 36px;">' + 
    '<td style="width: 15%; height: 36px;">horse_stile</td>' + 
    '<td style="width: 85%; height: 36px;">Un &eacute;chalier permet aux pi&eacute;tons et aux chevaux de franchir un espace &agrave; travers une cl&ocirc;ture.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">kissing_gate</td>' + 
    '<td style="width: 85%; height: 18px;">Portillon &agrave; chicane mobile.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">turnstile</td>' + 
    '<td style="width: 85%; height: 18px;">Un passage &agrave; pied &agrave; travers une cl&ocirc;ture.</td>' + 
    '</tr>' + 
    '<tr style="height: 36px;">' + 
    '<td style="width: 15%; height: 36px;">bus_trap</td>' + 
    '<td style="width: 85%; height: 36px;">Portion de route o&ugrave; un trou central emp&ecirc;che le passage de certains v&eacute;hicule.</td>' + 
    '</tr>' + 
    '<tr style="height: 54px;">' + 
    '<td style="width: 15%; height: 54px;">fence</td>' + 
    '<td style="width: 85%; height: 54px;">Structure autoportante con&ccedil;ue pour restreindre ou emp&ecirc;cher le mouvement au-del&agrave; d\'une limite, qui se distingue g&eacute;n&eacute;ralement d\'un mur par la l&eacute;g&egrave;ret&eacute; de sa construction.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">entrance</td>' + 
    '<td style="width: 85%; height: 18px;">Une ouverture ou un espace dans un obstacle.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">ditch</td>' + 
    '<td style="width: 85%; height: 18px;">Un foss&eacute; ou une tranch&eacute; emp&ecirc;chant l\'acc&egrave;s &agrave; l\'autre c&ocirc;t&eacute;.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 15%; height: 18px;">yes</td>' + 
    '<td style="width: 85%; height: 18px;">Barri&egrave;re dont le type n\'est pas sp&eacute;cifi&eacute;.</td>' + 
    '</tr>' + 
    '</tbody>' + 
    '</table>' + 
    '<h4>Chemins interdits:</h4>' + 
    '<p>Les types de chemins interdits suivants sont affich&eacute;s:</p>' + 
    '<table style="width: 80%; border-collapse: collapse; margin-left: auto; margin-right: auto; height: 144px;" border="1">' + 
    '<tbody>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 30%; height: 18px;">no</td>' + 
    '<td style="width: 70%; height: 18px;">Interdiction g&eacute;n&eacute;rale d\'acc&egrave;s</td>' + 
    '</tr>' + 
    '<tr style="height: 54px;">' + 
    '<td style="width: 30%; height: 54px;">destination</td>' + 
    '<td style="width: 70%; height: 54px;">Acc&egrave;s r&eacute;serv&eacute; aux personnes ou v&eacute;hicules ayant cet &eacute;l&eacute;ment comme destination. Utilis&eacute; par exemple pour le panneau &laquo;&nbsp;Interdit sauf riverains&nbsp;&raquo;.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 30%; height: 18px;">customers</td>' + 
    '<td style="width: 70%; height: 18px;">Acc&egrave;s r&eacute;serv&eacute; aux clients</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 30%; height: 18px;">agricultural</td>' + 
    '<td style="width: 70%; height: 18px;">Acc&egrave;s r&eacute;serv&eacute; aux engins agricoles</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 30%; height: 18px;">forestry</td>' + 
    '<td style="width: 70%; height: 18px;">Acc&egrave;s r&eacute;serv&eacute; aux engins forestiers.</td>' + 
    '</tr>' + 
    '<tr style="height: 18px;">' + 
    '<td style="width: 30%; height: 18px;">designated (bicycle)</td>' + 
    '<td style="width: 70%; height: 18px;">Voie r&eacute;serv&eacute;e aux cyclistes</td>' + 
    '</tr>' + 
    '</tbody>' + 
    '</table>'

    var winOpts = L.control.window(map,
        {title: '<h1 style="text-align: center;"><strong>Trail Webmap</strong></h1>',
        content: content,
        modal: true,
        maxWidth:1000,
        visible: true});
}

//testOverpass();

function testOverpass() {
    // Définir la requête Overpass pour récupérer les barrières sur les chemins

    var overpassQuery = `[out:json][timeout:60];
    area[name="Moselle"]->.moselleArea;
    
    (
      way(area.moselleArea)[motorcar~"no"];
    );
    
    out geom;
    >;
    out skel qt;`;

    // URL de l'API Overpass
    var overpassUrl = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(overpassQuery);

    fetch(overpassUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la requête à l\'API Overpass');
        }
        return response.json();
    })
    .then(data => {
        // Traitement des données en cas de succès
        var ways = data.elements
                .filter(element => element.type === 'way')
                .map(element => element.geometry.map(coord => [coord.lat, coord.lon]));

            // Ajouter les chemins à la carte en tant que polylignes
            ways.forEach(path => {
                L.polyline(path).addTo(map);
            });
    })
        
        .catch(error => {
            // Gestion des erreurs
            alert("Une erreur s'est produite lors de la requête Overpass: " + error.message);
        });
}   



//Calibrage des icones
/*iconPath = "res/marker-i-50x50_Bleu.png";

var customIcon = L.icon({
iconUrl: iconPath, // Chemin de l'image sur le serveur. src: https://icons8.com/icons/set/marker--static
iconSize: [30, 30], // Taille de l'icône [largeur, hauteur]
iconAnchor: [15, 30], // Point d'ancrage de l'icône par rapport à son coin supérieur gauche
});

var newMarker = new L.marker([49, 7.2], {icon: customIcon}).addTo(map);

var marker = L.marker([49, 7.2]).addTo(map);*/

//res/marker-i-50x50_Bleu.png: Size = [30,30] / Anchor = [15,30]
//res/marker-i-50x50_Orange.png: Size = [30,30] / Anchor = [15,30]
//res/marker-i-50x50_Violet.png: Size = [30,30] / Anchor = [15,30]
//res/pin-icon-end.png: Size = [30,30] / Anchor = [15,30]
//res/pin-icon-start.png: Size = [30,30] / Anchor = [15,30]
//res/dot-icon.png: Size = [20,20] / Anchor = [9,12]
