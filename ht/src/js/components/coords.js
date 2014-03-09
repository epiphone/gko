/** @jsx React.DOM */
/* global React, d3, MathUtils, module */
"use strict";


/** A 2D coordinate system. */
var Coords = React.createClass({

  propTypes: {
    drawAxes: React.PropTypes.bool,
    shapes: React.PropTypes.array,
    bounds: React.PropTypes.object,
    aspect: React.PropTypes.number
  },

  handleResize: function() {
    var parent = $(this.getDOMNode().parentNode);
    this.setState({width: parent.width()});
  },

  getInitialState: function() {
    return {width: 0};
  },

  getDefaultProps: function() {
    return {
      drawAxes: true,
      shapes: [],
      bounds: {maxY:10, maxX:10, minY:0, minX:0},
      aspect: 1
    };
  },

  componentDidMount: function() {
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  },

  componentWillUnmount: function() {
    window.removeEventListener("resize", this.handleResize);
  },

  render: function() {
    /* jshint ignore:start */
    var margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    };

    var width = this.state.width ? this.state.width - margin.left - margin.right : 0;
    var height = Math.round(width * this.props.aspect) - margin.top - margin.bottom;

    var bounds = this.props.bounds;
    var spacing = Math.round(Math.min(
      width / Math.abs(bounds.maxX - bounds.minX),
      height / Math.abs(bounds.maxY - bounds.minY)
    ));

    var x = d3.scale.linear()
      .domain([bounds.minX, bounds.minX + 1])
      .range([0, spacing]);

    var y = d3.scale.linear()
      .domain([bounds.minY, bounds.minY + 1])
      .range([height, height - spacing]);

    var fullWidth = width + margin.left + margin.right;
    var fullHeight = height + margin.top + margin.bottom;
    var transform = "translate(" + margin.left + "," + margin.top + ")";

    var shapes, grid;
    if (this.state.width) {
      shapes = <Shapes x={x} y={y} spacing={spacing} data={this.props.shapes} />;
      grid = <Grid drawAxes={this.props.drawAxes} x={x} y={y} bounds={bounds} />;
    }

    return (
      <div className="coords-container">
        <svg width={fullWidth} height={fullHeight}>
          <g transform={transform}>
            {grid}
            {shapes}
          </g>
        </svg>
      </div>
    );
    /* jshint ignore:end */
  }
});

/** A grid for the coordinate system. */
var Grid = React.createClass({

  propTypes: {
    x: React.PropTypes.func.isRequired,
    y: React.PropTypes.func.isRequired,
    bounds: React.PropTypes.object.isRequired,
    spacing: React.PropTypes.number,
    transitionDuration: React.PropTypes.number,
    drawAxes: React.PropTypes.bool
  },

  /** Redraw grid.  */
  update: function(props) {
    var container = d3.select(this.getDOMNode());
    var bounds = props.bounds;
    var spacing = props.spacing;
    var x = props.x;
    var y = props.y;

    var xRange = d3.range(Math.ceil((bounds.minX) / spacing), Math.round(bounds.maxX) + spacing, spacing);
    var yRange = d3.range(Math.ceil((bounds.minY) / spacing), Math.round(bounds.maxY) + spacing, spacing);
    var data = xRange.concat(yRange);
    var isX = function(index) { return index < xRange.length; };

    var axes = container.selectAll(".axis")
      .data(data);

    axes.enter().append("line").attr("class", function(d) {
      return "axis " + ((props.drawAxes && d === 0) ? "thick" : "");
    });

    axes.transition().duration(props.transitionDuration)
      .attr("x1", function(d, i) { return isX(i) ? x(d) : x(bounds.minX); })
      .attr("y1", function(d, i) { return isX(i) ? y(bounds.minY) : y(d); })
      .attr("x2", function(d, i) { return isX(i) ? x(d) : x(bounds.maxX); })
      .attr("y2", function(d, i) { return isX(i) ? y(bounds.maxY) : y(d); });

    axes.exit().remove();

    if (props.drawAxes) {
      var labels = container.selectAll(".label").data(data);

      labels.enter().append("text")
        .attr("class", function(d, i) { return "label " + (isX(i) ? "x" : "y"); })
        .attr("text-anchor", "middle")
        .style("display", function(d) { if (!d) return "none"; })
        .text(Object)
        .attr("dy", function(d, i) { return isX(i) ? "1.4em" : ".3em"; })
        .attr("dx", function(d, i) { return isX(i) ? null : "-.8em"; })
        .attr("font-size", 1 + "em");

      labels.transition().duration(props.transitionDuration)
        .attr("x", function(d, i) { return isX(i) ? x(d) : x(0); })
        .attr("y", function(d, i) { return isX(i) ? y(0) : y(d); });

      labels.exit().remove();
    }
  },

  getDefaultProps: function() {
    return {
      drawAxes: true,
      transitionDuration: 550,
      spacing: 1
    };
  },

  componentDidMount: function() {
    this.update(this.props);
  },

  shouldComponentUpdate: function(nextProps) {
    this.update(nextProps);
    return false;
  },

  render: function() {
    return (
      /* jshint ignore:start */
      <g className="axes"/>
      /* jshint ignore:end */
    );
  }
});


