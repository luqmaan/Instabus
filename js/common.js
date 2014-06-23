requirejs.config({
    baseUrl: 'js/app',
    paths: {
        // libs: '../libs',
        // Served via bower
        'jquery': '../../bower_components/jquery/dist/jquery.min',
        'knockout': '../../bower_components/knockout-dist/knockout.min',
        'underscore': '../../bower_components/underscore/underscore',
        'x2js': '../../bower_components/x2js/xml2json.min',
        'when': '../../bower_components/when/when',
        'leaflet': '../../bower_components/leaflet/dist/leaflet-src',
        'Leaflet.label': '../../bower_components/Leaflet.label/dist/leaflet.label-src'
    },
    shim: {
        /*
        'libs/jquery': {
            exports: '$'
        },
        'libs/xml2json': {
            exports: 'X2JS'
        },
        'libs/underscore': {
            exports: '_'
        }
        */
    }
});

requirejs(['main']);
