var L = L || require('leaflet');

var _DEFAULT_MARKER_OPTS = {
    addStartEndIcons: false,
    startIconUrl: 'res/pin-icon-start.png',
    endIconUrl: 'res/pin-icon-end.png',
    wptIconUrl: 'res/marker-i-50x50_Orange.png',
    iconSize: [30, 30], // Taille de l'icône [largeur, hauteur]
    iconAnchor: [15, 30], // Point d'ancrage de l'icône par rapport à son coin supérieur gauche
    popupAnchor: [-3, -30], // Point d'ancrage de la fenêtre contextuelle par rapport à l'icône
    clickable: false
  };
var _DEFAULT_POLYLINE_OPTS = {
    color: '#a00af7',  //Violet
    weight: 7
  };

L.GPXHelper = L.FeatureGroup.extend({
    initialize: function(gpx, options) { 
        options.marker_options = this._merge_objs(
            _DEFAULT_MARKER_OPTS,
            options.marker_options || {});
        options.polyline_options = this._merge_objs(
            _DEFAULT_POLYLINE_OPTS,
                options.polyline_options || {});

        this._gpx = gpx;
        this._layers = {};
        this._init_info();
  
      if (gpx) {
        this._parse(gpx, options);
      }
    },

    // Public methods
    get_name:            function() { return this._info.name; },

    // Private methods
    _merge_objs: function(a, b) {
        var _ = {};
        for (var attr in a) { _[attr] = a[attr]; }
        for (var attr in b) { _[attr] = b[attr]; }
        return _;
    },

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

    _parse: function(input, options) {
        var _this = this;

        var cb = function(gpx) {
            var layers = _this._parseGPX(gpx, options);
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

    _parseGPX: function(gpx, options) {
        //this function parse all tracks. tracks are <trkpt> tags in one or more <trkseg> sections in each <trk>
        var layers = [];

        var name = gpx.getElementsByTagName('name');
        if (name.length > 0) {
        this._info.name = name[0].textContent;
        }

        // parse waypoints and add markers for each of them
        el = gpx.getElementsByTagName('wpt');
        for (i = 0; i < el.length; i++) {
          var ll = new L.LatLng(
              el[i].getAttribute('lat'),
              el[i].getAttribute('lon'));
  
          var nameEl = el[i].getElementsByTagName('name');
          var name = nameEl.length > 0 ? nameEl[0].textContent : '';
  
          var descEl = el[i].getElementsByTagName('desc');
          var desc = descEl.length > 0 ? descEl[0].textContent : '';  

          var customIcon = L.icon({
            iconUrl: options.marker_options.wptIconUrl,
            iconSize: options.marker_options.iconSize,
            iconAnchor: options.marker_options.iconAnchor,
            popupAnchor: options.marker_options.popupAnchor
            });
  
          var marker = new L.Marker(ll, {
            clickable: options.marker_options.clickable,
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
                layers = layers.concat(this._parseSegment(segments[j], 'trkpt', options));
            }
        }

        if (layers.length > 1) {
            return new L.FeatureGroup(layers);
        } else if (layers.length == 1) {
        return layers[0];
        }
    },

    _parseSegment: function(line, tag, options) {
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
        var l = new L.polyline(coords, {color: options.polyline_options.color, weight: options.polyline_options.weight});
        layers.push(l);

        if (options.marker_options.addStartEndIcons) {
            // add start pin
            var customIcon = L.icon({
                iconUrl: options.marker_options.startIconUrl,
                iconSize: options.marker_options.iconSize,
                iconAnchor: options.marker_options.iconAnchor,
                popupAnchor: options.marker_options.popupAnchor
                });
            var marker = new L.Marker(coords[0], {
              clickable: false,
              icon: customIcon
            });

            layers.push(marker);
          
            // add end pin
            var customIcon = L.icon({
                iconUrl: options.marker_options.endIconUrl,
                iconSize: options.marker_options.iconSize,
                iconAnchor: options.marker_options.iconAnchor,
                popupAnchor: options.marker_options.popupAnchor
                });
            var marker = new L.Marker(coords[coords.length-1], {
              clickable: false,
              icon: customIcon
            });

            layers.push(marker);
          }

        return layers;
    }
});
