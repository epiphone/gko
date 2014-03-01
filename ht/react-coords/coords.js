/** @jsx React.DOM */
/* global React, d3 */
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

    var shapes = !this.state.width ? null : (
      <Shapes x={x} y={y} spacing={spacing} data={this.props.shapes} />
    );

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


/** Various geometric shapes to be drawn on the coordinate system. */
var Shapes = React.createClass({
  /** Redraw the circle. */
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


    // Enter, update and remove circles
    var circles = container.selectAll("circle.shape")
      .data(props.data.filter(function(s) { return s.points.length == 1; }));

    circles.enter().append("circle").attr("class", "shape");

    circles.transition().duration(transitionDuration)
      .attr("cx", function(d) { return props.x(d.points[0][0]); })
      .attr("cy", function(d) { return props.y(d.points[0][1]); })
      .attr("r", function(d) { return props.spacing * (d.r || 0.2); });

    circles.exit().remove();


    // Enter, update and remove lines
    var lines = container.selectAll("line.shape")
      .data(props.data.filter(function(s) { return s.points.length == 2; }));

    lines.enter().append("line").attr("class", "shape");

    lines.transition().duration(transitionDuration)
      .attr("x1", function(d) { return props.x(d.points[0][0]); })
      .attr("y1", function(d) { return props.y(d.points[0][1]); })
      .attr("x2", function(d) { return props.x(d.points[1][0]); })
      .attr("y2", function(d) { return props.y(d.points[1][1]); });

    lines.exit().remove();


    // Update all shapes (common attributes)
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
    return <g/>;
    /* jshint ignore:end */
  }
});



/** Generates modern art. */
var ModernArtGenerator = React.createClass({

  changeShapes: function() {
    function randomPoint() {
      var x = Math.floor(Math.random() * 10);
      var y = Math.floor(Math.random() * 10);
      return [x, y];
    }

    function randomColor() {
      var colors = "#1f77b4 #aec7e8 #ff7f0e #ffbb78 #2ca02c #98df8a #d62728 #ff9896 #9467bd #c5b0d5 #8c564b #c49c94 #e377c2 #f7b6d2 #7f7f7f #c7c7c7 #bcbd22 #dbdb8d #17becf #9edae5".split(" ");
      return colors[Math.floor(Math.random() * colors.length)];
    }

    var shapesN = Math.ceil(Math.random() * this.props.shapesN);
    var shapes = [];

    for (var i = 0; i < shapesN; i++) {
      var pointsN = Math.ceil(Math.random() * this.props.pointsN);
      shapes.push({points: [], stroke: randomColor()});
      for (var j = 0; j < pointsN; j++) {
        shapes[i].points.push(randomPoint());
      }

      if (shapes[i].points.length === 1)
        shapes[i].r = Math.random();
    }

    this.setState({shapes: shapes});
  },

  componentDidMount: function() {
    setInterval(this.changeShapes, 1000);
  },

  getInitialState: function() {
    return {shapes: []};
  },

  render: function() {
    /* jshint ignore:start */
    var bounds = {maxY: 10, maxX: 10, minY: -2, minX: -2};
    var aspect = 1;

    return (
      <Coords shapes={this.state.shapes} bounds={bounds} aspect={aspect} />
    );
    /* jshint ignore:end */
  }
});


var Application = React.createClass({

  getInitialState: function() {
    return {shapesN: 1, pointsN: 100};
  },

  handleChange: function() {
    this.setState({
      shapesN: this.refs.shapesN.getDOMNode().value,
      pointsN: this.refs.pointsN.getDOMNode().value
    });
  },

  render: function() {
    /* jshint ignore:start */
    return (
      <div>
        Kappaleita enintään <input ref="shapesN" type="number" value={this.state.shapesN} onChange={this.handleChange} />
        Pisteitä kappaleissa enintään <input ref="pointsN" type="number" value={this.state.pointsN} onChange={this.handleChange} />
        <ModernArtGenerator shapesN={this.state.shapesN} pointsN={this.state.pointsN} />
      </div>
    );
    /* jshint ignore:end */
  }
});

/* jshint ignore:start */
React.renderComponent(
  <Application />,
  document.getElementById("content")
);
/* jshint ignore:end */
