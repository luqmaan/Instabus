var start,
    map;

document.addEventListener( "DOMContentLoaded", function(){
    document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
    start();
}, false );

function start() {
    map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    fetchBusLocations();
}

function fetchBusLocations() {
    $.ajax({
        url: "http://query.yahooapis.com/v1/public/yql",
        data:{
            q: "select * from xml where url=\"http://www.capmetro.org/planner/s_buslocation.asp?route=*\"",
            format: "xml"
        }
    }).done(function(data) {
        var x2js = new X2JS({}),
            doc = x2js.xml2json(data);

        window.doc = doc;

        drawVehicles(doc.query.results.Envelope.Body.BuslocationResponse.Vehicles.Vehicle);
    }).fail(function(xhr, status, err) {
        console.error(err);
    });
}

function drawVehicles(vehicles) {
    vehicles.forEach(function(vehicle) {
        console.log(vehicle)
        vehicle.Positions.Position.forEach(function(posStr, i) {
            var lat = posStr.split(',')[0],
                lon = posStr.split(',')[1];

            L.circleMarker([lat, lon], 50).bindLabel(vehicle.Vehicleid + ' ' + i, {
                noHide: true
            }).addTo(map);
        });
        map.panTo({lat: 30.267153, lng: -97.743061}).setZoom(13, {animate: true});
    });
}
