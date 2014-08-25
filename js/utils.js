var utils = {
    // 550 uses 1 for NB, 801 uses 0 ...thats just how capmetro rolls
    formatDirection: function(route, direction) {
        route = parseInt(route);
        if (direction === 0) {
            if (route === 801) {
                return 'North';
            }
            if (route === 803) {
                return 'North';
            }
            if (route === 550) {
                return 'South';
            }
            return 'South';
        }
        if (direction === 1) {
            if (route === 801) {
                return 'South';
            }
            if (route === 803) {
                return 'South';
            }
            if (route === 550) {
                return 'North';
            }
        }
        if (direction === 'S') {
            return 'South';
        }
        if (direction === 'N') {
            return 'North';
        }
    },
    getDirectionID: function(route, direction) {
        route = parseInt(route);
        direction = direction.toLowerCase().replace('/', '');

        if (direction === 'north' || direction === 'n') {
            if (route === 801) {
                return 0;
            }
            if (route === 803) {
                return 0;
            }
            if (route === 550) {
                return 1;
            }
        }
        if (direction === 'south' || direction === 's') {
            if (route === 801) {
                return 1;
            }
            if (route === 803) {
                return 1;
            }
            if (route === 550) {
                return 0;
            }
        }

        return 0;
    }
};

module.exports = utils;
