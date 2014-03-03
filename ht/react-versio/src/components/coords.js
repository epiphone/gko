/** @jsx React.DOM */
/* global React, d3, MathUtils */
"use strict";


var Coords = React.createClass({

  handleResize: function() {
    var parent = $(this.getDOMNode().parentNode);
    this.setState({width: parent.width()});
  },

  getInitialState: function() {
    return {width: 0};
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

    var shapes, axes;
    if (this.state.width) {
      shapes = this.state.width ? <Shapes x={x} y={y} spacing={spacing} data={this.props.shapes} /> : null;
      axes = <Axes x={x} y={y} bounds={bounds} />;
    }

    return (
      <div className="coords-container">
        <svg width={fullWidth} height={fullHeight}>
          <g transform={transform}>
            {axes}
            {shapes}
          </g>
        </svg>
      </div>
    );
    /* jshint ignore:end */
  }
});

/** Vertical and horizontal axes for the coordinate system. */
var Axes = React.createClass({

  /** Redraw axes and labels.  */
  update: function(props) {
    var container = d3.select(this.getDOMNode());
    var transitionDuration = props.transitionDuration || 550;
    var bounds = this.props.bounds;
    var spacing = this.props.spacing || 1;
    var x = this.props.x;
    var y = this.props.y;
    var xRange = d3.range(Math.ceil((bounds.minX) / spacing), Math.round(bounds.maxX) + spacing, spacing);
    var yRange = d3.range(Math.ceil((bounds.minY) / spacing), Math.round(bounds.maxY) + spacing, spacing);
    var data = xRange.concat(yRange);
    var isX = function(index) { return index < xRange.length; };

    var axes = container.selectAll(".axis")
      .data(data);

    axes.enter().append("line")
      .attr("class", function(d, i) { return "axis " + (d === 0 ? "thick" : ""); });

    axes.transition().duration(transitionDuration)
      .attr("x1", function(d, i) { return isX(i) ? x(d) : x(bounds.minX); })
      .attr("y1", function(d, i) { return isX(i) ? y(bounds.minY) : y(d); })
      .attr("x2", function(d, i) { return isX(i) ? x(d) : x(bounds.maxX); })
      .attr("y2", function(d, i) { return isX(i) ? y(bounds.maxY) : y(d); });

    axes.exit().remove();


    var labels = container.selectAll(".label").data(data);

    labels.enter().append("text")
      .attr("class", function(d, i) { return "label " + (isX(i) ? "x" : "y"); })
      .attr("text-anchor", "middle")
      .style("display", function(d) { if (!d) return "none"; })
      .text(Object)
      .attr("dy", function(d, i) { return isX(i) ? "1.4em" : ".3em"; })
      .attr("dx", function(d, i) { return isX(i) ? null : "-.8em"; })
      .attr("font-size", 1 + "em");

    labels.transition().duration(transitionDuration)
      .attr("x", function(d, i) { return isX(i) ? x(d) : x(0); })
      .attr("y", function(d, i) { return isX(i) ? y(0) : y(d); });

    labels.exit().remove();
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

  /** Redraw shapes. */
  update: function(props) {
    var container = d3.select(this.getDOMNode());
    var transitionDuration = props.transitionDuration || 550;

    var polygons = container.selectAll("polygon.shape")
      .data(props.data.filter(function(s) { return s.points.length > 2; }));

    polygons.enter().append("polygon").attr("class", "shape");

    polygons.transition().duration(transitionDuration)
      .attr("points", function(d) {
        return d.points.map(function(ps) {
          return [props.x(ps[0]), props.y(ps[1])];
        });
      });

    polygons.exit().remove();


    var circles = container.selectAll("circle.shape")
      .data(props.data.filter(function(s) { return s.points.length == 1; }));

    circles.enter().append("circle").attr("class", "shape");

    circles.transition().duration(transitionDuration)
      .attr("cx", function(d) { return props.x(d.points[0][0]); })
      .attr("cy", function(d) { return props.y(d.points[0][1]); })
      .attr("r", function(d) { return props.spacing * (d.r || 0.2); });

    circles.exit().remove();


    var lines = container.selectAll("line.shape")
      .data(props.data.filter(function(s) { return s.points.length == 2; }));

    lines.enter().append("line").attr("class", "shape");

    lines.transition().duration(transitionDuration)
      .attr("x1", function(d) { return props.x(d.points[0][0]); })
      .attr("y1", function(d) { return props.y(d.points[0][1]); })
      .attr("x2", function(d) { return props.x(d.points[1][0]); })
      .attr("y2", function(d) { return props.y(d.points[1][1]); });

    lines.exit().remove();


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
