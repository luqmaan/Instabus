define(['libs/knockout'],
function(ko) {
    function Trip(data) {
        this.tripTime = ko.observable(data.Triptime);
        this.id = ko.observable(data.Tripid);
        this.skedTripID = ko.observable(data.Skedtripid);
        this.block = ko.observable(data.Block);
        this.exception = ko.observable(data.Exception);
    }

    return Trip;
});
