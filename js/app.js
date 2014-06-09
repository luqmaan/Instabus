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

function start() {
    map = L.map('map');
    map.setView([30.267153, -97.743061], 13);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var routeID = 801,
        directionID = 1;

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
    }).fail(function(xhr, status, err) {
        console.error(err);
        deferred.reject();
    });

    return deferred.promise();
}

function directionify(directionID, format) {
    if (format === 'S') {
        return directionID === 0 ? 'S' : 'N';
    }
}

function drawVehicles(routeID, directionID, vehicles) {
    vehicles.forEach(function(vehicle) {
        if (Math.parseInt(vehicle.Route) !== routeID || vehicle.Direction !== directionify(directionID, '%s')) {
            return;
        }
        console.log(vehicle);
        var posStr = vehicle.Positions.Position[0],
            lat = posStr.split(',')[0],
            lon = posStr.split(',')[1];

        L.circleMarker([lat, lon], 50).bindLabel(vehicle.Vehicleid, {
            noHide: true
        }).addTo(map);

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
        color: 'red',
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1
    });
    line.addTo(map);
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
            .bindLabel(stop.stop_name)
            .addTo(map);
    });
}
