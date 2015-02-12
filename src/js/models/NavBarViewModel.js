var ko = require('knockout');
var RoutesCollection = require('./RoutesCollection');


function NavBar() {
    this.title = ko.computed(function() {
        var name = 'Instabus';
        if (this.locationHash().indexOf('route') !== -1 && this.routes.active()) {
            name = RoutesCollection.active().prettyName();
        }
        return name;
    }, this);
}

NavBar.prototype.applyBindings = function() {
    document.querySelector("#navbar");
    ko.applyBindings(this, inner);
}

NavBar.prototype.hashChange = function() {

}

module.exports = NavBar();
