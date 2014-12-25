var fs = require('fs');

var ko = require('knockout');
var when = require('when');
require('leaflet.label');
var leaflet = require('leaflet');

var config = require('../config');
var TripCollection = require('./TripCollection');
var stopDetailsHTML = fs.readFileSync(__dirname + '/../templates/stop-details.html', 'utf8');


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

    this.tripCollection = new TripCollection();

    this.cssId = ko.observable('stop-' + data.stop_id);

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

Stop.prototype.refresh = function() {
    return this.tripCollection.fetch();
};

Stop.prototype.centerMarker = function() {
    try {
        this.marker._map.setView(this.marker._latlng);
    }
    catch (e) {
        console.log('Marker does not have ._map yet, retrying in 1000ms', e);
        setTimeout(function() {
            this.marker._map.setView(this.marker._latlng);
        }.bind(this), 1000);
    }
};

Stop.prototype.applyBindings = function() {
    var div = document.querySelector("#stop-details-wrapper");
    var inner = div.querySelector('.inner');

    if (inner) {
        ko.cleanNode(inner);
        inner.remove();
    }

    div.innerHTML = stopDetailsHTML;
    inner = div.querySelector('.inner');
    ko.applyBindings(this, inner);
};

Stop.prototype.stopClicked = function() {
    var hash = '#/route/' + this.routeID() + '/direction/' + this.directionID() + '/stop/' + this.stopID();
    location.hash = hash;
};

module.exports = Stop;
