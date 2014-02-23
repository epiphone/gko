"use strict";

/** App initialization and routing. */

angular.module("app.services", []);
angular.module("app.directives", []);
angular.module("app.controllers", []);

angular.module("app", [
    "app.services",
    "app.directives",
    "app.controllers",
    "ngRoute"
]).
config(function($routeProvider) {
    $routeProvider.when("/", {
        template: "Valitse tehtävä yläpalkista"
    });

    $routeProvider.when("/:taskTemplatePath*", {
        templateUrl: "partials/task-partial.html",
        controller: "TaskCtrl"
    });

    $routeProvider.otherwise({
        redirectTo: "/"
    });
});