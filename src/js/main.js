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
window.Raven.setUser({id: fingerme});
