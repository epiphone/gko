"use strict";


angular.module("app.controllers")

/**
 * The common controller for all tasks.
 *
 * Loads the task template specified in URL, handles common task functionality
 * such as answer checking and submitting.
 */
.controller("TaskCtrl", function($scope, $routeParams, $templateCache, $http) {

    $scope.error = null;
    $scope.parent = {
        expression: "\\left(\\prod_{i=1}^{n+1} q(t_i | t_{i-2}, t_{i-1}) \\prod_{i=1}^{n}e(w_i | t_i) \\right)"
    };

    getTemplate("tasks/" + $routeParams.taskTemplatePath);

    /**
     * Get template either from cache or by HTTP.
     * If template is found, it's displayed; otherwise an error is shown.
     *
     * @param {string} url Template file location.
     */
    function getTemplate(url) {
        $scope.error = null;

        var urlParts = url.split(".");
        var suffix = urlParts[urlParts.length - 1];
        if (suffix !== "html") {
            url = urlParts.concat("html").join(".");
        }

        var cached = $templateCache.get(url);
        if (cached) {
            $scope.templateUrl = url;
            return;
        }

        $http.get(url)
            .success(function(data) {
                $templateCache.put(url, data);
                $scope.templateUrl = url;
            })
            .error(function() {
                $scope.error = "Tehtävää ei löytynyt.";
            });
    }
});
