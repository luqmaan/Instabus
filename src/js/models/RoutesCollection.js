var when = require('when');
var requests = require('../requests');

var RoutesCollection = {
    fetch: function() {
        return requests.get('data/routes.json');
    }
};

module.exports = RoutesCollection;
