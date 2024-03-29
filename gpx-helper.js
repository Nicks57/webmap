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
        var l = new L.polyline(coords, {color: color, weight: 5});
        layers.push(l);

        return layers;
    }
});
