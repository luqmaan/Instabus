var ko = require('knockout');
var L = require('leaflet');

var LocateControl = require('./LocateControl');
var config = require('./config');


function MapController() {
    this.map = null;

    // obervables
    this.displayMap = ko.observable(false);

    // stops tells mapcontroller the stop coordinates
    // vehicles tells mapcontroller the vehicle coordinates
    // mapscontroller looks at them whenever it tries to fit closest
    this.stopCoords = ko.observableArray();
    this.vehicleCoords = ko.observableArray();

    this.hashChange();
}

MapController.prototype.applyBindings = function() {
    this.displayMap(true);
    if (!!this.didApplyBindings) {
        return;
    }
    else {
        this.didApplyBindings = true;
    }

    ko.applyBindings(this, document.querySelector("#map-wrapper"));

    this.map = L.map('map', {zoomControl: false});

    this.map.setView(config.MAP_INITIAL_COORDINATES, config.MAP_INITIAL_ZOOM_LEVEL);

    this._tileLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '<a href="http://openstreetmap.org">OpenStreetMap</a> | <a href="http://mapbox.com">Mapbox</a>',
        id: 'drmaples.ipbindf8',
    });
    this._tileLayer.addTo(this.map);

    this._zoomCtrl = new L.Control.Zoom({position: 'bottomright'});
    this._zoomCtrl.addTo(this.map);

    this._locateCtrl = new LocateControl({
        position: 'bottomright',
        zoomLevel: 16,
        zoomFunction: this.fitClosest.bind(this)
    });
    this._locateCtrl.addTo(this.map);

    this.map.on('locationfound', function(e) {
        this.latlng = e.latlng;
    }.bind(this));
};

MapController.prototype.removeBindings = function() {
    // FIXME: Actually remove the map from the DOM
    this.displayMap(false);
};

MapController.prototype.hashChange = function() {
    if (location.hash.match(/route\/\d+/g)) {
        this.applyBindings();
    }
    else {
        this.removeBindings();
    }
};

MapController.prototype.fitClosest = function() {
    if (!this.latlng.lat || !this.latlng.lng) {
        return;
    }

    var bounds = [
        [this.latlng.lat, this.latlng.lng],
        // geolib.closest(this.stopCoords()),
        // geolib.closest(this.vehicleCoords()),
    ];
    console.log('Zooming to fit bounds', bounds);

    this.map.fitBounds(bounds, {
        maxZoom: config.MAP_INITIAL_ZOOM_LEVEL,
    });
};

module.exports = new MapController();
