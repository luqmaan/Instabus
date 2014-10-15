var ko = require('knockout');
var when = require('when');
var leaflet = require('leaflet');
require('leaflet.label');
var TripCollection = require('./TripCollection');
var fs = require('fs');
var config = require('../config');

var stopPopupHTML = fs.readFileSync(__dirname + '/../templates/stop-popup.html', 'utf8');

function Stop(data) {
    var stop_name = data.stop_name.replace('(SB)', '').replace('(NB)', '');
    this.name = ko.observable(stop_name);
    this.direction = ko.observable(parseInt(data.direction_id));
    this.route = ko.observable(parseInt(data.route_id));
    this.code = ko.observable(data.stop_code);
    this.desc = ko.observable(data.stop_desc);
    this.id = ko.observable(data.stop_id);
    this.lat = ko.observable(data.stop_lat);
    this.lon = ko.observable(data.stop_lon);
    this.timezone = ko.observable(data.stop_timezone);
    this.url = ko.observable(data.url);
    this.errorMsg = ko.observable();

    this.trips = ko.observableArray();

    this.closest = ko.observable(false);
    this.cssId = ko.observable('stop-' + data.stop_id);

    this.showTrips = ko.observable(false);
    this.loadedTrips = ko.observable(false);
    this.loading = ko.observable(false);
    this.showProgress = ko.computed(function() {
        // don't show after the first load
        return this.loading() && !this.loadedTrips();
    }.bind(this));

    this.color = 'rgb(199,16,22)';

    this.marker = leaflet.circleMarker([this.lat(), this.lon()], {
            color: 'white',
            opacity: 1,
            weight: 3,
            fillColor: this.color,
            fill: true,
            fillOpacity: 1,
            radius: 12,
            zIndexOffset: config.STOP_Z_INDEX
        });

    this.marker.bindPopup(this.popupContent());
    this.marker.bindLabel(this.name(), {
        noHide: true,
        direction: 'auto',
        className: 'stop-leaflet-label',
        offset: [15, -10],
   });

    this.marker.addEventListener('click', this.toggleTrips.bind(this));
}

Stop.prototype = {
    toggleTrips: function(e) {
        this.showTrips(!this.showTrips());

        this.centerMarker();
        this.marker.openPopup();

        if (!this.loadedTrips()) {
            this.loadTrips().then(
                this.centerMarker.bind(this),
                console.error
            );
        }
    },
    loadTrips: function() {
        var deferred = when.defer();

        this.showTrips(true);
        this.loading(true);

        TripCollection.fetch(this.route(), this.direction(), this.id())
            .progress(function(msg) {
                this.errorMsg(msg);
            }.bind(this))
            .then(function(trips) {
                this.loadedTrips(true);
                this.loading(false);
                this.trips(trips);
                this.errorMsg(null);
                deferred.resolve();
            }.bind(this))
            .catch(function(e) {
                this.loadedTrips(true);
                this.loading(false);
                this.errorMsg(e.message);
                deferred.reject(e);
            }.bind(this));

        return deferred.promise;
    },
    refresh: function() {
        if (this.showTrips()) {
            return this.loadTrips();
        }
    },
    popupContent: function() {
        var div = document.createElement('div');
        div.innerHTML = stopPopupHTML;
        ko.applyBindings(this, div);
        return div;
    },
    centerMarker: function() {
        this.marker._map.setView(this.marker._latlng);
    }
};

module.exports = Stop;
