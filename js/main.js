define(['jquery', 'knockout', 'rappid'],
function($, ko, Rappid) {
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
});

