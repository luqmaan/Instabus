var ko = require('knockout');
var when = require('when');
var leaflet = require('leaflet');
require('leaflet.label');
var StopDetails = require('./StopDetails');
var fs = require('fs');
var config = require('../config');

var stopPopupHTML = fs.readFileSync(__dirname + '/../templates/stop-popup.html', 'utf8');

function Stop(data) {
    var stop_name = data.stop_name.replace('(SB)', '').replace('(NB)', '');
    this.name = ko.observable(stop_name);
    this.stopID = ko.observable(data.stop_id);
    this.directionID = ko.observable(parseInt(data.direction_id));
    this.routeID = ko.observable(parseInt(data.route_id));
    this.code = ko.observable(data.stop_code);
    this.desc = ko.observable(data.stop_desc);
    this.lat = ko.observable(data.stop_lat);
    this.lon = ko.observable(data.stop_lon);
    this.timezone = ko.observable(data.stop_timezone);
    this.url = ko.observable(data.url);

    this.stopDetails = new StopDetails(this.routeID(), this.directionID(), this.stopID());
    this.trips = ko.observableArray();

    this._errorMsg = ko.observable();
    this.errorMsg = ko.computed(function() {
        return this.stopDetails.errorMsg() || this._errorMsg();
    }, this);

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

    this.marker.bindLabel(this.name(), {
        noHide: true,
        direction: 'right',
        className: 'stop-leaflet-label',
        offset: [15, -10],
   });

    this.marker.on('click', this.centerMarker.bind(this));
    this.marker.on('click', this.stopClicked.bind(this));
}

Stop.prototype = {
    stopClicked: function() {
        var hash = '#/route/' + this.routeID() + '/direction/' + this.directionID() + '/stop/' + this.stopID();
        location.hash = hash;
    },
    refresh: function() {
        this.loading(true);

        this.stopDetails.fetch()
            .progress(function(msg) {
                this._errorMsg(msg);
            }.bind(this))
            .then(function() {
                if (this.stopDetails.tripCollection) {
                    this.trips(this.stopDetails.tripCollection.trips());
                }
                this.loadedTrips(true);
                this.loading(false);
                this._errorMsg(null);
            }.bind(this))
            .catch(function(e) {
                this.loadedTrips(false);
                this.loading(false);
                this._errorMsg(e.message);
            }.bind(this));
    },
    setupMarker: function() {
        this.marker.bindPopup(this.popupContent());
        this.marker.openPopup();
    },
    popupContent: function() {
        var div = document.createElement('div');
        div.innerHTML = stopPopupHTML;
        ko.applyBindings(this, div);
        return div;
    },
    centerMarker: function() {
        try {
            this.marker._map.setView(this.marker._latlng);
        }
        catch (e) {
            console.log('Marker does not have ._map yet, retrying in 1000ms', e);
            setTimeout(function() {
                this.marker._map.setView(this.marker._latlng);
            }.bind(this), 1000);
        }
    }
};

module.exports = Stop;
