var ko = require('knockout'),
    L = require('leaflet'),
    config = require('../config'),
    utils = require('../utils');

var fs = require('fs'),
    vehiclePopupHTML = fs.readFileSync(__dirname + '/../templates/vehicle-popup.html', 'utf8');

function Vehicle(data) {
    // FIXME: Do these have to be observables? There isn't two way binding.
    this.id = this.vehicleID = data.Vehicleid;
    this.route = data.Route;
    this.direction = utils.getDirectionID(data.Direction);
    this.updateTime = data.Updatetime;
    this.block = data.Block;
    this.adherance = data.Adherance;
    this.adheranceChange = data.Adhchange;
    this.reliable = data.Reliable;
    this.offRoute = data.Offroute;
    this.stopped = data.Stopped;
    this.inService = data.Inservice;
    this.routeID = data.Routeid;
    this.speed = data.Speed;
    this.heading = data.Heading;

    this.positions = this.parsePositions(data.Positions);
    this.latlng = this.positions[0];
    this.lat = this.latlng[0];
    this.lng = this.latlng[1];

    this.marker = null;
}

Vehicle.prototype.popupContent = function() {
    var div = document.createElement('div');
    div.innerHTML = vehiclePopupHTML;
    ko.applyBindings(this, div);
    return div;
};

Vehicle.prototype.parsePositions = function (positions) {
    if (!Array.isArray(positions)) {
        positions = [positions];
    }
    return positions.map(function(pos) {
        pos = pos.split(',');
        return [Number(pos[0]), Number(pos[1])];
    });
};

Vehicle.prototype.draw = function(existingMarkers, layer) {
    var newMarker;

    if (existingMarkers[this.vehicleID]) {
        this.marker = existingMarkers[this.vehicleID];
        var deltaLatLng = [this.lat - this.marker.lat, this.lng[1] - this.marker.lng[1]];
        animateMarker(this.marker, 0, 200, this.marker.latlng, deltaLatLng);
    }
    else {
        this.marker = this.newMarker();
        this.marker.addTo(layer);
    }

    return newMarker;
};

Vehicle.prototype.newMarker = function() {
    var marker = L.circleMarker([this.lat, this.lng], {
        color: '#fff',
        weight: 3,
        radius: 15,
        opacity: 1,
        fillOpacity: '0.9',
        fillColor: this.Inservice === 'Y' ? 'rgb(34,189,252)' : 'rgb(188,188,188)',
        zIndexOffset: config.vehicleZIndex
    });

    marker.latlng = this.latlng;
    marker.lat = this.lat;
    marker.lng = this.lng;

    marker.bindPopup('popupContent');

    return marker;
};

// https://github.com/danro/jquery-easing/blob/818a47a97fa5ea25f1e4c8a6121e0bca9407d51a/jquery.easing.js
function easeInOutCubic(t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t + b;
    return c/2*((t-=2)*t*t + 2) + b;
}

function animateMarker(marker, i, steps, startLatLng, deltaLatLng) {
    var x = easeInOutCubic(i, startLatLng[0], deltaLatLng[0], steps),
        y = easeInOutCubic(i, startLatLng[1], deltaLatLng[1], steps);

    marker.setLatLng([x, y]);

    if (i < steps) {
        setTimeout(animateMarker.bind(null, marker, i + 1, steps, startLatLng, deltaLatLng), 10);
    }
}

module.exports = Vehicle;
