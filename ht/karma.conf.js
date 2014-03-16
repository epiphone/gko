// Karma (unit test runner) configuration

module.exports = function(config) {
    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: "",

        // frameworks to use
        frameworks: ["jasmine"],

        // list of files / patterns to load in the browser
        files: [
            "http://cdnjs.cloudflare.com/ajax/libs/es5-shim/2.3.0/es5-shim.min.js",
            "http://cdnjs.cloudflare.com/ajax/libs/react/0.9.0/react-with-addons.js",
            "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML",
            "http://cdnjs.cloudflare.com/ajax/libs/d3/3.4.2/d3.min.js",
            "http://cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js",
            "test/test-bundle.js"
        ],


        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ["progress"],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_DEBUG,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera (has to be installed with `npm install karma-opera-launcher`)
        // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
        // - PhantomJS
        // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
        browsers: ["Chrome"],


        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });
};