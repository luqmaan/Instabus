var $ = require('jquery');
var ko = require('knockout');
var Rappid = require('./rappid');

var rappid = window.rappid = new Rappid();
window.ko = ko;

$(document).ready(function() {
    ko.applyBindings(rappid, document.getElementById('lerappid'));
    rappid.start().catch(function(e) {
        console.error(e);
        if (e === 'The CapMetro API is unavailable') {
            rappid.rustle();
        }
    });
});
