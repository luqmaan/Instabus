var ko = require('knockout');
var Rappid = require('./rappid');

var rappid = window.rappid = new Rappid();
window.ko = ko;

ko.applyBindings(rappid, document.getElementById('lerappid'));
rappid.start();
