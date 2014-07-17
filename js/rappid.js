define(['knockout', 'leaflet', 'when', 'NProgress', 'LocateControl', 'models/RoutesCollection', 'models/Vehicles', 'models/Shape', 'models/StopCollection'],
function(ko, L, when, NProgress, LocateControl, RoutesCollection, Vehicles, Shape, StopCollection) {
    function Rappid() {
        // leaflet
        this.map = null;
        this.routeLayer = null;
        this.latlng = null;

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
            var deferred = when.defer();

            this.resize();
            this.setupMap();

            RoutesCollection.fetch().then(
                function(routes) {
                    this.availableRoutes(routes);

                    var cachedRoute = JSON.parse(localStorage.getItem('rappid:route')),
                        defaultRoute = this.availableRoutes()[0];

                    if (cachedRoute) {
                        defaultRoute = this.availableRoutes().filter(function(r) { return cachedRoute.id === r.id && cachedRoute.direction === r.direction; })[0];
                    }

                    this.route(defaultRoute);
                    this.setupRoute().then(null, console.error);

                    deferred.resolve();
                }.bind(this),
                deferred.reject
            );

            NProgress.configure({ showSpinner: false });

            return deferred.promise;
        },
        refresh: function() {
            NProgress.start();

            var deferred = when.defer(),
                vehiclesPromise = this.vehicles.fetch(),
                stopPromises = this.stops().map(function(stop) { return stop.refresh(); }),
                promises;

            vehiclesPromise.then(this.vehicles.draw.bind(this.vehicles, this.routeLayer));

            promises = [vehiclesPromise];
            promises = promises.concat(stopPromises);

            when.all(promises).done(
                function() {
                    NProgress.done();
                    setTimeout(this.refresh.bind(this), 15 * 1000);
                    deferred.resolve(true);
                }.bind(this),
                function(e) {
                    console.error(e);
                    NProgress.done();
                    deferred.resolve(false);
                }
            );

            // always resolves to true (success) or false (error)
            // doesn't not reject because we don't want an error to propogate from here since it is self scheduling
            return deferred.promise;
        },
        setupMap: function() {
            var tileLayer,
                zoomCtrl,
                locateCtrl;

            this.map = L.map('map', {zoomControl: false,});
            this.map.setView([30.267153, -97.743061], 12);

            tileLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'drmaples.ippd4l38'
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
            var deferred = when.defer(),
                route = this.route().id,
                direction = this.route().direction,
                promises,
                shapePromise,
                vehiclesPromise,
                stopsPromise;

            this.track();

            console.log('Setup route', this.route());
            localStorage.setItem('rappid:route', ko.toJSON(this.route()));

            if (this.routeLayer) {
                this.map.removeLayer(this.routeLayer);
            }

            this.routeLayer = L.layerGroup();
            this.routeLayer.addTo(this.map);

            this.vehicles = new Vehicles(route, direction);
            this.shape = new Shape(route, direction);

            shapePromise = this.shape.fetch();
            shapePromise.then(this.shape.draw.bind(this.shape, this.routeLayer));

            vehiclesPromise = this.vehicles.fetch();
            vehiclesPromise.then(this.vehicles.draw.bind(this.vehicles, this.routeLayer));

            stopsPromise = StopCollection.fetch(route, direction);
            stopsPromise.then(
                function(stops) {
                    StopCollection.draw(stops, this.routeLayer);
                    this.stops(stops);

                    if (this.latlng) {
                        StopCollection.closest(stops, this.latlng);
                    }
                }.bind(this)
            );

            promises = [shapePromise, vehiclesPromise, stopsPromise];

            when.all(promises).done(
                function() {
                    setTimeout(this.refresh.bind(this), 15 * 1000);
                    deferred.resolve();
                }.bind(this),
                deferred.reject
            );

            return deferred.promise;
        },
        resize: function(e) {
            if (window.screen.width <= 640) {
                this.includeMap(false);
                this.includeList(true);
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
            window.ga('send', {
                'dimension1': routeDirection,
                'hitType': 'screen',
                'screenName': routeDirection
            });
        }
    };

    return Rappid;
});
