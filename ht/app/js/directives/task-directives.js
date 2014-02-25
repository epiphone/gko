"use strict";
/* global MathJax, d3 */

/**
 * UI components for tasks.
 */
angular.module("app.directives")

/**
 * Inject Latex maths notation into templates.
 *
 * Note that a reference to the MathJax library is required.
 * Adapted from http://stackoverflow.com/questions/16087146/
 *
 * Usage:
 * <span td-math="someScopeVariable"></span>, or
 * <span td-math="'10 + 4 = 2'"></span> (Note the extra quotes!)
 */
.directive("tdMath", function() {
    return {
        restrict: "A",

        link: function(scope, elem, attrs) {
            scope.$watch(attrs.tdMath, function(value) {
                var script = angular.element("<script type='math/tex'>").html(value || "");
                elem.html("");
                elem.append(script);
                MathJax.Hub.Queue(["Reprocess", MathJax.Hub, elem[0]]);
            });
        }
    };
})

/**
 * Initialize scope variables in templates.
 *
 * Usage:
 * <td-init>b = 4 + someExistingScopeVariable</td-init>
 */
.directive("tdInit", function() {
    return {
        restrict: "E",

        link: function(scope, elem) {
            elem.hide();
            scope.$eval(elem.text());
        }
    };
});