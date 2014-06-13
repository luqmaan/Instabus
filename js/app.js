var x2js = new X2JS({}),
    busLocationResponse = {},
    start,
    fetchBusLocations,
    drawVehicles,
    fetchShape,
    drawShape,
    map;

document.addEventListener( "DOMContentLoaded", function(){
    document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
    start();
}, false );

function param(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function formatDirection(direction) {
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
}

function getDirectionID(direction) {
    direction = direction.toLowerCase().replace('/', '');

    if (direction === 'north' || direction === 'n') {
        return 1;
    }
    if (direction === 'south' || direction === 's') {
        return 0;
    }

    return 0;
}

function start() {
    map = L.map('map');
    map.setView([30.267153, -97.743061], 12);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var routeID = parseInt(param('route')),
        directionID = getDirectionID(param('direction'));

    fetchBusLocations().then(function() {
        drawVehicles(routeID, directionID, busLocationResponse.query.results.Envelope.Body.BuslocationResponse.Vehicles.Vehicle);
    });

    fetchRoute(routeID).then(function(route) {
        console.log(route);
        fetchShape(routeID, directionID).then(function(shape) {
            drawShape(shape);
        });

        fetchStops(routeID, directionID).then(function(stops) {
            drawStops(stops);
        });
    });
}

function fetchBusLocations() {
    var deferred = new $.Deferred();

    $.ajax({
        url: "http://query.yahooapis.com/v1/public/yql",
        data:{
            q: "select * from xml where url=\"http://www.capmetro.org/planner/s_buslocation.asp?route=*\"",
            format: "xml"
        }
    }).done(function(data) {
        busLocationResponse = x2js.xml2json(data);
        deferred.resolve();
    }).fail(function(xhr, status, err) {
        console.error(err);
        deferred.reject();
    });

    return deferred.promise();
}

function drawVehicles(routeID, directionID, allVehicles) {
    var vehicles = _.filter(allVehicles, function(vehicle) {
        var _route = parseInt(vehicle.Route),
            _dir = getDirectionID(vehicle.Direction);
        return _route === routeID && _dir === directionID;
    });

    console.log('Drawing', vehicles.length, 'of', allVehicles.length, 'total vehicles', vehicles);

    vehicles.forEach(function(vehicle) {
        var posStr = vehicle.Positions.Position[0],
            lat = posStr.split(',')[0],
            lon = posStr.split(',')[1],
            popupText;

        popupText = [
            'Vehicle ' + vehicle.Vehicleid,
            'Updated at ' + vehicle.Updatetime,
            'Moving ' + formatDirection(vehicle.Direction) + ' at ' + vehicle.Speed + 'mph',
            'Reliable? ' + vehicle.Reliable,
            'Stopped? ' + vehicle.Stopped,
            'Off Route? ' + vehicle.Offroute,
            'In Service? ' + vehicle.Inservice,
        ].join('<br />');

        var vehicleColor = vehicle.Inservice === 'Y' ? 'rgb(206,36,41)' : 'rgb(188,188,188)';

        L.circleMarker([lat, lon], {
            weight: 0,
            radius: 12,
            fillOpacity: '0.9',
            fillColor: 'rgb(34,189,252)'
        })
        .bindPopup(popupText)
        .addTo(map);
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
    color = color.replace('#', '');           // remove #
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
        deferred.resolve(_.find(_routesCache, function(r) {
            return parseInt(r.route_id) === routeID;
        }));
        return deferred.promise;
    }
    $.ajax({
        url: 'data/routes.json'
    }).done(function(data) {
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
