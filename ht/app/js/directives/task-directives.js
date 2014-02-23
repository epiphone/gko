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
 * <span td-math="someScopeValue"></span>, or
 * <span td-math="{{10 + 4 = 2}}"></span>
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
 * A zoomable & scrollable 2D coordinate system.
 *
 * TODO WIP
 * <div td-coordinates></div>
 */
.directive("tdCoordinates", function() {
    return {
        restrict: "A",

        link: function(scope, elem, attrs) {
            var margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 40
            };

            var width = elem[0].scrollWidth - margin.left - margin.right;
            var height = elem[0].scrollHeight - margin.top - margin.bottom;

            var x = d3.scale.linear()
                .domain([-width / 2, width / 2])
                .range([0, width]);

            var y = d3.scale.linear()
                .domain([-height / 2, height / 2])
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickSize(-height);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(5)
                .tickSize(-width);

            var zoom = d3.behavior.zoom()
                .x(x)
                .y(y)
                .scaleExtent([1, 10])
                .on("zoom", zoomed);

            var svg = d3.select(elem[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(zoom);

            svg.append("rect")
                .attr("width", width)
                .attr("height", height);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            function zoomed() {
                svg.select(".x.axis").call(xAxis);
                svg.select(".y.axis").call(yAxis);
            }
        }
    };
});
