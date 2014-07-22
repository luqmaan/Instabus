module.exports = function(grunt) {
    grunt.initConfig({
        requirejs: {
            compile: {
                options: {
                    baseUrl: 'js',
                    mainConfigFile: 'js/build.js',
                    include: 'main',
                    insertRequire: ['main'],
                    name: '../bower_components/almond/almond',
                    out: 'js/built.js',
                    wrap: true,
                    optimize: 'uglify2',
                    preserveLicenseComments: false,
                    generateSourceMaps: true,
                    replaceRequireScript: [{
                        files: ['index.html'],
                        modulePath: 'js/built'
                    }]
                }
            }
        },
        cssmin: {
          combine: {
            files: {
                'css/main.min.css': [
                    'css/leaflet.css',
                    'css/leaflet-label.css',
                    'css/nprogress.css',
                    'css/progress.css',
                    'css/main.css',
                    '!css/main.min.css'
                ]
            }
          }
        },
        connect: {
            server: {
              options: {
                port: 1234
              }
            }
        },
        watch: {
            files: ['css/*', '!css/main.min.css'],
            tasks: ['cssmin']
        }
    });

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // build for production
    // replace the script tag in index.html to target the single file js
    grunt.registerTask('build', ['requirejs', 'cssmin']);

    grunt.registerTask('serve', ['connect', 'watch']);
};
