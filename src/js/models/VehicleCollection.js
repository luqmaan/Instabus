var geolib = require('geolib');
var L = require('leaflet');
var when = require('when');
var _ = require('underscore');

var config = require('../config');
var requests = require('../requests');
var utils = require('../utils');
var mapController = ('../MapController');
var Vehicle = require('./Vehicle');

var CapMetroAPIError = config.errors.CapMetroAPIError();

function VehicleCollection(routeID) {
    this.routeID = routeID;
    this.vehicles = [];

    this._layer = null;
    this._refreshTimeout = null;

    window.addEventListener("hashchange", this.hashChange.bind(this));

    this.hashChange();
}

_.extend(VehicleCollection.prototype, {
    start: function() {
        var promise = this.fetch()
                          .with(this)
                          .tap(this.applyBindings)
                          .tap(this.draw)
                          .finally(function() {
                              this._refreshTimeout = setTimeout(this.refresh, config.REFRESH_INTERVAL);
                          });
        return promise;
    },
    refresh: function() {
        var promise = this.fetch()
                          .with(this)
                          .tap(this.draw)
                          .finally(function() {
                              this._refreshTimeout = setTimeout(this.refresh, config.REFRESH_INTERVAL);
                          });

        return promise;
    },
    fetch: function() {
        var yqlURL = 'http://query.yahooapis.com/v1/public/yql';
        var capURL = 'http://www.capmetro.org/planner/s_buslocation.asp?route=' + this.routeID;
        var params = {
            q: 'select * from xml where url="' + capURL + '"',
            format: 'json' // let yql do the conversion from xml to json
        };

        // FIXME: Make the retries option actually work
        var promise = requests.get(yqlURL, params, {retries: config.MAX_RETRIES})
            .with(this)
            .then(this.parseResponse)
            .tap(function(vehicles) {
                this.vehicles = vehicles;
                console.info('API responded with', vehicles.length, 'vehicles');
            });

        return promise;
    },
    parseResponse: function(res) {
        if (!res.query.results || !res.query.results.Envelope) {
            throw new CapMetroAPIError('The CapMetro Bus Location API is unavailable');
        }
        if (res.query.results.Envelope.Body.Fault) {
            var fault = res.query.results.Envelope.Body.Fault;
            var faultstring = fault.faultstring;
            var faultcode = fault.faultcode;

            throw new Error(faultcode + ' ' + faultstring);
        }
        if (!res.query.results.Envelope.Body.BuslocationResponse.Vehicles) {
            throw new Error('Zero active vehicles');
        }

        var data = res.query.results.Envelope.Body.BuslocationResponse.Vehicles.Vehicle;
        if (!Array.isArray(data)) {
            data = [data];
        }

        var vehicles = data.forEach(function(v) {
            return new Vehicle(v);
        });

        return vehicles;
    },
    applyBindings: function() {
        this._layer = L.layerGroup();
        this._layer.addTo(mapController.map);
    },
    removeBindings: function() {
        clearTimeout(this._refreshTimeout);

        mapController.map.removeLayer(this._layer);
        this._layer = null;
    },
    draw: function(newVehicles) {
        var addedVehicles = [];
        var existingVehicles = [];
        var deletedVehicles = [];
        var vehicleComparator = function(a, b) { return a.id === b.id; };

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
            v.remove(this._layer);

            var index = this.vehicles.indexOf(v);
            if (index > -1) {
                this.vehicles.splice(index, 1);
            }
        }.bind(this));

        // draw on map and add to this.vehicles
        addedVehicles.forEach(function(v) {
            this.vehicles.push(v);
            v.draw(this._layer);
        }.bind(this));

        // update the existing vehicle with the new vehicle's data
        // then move the existing vehicle's marker to its new location
        existingVehicles.forEach(function(v) {
            var newVehicle = _.find(newVehicles, vehicleComparator.bind(null, v));

            v.update(newVehicle);
        });
    },
    hashChange: function() {
        var hashRouteID = !!location.hash.match(/route\/\d+/g) ? /route\/(\d+)/g.exec(location.hash)[1] : null;

        if (hashRouteID === this.routeID && !this._layer) {
            this.start();
        }
        else if (hashRouteID && hashRouteID !== this.routeID && this._layer){
            this.removeBindings();
        }
    }
});

module.exports = VehicleCollection;
