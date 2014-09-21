// require('when/monitor/console');
var ko = require('knockout');
var L = require('leaflet');
var when = require('when');
var NProgress = require('NProgress');
var LocateControl = require('./LocateControl');
var RoutesCollection = require('./models/RoutesCollection');
var VehicleCollection = require('./models/VehicleCollection');
var Shape = require('./models/Shape');
var StopCollection = require('./models/StopCollection');
var config = require('./config');

var CapMetroAPIError = config.errors.CapMetroAPIError();

function Rappid() {
    // leaflet
    this.map = null;
    this.latlng = null;
    // route shape and stops go on rappid.routeLayer
    // vehicles go on rappid.vehicles.layer
    this.routeLayer = null;

    // data
    this.vehicles = null;
    this.shape = null;

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
            .then(this.selectRoute.bind(this))
            .catch(console.error);
    },
    refresh: function() {
        console.log('refreshing', this, arguments);
        function refreshCompletion() {
            NProgress.done();
            this.refreshTimeout = setTimeout(this.refresh.bind(this), config.REFRESH_INTERVAL);
            // refresh on mobile unlock/maximize
            // don't bind until the first refresh is done unless you want a world of race conditions with the animations ;_;
            window.addEventListener('pageshow', this.refresh.bind(this));
        }

        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
            // FIXME: Is there some way to abort any existings requests/promises?
            // Two refreshes happening at once seems bad.
            // We could do put a mutex on refresh(). But if refresh() gets stuck, no more refreshes will get scheduled.
        }

        NProgress.start();

        this.vehicles.refresh()
            .progress(function() {
                // console.log('progress', arguments);
                // FIXME: Show the progress notifications in the UI
            }.bind(this))
            .then(function() {
                var stopsRefresh = this.stops().map(function(stop) { return stop.refresh(); });
                return when.all(stopsRefresh);
            }.bind(this))
            .catch(CapMetroAPIError, this.rustle.bind(this))
            .catch(function(e) {
                // FIXME: Show the error in the UI
                console.error(e);
            })
            .finally(refreshCompletion.bind(this));
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
        this.setupRoute()
            .then(this.refresh.bind(this))
            .catch(console.error);
    },
    setupRoute: function() {
        var route = this.route().id,
            direction = this.route().direction,
            shapePromise,
            stopsPromise;

        this.track();
        localStorage.setItem('rappid:route', ko.toJSON(this.route()));

        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }
        this.routeLayer = L.layerGroup();
        this.routeLayer.addTo(this.map);

        if (this.vehicles) {
            this.map.removeLayer(this.vehicles.layer);
        }
        this.vehicles = new VehicleCollection(route, direction);
        this.vehicles.layer.addTo(this.map);

        this.shape = new Shape(route, direction);
        shapePromise = this.shape.fetch()
            .tap(this.shape.draw.bind(this.shape, this.routeLayer));

        stopsPromise = StopCollection.fetch(route, direction)
            .tap(function(stops) {
                StopCollection.draw(stops, this.routeLayer);
                this.stops(stops);
                if (this.latlng) {
                    StopCollection.closest(stops, this.latlng);
                }
            }.bind(this));

        return when.all([shapePromise, stopsPromise]);
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
        var routeDirection = this.route().id + '-' + this.route().direction;
        window.analytics.page({
            name: routeDirection,
            route: this.route().id,
            direction: this.route().id,
            location: {
                latitude: this.latlng.lat,
                longitude: this.latlng.lng,
            },
            app: {
                version: config.VERSION
            }
        });
    },
    rustle: function() {
        window.alert('There was a problem fetching data from CapMetro.\nClose the app and try again.');
        setTimeout(function() {
            window.alert('There is no need to be upset.');
            setTimeout(function() {
                window.location.href = "https://www.youtube.com/watch?v=ygr5AHufBN4";
            }, 5000);
        }, 2000);
    }
};

module.exports = Rappid;
