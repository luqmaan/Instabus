define(['libs/jquery', 'libs/leaflet-src', 'libs/knockout', 'rappid'],
function($, L, ko, Rappid) {
    var rappid = window.rappid = new Rappid();

    $(document).ready(function() {
        ko.applyBindings(rappid, document.getElementById('controls'));
        rappid.start();
    });
});

