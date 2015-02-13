var _ = require('underscore');
var fs = require('fs');
var ko = require('knockout');
var when = require('when');

var requests = require('../requests');
var RoutesCollection = require('../models/RoutesCollection');
var routesListHTML = require('../templates/routes-list.html');


function RoutesListView() {
    this.routesCollection = new RoutesCollection();
}

_.extend(RoutesListView.prototype, {
    init: function() {
        var promise = this.routesCollection.fetchAll()
                          .with(this)
                          .then(this.render);
    },
    render: function() {
        var div = document.querySelector("#content-wrapper");
        div.innerHTML = routesListHTML;

        var inner = div.querySelector('.inner');
        ko.applyBindings(this, inner);
    },
    tearDown: function() {
        var div = document.querySelector("#content-wrapper");
        var inner = div.querySelector('.inner');

        if (inner) {
            ko.cleanNode(inner);
            inner.remove();
        }
    },
});

module.exports = RoutesListView;
