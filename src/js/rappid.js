var ko = require('knockout');
var when = require('when');
var NProgress = require('NProgress');

var fs = require('fs');
var config = require('./config');

var mapController = require('./MapController');
var routesCollection = require('./models/RoutesCollection');
var InfoViewModel = require('./models/InfoViewModel');
var NavBarViewModel = require('./models/NavBarViewModel');

var CapMetroAPIError = config.errors.CapMetroAPIError();

function Rappid() {
    this.modules = {
        routes: routesCollection,
        map: mapController,
        info: new InfoViewModel(),
        nav: new NavBarViewModel(),
    };

    this.locationHash = ko.observable(window.location.hash);
}

module.exports = Rappid;
