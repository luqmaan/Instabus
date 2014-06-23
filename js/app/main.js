define(['libs/jquery', 'libs/leaflet-src', 'libs/knockout', 'rappid'],
function($, L, ko, Rappid) {
    var rappid = window.rappid = new Rappid();

    $(document).ready(function() {
        try {
            ko.applyBindings(rappid, document.getElementById('lerappid'));
        }
        catch (e) {
            console.error(e);
        }
        rappid.start();
    });
});

