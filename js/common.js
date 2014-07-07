requirejs.config({
    baseUrl: 'js/app',
    paths: {
        'text': '../../bower_components/requirejs-text/text',
        'jquery': '../../bower_components/jquery/dist/jquery.min',
        'knockout': '../../bower_components/knockout-dist/knockout.min',
        'underscore': '../../bower_components/underscore/underscore',
        'xml2json': '../../bower_components/x2js/xml2json.min',
        'leaflet': '../../bower_components/leaflet/dist/leaflet-src',
        'Leaflet.label': '../../bower_components/Leaflet.label/dist/leaflet.label-src',
        'moment': '../../bower_components/moment/min/moment.min',
        'geolib': '../../bower_components/geolib/dist/geolib.min'
    },
    packages: [
        {
            name: 'when',
            location: '../../bower_components/when',
            main: 'when'
        }
    ],
    shim: {
        'xml2json' : {
          exports : 'X2JS'
        }
    }
});

requirejs(['main']);
