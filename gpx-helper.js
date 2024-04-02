var L = L || require('leaflet');

L.GPXHelper = L.FeatureGroup.extend({
    initialize: function(gpx, color) { 
      this._gpx = gpx;
      this._color = color;
      this._layers = {};
      this._init_info();
  
      if (gpx) {
        this._parse(gpx, color);
      }
    },

    // Public methods
    get_name:            function() { return this._info.name; },

    _init_info: function() {
        this._info = {
            name: null
        };
    },

    _load_xml: function(url, cb) {
        var req = new window.XMLHttpRequest();
        req.open('GET', url, true);
        try {
            req.overrideMimeType('text/xml'); // unsupported by IE
        } catch(e) {}
        req.onreadystatechange = function() {
            if (req.readyState != 4) return;
            if(req.status == 200) cb(req.responseXML);
        };
        req.send(null);
    },

    _parse: function(input, color) {
        var _this = this;

        var cb = function(gpx) {
            var layers = _this._parseGPX(gpx, color);
            if (!layers) {
                _this.fire('error', { err: 'No parseable layers' });
                return;
            }
            _this.addLayer(layers);
            _this.fire('loaded', { layers: layers, element: gpx });
        }

        //var gpx; 
        if (input.substr(0,1)==='<') { // direct GPX string has to start with a <
            var parser = new DOMParser();
            setTimeout(function() {
                cb(parser.parseFromString(input, "text/xml"));
              });
        }
        else {
            this._load_xml(input, cb);
        }
    },

    _parseGPX: function(gpx, color) {
        //this function parse all tracks. tracks are <trkpt> tags in one or more <trkseg> sections in each <trk>
        var layers = [];

        var name = gpx.getElementsByTagName('name');
        if (name.length > 0) {
        this._info.name = name[0].textContent;
        }

        // parse waypoints and add markers for each of them
        el = gpx.getElementsByTagName('wpt');
        if(el.length > 0) {
            console.log("Waypoint(s) found!");
        }
        for (i = 0; i < el.length; i++) {
          var ll = new L.LatLng(
              el[i].getAttribute('lat'),
              el[i].getAttribute('lon'));
  
          var nameEl = el[i].getElementsByTagName('name');
          var name = nameEl.length > 0 ? nameEl[0].textContent : '';
  
          var descEl = el[i].getElementsByTagName('desc');
          var desc = descEl.length > 0 ? descEl[0].textContent : '';  

          var customIcon = L.icon({
            iconUrl: 'res/marker-i-50x50.png', // Chemin de l'image sur le serveur. src: https://icons8.com/icons/set/marker-info--static
            iconSize: [38, 38], // Taille de l'icône [largeur, hauteur]
            iconAnchor: [22, 34], // Point d'ancrage de l'icône par rapport à son coin supérieur gauche
            popupAnchor: [-3, -30] // Point d'ancrage de la fenêtre contextuelle par rapport à l'icône
            });
  
          var marker = new L.Marker(ll, {
            clickable: true,
            icon: customIcon,
            title: name,
            type: 'waypoint'
          });

          marker.bindPopup("<b>" + name + "</b>" + (desc.length > 0 ? '<br>' + desc : '')).openPopup();
          this.fire('addpoint', { point: marker, point_type: 'waypoint', element: el[i] });
          layers.push(marker);
        }

        var tracks = gpx.getElementsByTagName('trk');
        for (i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            var segments = track.getElementsByTagName('trkseg');
            for (j = 0; j < segments.length; j++) {
                layers = layers.concat(this._parseSegment(segments[j], 'trkpt', color));
            }
        }

        if (layers.length > 1) {
            return new L.FeatureGroup(layers);
        } else if (layers.length == 1) {
        return layers[0];
        }
    },

    _parseSegment: function(line, tag, color) {
        var trkpts = line.getElementsByTagName(tag);
        if (!trkpts.length) return [];

        var coords = [];
        var layers = [];

        for (var i = 0; i < trkpts.length; i++) {
            var latlon = new L.LatLng(
                trkpts[i].getAttribute('lat'),
                trkpts[i].getAttribute('lon'));

            coords.push(latlon);
            }

        // add track
        var l = new L.polyline(coords, {color: color, weight: 7});
        layers.push(l);

        return layers;
    }
});
