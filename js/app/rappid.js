define(['knockout', 'leaflet', 'when', 'LocateControl', 'models/RoutesCollection', 'models/Vehicles', 'models/Shape', 'models/Stops'],
function(ko, L, when, LocateControl, RoutesCollection, Vehicles, Shape, Stops) {
    function Rappid() {
        // leaflet
        this.map = null;
        this.routeLayer = null;

        // data
        this.vehicles = null;
        this.shape = null;
        this.stops = null;

        // viewmodels
        this.availableRoutes = ko.observableArray();
        this.route = ko.observable();
        this.stopsList = ko.observableArray();

        // options
        this.includeList = ko.observable(true);
        this.includeMap = ko.observable(true);
        this.includeToggleBtn = ko.computed(function() {
            return !this.includeList() || !this.includeMap();
        }.bind(this));
    }

    Rappid.prototype = {
        start: function() {
            this.resize();
            this.setupMap();

            RoutesCollection.fetch().then(
                function(routes) {
                    try {
                        this.availableRoutes(routes);

                        var cachedRoute = JSON.parse(localStorage.getItem('rappid:route')),
                            defaultRoute = this.availableRoutes()[0];

                        if (cachedRoute) {
                            defaultRoute = this.availableRoutes().filter(function(r) {return cachedRoute.id === r.id && cachedRoute.direction === r.direction; })[0];
                        }

                        this.route(defaultRoute);
                        this.setupRoute();
                    } catch(e) {
                        console.error(e);
                    }
                }.bind(this),
                console.error
            );
        },
        selectRoute: function() {
            this.setupRoute();
            localStorage.setItem('rappid:route', ko.toJSON(this.route()));
        },
        refresh: function() {
            this.vehicles.fetch().then(
                function() {
                    this.vehicles.draw(this.routeLayer);
                    setTimeout(this.refresh.bind(this), 15 * 1000);
                }.bind(this),
                this.errorHandler
            );

            this.stopsList().forEach(function(stop) {
                stop.refresh();
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
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'examples.map-i86knfo3',
            });

            zoomCtrl = new L.Control.Zoom({position: 'bottomright'});

            locateCtrl = new LocateControl({
                position: 'bottomright',
                zoomLevel: 16,
            });

            tileLayer.addTo(this.map);
            zoomCtrl.addTo(this.map);
            locateCtrl.addTo(this.map);
        },
        setupRoute: function() {
            var route = this.route().id,
                direction = this.route().direction;

            console.log("init route", route, direction);

            if (this.routeLayer) {
                this.map.removeLayer(this.routeLayer);
            }

            this.routeLayer = L.layerGroup();
            this.routeLayer.addTo(this.map);

            this.vehicles = new Vehicles(route, direction);
            this.shape = new Shape(route, direction);
            this.stops = new Stops(route, direction);

            this.shape.fetch().then(
                this.shape.draw.bind(this.shape, this.routeLayer),
                this.errorHandler.bind(this)
            );
            this.vehicles.fetch().then(this.vehicles.draw.bind(
                this.vehicles, this.routeLayer),
                this.errorHandler.bind(this)
            );
            this.stops.fetch().then(
                function() {
                    this.stops.draw(this.routeLayer);
                    this.stopsList(this.stops._stops);
                }.bind(this),
                this.errorHandler.bind(this)
            );

            setTimeout(this.refresh.bind(this), 15 * 1000);
        },
        errorHandler: function(e) {
            console.error(e);
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
        }
    };

    return Rappid;
});