/** Various geometric shapes to be drawn on the coordinate system. */
var Shapes = React.createClass({

  propTypes: {
    data: React.PropTypes.array.isRequired,
    x: React.PropTypes.func.isRequired,
    y: React.PropTypes.func.isRequired,
    spacing: React.PropTypes.number.isRequired,
    transitionDuration: React.PropTypes.number
  },

  /** Redraw shapes. Gets called whenever shapes are updated or screen resizes. */
  update: function(props) {
    var container = d3.select(this.getDOMNode());
    var transitionDuration = props.transitionDuration || 550;

    var polygons = container.selectAll("polygon.shape")
      .data(props.data.filter(function(s) { return s.points.length > 2; }));

    var addedPolygons = polygons.enter().append("polygon").attr("class", "shape");

    polygons.transition().duration(transitionDuration)
      .attr("points", function(d) {
        return d.points.map(function(ps) {
          return [props.x(ps[0]), props.y(ps[1])];
        });
      });

    polygons.exit().remove();


    var circles = container.selectAll("circle.shape")
      .data(props.data.filter(function(s) { return s.points.length == 1; }));

    var addedCircles = circles.enter().append("circle").attr("class", "shape");

    circles.transition().duration(transitionDuration)
      .attr("cx", function(d) { return props.x(d.points[0][0]); })
      .attr("cy", function(d) { return props.y(d.points[0][1]); })
      .attr("r", function(d) { return props.spacing * (d.r || 0.2); });

    circles.exit().remove();


    var lines = container.selectAll("line.shape")
      .data(props.data.filter(function(s) { return s.points.length == 2; }));

    var addedLines = lines.enter().append("line").attr("class", "shape");

    lines.transition().duration(transitionDuration)
      .attr("x1", function(d) { return props.x(d.points[0][0]); })
      .attr("y1", function(d) { return props.y(d.points[0][1]); })
      .attr("x2", function(d) { return props.x(d.points[1][0]); })
      .attr("y2", function(d) { return props.y(d.points[1][1]); });

    lines.exit().remove();

    // Attach click event listeners.
    [addedPolygons, addedCircles, addedLines].forEach(function(added) {
      added.on("click", function(d) {
        if ($.isFunction(d.onClick))
          d.onClick(d);
      });
    });

    // Set common attributes.
    container.selectAll(".shape")
      .attr("fill", function(d) { return d.fill || "transparent"; })
      .attr("stroke", function(d) { return d.stroke || "steelblue"; })
      .attr("stroke-width", function(d) { return (d.strokeWidth || 2) + "px"; });
  },

  componentDidMount: function() {
    this.update(this.props);
  },

  shouldComponentUpdate: function(nextProps) {
    this.update(nextProps);
    return false;
  },

  render: function() {
    /* jshint ignore:start */
    return <g className="shapes"/>;
    /* jshint ignore:end */
  }
});

module.exports = Coords;