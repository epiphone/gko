"use strict";


angular.module("app.controllers")

/**
 * The common controller for all tasks.
 *
 * Loads the task template specified in URL, handles common task functionality
 * such as answer checking and submitting.
 */
.controller("TaskCtrl", function($scope, $routeParams, $templateCache, $http, $location, MathUtils) {

    $scope.MathUtils = MathUtils;
    $scope.error = null;

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

    /**
     * Compare given answer to the solution, return 1 if correct.
     *
     * @param answer   User's answer.
     * @param solution The correct answer.
     * @returns 1 if correct, otherwise 0.
     */
    $scope.check = function(answer, solution) {
        console.log(answer, solution);
        var match = false;
        if (solution instanceof RegExp) {
            match = solution.test(answer);
        } else if (!isNaN(answer) && !isNaN(solution)) {
            match = Math.abs(answer - solution) <= 0.001;
        } else if (answer.length !== undefined && solution.length !== undefined) {
            match = MathUtils.arraysEqual(answer, solution);
        } else {
            match = answer === solution;
        }

        console.log("match =", match);
        return match ? 1 : 0;
    };

    /** Finish current task. */
    $scope.finish = function() {
        $location.path("");
    };
});