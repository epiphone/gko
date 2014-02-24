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
.directive("tdCoordinates", function($log) {
    return {
        restrict: "A",

        scope: {
            shapes: "=tdShapes"
        },

        link: function(scope, elem, attrs) {
            var margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 40
            };

            var width = elem.width() - margin.left - margin.right;
            var aspect = attrs.tdAspect || 500 / 800;
            var height = Math.round(width * aspect) - margin.top - margin.bottom;

            // Try to read bounds from attributes.
            var minX, maxX, minY, maxY;
            if (attrs.tdBounds) {
                var bounds = attrs.tdBounds.split(",").map(function(b) {
                    return parseInt(b);
                });

                var areValidNumbers = bounds.every(function(b) {
                    return !isNaN(b);
                });

                if (bounds.length === 4 && areValidNumbers) {
                    maxY = bounds[0];
                    maxX = bounds[1];
                    minY = bounds[2];
                    minX = bounds[3];
                } else {
                    $log.error("tdBounds attribute in tdCoordinates directive is invalid");
                }
            }

            // If no bounds are defined, set them so that each shape fits the view.
            if (minX === undefined) {
                scope.shapes.forEach(function(shape) {
                    shape.points.forEach(function(point) {
                        minX = minX === undefined ? point[0] : Math.min(minX, point[0]);
                        maxX = maxX === undefined ? point[0] : Math.max(maxX, point[0]);
                        minY = minY === undefined ? point[1] : Math.min(minY, point[1]);
                        maxY = maxY === undefined ? point[1] : Math.max(maxY, point[1]);
                    });
                });

                minX = isNaN(parseInt(attrs.tdMinX)) ? minX - 1 : parseInt(attrs.tdMinX) - 1;
                maxX = isNaN(parseInt(attrs.tdMaxX)) ? maxX + 1 : parseInt(attrs.tdMaxX) + 1;
                minY = isNaN(parseInt(attrs.tdMinY)) ? minY - 1 : parseInt(attrs.tdMinY) - 1;
                maxY = isNaN(parseInt(attrs.tdMaxY)) ? maxY + 1 : parseInt(attrs.tdMaxY) + 1;
            }

            var axisSpacing = parseInt(attrs.tdAxisSpacing) || 1;

            var spacing = Math.round(Math.min(
                width / Math.abs(maxX - minX),
                height / Math.abs(maxY - minY)
            ));

            var x = d3.scale.linear()
                .domain([minX, minX + 1])
                .range([0, spacing]);

            var y = d3.scale.linear()
                .domain([minY, minY + 1])
                .range([height, height - spacing]);

            var zoomExtent = parseInt(attrs.tdZoom);
            var zoom = !zoomExtent ? null : d3.behavior.zoom()
                .x(x)
                .y(y)
                .scaleExtent([1, zoomExtent])
                .on("zoom", zoomed);

            var drag = d3.behavior.drag()
                .origin(function(d) { return d; })
                .on("dragstart", dragStarted)
                .on("drag", dragged)
                .on("dragend", dragEnded);

            var svg = d3.select(elem[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(zoomIfEnabled);


            var container = svg.append("g");

            // Coordinate grid
            container.append("g")
                .attr("class", "x axis")
                .selectAll("line")
                .data(d3.range(Math.round(minX), Math.round(maxX) + axisSpacing, axisSpacing))
                .enter().append("line")
                .attr("x1", x)
                .attr("y1", y(minY))
                .attr("x2", x)
                .attr("y2", y(maxY))
                .attr("class", function(d) {
                    return d === 0 ? "thick" : "";
                });

            container.append("g")
                .attr("class", "y axis")
                .selectAll("line")
                .data(d3.range(Math.round(minY), Math.round(maxY) + axisSpacing, axisSpacing))
                .enter().append("line")
                .attr("x1", x(minX))
                .attr("y1", y)
                .attr("x2", x(maxX))
                .attr("y2", y)
                .attr("class", function(d) {
                    return d === 0 ? "thick" : "";
                });


            // Axis labels
            container.append("g")
                .selectAll(".label.x")
                .data(d3.range(Math.ceil((minX) / axisSpacing), Math.round(maxX) + axisSpacing, axisSpacing))
                .enter().append("text")
                .attr("x", x)
                .attr("y", y(0))
                .attr("dy", "1.4em")
                .attr("class", "label x")
                .attr("font-size", 10 + "px");

            container.append("g")
                .selectAll(".label.y")
                .data(d3.range(Math.ceil((minY) / axisSpacing), Math.round(maxY) + axisSpacing, axisSpacing))
                .enter().append("text")
                .attr("x", x(0))
                .attr("y", y)
                .attr("dx", "-.8em")
                .attr("dy", ".3em")
                .attr("class", "label y");

            container.selectAll("text.label")
                .attr("text-anchor", "middle")
                .style("display", function(d) { if (!d) return "none"; })
                .text(Object);

            scope.shapes.forEach(function(shape) {
                var xSum = 0, ySum = 0, ptsCount = 0;
                shape.points.forEach(function(point) {
                    xSum += point[0];
                    ySum += point[1];
                    ptsCount++;
                });
                shape.x = Math.round(x(xSum/ptsCount));
                shape.y = Math.round(y(ySum/ptsCount));
            });
            console.log(scope.shapes);

            // Shapes
            var shapes = container.selectAll(".shape")
                .data(scope.shapes)
                .enter().append("g")
                .attr("class", "shape");

            shapes // Polygons
                .filter(function(d) { return d.points.length > 2; })
                .append("polygon")
                .attr("points", function(d) {
                    return d.points.map(function(ps) { return [x(ps[0]), y(ps[1])]; });
                })
                .call(drag);

            shapes // Lines
                .filter(function(d) { return d.points.length == 2; })
                .append("line")
                .attr("x1", function(d) { return x(d.points[0][0]); })
                .attr("y1", function(d) { return y(d.points[0][1]); })
                .attr("x2", function(d) { return x(d.points[1][0]); })
                .attr("y2", function(d) { return y(d.points[1][1]); })
                .call(drag);

            shapes // Circles
                .filter(function(d) { return d.points.length == 1; })
                .append("circle")
                .attr("cx", function(d) { return x(d.points[0][0]); })
                .attr("cy", function(d) { return y(d.points[0][1]); })
                .attr("r", function(d) { return d.r || 3; })
                .call(drag);

            shapes // Common shape attributes
                .attr("fill", function(d) { return d.fill || "none"; })
                .attr("stroke", function(d) { return d.stroke || "black"; })
                .attr("stroke-width", function(d) { return (d.strokeWidth || 2) + "px"; });


            function zoomIfEnabled(selection) {
                if (angular.isFunction(zoom)) zoom(selection);
            }

            /** Apply transform when zoomed. */
            function zoomed() {
                container.attr("transform", "translate(" + d3.event.translate +
                    ")scale(" + d3.event.scale + ")");
            }

            function dragStarted(d) {
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).classed("dragging", true);
            }

            function dragged(d) {
                d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
                console.log(d3.event.x);
            }

            function dragEnded(d) {
                d3.select(this).classed("dragging", false);
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