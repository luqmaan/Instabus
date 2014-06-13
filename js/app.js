var x2js = new X2JS({}),
    busLocationResponse = {},
    start,
    fetchBusLocations,
    drawVehicles,
    fetchShape,
    drawShape,
    vehicles,
    map;

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

document.addEventListener( "DOMContentLoaded", function(){
    document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
    applyBindings();
    start(801, 1);
}, false );

function param(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


function applyBindings() {
    // le turd

    $('#refrescar').on('click', function() {
        vehicles.update();
    });

    $('input[name=route]').click(function(e) {
        $btn = $(e.target);
        console.log('arguments', arguments)
        console.log('switching', parseInt($btn.data('route')), parseInt($btn.data('direction')));
        $("#map").remove();
        $("body").append("<div id='map'></div>")
        start(parseInt($btn.data('route')), parseInt($btn.data('direction')));
    });
}

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
    }).addTo(map);
    map.fitBounds(line.getBounds());
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


function invertColor(hexTripletColor) {
    var color = hexTripletColor;
    color = color.replace('#', '');       // remove #
    color = parseInt(color, 16);          // convert to integer
    color = 0xFFFFFF ^ color;             // invert three bytes
    color = color.toString(16);           // convert to hex
    color = ("000000" + color).slice(-6); // pad with leading zeros
    color = "#" + color;                  // prepend #
    return color;
}

function drawStops(stops, color) {
    color = color || 'rgb(199,16,22)';
    stops.forEach(function(stop) {
        L.circleMarker([stop.stop_lat, stop.stop_lon], {
            color: 'white',
            opacity: 1,
            weight: 3,
            fillColor: color,
            fill: true,
            fillOpacity: 1,
            radius: 7,
        }).bindPopup(stop.stop_name).addTo(map);
    });
}

var _routesCache = null;
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


function onLocationFound(e) {
    console.log('found location: ', e.latlng, "accuracy:", e.accuracy);
    map.setView(e.latlng, 16, {zoom: {animate: true}, pan: {animate: true}});
    var radius = e.accuracy / 2;
    L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
    L.circle(e.latlng, radius).addTo(map);
}

function onLocationError(e) {
    console.log('unable to find location: ', e.message)
    map.setView([30.267153, -97.743061], 16);
}


function start(routeID, directionID) {
    map = L.map('map');
    map.locate({maximumAge: 1000, enableHighAccuracy: true});
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'examples.map-i86knfo3'
    }).addTo(map);

    vehicles = new Vehicles(map, [{route: routeID, direction: directionID}], utils);
    vehicles.update();

    fetchRoute(routeID).then(function(route) {
        fetchShape(routeID, directionID).then(function(shape) {
            drawShape(shape);
            fetchStops(routeID, directionID).then(function(stops) {
                drawStops(stops);
            });
        });
    });
}
