var geolib = require('geolib');
var L = require('leaflet');
var when = require('when');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config');
var requests = require('../requests');
var Vehicle = require('./Vehicle');

var CapMetroAPIError = config.errors.CapMetroAPIError();

function VehicleCollection(route, direction) {
    this.route = route;
    this.direction = direction;
    this.vehicles = [];
    this.layer = L.layerGroup();
}

VehicleCollection.prototype = {
    refresh: function() {
        return this.fetch()
            .then(this.filter.bind(this))
            .tap(this.draw.bind(this));
    },
    fetch: function() {
        var url = 'https://lnykjry6ze.execute-api.us-west-2.amazonaws.com/prod/gtfsrt-debug?url=https://data.texas.gov/download/eiei-9rpf/application/octet-stream&_=' + (Math.ceil(Math.random() * 100000));

        return requests.json(url)
            .then(this.parseResponse.bind(this));
    },
    parseResponse: function(res) {
        debugger;
        var currentRoute = this.route;

        var vehicles = res.entity.filter(function(vehicle) {
            return vehicle.trip.route_id === currentRoute;
        }).map(function(vehicle) {
            return new Vehicle(res);
        });

        return vehicles;
    },
    filter: function(rawVehicles) {
        return rawVehicles.filter(function(v) {
            if (v.vehicleID && v.location) {
                return v;
            }
            console.log('discarding vehicle vehicleID: ', v.vehicleID, 'location', v.location);
        });
    },
    draw: function(newVehicles) {
        var addedVehicles = [],
            existingVehicles = [],
            deletedVehicles = [],
            vehicleComparator = function(a, b) { return a.id === b.id; };

        // find added and existing vehicles
        newVehicles.forEach(function(v) {
            var existing = _.find(this.vehicles, vehicleComparator.bind(null, v));
            if (existing) {
                existingVehicles.push(existing);
            }
            else {
                addedVehicles.push(v);
            }
        }.bind(this));

        // find deleted vehicles
        this.vehicles.forEach(function(v) {
            var equal = _.find(newVehicles, vehicleComparator.bind(null, v));
            if (!equal) {
                deletedVehicles.push(v);
            }
        });

        console.info('Existing', existingVehicles.length, 'vehicles', existingVehicles);
        console.info('Added', addedVehicles.length, 'vehicles', addedVehicles);
        console.info('Deleted', deletedVehicles.length, 'vehicles', deletedVehicles);

        // remove from map and delete from this.vehicles
        deletedVehicles.forEach(function(v) {
            v.remove(this.layer);

            var index = this.vehicles.indexOf(v);
            if (index > -1) {
                this.vehicles.splice(index, 1);
            }
        }.bind(this));

        // draw on map and add to this.vehicles
        addedVehicles.forEach(function(v) {
            this.vehicles.push(v);
            v.draw(this.layer);
        }.bind(this));

        // update the existing vehicle with the new vehicle's data
        // then move the existing vehicle's marker to its new location
        existingVehicles.forEach(function(v) {
            var newVehicle = _.find(newVehicles, vehicleComparator.bind(null, v));

            v.update(newVehicle);
        });
    }
};

// FIXME: VehicleCollection really needs to be refactored to be more like StopsCollection
//        It is suppeeeeer 💩 as is.
VehicleCollection.closest = function(lat, lng, vehicles) {
    if (!lat || !lng || !vehicles || !vehicles.vehicles.length) return;

    var points = vehicles.vehicles.map(function(v) { return {latitude: v.lat(), longitude: v.lon()}; }),
        nearestPoint = geolib.findNearest({latitude: lat, longitude: lng}, points, 0, 1),
        closest = vehicles.vehicles[parseInt(nearestPoint.key)];

    return closest;
}


module.exports = VehicleCollection;
