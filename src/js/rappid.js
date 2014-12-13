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
    this.latlng = {lat: null, lng: null};
    // route shape and stops go on rappid.routeLayer
    // vehicles go on rappid.vehicles.layer
    this.routeLayer = null;

    // data
    this.vehicles = null;
    this.shape = null;

    // viewmodels
    this.routes = new RoutesCollection();
    this.stops = ko.observableArray();

    this.displayMap = ko.observable(false);
    this.title = ko.computed(function() {
        var name = 'MetroRappid';
        if (this.routes.active()) {
            name = this.routes.active().prettyName();
        }
        return name;
    }, this);

}

Rappid.prototype = {
    start: function() {
        NProgress.configure({ showSpinner: false });

        window.addEventListener("hashchange", this.hashChange.bind(this));

        this.routes.start()

        this.routes.active.subscribe(this.selectRoute.bind(this));
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

        // FIXME: suppeeeeer 💩
        var firstVehiclesRefresh = !this.vehicles.vehicles.length;
        console.log("firstVehiclesRefresh", firstVehiclesRefresh);

        this.vehicles.refresh()
            .progress(function() {
                // console.log('progress', arguments);
                // FIXME: Show the progress notifications in the UI
            }.bind(this))
            .then(function() {
                if (firstVehiclesRefresh) {
                    this.fitClosest(true);
                }
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

        if (!this.alreadySetupMap) {
            this.alreadySetupMap = true;
        }
        else {
            return;
        }

        this.map = L.map('map', {zoomControl: false,});
        this.map.setView(config.MAP_INITIAL_COORDINATES, config.MAP_INITIAL_ZOOM_LEVEL);

        tileLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '<a href="http://openstreetmap.org">OpenStreetMap</a> | <a href="http://mapbox.com">Mapbox</a>',
            id: 'drmaples.ipbindf8'
        });

        zoomCtrl = new L.Control.Zoom({position: 'bottomright'});

        locateCtrl = new LocateControl({
            position: 'bottomright',
            zoomLevel: 16,
            zoomFunction: this.fitClosest.bind(this)
        });

        tileLayer.addTo(this.map);
        zoomCtrl.addTo(this.map);
        locateCtrl.addTo(this.map);

        this.map.on('locationfound', function(e) {
            if (!this.latlng.lat || !this.latlng.lng) {
                this.latlng = e.latlng;
                this.fitClosest();
            }
            this.latlng = e.latlng;
        }.bind(this));
    },
    selectRoute: function(route) {
        this.displayMap(true);
        this.setupMap();

        this.setupRoute(route)
            .then(this.refresh.bind(this))
            .catch(console.error);
    },
    setupRoute: function(route) {
        var shapePromise,
            stopsPromise;

        this.track(route);

        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }
        this.routeLayer = L.layerGroup();
        this.routeLayer.addTo(this.map);

        if (this.vehicles) {
            this.map.removeLayer(this.vehicles.layer);
        }
        this.vehicles = new VehicleCollection(route.id(), route.directionId());
        this.vehicles.layer.addTo(this.map);

        this.shape = new Shape(route.id(), route.directionId());
        shapePromise = this.shape.fetch()
            .tap(this.shape.draw.bind(this.shape, this.routeLayer));

        stopsPromise = StopCollection.fetch(route.id(), route.directionId())
            .tap(function(stops) {
                StopCollection.draw(stops, this.routeLayer);
                this.stops(stops);
                if (this.latlng.lat && this.latlng.lng) {
                    this.fitClosest();
                }
            }.bind(this));

        return when.all([shapePromise, stopsPromise]);
    },
    track: function(route) {
        var routeDirection = route.id() + '-' + route.directionId();
        window.analytics.track('TripSelected', {
            name: routeDirection,
            route: route.id(),
            direction: route.directionId(),
            fingerprint: window.fingerme,
            coordinates: [this.latlng.lat, this.latlng.lng],
            location: {
                latitude: this.latlng.lat,
                longitude: this.latlng.lng,
            },
            app: {
                version: config.VERSION
            },
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
    },
    fitClosest: function() {
        if (!this.latlng.lat || !this.latlng.lng) { return; }

        var bounds = [[this.latlng.lat, this.latlng.lng]],
            closestStop = StopCollection.closest(this.latlng.lat, this.latlng.lng, this.stops()),
            closestVehicle = VehicleCollection.closest(this.latlng.lat, this.latlng.lng, this.vehicles);

        if (closestStop) {
            bounds.push([closestStop.lat(), closestStop.lon()]);
        }
        if (closestVehicle) {
            bounds.push([closestVehicle.lat(), closestVehicle.lon()]);
        }
        console.log('Zooming to fit bounds', bounds);

        this.map.fitBounds(bounds, {
            maxZoom: config.MAP_INITIAL_ZOOM_LEVEL,
        });
    },
    hashChange: function() {
        console.log('Hash changed to', location.hash);

        if (location.hash === '') {
            this.displayMap(false);
        }
    }
};

module.exports = Rappid;
