var x2js = new X2JS({}),
    map = L.map('map', {
        zoomControl: false,
    }),
    _routesCache,
    start,
    fetchShape,
    drawShape,
    vehicles,
    locationMarker,
    lair;


function setupMap() {
    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'examples.map-i86knfo3',
    }).addTo(map);
    var zoomCtrl = new L.Control.Zoom({ position: 'bottomright' }).addTo(map);

    var LocateCtrl = L.Control.extend({
        options: {
            position: 'topleft',
            icon: 'icon-location',
            defaultLatLng: [30.267153, -97.743061],
            zoom: 16,
        },
        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'locate-control leaflet-bar leaflet-control');
            var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single ' + this.options.icon, container);

            var locate = function() {
                container.classList.add('loading');

                map.locate({maximumAge: 1000, enableHighAccuracy: true});
                map.on('locationfound', function onLocationFound(e) {
                    var radius = e.accuracy / 2;
                    console.log('found location:', e.latlng, 'accuracy:', e.accuracy);

                    container.classList.remove('loading');

                    map.setView(e.latlng, this.zoom, {
                        zoom: {
                            animate: true
                        },
                        pan: {
                            animate: true
                        },
                    });
                    try {
                        locationMarker.setLatLng(e.latlng).update();
                    }
                    catch(err) {
                        locationMarker = L.marker(e.latlng).addTo(map).bindPopup('You are here').openPopup();
                    }
                }.bind(this));
                map.on('locationerror', function onLocationError(e) {
                    console.log('unable to find location: ', e.message);
                    container.classList.remove('loading');
                });

            }.bind(this);

            this.locate = locate;

            L.DomEvent
                .on(link, 'click', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', locate)
                .on(link, 'dblclick', L.DomEvent.stopPropagation);

            return container;
        }
    });

    var locateCtrl = new LocateCtrl({
        position: 'bottomright',
        zoom: ''
    }).addTo(map);

}

$(document).ready(setupMap);

var utils = {
    formatDirection: function(direction) {
        switch (direction) {
            case 0:
                return 'South';
            case 1:
                return 'North';
            case 'S':
                return 'South';
            case 'N':
                return 'North';
        }
    },
    getDirectionID: function(direction) {
        direction = direction.toLowerCase().replace('/', '');

        if (direction === 'north' || direction === 'n') {
            return 1;
        }
        if (direction === 'south' || direction === 's') {
            return 0;
        }

        return 0;
    }
};

var Controls = {
    availableRoutes: ko.observableArray([
        {route: 801, direction: 1, name: '801 MetroRapid North'},
        {route: 801, direction: 0, name: '801 MetroRapid South'},
        {route: 550, direction: 1, name: '550 MetroRail North'},
        {route: 550, direction: 0, name: '550 MetroRail South'},
    ]),
    selectedRoute: ko.observable(),
    activity: ko.observable('loading...'),
    updateVehicles: function() {
        this.activity('refreshing...');
        console.log('refreshing...');
        vehicles.update().then(function() {
            this.activity('');
        }.bind(this));
    },
};

ko.applyBindings(Controls, document.getElementById('controls'));

Controls.selectedRoute.subscribe(start);
Controls.selectedRoute(Controls.availableRoutes()[0]);

function fetchShape(routeID, directionID) {
    var deferred = new $.Deferred();

    $.ajax({
        url: 'data/shapes_' + routeID + '_' + directionID + '.json'
    }).done(function(data) {
        var shape = [];
        data.forEach(function(el) {
            shape.push(new L.LatLng(el.shape_pt_lat, el.shape_pt_lon));
        });
        deferred.resolve(shape);
    }).fail(function(xhr, status, err) {
        console.error(err);
        deferred.reject();
    });

    return deferred.promise();
}

function drawShape(shape, color) {
    color = color || 'rgb(199,16,22)';

    var line = new L.Polyline(shape, {
        color: color,
        stroke: true,
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1
    }).addTo(lair);

    map.fitBounds(line.getBounds());
}

function fetchArrivals(routeID, directionID, stopID) {
    var deferred = new $.Deferred(),
        next_arrival_url = 'http://www.capmetro.org/planner/s_service.asp?output=xml&opt=2&tool=SI&route=' + routeID + '&stopid=' + stopID;

    console.log('Fetching next arrival', next_arrival_url);

    $.ajax({
        url: 'http://query.yahooapis.com/v1/public/yql',
        data: {
            q: 'select * from xml where url="' + next_arrival_url + '"',
            format: 'xml'
        }
    }).done(function(data) {
        var doc = x2js.xml2json(data),
            fault = doc.query.results.Envelope.Body.Fault,
            service,
            times;

        if (fault) {
            console.error(fault);
            deferred.reject(fault);
        }

        service = doc.query.results.Envelope.Body.SchedulenearbyResponse.Atstop.Service;
        if (Array.isArray(service)) {
            service = service.filter(function(s) { return utils.getDirectionID(s.Direction) === directionID; })[0];
        }
        times = service.Times;

        deferred.resolve(times);
    }.bind(this)).fail(function(xhr, status, err) {
        console.error('Fetch arrivals', err);
        deferred.reject();
    });

    return deferred.promise();
}

function fetchStops(routeID, directionID) {
    var deferred = new $.Deferred();

    $.ajax({
        url: 'data/stops_' + routeID + '_' + directionID + '.json'
    }).done(function(data) {
        deferred.resolve(data);
    }).fail(function(xhr, status, err) {
        console.error(err);
        deferred.reject();
    });

    return deferred.promise();
}

function drawStops(stops, color) {
    color = color || 'rgb(199,16,22)';
    stops.forEach(function(stop) {
        var stopMessage = stop.stop_id + ' - ' + stop.stop_name,
            marker = L.circleMarker([stop.stop_lat, stop.stop_lon], {
                color: 'white',
                opacity: 1,
                weight: 3,
                fillColor: color,
                fill: true,
                fillOpacity: 1,
                radius: 10
            })
            .bindPopup(stopMessage);

        marker.addEventListener('click', function(e) {
            var routeID = Controls.selectedRoute().route,
                directionID = Controls.selectedRoute().direction,
                stopID = stop.stop_id;

            fetchArrivals(routeID, directionID, stopID).then(function(times) {
                marker.bindPopup(stopMessage + '<br />' + times);
            });
        }, this);

        marker.addTo(lair);
    });
}

function fetchRoute(routeID) {
    var deferred = new $.Deferred();

    if (_routesCache) {
        return deferred.resolve(_.find(_routesCache, function(r) {
            return parseInt(r.route_id) === routeID;
        }));
        return deferred.promise;
    }
    $.ajax({url: 'data/routes.json'}).done(function(data) {
        _routesCache = data;
        deferred.resolve(deferred.resolve(_.find(_routesCache, function(r) {
            return parseInt(r.route_id) === routeID;
        })));
    }).fail(function(xhr, status, err) {
        console.error(err);
        deferred.reject();
    });
    return deferred.promise();
}

function start(route, locateUser) {
    var routeID = route.route,
        directionID = route.direction;

    if (lair) {
        map.removeLayer(lair);
    }

    lair = L.layerGroup();

    lair.addTo(map);

    vehicles = new Vehicles(lair, [{route: routeID, direction: directionID}], utils);

    fetchRoute(routeID).then(function(route) {
        fetchShape(routeID, directionID).then(function(shape) {
            drawShape(shape);
            fetchStops(routeID, directionID).then(function(stops) {
                drawStops(stops);
                vehicles.update().then(function() {
                    Controls.activity('');
                });
            });
        });
    });
}
