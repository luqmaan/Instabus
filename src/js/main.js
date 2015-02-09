require('when/monitor/console');
var ko = window.ko = require('knockout');
var Fingerprint = require('fingerprintjs');
var Rappid = require('./rappid');
var config = window.config = require('./config');

var rappid = window.rappid = new Rappid();
var fingerme = window.fingerme = new Fingerprint({canvas: true}).get();

ko.applyBindings(rappid, document.getElementById('lerappid'));
rappid.start();

window.analytics.identify(fingerme);


// var fs = require('fs');
// var ProtoBuf = require('protobufjs');
//
// var protoString = fs.readFileSync(__dirname + '/models/gtfs-realtime.proto');
//
// builder = ProtoBuf.loadProto(protoString);
// root = builder.build();
// VehiclePosition = root.transit_realtime.VehiclePosition;
//
// window.xhr = ProtoBuf.Util.XHR();
// xhr.open("GET", 'https://data.texas.gov/api/file_data/8CsYrnQIng_pcsZcEJ1BtMyAAFKX1RPZbj0L5j0JS4g?filename=VehLoc.pb', true);
// // xhr.responseType = "arraybuffer";
// xhr.onload = function(e) {
//     console.log('res', xhr.response)
//     window.e = e
//     // msg = builder.decode(xhr.response);
//     // console.log(JSON.stringify(msg, null, 4)); // Correctly decoded
// }
// xhr.send(null);
// console.log(builder);
