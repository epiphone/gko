/** @jsx React.DOM */
/* global React, d3 */
"use strict";



var Coords = React.createClass({

  getSVG: function() {
    return d3.select(this.getDOMNode()).select("svg>g");
  },

  render: function() {

    var margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    };

    var bounds = this.props.bounds;
    var spacing = Math.round(Math.min(
      this.props.width / Math.abs(bounds.maxX - bounds.minX),
      this.props.height / Math.abs(bounds.maxY - bounds.minY)
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

    /* jshint ignore:start */
    var shapes = this.props.shapes.map(function(shape) {
        return (
          <Circle x={x} y={y} data={[shape]} spacing={spacing} getSVG={this.getSVG}/>
        );
    }.bind(this));

    return (
      <div className="coords">
        <svg width={fullWidth} height={fullHeight}>
          <g transform={transform}>
            {shapes}
          </g>
        </svg>
      </div>
    );
    /* jshint ignore:end */
  }
});


var Circle = React.createClass({

  update: function() {
    var svg = this.props.getSVG();
    var props = this.props;
    var circle = svg.selectAll("circle.shape")
      .data(this.props.data);

    circle.enter().append("circle").attr("class", "shape");

    circle.transition().duration(550)
      .attr("cx", function(d) { return props.x(d.points[0][0]); })
      .attr("cy", function(d) { return props.y(d.points[0][1]); })
      .attr("r", function(d) { return props.spacing * (d.r || 0.2); })
      .attr("stroke", function(d) { return d.stroke || "steelblue"; })
      .attr("fill", function(d) { return d.fill || "transparent"; })
      .attr("stroke-width", function(d) { return (d.strokeWidth || 2) + "px"; });

    circle.exit().remove();
  },

  componentDidMount: function(nextProps) {
    this.update();
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    this.update();
    return false;
  },

  render: function() {
    var cx = this.props.x(this.props.cx);
    var cy = this.props.y(this.props.cy);
    var stroke = this.props.stroke || "steelblue";
    var fill = this.props.fill || "transparent";
    var strokeWidth = this.props.strokeWidth || 2;

    /* jshint ignore:start */
    // <circle stroke={stroke} fill={fill} strokeWidth={strokeWidth} r={this.props.r} cx={cx} cy={cy} />
    return <circle/>;
    /* jshint ignore:end */
  }

});


var shapes = [{points: [[3,4]], r:0.2, stroke:"red"}];
var width = $("#content").width();
var aspect = 1;
var height = width * aspect;
var bounds = {maxY: 10, maxX: 10, minY: -2, minX: -2};

/* jshint ignore:start */

React.renderComponent(
  <Coords shapes={shapes} bounds={bounds} width={width} height={height} />,
  document.getElementById("content")
);

/* jshint ignore:end */
