define(['libs/jquery', 'libs/knockout', 'libs/leaflet-src', 'libs/when/when', 'LocateControl', 'models/Vehicles', 'models/Shape', 'models/Stops'],
function($, ko, L, when, LocateControl, Vehicles, Shape, Stops) {
    function Rappid() {
        // leaflet
        this.map = null;
        this.routeLayer = null;

        this.availableRoutes = ko.observableArray([
            {id: 801, direction: 1, name: '801 MetroRapid North'},
            {id: 801, direction: 0, name: '801 MetroRapid South'},
            {id: 550, direction: 1, name: '550 MetroRail North'},
            {id: 550, direction: 0, name: '550 MetroRail South'},
        ]);
        this.activity = ko.observable();

        // data
        this.route = ko.observable();
        this.vehicles = ko.observable();
    }

    Rappid.prototype = {
        start: function() {
            this.setupMap();
            // this.route(this.availableRoutes()[0]);
            // this.setupRoute();
            // this.route.subscribe(this.setupRoute.bind(this));
        },
        refresh: function() {
            this.activity('refreshing...');
            console.log('refreshing...');
            this.vehicles.update().then(function() {
                this.activity('');
            }.bind(this));

            setTimeout(this.refresh, 15 * 1000);
        },
        setupMap: function() {
            var tileLayer,
                zoomCtrl,
                locateCtrl;

            this.map = L.map('map', {zoomControl: false});

            tileLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'examples.map-i86knfo3',
            });

            zoomCtrl = new L.Control.Zoom({ position: 'bottomright' });

            locateCtrl = new LocateControl({
                position: 'bottomright',
                zoomLevel: undefined,  // null is treated as zoomLevel 0
            });

            tileLayer.addTo(this.map);
            zoomCtrl.addTo(this.map);
            locateCtrl.addTo(this.map);
        },
        setupRoute: function() {
            var route = this.route().id,
                direction = this.route().id,
                shape,
                stops,
                vehicles;

            this.map.removeLayer(this.routeLayer);

            this.routeLayer = L.layerGroup();
            this.routeLayer.addTo(this.map);

            this.vehicles = new Vehicles(route, direction);

            shape = new Shape(route, direction);
            stops = new Stops(route, direction);

            var promises = [shape.fetch(), stops.fetch(), vehicles.fetch()];

            when.all(promises).then(function() {
                shape.draw();
                stops.draw();
                vehicles.draw();
            });

            this.vehicles(vehicles);
            this.shape(shape);
            this.stops(stops);
        }
    };

    return Rappid;
});
