var x2js = new X2JS({}),
    start,
    fetchBusLocations,
    drawVehicles,
    fetchShape,
    drawShape,
    busLocationResponse = {},
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

function directionify(directionID, format) {
    if (format === '%S') {
        return directionID === 0 ? 'S' : 'N';
    }
    else {
        return directionID == 0 ? 'South' : 'North';
    }
}

function unDirectionify(direction) {
    direction = direction.toLowerCase().replace('/', '');
    if (direction === 'north' || direction === 'n') {
        return 1;
    }
    if (direction === 'south' || direction === 's') {
        return 0;
    }
}

function start() {
    map = L.map('map');
    map.setView([30.267153, -97.743061], 12);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var routeID = parseInt(param('route')),
        directionID = unDirectionify(param('direction'));

    fetchBusLocations().then(function() {
        drawVehicles(routeID, directionID, busLocationResponse.query.results.Envelope.Body.BuslocationResponse.Vehicles.Vehicle);
    });

    fetchShape(routeID, directionID).then(function(shape) {
        drawShape(shape);
    });

    fetchStops(routeID, directionID).then(function(stops) {
        drawStops(stops);
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

function drawVehicles(routeID, directionID, vehicles) {
    vehicles.forEach(function(vehicle) {
        if (parseInt(vehicle.Route) !== routeID || vehicle.Direction !== directionify(directionID, '%S')) {
            return;
        }
        console.log(vehicle);
        var posStr = vehicle.Positions.Position[0],
            lat = posStr.split(',')[0],
            lon = posStr.split(',')[1],
            popupText;

        popupText = [
            'Route ' + vehicle.Route + ' ' + directionify(vehicle.Direction),
            'Vehicle ' + vehicle.Vehicleid,
            'Updated at ' + vehicle.Updatetime,
            'Moving at ' + vehicle.Speed + 'mph',
            'Reliable? ' + vehicle.Reliable,
            'Off Route?' + vehicle.Offroute,
            'Stopped? ' + vehicle.Stopped,
        ].join('<br />');


        L.circleMarker([lat, lon], {
            color: 'white',
            opacity: 0.8,
            fillOpacity: '0.9',
            fillColor: 'rgb(206,36,41)',
            weight: 2
        })
        .setRadius(10)
        .bindPopup(popupText)
        .bindLabel('Vehicle ' + vehicle.Vehicleid, {
            noHide: true
        })
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


function drawShape(shape) {
    var line = new L.Polyline(shape, {
        color: 'rgb(40,52,78)',
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1
    }).addTo(map);
    window.l = line;
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

function drawStops(stops) {
    stops.forEach(function(stop) {
        L.circleMarker([stop.stop_lat, stop.stop_lon], 10)
            .bindLabel('Stop ' + stop.stop_name)
            .addTo(map);
    });
}
