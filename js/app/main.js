define(['jquery', 'leaflet', 'knockout', 'rappid'],
function($, L, ko, Rappid) {
    var rappid = window.rappid = new Rappid();

    $(document).ready(function() {
        ko.applyBindings(rappid, document.getElementById('controls'));
        rappid.start();
    });
});

