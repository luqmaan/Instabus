var config =  {
    vehicleZIndex: 10,
    stopZIndex: 5,
    errors: {
        CapMetroAPIError: function() {
            function CapMetroAPIError(message) {
                this.name = 'CapMetroAPIError';
                this.message = message;
                this.stack = (new Error()).stack;
            }
            CapMetroAPIError.prototype = new Error;
            return CapMetroAPIError;
        }
    }
};
module.exports = config;
