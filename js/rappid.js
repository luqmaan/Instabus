var ko = require('knockout');
var L = require('leaflet');
var when = require('when');
var NProgress = require('NProgress');
var LocateControl = require('./LocateControl');
var RoutesCollection = require('./models/RoutesCollection');
var VehicleCollection = require('./models/VehicleCollection');
var Shape = require('./models/Shape');
var StopCollection = require('./models/StopCollection');


function Rappid() {
    // leaflet
    this.map = null;
    this.routeLayer = null;
    this.latlng = null;

    // data
    this.vehicles = null;
    this.shape = null;
    this.markers = {};

    // viewmodels
    this.availableRoutes = ko.observableArray();
    this.route = ko.observable();
    this.stops = ko.observableArray();

    // options
    this.includeList = ko.observable(true);
    this.includeMap = ko.observable(true);
    this.includeToggleBtn = ko.computed(function() {
        return !this.includeList() || !this.includeMap();
    }.bind(this));
}

Rappid.prototype = {
    start: function() {
        NProgress.configure({ showSpinner: false });

        this.resize();
        this.setupMap();

        RoutesCollection.fetch()
            .tap(function(routes) {
                this.availableRoutes(routes);

                var cachedRoute = JSON.parse(localStorage.getItem('rappid:route')),
                    defaultRoute = this.availableRoutes()[0];

                if (cachedRoute) {
                    defaultRoute = this.availableRoutes().filter(function(r) { return cachedRoute.id === r.id && cachedRoute.direction === r.direction; })[0];
                }

                this.route(defaultRoute);
            }.bind(this))
            .then(this.setupRoute.bind(this))
            .catch(function(e) {
                console.error(e);
                NProgress.done();

                if (e === 'The CapMetro API is unavailable') {
                    this.rustle();
                }
            }.bind(this))
            .done(function() {
                setTimeout(this.refresh.bind(this), 15 * 1000);
            }.bind(this));
    },
    refresh: function() {
        // refresh() should be the final place where all the promises die
        // therefore, refresh() can't return a promise itself
        NProgress.start();

        VehicleCollection.fetch(this.route().id, this.route().direction)
            .then(function(newVehicles) {
                this.vehicles = newVehicles;
                this.markers = VehicleCollection.draw(this.vehicles, this.markers, this.routeLayer);
            }.bind(this))
            .then(function() {
                var stopsRefresh = this.stops().map(function(stop) { return stop.refresh(); });
                return when.all(stopsRefresh);
            }.bind(this))
            .catch(function(e) {
                // FIXME: Show the error in the UI
                console.error(e);
                if (e.message === 'The CapMetro API is unavailable') {
                    this.rustle();
                }
            })
            .finally(function() {
                NProgress.done();
                setTimeout.bind(null, this.refresh.bind(this), 15 * 1000);
            }.bind(this))
            .done(function() {
                NProgress.done();
            });
    },
    setupMap: function() {
        var tileLayer,
            zoomCtrl,
            locateCtrl;

        this.map = L.map('map', {zoomControl: false,});
        this.map.setView([30.267153, -97.743061], 12);

        tileLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '<a href="http://openstreetmap.org">OpenStreetMap</a> | <a href="http://mapbox.com">Mapbox</a>',
            id: 'drmaples.ipbindf8'
        });

        zoomCtrl = new L.Control.Zoom({position: 'bottomright'});

        locateCtrl = new LocateControl({
            position: 'bottomright',
            zoomLevel: 16,
        });

        tileLayer.addTo(this.map);
        zoomCtrl.addTo(this.map);
        locateCtrl.addTo(this.map);

        this.map.on('locationfound', function(e) {
            if (!this.latlng) {
                StopCollection.closest(this.stops(), e.latlng);
            }
            this.latlng = e.latlng;
        }.bind(this));
    },
    selectRoute: function() {
        this.setupRoute().done(null, console.error);
    },
    setupRoute: function() {
        var route = this.route().id,
            direction = this.route().direction,
            shapePromise,
            vehiclesPromise,
            stopsPromise;

        this.track();
        localStorage.setItem('rappid:route', ko.toJSON(this.route()));

        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }
        this.routeLayer = L.layerGroup();
        this.routeLayer.addTo(this.map);

        this.shape = new Shape(route, direction);
        shapePromise = this.shape.fetch()
            .tap(this.shape.draw.bind(this.shape, this.routeLayer));

        vehiclesPromise = VehicleCollection.fetch(route, direction)
            .tap(function(vehicles) {
                this.vehicles = vehicles;
                VehicleCollection.draw(this.vehicles, this.markers, this.routeLayer);
            }.bind(this));

        stopsPromise = StopCollection.fetch(route, direction)
            .tap(function(stops) {
                StopCollection.draw(stops, this.routeLayer);
                this.stops(stops);
                if (this.latlng) {
                    StopCollection.closest(stops, this.latlng);
                }
            }.bind(this));

        return when.all([shapePromise, vehiclesPromise, stopsPromise]);
    },
    resize: function(e) {
        if (window.screen.width <= 1024) {
            this.includeMap(true);
            this.includeList(false);
        }
        else {
            this.includeMap(true);
            this.includeList(true);
        }
    },
    toggleMap: function() {
        this.includeList(!this.includeList());
        this.includeMap(!this.includeMap());
        this.map.invalidateSize();
        this.map.closePopup();
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    },
    track: function() {
        // FIXME: Shit don't work
        var routeDirection = this.route().id + '-' + this.route().direction;
        window.ga('send', {
            'dimension1': routeDirection,
            'hitType': 'screen',
            'screenName': routeDirection
        });
    },
    rustle: function() {
        window.alert('There was a problem fetching data from CapMetro.\nClose the app and try again.');
        // setTimeout(function() {
        //     window.alert('There is no need to be upset.');
        //     setTimeout(function() {
        //         window.location.href = "https://www.youtube.com/watch?v=ygr5AHufBN4";
        //     }, 5000);
        // }, 2000);
    }
};

module.exports = Rappid;
