// Karma configuration
// Generated on Wed Feb 19 2014 10:54:44 GMT+0200 (FLE Standard Time)

module.exports = function(config) {
    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: "../../",


        // frameworks to use
        frameworks: ["jasmine"],


        // list of files / patterns to load in the browser
        files: [
            "http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js",
            "http://cdnjs.cloudflare.com/ajax/libs/es5-shim/2.2.0/es5-shim.min.js",
            "http://cdnjs.cloudflare.com/ajax/libs/d3/3.4.1/d3.min.js",
            "http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.10/angular.min.js",
            "http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.10/angular-route.min.js",
            "http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.10/angular-mocks.js",
            "app/js/app.js",
            "app/js/*/*.js",
            "test/unit/*-test.js"
        ],


        // list of files to exclude
        exclude: [

        ],

        plugins: [
            "karma-chrome-launcher",
            "karma-jasmine"
        ],

        // test results reporter to use
        // possible values: "dots", "progress", "junit", "growl", "coverage"
        reporters: ["progress"],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        browsers: ["Chrome"]
    });
};