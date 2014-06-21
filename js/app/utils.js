var utils = {
    formatDirection: function(direction) {
        switch (direction) {
            case 0:
                return 'South';
            case 1:
                return 'North';
            case 'S':
                return 'South';
            case 'N':
                return 'North';
        }
    },
    getDirectionID: function(direction) {
        direction = direction.toLowerCase().replace('/', '');

        if (direction === 'north' || direction === 'n') {
            return 1;
        }
        if (direction === 'south' || direction === 's') {
            return 0;
        }

        return 0;
    }
};
