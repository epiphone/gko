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

        scope: {
            shapes: "=shapes"
        },

        link: function(scope, elem, attrs) {
            var margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 40
            };

            var width = elem.width() - margin.left - margin.right;
            var aspect = 500 / 800;
            var height = Math.round(width * aspect) - margin.top - margin.bottom;


            var xPoints = [];
            var yPoints = [];

            scope.shapes.forEach(function(shape) {
                shape.points.forEach(function(point) {
                    xPoints.push(point[0]);
                    yPoints.push(point[1]);
                });
            });

            var bounds = {
                minX: isNaN(parseInt(attrs.minX)) ? d3.min(xPoints) : parseInt(attrs.minX),
                maxX: isNaN(parseInt(attrs.maxX)) ? d3.max(xPoints) : parseInt(attrs.maxX),
                minY: isNaN(parseInt(attrs.minY)) ? d3.min(yPoints) : parseInt(attrs.minY),
                maxY: isNaN(parseInt(attrs.maxY)) ? d3.max(yPoints) : parseInt(attrs.maxY)
            };

            var axisSpacing = parseInt(attrs.axisSpacing);
            if (isNaN(axisSpacing)) {
                axisSpacing = Math.min(Math.floor((bounds.maxX - bounds.minX) / 10),
                    Math.floor((bounds.maxY - bounds.minY) / 10)) || 1;
            }
            console.log(bounds);
            console.log(axisSpacing);

            var x = d3.scale.linear()
                // .domain([bounds.minX, bounds.maxX])
                // .range([0, width ]);
                .domain([bounds.minY, bounds.maxY])
                .range([0,height]);
            var y = d3.scale.linear()
                .domain([bounds.minY, bounds.maxY])
                .range([height, 0]);

            var zoomExtent = parseInt(attrs.zoom);
            var zoom = !zoomExtent ? null : d3.behavior.zoom()
                .x(x)
                .y(y)
                .scaleExtent([1, zoomExtent])
                .on("zoom", zoomed);

            var svg = d3.select(elem[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(zoomIfEnabled);

            var rect = svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "none")
                .style("pointer-events", "all");

            var container = svg.append("g");

            container.append("g")
                .attr("class", "y axis")
                .selectAll("line")
                .data(d3.range(bounds.minX, bounds.maxX, axisSpacing))
                .enter().append("line")
                .attr("x1", x)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", height)
                .attr("class", function(d) {
                    return d === 0 ? "thick" : "";
                });

            container.append("g")
                .attr("class", "x axis")
                .selectAll("line")
                .data(d3.range(bounds.minY, bounds.maxY, axisSpacing))
                .enter().append("line")
                .attr("x1", 0)
                .attr("y1", y)
                .attr("x2", width)
                .attr("y2", y)
                .attr("class", function(d) {
                    return d === 0 ? "thick" : "";
                });

            container.selectAll(".shape")
                .data(scope.shapes)
                .enter().append("polygon")
                .attr("points", function(d) {
                    return d.points.map(function(ps) {
                        console.log(ps[0], x(ps[0]));
                        return [x(ps[0]), y(ps[1])];
                    });
                })
                .attr("fill", function(d) {
                    return d.color || "steelblue";
                })
                .attr("stroke", "black")
                .attr("stroke-width", 2);


            function zoomIfEnabled(selection) {
                if (angular.isFunction(zoom)) zoom(selection);
            }

            function zoomed() {
                container.attr("transform", "translate(" + d3.event.translate +
                    ")scale(" + d3.event.scale + ")");
            }

            // Watch for window resize and changes in bound data:
            // d3.select(window).on("resize", update);

            // scope.$watch("shapes", function(newShapes) {
            //     if (newShapes) update(newShapes);
            // }, true);

            /**
             * Redraws the coordinate system.
             * @param  {[object]} Geometric shapes to draw.
             */
            function update(shapes) {
                width = elem.width() - margin.left - margin.right;
                height = Math.round(width * aspect) - margin.top - margin.bottom;

                x.domain([-width / 2, width / 2]).range([0, width]);
                y.domain([-height / 2, height / 2]).range([height, 0]);

                svg = d3.select(elem[0]).select("svg");
                svg
                    .attr("width", width + margin.bottom + margin.top)
                    .attr("height", height + margin.left + margin.right)
                    .call(zoomIfEnabled);

                svg.select("rect")
                    .attr("width", width)
                    .attr("height", height);


                // Shapes
                var drawnShapes = container.selectAll(".shape")
                    .data(shapes);

                drawnShapes.attr("points", function(d) {
                    return d.points.map(function(ps) {
                        return [x(ps[0]), y(ps[1])];
                    });
                });

                drawnShapes.enter().append("polygon")
                    .attr("points", function(d) {
                        return d.points.map(function(ps) {
                            console.log(ps[0], x(ps[0]));
                            return [x(ps[0]), y(ps[1])];
                        });
                    })
                    .attr("fill", function(d) {
                        return d.color || "steelblue";
                    })
                    .attr("stroke", "black")
                    .attr("stroke-width", 2);

                drawnShapes.exit().remove();
            }
        }
    };
});