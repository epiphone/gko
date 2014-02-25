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
 * <div td-coords></div>
 */
.directive("tdCoords", function($log, $window) {
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
                    $log.error("tdBounds attribute in coordinates directive is invalid");
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

            var svg = d3.select(elem[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(zoomIfEnabled);

            // A rect element to catch pointer events
            var rect = svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "none")
                .style("pointer-events", "all");

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


            function zoomIfEnabled(selection) {
                if (angular.isFunction(zoom)) zoom(selection);
            }

            /** Apply transform when zoomed. */
            function zoomed() {
                container.attr("transform", "translate(" + d3.event.translate +
                    ")scale(" + d3.event.scale + ")");
            }

            // Watch for window resize and changes in bound data:
            var resizeTimer;
            angular.element($window).bind("resize", function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function(){
                    update(scope.shapes);
                }, 100);
            });

            scope.$watch("shapes", function(newShapes) {
                if (newShapes) update(newShapes, true);
            }, true);

            update(scope.shapes, true);


            /**
             * Redraws the coordinate system.
             * @param  {[object]} shapes Geometric shapes to draw.
             * @param  {=boolean} init   Is coordinate system being initialized.
             */
            function update(shapes, init) {
                var newWidth = elem.width() - margin.left - margin.right;
                if (newWidth === width && !init) return;
                console.log(shapes[0]);

                width = newWidth;
                height = Math.round(width * aspect) - margin.top - margin.bottom;

                var spacing = Math.round(Math.min(
                    width / Math.abs(maxX - minX),
                    height / Math.abs(maxY - minY)
                ));

                var transitionDuration = attrs.tdDuration || 550;

                x.range([0, spacing]);
                y.range([height, height - spacing]);

                svg = d3.select(elem[0]).select("svg");
                svg
                    .attr("width", width + margin.bottom + margin.top)
                    .attr("height", height + margin.left + margin.right)
                    .call(zoomIfEnabled);

                svg.select("rect")
                    .attr("width", width)
                    .attr("height", height);



                // Enter, update and remove polygons
                var polygons = container.selectAll("polygon.shape")
                    .data(shapes.filter(function(s) { return s.points.length > 2; }));

                polygons.enter().append("polygon").attr("class", "shape");

                polygons.transition().duration(transitionDuration)
                    .attr("points", function(d) {
                        return d.points.map(function(ps) { return [x(ps[0]), y(ps[1])]; });
                    });

                polygons.exit().remove();


                // Enter, update and remove circles
                var circles = container.selectAll("circle.shape")
                    .data(shapes.filter(function(s) { return s.points.length == 1; }));

                circles.enter().append("circle").attr("class", "shape");

                circles.transition().duration(transitionDuration)
                    .attr("cx", function(d) { return x(d.points[0][0]); })
                    .attr("cy", function(d) { return y(d.points[0][1]); })
                    .attr("r", function(d) { return spacing*(d.r || 0.1); });

                circles.exit().remove();


                // Enter, update and remove lines
                var lines = container.selectAll("line.shape")
                    .data(shapes.filter(function(s) { return s.points.length == 2; }));

                lines.enter().append("line").attr("class", "shape");

                lines.transition().duration(transitionDuration)
                    .attr("x1", function(d) { console.log(d.points[0]);return x(d.points[0][0]); })
                    .attr("y1", function(d) { return y(d.points[0][1]); })
                    .attr("x2", function(d) { return x(d.points[1][0]); })
                    .attr("y2", function(d) { return y(d.points[1][1]); });

                lines.exit().remove();


                // Update all shapes (common attributes)
                container.selectAll(".shape")
                    .attr("fill", function(d) { return d.fill || "none"; })
                    .attr("stroke", function(d) { return d.stroke || "black"; })
                    .attr("stroke-width", function(d) { return (d.strokeWidth || 2) + "px"; });


                // Animate axis rescale
                container.selectAll(".x.axis line")
                    .transition().duration(550)
                    .attr("x1", x)
                    .attr("y1", y(minY))
                    .attr("x2", x)
                    .attr("y2", y(maxY));

                container.selectAll(".y.axis line")
                    .transition().duration(550)
                    .attr("x1", x(minX))
                    .attr("y1", y)
                    .attr("x2", x(maxX))
                    .attr("y2", y);

                container.selectAll(".label.x")
                    .transition().duration(550)
                    .attr("x", x)
                    .attr("y", y(0));

                container.selectAll(".label.y")
                    .transition().duration(550)
                    .attr("x", x(0))
                    .attr("y", y);
            }
        }
    };
});
