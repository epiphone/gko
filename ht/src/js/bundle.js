(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */
"use strict";
/* globals React, require, module */


var AdditionTask = require("./tasks/addition-task");
var SimpleCoordsTask = require("./tasks/simple-coords-task");
var BasicShapesTask = require("./tasks/basic-shapes-task");
var DrawShapesTask = require("./tasks/draw-shapes-task");

/**
 * A small application with a few example tasks.
 * @module Application
 */
var Application = React.createClass({displayName: 'Application',

  handleListClick: function(e) {
    e.preventDefault();
    var taskName = e.target.text;
    this.setState({selectedTask: taskName});
  },

  handleTaskDone: function() {
    console.log("Task done - here's where the task connects to an external app.");
  },

  getInitialState: function() {
    return {selectedTask: "Yhteenlasku"};
  },

  render: function() {
    /* jshint ignore:start */
    var tasks = {
      "Yhteenlasku": AdditionTask( {onTaskDone:this.handleTaskDone, steps:5}),
      "Koordinaatiston lukeminen": SimpleCoordsTask( {onTaskDone:this.handleTaskDone, steps:5}),
      "Kappaleiden tunnistaminen": BasicShapesTask( {onTaskDone:this.handleTaskDone, time:20}),
      "Kolmioiden piirtäminen": DrawShapesTask( {onTaskDone:this.handleTaskDone, steps:3})
    };

    var taskListElems = Object.keys(tasks).map(function(taskName) {
      var className = taskName === this.state.selectedTask ? "text-muted" : "";
      return (
        React.DOM.li(null, 
          React.DOM.a( {className:className, href:"", onClick:this.handleListClick}, taskName)
        )
      );
    }.bind(this));

    var task = tasks[this.state.selectedTask];

    return (
      React.DOM.div(null, 
        React.DOM.ul( {className:"list-inline"}, 
          taskListElems
        ),

        React.DOM.div( {className:"task-container"}, 
          task
        )
      )
    );
    /* jshint ignore:end */
  }
});

module.exports = Application;

},{"./tasks/addition-task":8,"./tasks/basic-shapes-task":9,"./tasks/draw-shapes-task":10,"./tasks/simple-coords-task":11}],2:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, d3, MathUtils, module */
"use strict";


/**
 * Components for drawing geometric shapes on to a coordinate system.
 * @module CoordsComponents
 */
var CoordsComponents = (function() {

  var coordsComponents = {};

  /**
   * An array with two elements: the x and y coordinate.
   * @typedef {Array} Point
   * @memberof module:CoordsComponents
   */

  /**
   * A shape that is drawn on the coordinate system.
   * @typedef Shape
   * @type {Object}
   * @property {string} name
   * @property {number} key
   * @property {function} onClick - Shape click event handler.
   * @property {string} stroke - A CSS compatible stroke color.
   * @property {string} fill - A CSS compatible fill color.
   * @property {Array.<module:CoordsComponents.Point>} points - Shape vertices.
   * @property {number} r - Circle radius that's used when only one point is defined.
   * @memberof module:CoordsComponents
   */

  /**
   * Coordinate system click event handler.
   * @callback coordsOnClick
   * @param {number} x - Click position's x coordinate, rounded to nearest integer.
   * @param {number} y - Click position's y coordinate, rounded to nearest integer.
   * @memberof module:CoordsComponents
   */

  /**
   * A 2D coordinate system, consists of a Grid and Shapes.
   * @name Coords
   * @memberof module:CoordsComponents
   *
   * @property {boolean} [drawAxes=true] - Whether the x and y axes are drawn.
   * @property {Array.<module:CoordsComponents.Shape>} [shapes=[]] - The geometric shapes to draw.
   * @property {Object} [bounds={maxY:10, maxX:10, minY:0, minX:0}] - Maximum coordinate values.
   * @property {Object} [margin={top:20, right:20, bottom:20, left:20}] - Margin around the coordinate system.
   * @property {number} [aspect=1] - Coordinate system aspect ratio.
   * @property {module:CoordsComponents.coordsOnClick} [onClick] - Click event handler.
   *
   * @example
   * // Drawing a single circle:
   * var center = [1, 2];
   * var bounds = {minX: 0, minY: 0, maxX: 10, maxY: 10};
   * var shapes = [{points: [center], r: 0.5, stroke: "red"}];
   * React.renderComponent(
   *   <Coords shapes={shapes} bounds={bounds}/>,
   *   document.getElementById("target")
   * );
   *
   * // Drawing a polygon:
   * var triangle = [{points: [[0,0], [1,1], [2,0]]}, fill: "#FFF"];
   * var shapes = [triangle];
   * React.renderComponent(
   *   <Coords shapes={shapes} />,
   *   document.getElementById("target")
   * );
   */
  coordsComponents.Coords = React.createClass({displayName: 'Coords',

    propTypes: {
      drawAxes: React.PropTypes.bool,
      shapes: React.PropTypes.array,
      bounds: React.PropTypes.object,
      margin: React.PropTypes.object,
      aspect: React.PropTypes.number,
      onClick: React.PropTypes.func
    },

    handleResize: function() {
      var parent = $(this.getDOMNode().parentNode);

      var margin = this.props.margin;
      var width = parent ? parent.width() - margin.left - margin.right : 0;
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


      this.setState({
        width: width,
        spacing: spacing,
        x: x,
        y: y
      });
    },

    /* Translate and round screen position into coordinates, trigger event. */
    handleSVGClick: function(event) {
      if (!$.isFunction(this.props.onClick)) return;

      var elem = $(this.refs.svg.getDOMNode());
      var bounds = this.props.bounds;

      var svgX = event.pageX - elem.offset().left - this.props.margin.left;
      var svgY = event.pageY - elem.offset().top - this.props.margin.top;
      var coordsX = Math.max(bounds.minX, Math.min(bounds.maxX, Math.round(this.state.x.invert(svgX))));
      var coordsY = Math.max(bounds.minY, Math.min(bounds.maxY, Math.round(this.state.y.invert(svgY))));

      this.props.onClick(coordsX, coordsY);
    },

    getInitialState: function() {
      return {width: 0};
    },

    getDefaultProps: function() {
      return {
        drawAxes: true,
        shapes: [],
        bounds: {maxY:10, maxX:10, minY:0, minX:0},
        aspect: 1,
        margin: {top:20, right:20, bottom:20, left:20}
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
      var margin = this.props.margin;
      var bounds = this.props.bounds;
      var width = this.state.width;
      var height = Math.round(width * this.props.aspect) - margin.top - margin.bottom;
      var spacing = this.state.spacing;
      var x = this.state.x;
      var y = this.state.y;

      var fullWidth = width + margin.left + margin.right;
      var fullHeight = height + margin.top + margin.bottom;
      var transform = "translate(" + margin.left + "," + margin.top + ")";

      var shapes, grid;
      if (this.state.width) {
        var Shapes = coordsComponents.Shapes;
        var Grid = coordsComponents.Grid;

        shapes = Shapes( {x:x, y:y, spacing:spacing, data:this.props.shapes} );
        grid = Grid( {drawAxes:this.props.drawAxes, x:x, y:y, bounds:bounds} );
      }

      return (
        React.DOM.div( {className:"coords-container"}, 
          React.DOM.svg( {ref:"svg", onClick:this.handleSVGClick, width:fullWidth, height:fullHeight}, 
            React.DOM.g( {transform:transform}, 
              grid,
              shapes
            )
          )
        )
      );
      /* jshint ignore:end */
    }
  });

  /**
   * Draw a grid on a coordinate system.
   * Used by the {@link module:CoordsComponents.Coords|Coords component}.
   * @name Grid
   * @memberof module:CoordsComponents
   */
  coordsComponents.Grid = React.createClass({displayName: 'Grid',

    propTypes: {
      x: React.PropTypes.func.isRequired,
      y: React.PropTypes.func.isRequired,
      bounds: React.PropTypes.object.isRequired,
      spacing: React.PropTypes.number,
      transitionDuration: React.PropTypes.number,
      drawAxes: React.PropTypes.bool
    },

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
        React.DOM.g( {className:"axes"})
        /* jshint ignore:end */
      );
    }
  });


  /**
   * Draw various geometric shapes on a coordinate system.
   * Used by the {@link module:CoordsComponents.Coords|Coords component}.
   * @name Shapes
   * @memberof module:CoordsComponents
   */
  coordsComponents.Shapes = React.createClass({displayName: 'Shapes',

    propTypes: {
      data: React.PropTypes.array.isRequired,
      x: React.PropTypes.func.isRequired,
      y: React.PropTypes.func.isRequired,
      spacing: React.PropTypes.number.isRequired,
      transitionDuration: React.PropTypes.number
    },

    /* Redraw shapes. Gets called whenever shapes are updated or screen resizes. */
    update: function(props) {
      var container = d3.select(this.getDOMNode());
      var transitionDuration = props.transitionDuration || 550;

      var polygons = container.selectAll("polygon.shape")
        .data(props.data.filter(function(s) { return s.points.length > 2; }));

      var addedPolygons = polygons.enter().append("polygon")
        .attr("class", "shape")
        .attr("fill", function(d) { return d.fill || "transparent"; });

      polygons.transition().duration(transitionDuration)
        .attr("points", function(d) {
          return d.points.map(function(ps) {
            return [props.x(ps[0]), props.y(ps[1])];
          });
        })
        .attr("fill", function(d) { return d.fill || "transparent"; });

      polygons.exit().remove();


      var circles = container.selectAll("circle.shape")
        .data(props.data.filter(function(s) { return s.points.length == 1; }));

      var addedCircles = circles.enter().append("circle")
        .attr("class", "shape")
        .attr("fill", function(d) { return d.fill || "transparent"; });

      circles.transition().duration(transitionDuration)
        .attr("cx", function(d) { return props.x(d.points[0][0]); })
        .attr("cy", function(d) { return props.y(d.points[0][1]); })
        .attr("r", function(d) { return props.spacing * (d.r || 0.2); })
        .attr("fill", function(d) { return d.fill || "transparent"; });

      circles.exit().remove();


      var lines = container.selectAll("line.shape")
        .data(props.data.filter(function(s) { return s.points.length == 2; }));

      var addedLines = lines.enter().append("line")
        .attr("class", "shape")
        .attr("fill", function(d) { return d.fill || "transparent"; });

      lines.transition().duration(transitionDuration)
        .attr("x1", function(d) { return props.x(d.points[0][0]); })
        .attr("y1", function(d) { return props.y(d.points[0][1]); })
        .attr("x2", function(d) { return props.x(d.points[1][0]); })
        .attr("y2", function(d) { return props.y(d.points[1][1]); })
        .attr("fill", function(d) { return d.fill || "transparent"; });

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
      return React.DOM.g( {className:"shapes"});
      /* jshint ignore:end */
    }
  });

  return coordsComponents;
})();

module.exports = CoordsComponents;

},{}],3:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * Various components for creating {@link module:Forms|answer forms}.
 * @module FormComponents
 */
var FormComponents = (function(){

  var Mixins = require("./mixins");

  var formComponents = {};

  /**
   * A blank form with a submit button, used as a container for various
   * input components. The child components can toggle the form's validity status,
   * preventing submit when inputs are invalid.
   * @name AnswerForm
   * @memberof module:FormComponents
   * @property {function} onAnswer - Form submit event handler.
   * @property {string} [btnCorrectAnimClass='animated bounce'] - The CSS animation class applied to submit
   *                                                              button upon a correct answer.
   * @property {string} [btnIncorrectAnimClass='animated shake'] - The CSS animation class applied to submit
   *                                                               button upon an incorrect answer.
   * @property {string} [formClass='form-horizontal'] - Form element's CSS class.
   * @property {string} [btnClass='btn btn-success btn-lg btn-block'] - Submit button's CSS class.
   */
  formComponents.AnswerForm = React.createClass({displayName: 'AnswerForm',

    propTypes: {
      onAnswer: React.PropTypes.func.isRequired,
      btnCorrectAnimClass: React.PropTypes.string,
      btnIncorrectAnimClass: React.PropTypes.string,
      formClass: React.PropTypes.string,
      btnClass: React.PropTypes.string
    },

    mixins: [Mixins.TriggerAnimationMixin],

    // Submit answer if form is valid.
    handleSubmit: function(e) {
      if (e)
        e.preventDefault();

      if (this.state.isValid) {
        this.props.onAnswer();
      } else {
        this.setState({showErrors: true});
      }
    },

    handleCorrectAnswer: function() {
      var btn = $(this.refs.btn.getDOMNode());
      this.animate(btn, this.props.btnCorrectAnimClass);
    },

    handleIncorrectAnswer: function() {
      var btn = $(this.refs.btn.getDOMNode());
      this.animate(btn, this.props.btnIncorrectAnimClass);
    },

    setValidity: function(isValid) {
      this.setState({isValid: isValid, isDirty: true});
    },

    // Clear values and validation states for all child elements.
    reset: function() {
      this.setState({
        isValid: true,
        isDirty: false,
        showErrors: false
      });
    },

    getDefaultProps: function() {
      return {
        formClass: "form-horizontal",
        btnClass: "btn btn-success btn-lg btn-block",
        btnCorrectAnimClass: "animated bounce",
        btnIncorrectAnimClass: "animated shake"
      };
    },

    getInitialState: function() {
      return {
        isValid: true,
        isDirty: false,
        showErrors: false
      };
    },

    render: function() {
      /* jshint ignore:start */
      var children = [].concat(this.props.children).map(function(child) {
        child.props.onValidityChange = this.setValidity;
        child.props.onSubmit = this.handleSubmit;
        child.props.showError = this.state.showErrors;
        return child;
      }.bind(this));

      var btnClass = this.props.btnClass + (this.state.isValid ? "" : " disabled");

      return (
        React.DOM.form( {role:"form", className:this.props.formClass, onSubmit:this.handleSubmit, noValidate:true}, 
          children,
          React.DOM.div( {className:"form-group"}, 
            React.DOM.input( {ref:"btn", type:"submit", value:"Vastaa", className:btnClass} )
          )
        )
      );
      /* jshint ignore:end */
    }
  });


  /**
   * An input with regular expression validation and visible validation states.
   * @name ReInput
   * @memberof module:FormComponents
   * @property {RegExp} [re=/^\s*-?\d+\s*$/] - The validating regular expression.
   * @property {boolean} [showError=false] - Is an error label is displayed.
   * @property {boolean} [required=true] - Is the field required.
   * @property {string} [placeholder] - Input field placeholder text.
   * @property {string} [type=text] - Input field type.
   * @property {string} [className] - Input field class.
   * @property {function(boolean)} [onValidityChange] - Input validity change event handler.
   */
  formComponents.ReInput = React.createClass({displayName: 'ReInput',

    propTypes: {
      re: React.PropTypes.object,
      showError: React.PropTypes.bool,
      required: React.PropTypes.bool,
      placeholder: React.PropTypes.string,
      type: React.PropTypes.string,
      className: React.PropTypes.string,
      onValidityChange: React.PropTypes.func
    },

    /* Read value, validate, notify parent element if an event is attached. */
    handleChange: function(e) {
      var isValid = this.validator.test(e.target.value);
      this.setState({value: e.target.value, isValid: isValid, isDirty: true});

      if ($.isFunction(this.props.onValidityChange))
        this.props.onValidityChange(isValid);
    },

    value: function(value) {
      if (value !== undefined)
        this.setState({value: value});
      else
        return this.state.value;
    },

    select: function() {
      this.refs.input.getDOMNode().select();
    },

    /* Clear value and reset validation states. */
    reset: function() {
      this.setState({
        value: "",
        isValid: true,
        isDirty: false
      });
    },

    setValidator: function(re) {
      this.validator = new RegExp(re);
    },

    componentDidMount: function() {
      this.setValidator(this.props.re);
    },

    componentWillReceiveProps: function(newProps) {
      this.setValidator(newProps.re);
    },

    getInitialState: function() {
      return {
        value: "",
        isValid: true,
        isDirty: false,
        type: "text"
      };
    },

    getDefaultProps: function() {
      return {
        re: /^\s*-?\d+\s*$/,
        showError: false,
        required: true,
        className: ""
      };
    },

    render: function() {
      /* jshint ignore:start */
      var validationState = React.addons.classSet({
        "has-success": this.state.isValid && this.state.isDirty,
        "has-warning": !this.state.isDirty && this.props.showError,
        "has-error": !this.state.isValid
      });

      var error;
      if (this.props.showError) {
        if (!this.state.isValid) {
          error = React.DOM.label( {className:"control-label"}, "Virheellinen syöte");
        }
        else if (this.props.required && this.value().length === 0) {
          error = React.DOM.label( {className:"control-label"}, "Täytä tämä kenttä");
        }
      };

      return (
        React.DOM.div( {className:"form-group " + validationState}, 
          error,
          React.DOM.input( {ref:"input", onChange:this.handleChange, value:this.state.value, placeholder:this.props.placeholder,
          type:this.props.type, className:"form-control " + this.props.className} )
        )
      );
      /* jshint ignore:end */
    }
  });

  /**
   * A number input with buttons on either side for incrementing and decrementing.
   * Uses {@link module:FormComponents.ReInput|ReInput} for validation.
   * @name NumInput
   * @memberof module:FormComponents
   * @property {number} [step=1] - How much the value changes on a single increment/decrement.
   * @property {string} [placeholder] - Input placeholder text.
   * @property {string} [btnClass='btn btn-lg btn-info'] - Increment/decrement button class.
   * @property {function(boolean)} [onValidityChange] - Input validity change event handler.
   * @property {function} [onSubmit] - Input submit event handler, triggered when Enter is clicked.
   */
  formComponents.NumInput = React.createClass({displayName: 'NumInput',

    propTypes: {
      step: React.PropTypes.number,
      placeholder: React.PropTypes.string,
      btnClass: React.PropTypes.string,
      onValidityChange: React.PropTypes.func,
      onSubmit: React.PropTypes.func
    },

    setValueAndValidity: function(value, isValid) {
      this.setState({
        value: value, isValid: isValid
      });
      if ($.isFunction(this.props.onValidityChange))
        this.props.onValidityChange(isValid);
    },

    reset: function() {
      this.setValueAndValidity("", true);
    },

    handleDecrement: function(e) {
      e.preventDefault();
      this.setValueAndValidity(this.value() - this.props.step, true);
    },

    handleIncrement: function(e) {
      e.preventDefault();
      this.setValueAndValidity(this.value() + this.props.step, true);
    },

    /* Reset state to input value if input value is a number. */
    handleChange: function(e) {
      var val = e.target.value;
      var isValid = !isNaN(parseFloat(val));
      this.setValueAndValidity(val, isValid);
    },

    /* Try to submit parent form when Enter is clicked. */
    handleKeyPress: function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (this.props.onSubmit)
          this.props.onSubmit();
      }
    },

    value: function() {
      return parseFloat(this.state.value) || 0;
    },

    getInitialState: function() {
      return {
        value: null,
        isValid: true
      };
    },

    getDefaultProps: function() {
      return {
        step: 1,
        btnClass: "btn btn-lg btn-info"
      };
    },

    render: function() {
      /* jshint ignore:start */
      var ReInput = formComponents.ReInput;
      var btnClass = this.props.btnClass;
      var validationState = this.state.isValid ? "has-success" : "has-error";

      return (
        React.DOM.div( {className:"form-group " + validationState}, 
          React.DOM.div( {className:"row"}, 
            React.DOM.div( {className:"col-sm-3 col-xs-3"}, 
              React.DOM.button( {tabIndex:"-1", className:btnClass + " pull-right", onClick:this.handleDecrement}, 
                React.DOM.span( {className:"glyphicon glyphicon-chevron-left"})
              )
            ),
            React.DOM.div( {className:"col-sm-6 col-xs-6"}, 
              React.DOM.input( {type:"number", value:this.state.value, onChange:this.handleChange, onKeyPress:this.handleKeyPress,
              className:"form-control input-lg text-center", placeholder:this.props.placeholder})
            ),
            React.DOM.div( {className:"col-sm-3 col-xs-3"}, 
              React.DOM.button( {tabIndex:"-1", className:btnClass + " pull-left", onClick:this.handleIncrement}, 
                React.DOM.span( {className:"glyphicon glyphicon-chevron-right"})
              )
            )
          )
        )
      );
      /* jshint ignore:end */
    }
  });

  return formComponents;
})();


module.exports = FormComponents;

},{"./mixins":6}],4:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * Complete answer forms for tasks. Forms consist of {@link module:FormComponents|form components}.
 * @module Forms
 */
var Forms = (function() {

  var FormComponents = require("./form-components");
  var AnswerForm = FormComponents.AnswerForm;
  var NumInput = FormComponents.NumInput;

  var forms = {};

  /**
   * Form with a single {@link module:FormComponents.NumInput|NumInput}.
   * @name SingleNumberForm
   * @memberof module:Forms
   * @property {module:Forms.singleNumberFormOnAnswer} onAnswer - Form answer event handler.
   */
  forms.SingleNumberForm = React.createClass({displayName: 'SingleNumberForm',

    /**
     * {@link module:Forms.SingleNumberForm|SingleNumberForm}'s answer event handler.
     * @callback singleNumberFormOnAnswer
     * @param {number} value - The answer value.
     * @returns {boolean} Was the answer correct.
     * @memberof module:Forms
     */

    propTypes: {
      onAnswer: React.PropTypes.func.isRequired
    },

    handleAnswer: function() {
      var isCorrect = this.props.onAnswer(this.refs.answer.value());
      if (isCorrect) {
        this.refs.form.handleCorrectAnswer();
        this.reset();
      } else {
        this.refs.form.handleIncorrectAnswer();
      }
    },

    reset: function() {
      this.refs.form.reset();
      this.refs.answer.reset();
    },

    render: function() {
      return (
        /* jshint ignore:start */
        AnswerForm( {ref:"form", className:"form-horizontal", onAnswer:this.handleAnswer}, 
          NumInput( {ref:"answer", placeholder:"Vastaa tähän"})
        )
        /* jshint ignore:end */
      );
    }
  });

  /**
   * Form with two {@link module:FormComponents.NumInput|NumInputs} for x and y coordinates.
   * @name CoordsAnswerForm
   * @memberof module:Forms
   * @property {module:Forms.coordsAnswerFormOnAnswer} onAnswer - Answer event handler.
   */
  forms.CoordsAnswerForm = React.createClass({displayName: 'CoordsAnswerForm',

    /**
     * {@link module:Forms.CoordsAnswerForm|CoordsAnswerForm}'s answer event handler.
     * @callback coordsAnswerFormOnAnswer
     * @param {number} x
     * @param {number} y
     * @returns {boolean} Was the answer correct.
     * @memberof module:Forms
     */

    propTypes: {
      onAnswer: React.PropTypes.func.isRequired
    },

    handleAnswer: function() {
      var isCorrect = this.props.onAnswer(this.refs.x.value(), this.refs.y.value());
      if (isCorrect) {
        this.refs.form.handleCorrectAnswer();
        this.reset();
      } else {
        this.refs.form.handleIncorrectAnswer();
      }
    },

    reset: function() {
      this.refs.form.reset();
    },

    render: function() {
      /* jshint ignore:start */
      return (
        AnswerForm( {ref:"form", className:"form-horizontal", onAnswer:this.handleAnswer}, 
          NumInput( {ref:"x", placeholder:"x"}),
          NumInput( {ref:"y", placeholder:"y"})
        )
      );
      /* jshint ignore:end */
    }
  });

  return forms;
})();


module.exports = Forms;

},{"./form-components":3}],5:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, module, MathJax */
"use strict";


/**
 * Components for maths tasks.
 * @module MathComponents
 */
var MathComponents = (function() {

  var mathComponents = {};

  /**
   * Render LaTex maths notation into web fonts using MathJax.
   * @name MathJax
   * @memberof module:MathComponents
   *
   * @example
   * // Render a simple formula:
   *
   * var contents = "a_1 + b_2 = c_3";
   * var formula = (
   *   <MathJax>
   *     {contents}
   *   </MathJax>
   * );
   *
   * React.renderComponent(
   *   formula,
   *   document.getElementById("target")
   * );
   */
  mathComponents.MathJax = React.createClass({displayName: 'MathJax',
    reprocess: function() {
      var elem = this.refs.script.getDOMNode();
      MathJax.Hub.Queue(["Reprocess", MathJax.Hub, elem]);
    },

    componentDidMount: function() {
      this.reprocess();
    },

    componentDidUpdate: function() {
      this.reprocess();
    },

    render: function() {
      return (
        /* jshint ignore:start */
        React.DOM.span(null, 
          React.DOM.script( {ref:"script", type:"math/tex"}, this.props.children)
        )
        /* jshint ignore:end */
      );
    }
    });

    return mathComponents;
})();


module.exports = MathComponents;

},{}],6:[function(require,module,exports){
/** @jsx React.DOM */
/* global module */
"use strict";


/**
 * Component extensions i.e. {@link http://facebook.github.io/react/docs/reusable-components.html#mixins|mixins}.
 * @module Mixins
 */
var Mixins = (function() {

  var mixins = {};

  /**
   * Provides a setInterval function which will get cleaned up when
   * the component is destroyed.
   * @name SetIntervalMixin
   * @memberof module:Mixins
   */
  mixins.SetIntervalMixin = {
    setInterval: function() {
      this.intervals.push(setInterval.apply(null, arguments));
    },

    clearAllIntervals: function() {
      this.intervals.map(clearInterval);
      this.intervals = [];
    },

    /* Invoked when component is initialized. */
    componentWillMount: function() {
      this.intervals = [];
    },

    /* Invoked when component is destroyed. */
    componentWillUnmount: function() {
      this.clearAllIntervals();
    }
  };

  /**
   * Provides a setTimeout function which will get cleaned up when
   * the component is destroyed.
   * @name SetTimeoutMixin
   * @memberof module:Mixins
   */
  mixins.SetTimeoutMixin = {
    setTimeout: function() {
      this.timeouts.push(setTimeout.apply(null, arguments));
    },

    clearAllTimeouts: function() {
      this.timeouts.map(clearTimeout);
      this.timeouts = [];
    },

    /* Invoked when component is initialized. */
    componentWillMount: function() {
      this.timeouts = [];
    },

    /* Invoked when component is destroyed. */
    componentWillUnmount: function() {
      this.clearAllTimeouts();
    }
  };

  /**
   * Apply CSS classes for set duration - useful for singleshot animations.
   * @name TriggerAnimationMixin
   * @memberof module:Mixins
   */
  mixins.TriggerAnimationMixin = {

    animate: function(elem, className, duration) {
      duration = duration || 1000;
      if (!this.timeout && this.timeout !== 0) {
        elem.addClass(className);
        this.timeout = setTimeout(function() {
          elem.removeClass(className);
          this.timeout = null;
        }.bind(this), duration);
      }
    },

    componentWillUnmount: function() {
      clearTimeout(this.timeout);
    }
  };

  return mixins;
})();


module.exports = Mixins;

},{}],7:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, module */
"use strict";

/**
 * Common task components.
 * @module TaskComponents
 */
var TaskComponents = (function() {

  var Mixins = require("./mixins");

  var taskComponents = {};

  /**
   * A wrapper for Bootstrap's panel component.
   * @name TaskPanel
   * @memberof module:TaskComponents
   * @property {string} [className='panel-info'] - Panel class name.
   */
  taskComponents.TaskPanel = React.createClass({displayName: 'TaskPanel',

    propTypes: {
      className: React.PropTypes.string
    },

    render: function() {
      /* jshint ignore:start */
      var className = "panel " + (this.props.className || "panel-info" );

      return (
        React.DOM.div( {className:className}, 
          React.DOM.div( {className:"panel-heading"}, 
            React.DOM.h3( {className:"panel-title"}, this.props.header)
          ),
          React.DOM.div( {className:"panel-body"}, 
            this.props.children
          )
        )
      );
      /* jshint ignore:end */
    }
  });

  /**
   * A wrapper for Bootstrap's progress bar element.
   * @name TaskProgressBar
   * @memberof module:TaskComponents
   * @property {number} max - The maximum progress value.
   * @property {number} now - The current progress value.
   */
  taskComponents.TaskProgressBar = React.createClass({displayName: 'TaskProgressBar',
    propTypes: {
      max: React.PropTypes.number.isRequired,
      now: React.PropTypes.number.isRequired
    },

    render: function() {
      /* jshint ignore:start */
      var singleWidth = Math.ceil(1 / this.props.max * 100);
      var leftStyle = {width: singleWidth * (this.props.now - 1) + "%"};
      var rightStyle = {width: singleWidth * (this.props.max - this.props.now + 1) + "%"};

      return (
        React.DOM.div( {className:"progress progress-striped active task-progress-bar"}, 
          React.DOM.div( {className:"progress-bar progress-bar-success", style:leftStyle}),
          React.DOM.div( {className:"progress-bar progress-bar-warning", style:rightStyle})
        )
      );
      /* jshint ignore:end */
    }
  });

  /**
   * A timer that counts down from a specified time and triggers an event
   * when finished. Remaining time is displayed in a progress bar.
   * @name TaskCountdownTimer
   * @memberof module:TaskComponents
   * @property {number} time - Countdown duration in seconds.
   * @property {boolean} [startOnMount=false] - Does countdown start automatically when rendered.
   * @property {function} [onExpiry] - Countdown expiry event handler.
   */
  taskComponents.TaskCountdownTimer = React.createClass({displayName: 'TaskCountdownTimer',

    propTypes: {
      time: React.PropTypes.number.isRequired,
      startOnMount: React.PropTypes.bool,
      onExpiry: React.PropTypes.func
    },

    mixins: [Mixins.SetIntervalMixin],

    startCountdown: function() {
      this.setState({
        timeLeft: this.props.time
      });

      this.setInterval(this.tick, 1000);
    },

    tick: function() {
      var timeLeft = this.state.timeLeft - 1;

      this.setState({
        timeLeft: timeLeft
      });

      if (timeLeft < 1) {
        this.clearAllIntervals();
        if ($.isFunction(this.props.onExpiry)) this.props.onExpiry();
      }
    },

    componentDidMount: function() {
      if (this.props.startOnMount) this.startCountdown();
    },

    getInitialState: function() {
      return {
        timeLeft: this.props.time
      };
    },

    render: function() {
      /* jshint ignore:start */
      var singleWidth = Math.ceil(1 / this.props.time * 100);
      var width = Math.ceil(1 / this.props.time * 100 * this.state.timeLeft);
      var barStyle = {width: width + "%"};

      var barClass = React.addons.classSet({
        "progress-bar-success": width >= 40,
        "progress-bar-warning": width < 40 && width > 20,
        "progress-bar-danger": width <= 20,
      });

      return (
        React.DOM.div( {className:"progress progress-striped active task-progress-bar"}, 
          React.DOM.div( {className:"progress-bar " + barClass, style:barStyle})
        )
      );
      /* jshint ignore:end */
    }
  });

  /**
   * Task header.
   * @name TaskHeader
   * @memberof module:TaskComponents
   * @property {string} name - Task name to display in the header.
   */
  taskComponents.TaskHeader = React.createClass({displayName: 'TaskHeader',

    propTypes: {
      name: React.PropTypes.string.isRequired
    },

    render: function() {
      /* jshint ignore:start */
      return (
        React.DOM.div( {className:"task-header row"}, 
          React.DOM.div( {className:"col-sm-7"}, 
            React.DOM.h2(null, this.props.name)
          ),
          React.DOM.div( {className:"col-sm-5"}, 
            this.props.children
          )
        )
      );
      /* jshint ignore:end */
    }
  });


  /**
   * A panel that is shown after completing a task.
   * @name TaskDoneDisplay
   * @memberof module:TaskComponents
   * @property {number} [score] - Score to display.
   */
  taskComponents.TaskDoneDisplay = React.createClass({displayName: 'TaskDoneDisplay',

    propTypes: {
      score: React.PropTypes.number
    },

    render: function() {
      /* jshint ignore:start */
      var score = this.props.score || 0;

      return (
        React.DOM.div( {className:"task-done-display animate bounce-in"}, 
          React.DOM.div( {className:"alert alert-success"}, 
            React.DOM.strong(null, "Tehtävä suoritettu!"), " Pisteitä: ", score
          )
        )
      );
      /* jshint ignore:end */
    }
  });

  /**
   * A div with a method for applying CSS animation classes for a set duration.
   * @name TaskTriggerAnimDiv
   * @memberof module:TaskComponents
   * @property {string} [className] - Container div's CSS class.
   */
  taskComponents.TaskTriggerAnimDiv = React.createClass({displayName: 'TaskTriggerAnimDiv',

    mixins: [Mixins.TriggerAnimationMixin],

    triggerAnim: function(animationClass, duration) {
      var elem = $(this.getDOMNode());
      animationClass = animationClass || "";
      duration = duration || 1000;

      this.animate(elem, animationClass, duration);
    },

    render: function() {
      var className = this.props.className || "";
      return (
        /* jshint ignore:start */
        React.DOM.div( {className:"animated " + className}, 
          this.props.children
        )
        /* jshint ignore:end */
      );
    }
  });

  return taskComponents;
})();


module.exports = TaskComponents;

},{"./mixins":6}],8:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * A simple integer addition task.
 */
var AdditionTask = (function() {

  var TaskUtils = require("../utils/task-utils");
  var SingleNumberForm = require("../components/forms").SingleNumberForm;
  var MathComponents = require("../components/math-components");
  var TaskComponents = require("../components/task-components");


  var additionTask = React.createClass({displayName: 'additionTask',

    propTypes: {
      steps: React.PropTypes.number.isRequired,
      onTaskDone: React.PropTypes.func.isRequired
    },

    /** Reset the question. */
    reset: function() {
      var a, b;
      do {
        a = TaskUtils.randRange(1, 11);
        b = TaskUtils.randRange(1, 11);
      }
      while (TaskUtils.matchesSolution([a,b], [this.state.a, this.state.b]));

      this.setState({
        a: a,
        b: b,
        answer: a + b
      });
    },

    /** Check if correct. */
    handleAnswer: function(answer) {
      var isCorrect = TaskUtils.matchesSolution(answer, this.state.answer);
      if (isCorrect)
        this.handleCorrectAnswer();

      return isCorrect;
    },

    handleCorrectAnswer: function() {
      var step = this.state.step;
      if (step === this.props.steps)
        this.props.onTaskDone();
      else
        this.reset();

      this.setState({step: step + 1});
    },

    componentDidMount: function() {
      this.reset();
    },

    getInitialState: function() {
      return {
        step: 1,
        answer: null
      };
    },

    render: function() {
      /* jshint ignore:start */
      var TaskPanel = TaskComponents.TaskPanel;
      var TaskHeader = TaskComponents.TaskHeader;
      var TaskProgressBar = TaskComponents.TaskProgressBar;
      var TaskDoneDisplay = TaskComponents.TaskDoneDisplay;
      var MathJax = MathComponents.MathJax;

      var taskIsDone = this.state.step > this.props.steps;
      var question, sidebar;

      if (!taskIsDone) {
        var questionContent = this.state.a + " + " + this.state.b + " = ?";
        question = (
          React.DOM.div( {className:"text-center"}, 
            React.DOM.h1(null, 
              MathJax(null, questionContent)
            )
          )
        );

        sidebar = (
          React.DOM.div(null, 
            TaskPanel( {header:"Ohjeet"}, 
              React.DOM.span(null, "Mikä on yhteenlaskun tulos?")
            ),
            TaskPanel( {header:"Vastaus", className:"panel-success panel-extra-padding"}, 
              SingleNumberForm( {onAnswer:this.handleAnswer} )
            )
          )
        );
      }
      else {
        question = TaskDoneDisplay( {score:10});
      }

      return (
        React.DOM.div(null, 
          TaskHeader( {name:"Yhteenlasku"}, 
            TaskProgressBar( {now:this.state.step, max:this.props.steps})
          ),
          React.DOM.div( {className:"row"}, 
            React.DOM.div( {className:"col-sm-6 question"}, 
              question
            ),

            React.DOM.div( {className:"col-sm-5 col-sm-offset-1"}, 
              sidebar
            )
          )
        )
      );
      /* jshint ignore:end */
    }
  });

  return additionTask;
})();


module.exports = AdditionTask;

},{"../components/forms":4,"../components/math-components":5,"../components/task-components":7,"../utils/task-utils":12}],9:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, d3, module, require */
"use strict";


/**
 * Detect as many shapes as you can in 60 seconds.
 */
var BasicShapesTask = (function() {

  var TaskUtils = require("../utils/task-utils");
  var TaskComponents = require("../components/task-components");
  var Coords = require("../components/coords-components").Coords;
  var Mixins = require("../components/mixins");

  var basicShapesTask = React.createClass({displayName: 'basicShapesTask',

    propTypes: {
      onTaskDone: React.PropTypes.func.isRequired,
      time: React.PropTypes.number.isRequired
    },

    mixins: [Mixins.SetTimeoutMixin],

    /**
     * Returns an array of six different shapes that fill the coords
     * in a random order.
     */
    getRandomShapes: function() {
      var c1 = 0.46, c2 = 1.21, s1 = 1.43, s2 = 0.885;
      var pentagonPts = [[-s2,-c2], [-s1,c1], [0,1.5], [s1,c1], [s2,-c2]];
      pentagonPts = TaskUtils.translate(pentagonPts, 2.5, 1.5);

      var translates = [[0,0], [6,0], [0,4], [6,4], [0,8], [6,8]];
      var bases = [
        {name:"kolmio", points:[[1,0], [1,3], [4,0]]},
        {name:"neliö", points:[[1,0], [1,3], [4,3], [4,0]]},
        {name:"ympyrä", points:[[2.5,1.5]], r:1.5},
        {name:"suunnikas", points:[[0,0], [0.5,3], [4.5,3], [4,0]]},
        {name:"puolisuunnikas", points:[[0,0], [0.5,3], [4,3], [4.5,0]]},
        {name:"viisikulmio", points:pentagonPts}
      ];

      bases = TaskUtils.shuffle(bases);
      var clrs = d3.scale.category10();

      var shapes = bases.map(function(base, i) {
        var translateX = translates[i][0] + Math.random();
        var translateY = translates[i][1] + Math.random();
        base.points = TaskUtils.translate(base.points, translateX, translateY);
        base.key = i;
        base.onClick = this.handleShapeClick;
        base.stroke = "black";
        base.fill = clrs(TaskUtils.rand(9));
        return base;
      }.bind(this));

      return shapes;
    },

    /** Reset the question, i.e. generate new shapes. */
    reset: function() {
      var shapes = this.getRandomShapes();

      // Prevent asking for the same shape twice in a row.
      var possibleTargets = shapes;
      if (this.state.target) {
        possibleTargets = possibleTargets.filter(function(shape) {
          return shape.name !== this.state.target.name;
        }.bind(this));
      }
      var target = possibleTargets[TaskUtils.rand(possibleTargets.length)];

      this.setState({
        shapes: this.getRandomShapes(),
        target: target
      });
    },

    handleStartBtnClick: function() {
      this.setState({isRunning: true, score: 0});
      this.refs.timer.startCountdown();
      this.reset();
    },

    /** Check if correct shape and proceed. */
    handleShapeClick: function(shape) {
      var scoreIncrement;
      if (shape.name === this.state.target.name) {
        scoreIncrement = 1;
      } else {
        scoreIncrement = -1;
      }

      var anim = scoreIncrement > 0 ? "pulse" : "shake";
      this.refs.score.triggerAnim(anim, 1000);

      this.setState({score: Math.max(this.state.score + scoreIncrement, 0)});
      this.reset();
    },

    /** Task finishes (after a small timeout for smoothness) when timer expires. */
    handleTimerExpiry: function() {
      this.setTimeout(function() {
        this.setState({ isFinished: true });
      }.bind(this), 500);
    },

    getInitialState: function() {
      return {
        shapes: [],
        score: 0,
        isRunning: false,
        isFinished: false
      };
    },

    render: function() {
      /* jshint ignore:start */
      var TaskPanel = TaskComponents.TaskPanel;
      var TaskHeader = TaskComponents.TaskHeader;
      var TaskDoneDisplay = TaskComponents.TaskDoneDisplay;
      var TaskCountdownTimer = TaskComponents.TaskCountdownTimer;
      var TaskTriggerAnimDiv = TaskComponents.TaskTriggerAnimDiv;

      var shapes = this.state.shapes;
      var question, sidebar, timer;

      if (!this.state.isFinished) {
        var bounds = {maxY: 12, maxX: 12, minY: 0, minX: 0};

        question = Coords( {drawAxes:false, shapes:shapes, bounds:bounds, aspect:1} );

        var shapeToFind = "kolmio";

        var startBtn = this.state.isRunning ? null : (
          React.DOM.div(null, 
            React.DOM.hr(null),
            React.DOM.button( {className:"animated animated-repeat bounce btn btn-primary btn-block", onClick:this.handleStartBtnClick}, 
              "Aloita peli"
            )
          )
        );

        var targetDisplay = !this.state.target ? null : (
          React.DOM.div( {className:"animated bounce-in"}, 
            React.DOM.hr(null),
            "Klikattava kappale: ", React.DOM.strong(null, this.state.target.name),
            React.DOM.hr(null),
            TaskTriggerAnimDiv( {ref:"score", className:"text-center"}, 
              "Pisteet: ", React.DOM.span( {className:"label label-warning"}, this.state.score)
            )
          )
        );

        sidebar = (
          React.DOM.div(null, 
            TaskPanel( {header:"Ohjeet"}, 
              "Etsi koordinaatistosta määrätty tasokuvio ja klikkaa sitä.",React.DOM.br(null),
              "Sinulla on ", React.DOM.strong(null, this.props.time, " sekuntia"), " aikaa.",
              startBtn,
              targetDisplay
            )
          )
        );
      } else {
        question = TaskDoneDisplay( {score:this.state.score});
      }

      return (
        React.DOM.div(null, 
          TaskHeader( {name:"Kappaleiden tunnistaminen"}, 
            TaskCountdownTimer( {ref:"timer", time:this.props.time, onExpiry:this.handleTimerExpiry})
          ),
          React.DOM.div( {className:"row"}, 
            React.DOM.div( {className:"col-sm-6 question"}, 
              question
            ),

            React.DOM.div( {className:"col-sm-5 col-sm-offset-1"}, 
              sidebar
            )
          )
        )
      );
      /* jshint ignore:end */
    }
  });

  return basicShapesTask;
})();

module.exports = BasicShapesTask;

},{"../components/coords-components":2,"../components/mixins":6,"../components/task-components":7,"../utils/task-utils":12}],10:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * Draw a given shape on the coordinate system.
 */
var DrawShapesTask = (function() {

  var TaskUtils = require("../utils/task-utils");
  var TaskComponents = require("../components/task-components");
  var Coords = require("../components/coords-components").Coords;


  var drawShapesTask = React.createClass({displayName: 'drawShapesTask',

    propTypes: {
      steps: React.PropTypes.number.isRequired,
      onTaskDone: React.PropTypes.func.isRequired
    },

    reset: function() {
      var targetArea;
      do {
        targetArea = TaskUtils.randRange(1, 10);
      } while (targetArea === this.state.targetArea);

      this.setState({
        shapes: [],
        targetArea: targetArea,
        coordsDisabled: false
      });
    },

    checkAnswer: function() {
      var polygonPts = this.state.shapes.map(function(shape) {
        return shape.points[0];
      });
      var triangle = {points: polygonPts, fill: "steelblue"};

      this.setState({
        shapes: [triangle],
        coordsDisabled: true
      });

      var isCorrect = TaskUtils.triangleArea(polygonPts) === this.state.targetArea;

      setTimeout(function() {
        var anim = isCorrect ? "pulse" : "shake";
        this.refs.animDiv.triggerAnim(anim);

        triangle.fill = isCorrect ? "#1AC834" : "#8B0000";
        this.setState({shapes: [triangle]});

        setTimeout(function() {
          if (isCorrect) this.handleCorrectAnswer();
          this.reset();
        }.bind(this), 1000);

      }.bind(this), 500);
    },

    handleStartBtnClick: function() {
      this.setState({isRunning: true});
      this.reset();
    },

    handleCoordsClick: function(x, y) {
      if (this.state.coordsDisabled || !this.state.isRunning)
        return;

      var shapes = this.state.shapes;

      var complement = shapes.filter(function(shape) {
        var point = shape.points[0];
        return !(point[0] === x && point[1] === y);
      });

      if (complement.length < shapes.length) {
        shapes = complement;
      } else {
        var newShape = {points: [[x, y]]};
        shapes.push(newShape);
      }

      this.setState({shapes: shapes});

      if (shapes.length === 3) {
        this.checkAnswer();
      }
    },

    handleCorrectAnswer: function() {
      var step = this.state.step;
      if (step === this.props.steps) this.props.onTaskDone();
      this.setState({step: step + 1});
    },

    getInitialState: function() {
      return {
        step: 1,
        shapes: [],
        isRunning: false
      };
    },

    render: function() {
      /* jshint ignore:start */
      var TaskPanel = TaskComponents.TaskPanel;
      var TaskHeader = TaskComponents.TaskHeader;
      var TaskProgressBar = TaskComponents.TaskProgressBar;
      var TaskDoneDisplay = TaskComponents.TaskDoneDisplay;
      var TaskTriggerAnimDiv = TaskComponents.TaskTriggerAnimDiv;

      var taskIsDone = this.state.step > this.props.steps;
      var question, sidebar;

      if (!taskIsDone) {
        var bounds = {minX: 0, minY: 0, maxX: 7, maxY: 7};
        question = (
          Coords( {shapes:this.state.shapes, bounds:bounds, onClick:this.handleCoordsClick} )
        );

        if (this.state.isRunning) {
          sidebar = (
            React.DOM.div(null, 
              TaskPanel( {header:"Ohjeet"}, 
                TaskTriggerAnimDiv( {ref:"animDiv"}, 
                  React.DOM.span(null, 
                    "Muodosta kolmio, jonka pinta-ala on ", React.DOM.strong(null, this.state.targetArea)
                  )
                )
              )
            )
          );
        } else {
          sidebar = (
            React.DOM.div(null, 
              TaskPanel( {header:"Ohjeet"}, 
                "Muodosta ohjeiden mukainen kolmio klikkailemalla koordinaatistoa.",
                React.DOM.hr(null),
                React.DOM.button( {className:"animated animated-repeat bounce btn btn-primary btn-block",
                onClick:this.handleStartBtnClick}, 
                  "Aloita tehtävä"
                )
              )
            )
          );
        }
      } else {
        question = TaskDoneDisplay( {score:this.props.steps});
      }

      return (
        React.DOM.div(null, 
          TaskHeader( {name:"Kolmioiden piirtäminen"}, 
            TaskProgressBar( {now:this.state.step, max:this.props.steps})
          ),
          React.DOM.div( {className:"row"}, 
            React.DOM.div( {className:"col-sm-6 question"}, 
              question
            ),

            React.DOM.div( {className:"col-sm-5 col-sm-offset-1"}, 
              sidebar
            )
          )
        )
      );
      /* jshint ignore:end */
    }
  });

  return drawShapesTask;
})();


module.exports = DrawShapesTask;

},{"../components/coords-components":2,"../components/task-components":7,"../utils/task-utils":12}],11:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * Read positions from a coordinate system.
 */
var SimpleCoordsTask = (function() {

  var TaskUtils = require("../utils/task-utils");
  var TaskComponents = require("../components/task-components");
  var Coords = require("../components/coords-components").Coords;
  var Forms = require("../components/forms");


  var simpleCoordsTask = React.createClass({displayName: 'simpleCoordsTask',
    propTypes: {
      steps: React.PropTypes.number.isRequired,
      onTaskDone: React.PropTypes.func.isRequired
    },

    /** Reset the question, i.e. generate a new random point. */
    reset: function() {
      var newPoint;
      do { newPoint = [TaskUtils.randRange(0, 10), TaskUtils.randRange(0, 10)]; }
      while (TaskUtils.matchesSolution(newPoint, this.state.point));

      this.setState({point: newPoint});
    },

    /** Check if correct. */
    handleAnswer: function(x, y) {
      var isCorrect = TaskUtils.matchesSolution([x, y], this.state.point);
      if (isCorrect)
        this.handleCorrectAnswer();

      return isCorrect;
    },

    handleCorrectAnswer: function() {
      var step = this.state.step;
      if (step === parseInt(this.props.steps))
        this.props.onTaskDone();
      else
        this.reset();

      this.setState({step: step + 1});
    },

    componentDidMount: function() {
      this.reset();
    },

    getInitialState: function() {
      return {
        step: 1,
        point: null
      };
    },

    render: function() {
      /* jshint ignore:start */
      var TaskPanel = TaskComponents.TaskPanel;
      var TaskHeader = TaskComponents.TaskHeader;
      var TaskProgressBar = TaskComponents.TaskProgressBar;
      var TaskDoneDisplay = TaskComponents.TaskDoneDisplay;
      var CoordsAnswerForm = Forms.CoordsAnswerForm;

      var point = this.state.point;
      var taskIsDone = this.state.step > parseInt(this.props.steps);
      var coords, sidebar;

      if (point && !taskIsDone) {
        var bounds = {maxY: 10, maxX: 10, minY: -2, minX: -2};
        var shapes = [{points: [point], r:0.2, strokeWidth: 3, stroke: "#FF5B24", fill:"#FD0000"}];

        coords = Coords( {shapes:shapes, bounds:bounds, aspect:1} );

        sidebar = (
          React.DOM.div(null, 
            TaskPanel( {header:"Ohjeet"}, 
              React.DOM.span(null, "Mitkä ovat pisteen x-ja y-koordinaatit?")
            ),
            TaskPanel( {header:"Vastaus", className:"panel-success panel-extra-padding"}, 
              CoordsAnswerForm( {ref:"form", onAnswer:this.handleAnswer} )
            )
          )
        );
      }
      else if (taskIsDone) {
        coords = TaskDoneDisplay( {score:10});
      }

      return (
        React.DOM.div(null, 
          TaskHeader( {name:"Koordinaatiston lukeminen"}, 
            TaskProgressBar( {now:this.state.step, max:this.props.steps})
          ),
          React.DOM.div( {className:"row"}, 
            React.DOM.div( {className:"col-sm-6 question"}, 
              coords
            ),

            React.DOM.div( {className:"col-sm-5 col-sm-offset-1"}, 
              sidebar
            )
          )
        )
      );
      /* jshint ignore:end */
    }
  });

  return simpleCoordsTask;
})();

module.exports = SimpleCoordsTask;

},{"../components/coords-components":2,"../components/forms":4,"../components/task-components":7,"../utils/task-utils":12}],12:[function(require,module,exports){
"use strict";
/* global module */

/**
 * Utility functions (mainly maths related) for tasks.
 * @namespace
 */
var TaskUtils = {

    /**
     * Generate a random integer in range [min, max[.
     * @param  {number}  min       Inclusive lower bound.
     * @param  {number}  max       Exclusive upper bound.
     * @param  {number=} count     If set, return a list of random values.
     * @return {(number|number[])} A single or multiple random ints.
     */
    randRange: function(min, max, count) {
        if (count && count > 0) {
            var rands = [];
            for (var i = 0; i < count; i++) {
                rands.push(this.randRange(min, max));
            }
            return rands;
        }
        return Math.floor(Math.random() * (max - min)) + min;
    },


    /**
     * Generate a random integer in range [0, max[.
     * @param  {number}  max   Exclusive upper bound.
     * @param  {number=} count If set, return a list of random values.
     * @return {number|number[]} A single or multiple random ints.
     */
    rand: function(max, count) {
        if (count && count > 0) {
            var rands = [];
            for (var i = 0; i < count; i++) {
                rands.push(this.rand(max));
            }
            return rands;
        }
        return Math.floor(Math.random() * max);
    },


    /**
     * Reorders given array randomly, doesn't modify original array.
     * @param  {Array} arr
     * @return {Array}
     */
    shuffle: function(arr) {
        var clone = arr.slice();
        var shuffled = [];

        for (var i = clone.length; i > 0; i--) {
            var index = this.rand(i);
            shuffled.push(clone.splice(index, 1)[0]);
        }

        return shuffled;
    },


    /**
     * Generate a range of integers.
     * @param {number}  min  Inclusive lower bound.
     * @param {number}  max  Exclusive upper bound.
     * @param {number} [step=1] Increment value.
     * @return {number[]}    The specified range of numbers in an array.
     */
    range: function(min, max, step) {
        step = step || 1;
        var res = [];
        if (step > 0) {
            for (var i = min; i < max; i += step) {
                res.push(i);
            }
        } else {
            for (var j = min; j > max; j += step) {
                res.push(j);
            }
        }

        return res;
    },


    /**
     * Check whether arrays equal.
     * @param {Array} arr1
     * @param {Array} arr2
     * @return {boolean}
     */
    arraysEqual: function(arr1, arr2) {
        if (arr1.length !== arr2.length)
            return false;

        return arr1.every(function(d, i) {
            return d === arr2[i];
        });
    },


    /**
     * Translate an array of points by given x and y values.
     * @param  {Array.<module:CoordsComponents.Point>} points
     * @param  {number}     x
     * @param  {number}     y
     * @return {Array.<module:CoordsComponents.Point>}
     */
    translate: function(points, x, y) {
        return points.map(function(point) {
            return [point[0] + x, point[1] + y];
        });
    },

    /**
     * Calculate the area of a triangle.
     * @param  {Array.<module:CoordsComponents.Point>} points
     * @return {number}
     */
    triangleArea: function(points) {
        if (points.length !== 3)
            throw "invalid number of points";

        var x1 = points[1][0] - points[0][0];
        var y1 = points[1][1] - points[0][1];
        var x2 = points[2][0] - points[0][0];
        var y2 = points[2][1] - points[0][1];
        return 0.5 * Math.abs(x1*y2 - x2*y1);
    },

    /**
     * Compare given answer to the correct solution. Supports various data types.
     * @param answer   The answer value.
     * @param solution The correct solution.
     * @param {number} [epsilon=0.001]  Max error value for float comparison.
     * @return {boolean} True if correct, otherwise false.
     */
    matchesSolution: function(answer, solution, epsilon) {
        if (typeof answer === "string") {
            answer = answer.trim();
        }

        if (typeof solution === "number") {
            answer = parseFloat(answer);
            if (isNaN(answer)) return false;
            epsilon = epsilon === undefined ? 0.001 : epsilon;

            return Math.abs(answer - solution) <= epsilon;
        }

        if (solution instanceof RegExp) {
            return solution.test(answer);
        }

        var that = this;

        if (solution instanceof Array) {
            if (!answer instanceof Array || answer.length !== solution.length)
                return false;

            return answer.every(function(d, i) {
                return that.matchesSolution(d, solution[i], epsilon);
            });
        }

        if (solution instanceof Object) {
            if (!answer instanceof Object)
                return false;

            var ansKeys = Object.keys(answer);
            if (ansKeys.length !== Object.keys(solution).length)
                return false;

            return ansKeys.every(function(d) {
                return that.matchesSolution(answer[d], solution[d]);
            });
        }

        return answer === solution;
    }
};

module.exports = TaskUtils;

},{}],13:[function(require,module,exports){
/** @jsx React.DOM */
"use strict";

/* jshint ignore:start */
$(function() {
    var Application = require("./js/application.js");

    React.renderComponent(
        Application(null ),
        document.getElementById("application")
    );
});
/* jshint ignore:end */
},{"./js/application.js":1}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEFsZWtzaVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXHdhdGNoaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9jb29yZHMtY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvZm9ybS1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9mb3Jtcy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvbWF0aC1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9taXhpbnMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL3Rhc2tzL2FkZGl0aW9uLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9iYXNpYy1zaGFwZXMtdGFzay5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL3Rhc2tzL2RyYXctc2hhcGVzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy91dGlscy90YXNrLXV0aWxzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuLyogZ2xvYmFscyBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblxyXG5cclxudmFyIEFkZGl0aW9uVGFzayA9IHJlcXVpcmUoXCIuL3Rhc2tzL2FkZGl0aW9uLXRhc2tcIik7XHJcbnZhciBTaW1wbGVDb29yZHNUYXNrID0gcmVxdWlyZShcIi4vdGFza3Mvc2ltcGxlLWNvb3Jkcy10YXNrXCIpO1xyXG52YXIgQmFzaWNTaGFwZXNUYXNrID0gcmVxdWlyZShcIi4vdGFza3MvYmFzaWMtc2hhcGVzLXRhc2tcIik7XHJcbnZhciBEcmF3U2hhcGVzVGFzayA9IHJlcXVpcmUoXCIuL3Rhc2tzL2RyYXctc2hhcGVzLXRhc2tcIik7XHJcblxyXG4vKipcclxuICogQSBzbWFsbCBhcHBsaWNhdGlvbiB3aXRoIGEgZmV3IGV4YW1wbGUgdGFza3MuXHJcbiAqIEBtb2R1bGUgQXBwbGljYXRpb25cclxuICovXHJcbnZhciBBcHBsaWNhdGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FwcGxpY2F0aW9uJyxcclxuXHJcbiAgaGFuZGxlTGlzdENsaWNrOiBmdW5jdGlvbihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB2YXIgdGFza05hbWUgPSBlLnRhcmdldC50ZXh0O1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRUYXNrOiB0YXNrTmFtZX0pO1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZVRhc2tEb25lOiBmdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiVGFzayBkb25lIC0gaGVyZSdzIHdoZXJlIHRoZSB0YXNrIGNvbm5lY3RzIHRvIGFuIGV4dGVybmFsIGFwcC5cIik7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7c2VsZWN0ZWRUYXNrOiBcIllodGVlbmxhc2t1XCJ9O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgdGFza3MgPSB7XHJcbiAgICAgIFwiWWh0ZWVubGFza3VcIjogQWRkaXRpb25UYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lLCBzdGVwczo1fSksXHJcbiAgICAgIFwiS29vcmRpbmFhdGlzdG9uIGx1a2VtaW5lblwiOiBTaW1wbGVDb29yZHNUYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lLCBzdGVwczo1fSksXHJcbiAgICAgIFwiS2FwcGFsZWlkZW4gdHVubmlzdGFtaW5lblwiOiBCYXNpY1NoYXBlc1Rhc2soIHtvblRhc2tEb25lOnRoaXMuaGFuZGxlVGFza0RvbmUsIHRpbWU6MjB9KSxcclxuICAgICAgXCJLb2xtaW9pZGVuIHBpaXJ0w6RtaW5lblwiOiBEcmF3U2hhcGVzVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZSwgc3RlcHM6M30pXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB0YXNrTGlzdEVsZW1zID0gT2JqZWN0LmtleXModGFza3MpLm1hcChmdW5jdGlvbih0YXNrTmFtZSkge1xyXG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGFza05hbWUgPT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRUYXNrID8gXCJ0ZXh0LW11dGVkXCIgOiBcIlwiO1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5saShudWxsLCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOmNsYXNzTmFtZSwgaHJlZjpcIlwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlTGlzdENsaWNrfSwgdGFza05hbWUpXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB2YXIgdGFzayA9IHRhc2tzW3RoaXMuc3RhdGUuc2VsZWN0ZWRUYXNrXTtcclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgIFJlYWN0LkRPTS51bCgge2NsYXNzTmFtZTpcImxpc3QtaW5saW5lXCJ9LCBcclxuICAgICAgICAgIHRhc2tMaXN0RWxlbXNcclxuICAgICAgICApLFxyXG5cclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1jb250YWluZXJcIn0sIFxyXG4gICAgICAgICAgdGFza1xyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIGQzLCBNYXRoVXRpbHMsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29tcG9uZW50cyBmb3IgZHJhd2luZyBnZW9tZXRyaWMgc2hhcGVzIG9uIHRvIGEgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAqIEBtb2R1bGUgQ29vcmRzQ29tcG9uZW50c1xyXG4gKi9cclxudmFyIENvb3Jkc0NvbXBvbmVudHMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBjb29yZHNDb21wb25lbnRzID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGFycmF5IHdpdGggdHdvIGVsZW1lbnRzOiB0aGUgeCBhbmQgeSBjb29yZGluYXRlLlxyXG4gICAqIEB0eXBlZGVmIHtBcnJheX0gUG9pbnRcclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkNvb3Jkc0NvbXBvbmVudHNcclxuICAgKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQSBzaGFwZSB0aGF0IGlzIGRyYXduIG9uIHRoZSBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgKiBAdHlwZWRlZiBTaGFwZVxyXG4gICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWVcclxuICAgKiBAcHJvcGVydHkge251bWJlcn0ga2V5XHJcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gb25DbGljayAtIFNoYXBlIGNsaWNrIGV2ZW50IGhhbmRsZXIuXHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IHN0cm9rZSAtIEEgQ1NTIGNvbXBhdGlibGUgc3Ryb2tlIGNvbG9yLlxyXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBmaWxsIC0gQSBDU1MgY29tcGF0aWJsZSBmaWxsIGNvbG9yLlxyXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG1vZHVsZTpDb29yZHNDb21wb25lbnRzLlBvaW50Pn0gcG9pbnRzIC0gU2hhcGUgdmVydGljZXMuXHJcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IHIgLSBDaXJjbGUgcmFkaXVzIHRoYXQncyB1c2VkIHdoZW4gb25seSBvbmUgcG9pbnQgaXMgZGVmaW5lZC5cclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkNvb3Jkc0NvbXBvbmVudHNcclxuICAgKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQ29vcmRpbmF0ZSBzeXN0ZW0gY2xpY2sgZXZlbnQgaGFuZGxlci5cclxuICAgKiBAY2FsbGJhY2sgY29vcmRzT25DbGlja1xyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gQ2xpY2sgcG9zaXRpb24ncyB4IGNvb3JkaW5hdGUsIHJvdW5kZWQgdG8gbmVhcmVzdCBpbnRlZ2VyLlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gQ2xpY2sgcG9zaXRpb24ncyB5IGNvb3JkaW5hdGUsIHJvdW5kZWQgdG8gbmVhcmVzdCBpbnRlZ2VyLlxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6Q29vcmRzQ29tcG9uZW50c1xyXG4gICAqL1xyXG5cclxuICAvKipcclxuICAgKiBBIDJEIGNvb3JkaW5hdGUgc3lzdGVtLCBjb25zaXN0cyBvZiBhIEdyaWQgYW5kIFNoYXBlcy5cclxuICAgKiBAbmFtZSBDb29yZHNcclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkNvb3Jkc0NvbXBvbmVudHNcclxuICAgKlxyXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2RyYXdBeGVzPXRydWVdIC0gV2hldGhlciB0aGUgeCBhbmQgeSBheGVzIGFyZSBkcmF3bi5cclxuICAgKiBAcHJvcGVydHkge0FycmF5Ljxtb2R1bGU6Q29vcmRzQ29tcG9uZW50cy5TaGFwZT59IFtzaGFwZXM9W11dIC0gVGhlIGdlb21ldHJpYyBzaGFwZXMgdG8gZHJhdy5cclxuICAgKiBAcHJvcGVydHkge09iamVjdH0gW2JvdW5kcz17bWF4WToxMCwgbWF4WDoxMCwgbWluWTowLCBtaW5YOjB9XSAtIE1heGltdW0gY29vcmRpbmF0ZSB2YWx1ZXMuXHJcbiAgICogQHByb3BlcnR5IHtPYmplY3R9IFttYXJnaW49e3RvcDoyMCwgcmlnaHQ6MjAsIGJvdHRvbToyMCwgbGVmdDoyMH1dIC0gTWFyZ2luIGFyb3VuZCB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IFthc3BlY3Q9MV0gLSBDb29yZGluYXRlIHN5c3RlbSBhc3BlY3QgcmF0aW8uXHJcbiAgICogQHByb3BlcnR5IHttb2R1bGU6Q29vcmRzQ29tcG9uZW50cy5jb29yZHNPbkNsaWNrfSBbb25DbGlja10gLSBDbGljayBldmVudCBoYW5kbGVyLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiAvLyBEcmF3aW5nIGEgc2luZ2xlIGNpcmNsZTpcclxuICAgKiB2YXIgY2VudGVyID0gWzEsIDJdO1xyXG4gICAqIHZhciBib3VuZHMgPSB7bWluWDogMCwgbWluWTogMCwgbWF4WDogMTAsIG1heFk6IDEwfTtcclxuICAgKiB2YXIgc2hhcGVzID0gW3twb2ludHM6IFtjZW50ZXJdLCByOiAwLjUsIHN0cm9rZTogXCJyZWRcIn1dO1xyXG4gICAqIFJlYWN0LnJlbmRlckNvbXBvbmVudChcclxuICAgKiAgIDxDb29yZHMgc2hhcGVzPXtzaGFwZXN9IGJvdW5kcz17Ym91bmRzfS8+LFxyXG4gICAqICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0YXJnZXRcIilcclxuICAgKiApO1xyXG4gICAqXHJcbiAgICogLy8gRHJhd2luZyBhIHBvbHlnb246XHJcbiAgICogdmFyIHRyaWFuZ2xlID0gW3twb2ludHM6IFtbMCwwXSwgWzEsMV0sIFsyLDBdXX0sIGZpbGw6IFwiI0ZGRlwiXTtcclxuICAgKiB2YXIgc2hhcGVzID0gW3RyaWFuZ2xlXTtcclxuICAgKiBSZWFjdC5yZW5kZXJDb21wb25lbnQoXHJcbiAgICogICA8Q29vcmRzIHNoYXBlcz17c2hhcGVzfSAvPixcclxuICAgKiAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGFyZ2V0XCIpXHJcbiAgICogKTtcclxuICAgKi9cclxuICBjb29yZHNDb21wb25lbnRzLkNvb3JkcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nvb3JkcycsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgICAgc2hhcGVzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXksXHJcbiAgICAgIGJvdW5kczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCxcclxuICAgICAgbWFyZ2luOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgICBhc3BlY3Q6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIG9uQ2xpY2s6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZVJlc2l6ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBwYXJlbnQgPSAkKHRoaXMuZ2V0RE9NTm9kZSgpLnBhcmVudE5vZGUpO1xyXG5cclxuICAgICAgdmFyIG1hcmdpbiA9IHRoaXMucHJvcHMubWFyZ2luO1xyXG4gICAgICB2YXIgd2lkdGggPSBwYXJlbnQgPyBwYXJlbnQud2lkdGgoKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0IDogMDtcclxuICAgICAgdmFyIGhlaWdodCA9IE1hdGgucm91bmQod2lkdGggKiB0aGlzLnByb3BzLmFzcGVjdCkgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcclxuXHJcbiAgICAgIHZhciBib3VuZHMgPSB0aGlzLnByb3BzLmJvdW5kcztcclxuICAgICAgdmFyIHNwYWNpbmcgPSBNYXRoLnJvdW5kKE1hdGgubWluKFxyXG4gICAgICAgIHdpZHRoIC8gTWF0aC5hYnMoYm91bmRzLm1heFggLSBib3VuZHMubWluWCksXHJcbiAgICAgICAgaGVpZ2h0IC8gTWF0aC5hYnMoYm91bmRzLm1heFkgLSBib3VuZHMubWluWSlcclxuICAgICAgKSk7XHJcblxyXG4gICAgICB2YXIgeCA9IGQzLnNjYWxlLmxpbmVhcigpXHJcbiAgICAgICAgLmRvbWFpbihbYm91bmRzLm1pblgsIGJvdW5kcy5taW5YICsgMV0pXHJcbiAgICAgICAgLnJhbmdlKFswLCBzcGFjaW5nXSk7XHJcblxyXG4gICAgICB2YXIgeSA9IGQzLnNjYWxlLmxpbmVhcigpXHJcbiAgICAgICAgLmRvbWFpbihbYm91bmRzLm1pblksIGJvdW5kcy5taW5ZICsgMV0pXHJcbiAgICAgICAgLnJhbmdlKFtoZWlnaHQsIGhlaWdodCAtIHNwYWNpbmddKTtcclxuXHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgc3BhY2luZzogc3BhY2luZyxcclxuICAgICAgICB4OiB4LFxyXG4gICAgICAgIHk6IHlcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qIFRyYW5zbGF0ZSBhbmQgcm91bmQgc2NyZWVuIHBvc2l0aW9uIGludG8gY29vcmRpbmF0ZXMsIHRyaWdnZXIgZXZlbnQuICovXHJcbiAgICBoYW5kbGVTVkdDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKCEkLmlzRnVuY3Rpb24odGhpcy5wcm9wcy5vbkNsaWNrKSkgcmV0dXJuO1xyXG5cclxuICAgICAgdmFyIGVsZW0gPSAkKHRoaXMucmVmcy5zdmcuZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdmFyIGJvdW5kcyA9IHRoaXMucHJvcHMuYm91bmRzO1xyXG5cclxuICAgICAgdmFyIHN2Z1ggPSBldmVudC5wYWdlWCAtIGVsZW0ub2Zmc2V0KCkubGVmdCAtIHRoaXMucHJvcHMubWFyZ2luLmxlZnQ7XHJcbiAgICAgIHZhciBzdmdZID0gZXZlbnQucGFnZVkgLSBlbGVtLm9mZnNldCgpLnRvcCAtIHRoaXMucHJvcHMubWFyZ2luLnRvcDtcclxuICAgICAgdmFyIGNvb3Jkc1ggPSBNYXRoLm1heChib3VuZHMubWluWCwgTWF0aC5taW4oYm91bmRzLm1heFgsIE1hdGgucm91bmQodGhpcy5zdGF0ZS54LmludmVydChzdmdYKSkpKTtcclxuICAgICAgdmFyIGNvb3Jkc1kgPSBNYXRoLm1heChib3VuZHMubWluWSwgTWF0aC5taW4oYm91bmRzLm1heFksIE1hdGgucm91bmQodGhpcy5zdGF0ZS55LmludmVydChzdmdZKSkpKTtcclxuXHJcbiAgICAgIHRoaXMucHJvcHMub25DbGljayhjb29yZHNYLCBjb29yZHNZKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHt3aWR0aDogMH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZHJhd0F4ZXM6IHRydWUsXHJcbiAgICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgICBib3VuZHM6IHttYXhZOjEwLCBtYXhYOjEwLCBtaW5ZOjAsIG1pblg6MH0sXHJcbiAgICAgICAgYXNwZWN0OiAxLFxyXG4gICAgICAgIG1hcmdpbjoge3RvcDoyMCwgcmlnaHQ6MjAsIGJvdHRvbToyMCwgbGVmdDoyMH1cclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLmhhbmRsZVJlc2l6ZSk7XHJcbiAgICAgIHRoaXMuaGFuZGxlUmVzaXplKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdGhpcy5oYW5kbGVSZXNpemUpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBtYXJnaW4gPSB0aGlzLnByb3BzLm1hcmdpbjtcclxuICAgICAgdmFyIGJvdW5kcyA9IHRoaXMucHJvcHMuYm91bmRzO1xyXG4gICAgICB2YXIgd2lkdGggPSB0aGlzLnN0YXRlLndpZHRoO1xyXG4gICAgICB2YXIgaGVpZ2h0ID0gTWF0aC5yb3VuZCh3aWR0aCAqIHRoaXMucHJvcHMuYXNwZWN0KSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xyXG4gICAgICB2YXIgc3BhY2luZyA9IHRoaXMuc3RhdGUuc3BhY2luZztcclxuICAgICAgdmFyIHggPSB0aGlzLnN0YXRlLng7XHJcbiAgICAgIHZhciB5ID0gdGhpcy5zdGF0ZS55O1xyXG5cclxuICAgICAgdmFyIGZ1bGxXaWR0aCA9IHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQ7XHJcbiAgICAgIHZhciBmdWxsSGVpZ2h0ID0gaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b207XHJcbiAgICAgIHZhciB0cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCI7XHJcblxyXG4gICAgICB2YXIgc2hhcGVzLCBncmlkO1xyXG4gICAgICBpZiAodGhpcy5zdGF0ZS53aWR0aCkge1xyXG4gICAgICAgIHZhciBTaGFwZXMgPSBjb29yZHNDb21wb25lbnRzLlNoYXBlcztcclxuICAgICAgICB2YXIgR3JpZCA9IGNvb3Jkc0NvbXBvbmVudHMuR3JpZDtcclxuXHJcbiAgICAgICAgc2hhcGVzID0gU2hhcGVzKCB7eDp4LCB5OnksIHNwYWNpbmc6c3BhY2luZywgZGF0YTp0aGlzLnByb3BzLnNoYXBlc30gKTtcclxuICAgICAgICBncmlkID0gR3JpZCgge2RyYXdBeGVzOnRoaXMucHJvcHMuZHJhd0F4ZXMsIHg6eCwgeTp5LCBib3VuZHM6Ym91bmRzfSApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb29yZHMtY29udGFpbmVyXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5zdmcoIHtyZWY6XCJzdmdcIiwgb25DbGljazp0aGlzLmhhbmRsZVNWR0NsaWNrLCB3aWR0aDpmdWxsV2lkdGgsIGhlaWdodDpmdWxsSGVpZ2h0fSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5nKCB7dHJhbnNmb3JtOnRyYW5zZm9ybX0sIFxyXG4gICAgICAgICAgICAgIGdyaWQsXHJcbiAgICAgICAgICAgICAgc2hhcGVzXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIERyYXcgYSBncmlkIG9uIGEgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAgICogVXNlZCBieSB0aGUge0BsaW5rIG1vZHVsZTpDb29yZHNDb21wb25lbnRzLkNvb3Jkc3xDb29yZHMgY29tcG9uZW50fS5cclxuICAgKiBAbmFtZSBHcmlkXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpDb29yZHNDb21wb25lbnRzXHJcbiAgICovXHJcbiAgY29vcmRzQ29tcG9uZW50cy5HcmlkID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnR3JpZCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHg6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIGJvdW5kczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxyXG4gICAgICBzcGFjaW5nOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxyXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKHByb3BzKSB7XHJcbiAgICAgIHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QodGhpcy5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB2YXIgYm91bmRzID0gcHJvcHMuYm91bmRzO1xyXG4gICAgICB2YXIgc3BhY2luZyA9IHByb3BzLnNwYWNpbmc7XHJcbiAgICAgIHZhciB4ID0gcHJvcHMueDtcclxuICAgICAgdmFyIHkgPSBwcm9wcy55O1xyXG5cclxuICAgICAgdmFyIHhSYW5nZSA9IGQzLnJhbmdlKE1hdGguY2VpbCgoYm91bmRzLm1pblgpIC8gc3BhY2luZyksIE1hdGgucm91bmQoYm91bmRzLm1heFgpICsgc3BhY2luZywgc3BhY2luZyk7XHJcbiAgICAgIHZhciB5UmFuZ2UgPSBkMy5yYW5nZShNYXRoLmNlaWwoKGJvdW5kcy5taW5ZKSAvIHNwYWNpbmcpLCBNYXRoLnJvdW5kKGJvdW5kcy5tYXhZKSArIHNwYWNpbmcsIHNwYWNpbmcpO1xyXG4gICAgICB2YXIgZGF0YSA9IHhSYW5nZS5jb25jYXQoeVJhbmdlKTtcclxuICAgICAgdmFyIGlzWCA9IGZ1bmN0aW9uKGluZGV4KSB7IHJldHVybiBpbmRleCA8IHhSYW5nZS5sZW5ndGg7IH07XHJcblxyXG4gICAgICB2YXIgYXhlcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCIuYXhpc1wiKVxyXG4gICAgICAgIC5kYXRhKGRhdGEpO1xyXG5cclxuICAgICAgYXhlcy5lbnRlcigpLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gXCJheGlzIFwiICsgKChwcm9wcy5kcmF3QXhlcyAmJiBkID09PSAwKSA/IFwidGhpY2tcIiA6IFwiXCIpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGF4ZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHgoZCkgOiB4KGJvdW5kcy5taW5YKTsgfSlcclxuICAgICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1pblkpIDogeShkKTsgfSlcclxuICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHgoZCkgOiB4KGJvdW5kcy5tYXhYKTsgfSlcclxuICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1heFkpIDogeShkKTsgfSk7XHJcblxyXG4gICAgICBheGVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgIGlmIChwcm9wcy5kcmF3QXhlcykge1xyXG4gICAgICAgIHZhciBsYWJlbHMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwiLmxhYmVsXCIpLmRhdGEoZGF0YSk7XHJcblxyXG4gICAgICAgIGxhYmVscy5lbnRlcigpLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJsYWJlbCBcIiArIChpc1goaSkgPyBcInhcIiA6IFwieVwiKTsgfSlcclxuICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkgeyBpZiAoIWQpIHJldHVybiBcIm5vbmVcIjsgfSlcclxuICAgICAgICAgIC50ZXh0KE9iamVjdClcclxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8gXCIxLjRlbVwiIDogXCIuM2VtXCI7IH0pXHJcbiAgICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IG51bGwgOiBcIi0uOGVtXCI7IH0pXHJcbiAgICAgICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCAxICsgXCJlbVwiKTtcclxuXHJcbiAgICAgICAgbGFiZWxzLnRyYW5zaXRpb24oKS5kdXJhdGlvbihwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoMCk7IH0pXHJcbiAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geSgwKSA6IHkoZCk7IH0pO1xyXG5cclxuICAgICAgICBsYWJlbHMuZXhpdCgpLnJlbW92ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZHJhd0F4ZXM6IHRydWUsXHJcbiAgICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uOiA1NTAsXHJcbiAgICAgICAgc3BhY2luZzogMVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMudXBkYXRlKHRoaXMucHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xyXG4gICAgICB0aGlzLnVwZGF0ZShuZXh0UHJvcHMpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICAgIFJlYWN0LkRPTS5nKCB7Y2xhc3NOYW1lOlwiYXhlc1wifSlcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogRHJhdyB2YXJpb3VzIGdlb21ldHJpYyBzaGFwZXMgb24gYSBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgKiBVc2VkIGJ5IHRoZSB7QGxpbmsgbW9kdWxlOkNvb3Jkc0NvbXBvbmVudHMuQ29vcmRzfENvb3JkcyBjb21wb25lbnR9LlxyXG4gICAqIEBuYW1lIFNoYXBlc1xyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6Q29vcmRzQ29tcG9uZW50c1xyXG4gICAqL1xyXG4gIGNvb3Jkc0NvbXBvbmVudHMuU2hhcGVzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU2hhcGVzJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgZGF0YTogUmVhY3QuUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXHJcbiAgICAgIHg6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIHNwYWNpbmc6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgICB9LFxyXG5cclxuICAgIC8qIFJlZHJhdyBzaGFwZXMuIEdldHMgY2FsbGVkIHdoZW5ldmVyIHNoYXBlcyBhcmUgdXBkYXRlZCBvciBzY3JlZW4gcmVzaXplcy4gKi9cclxuICAgIHVwZGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgICAgdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCh0aGlzLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHZhciB0cmFuc2l0aW9uRHVyYXRpb24gPSBwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24gfHwgNTUwO1xyXG5cclxuICAgICAgdmFyIHBvbHlnb25zID0gY29udGFpbmVyLnNlbGVjdEFsbChcInBvbHlnb24uc2hhcGVcIilcclxuICAgICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPiAyOyB9KSk7XHJcblxyXG4gICAgICB2YXIgYWRkZWRQb2x5Z29ucyA9IHBvbHlnb25zLmVudGVyKCkuYXBwZW5kKFwicG9seWdvblwiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzaGFwZVwiKVxyXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KTtcclxuXHJcbiAgICAgIHBvbHlnb25zLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJwb2ludHNcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgcmV0dXJuIGQucG9pbnRzLm1hcChmdW5jdGlvbihwcykge1xyXG4gICAgICAgICAgICByZXR1cm4gW3Byb3BzLngocHNbMF0pLCBwcm9wcy55KHBzWzFdKV07XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KTtcclxuXHJcbiAgICAgIHBvbHlnb25zLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcblxyXG4gICAgICB2YXIgY2lyY2xlcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJjaXJjbGUuc2hhcGVcIilcclxuICAgICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPT0gMTsgfSkpO1xyXG5cclxuICAgICAgdmFyIGFkZGVkQ2lyY2xlcyA9IGNpcmNsZXMuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIilcclxuICAgICAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5maWxsIHx8IFwidHJhbnNwYXJlbnRcIjsgfSk7XHJcblxyXG4gICAgICBjaXJjbGVzLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzBdWzBdKTsgfSlcclxuICAgICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMF1bMV0pOyB9KVxyXG4gICAgICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy5zcGFjaW5nICogKGQuciB8fCAwLjIpOyB9KVxyXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KTtcclxuXHJcbiAgICAgIGNpcmNsZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuXHJcbiAgICAgIHZhciBsaW5lcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJsaW5lLnNoYXBlXCIpXHJcbiAgICAgICAgLmRhdGEocHJvcHMuZGF0YS5maWx0ZXIoZnVuY3Rpb24ocykgeyByZXR1cm4gcy5wb2ludHMubGVuZ3RoID09IDI7IH0pKTtcclxuXHJcbiAgICAgIHZhciBhZGRlZExpbmVzID0gbGluZXMuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZmlsbCB8fCBcInRyYW5zcGFyZW50XCI7IH0pO1xyXG5cclxuICAgICAgbGluZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMF1bMF0pOyB9KVxyXG4gICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueShkLnBvaW50c1swXVsxXSk7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzFdWzBdKTsgfSlcclxuICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMV1bMV0pOyB9KVxyXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KTtcclxuXHJcbiAgICAgIGxpbmVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgIC8vIEF0dGFjaCBjbGljayBldmVudCBsaXN0ZW5lcnMuXHJcbiAgICAgIFthZGRlZFBvbHlnb25zLCBhZGRlZENpcmNsZXMsIGFkZGVkTGluZXNdLmZvckVhY2goZnVuY3Rpb24oYWRkZWQpIHtcclxuICAgICAgICBhZGRlZC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24oZC5vbkNsaWNrKSlcclxuICAgICAgICAgICAgZC5vbkNsaWNrKGQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIFNldCBjb21tb24gYXR0cmlidXRlcy5cclxuICAgICAgY29udGFpbmVyLnNlbGVjdEFsbChcIi5zaGFwZVwiKVxyXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc3Ryb2tlIHx8IFwic3RlZWxibHVlXCI7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gKGQuc3Ryb2tlV2lkdGggfHwgMikgKyBcInB4XCI7IH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMudXBkYXRlKHRoaXMucHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xyXG4gICAgICB0aGlzLnVwZGF0ZShuZXh0UHJvcHMpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgcmV0dXJuIFJlYWN0LkRPTS5nKCB7Y2xhc3NOYW1lOlwic2hhcGVzXCJ9KTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGNvb3Jkc0NvbXBvbmVudHM7XHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvb3Jkc0NvbXBvbmVudHM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogVmFyaW91cyBjb21wb25lbnRzIGZvciBjcmVhdGluZyB7QGxpbmsgbW9kdWxlOkZvcm1zfGFuc3dlciBmb3Jtc30uXHJcbiAqIEBtb2R1bGUgRm9ybUNvbXBvbmVudHNcclxuICovXHJcbnZhciBGb3JtQ29tcG9uZW50cyA9IChmdW5jdGlvbigpe1xyXG5cclxuICB2YXIgTWl4aW5zID0gcmVxdWlyZShcIi4vbWl4aW5zXCIpO1xyXG5cclxuICB2YXIgZm9ybUNvbXBvbmVudHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSBibGFuayBmb3JtIHdpdGggYSBzdWJtaXQgYnV0dG9uLCB1c2VkIGFzIGEgY29udGFpbmVyIGZvciB2YXJpb3VzXHJcbiAgICogaW5wdXQgY29tcG9uZW50cy4gVGhlIGNoaWxkIGNvbXBvbmVudHMgY2FuIHRvZ2dsZSB0aGUgZm9ybSdzIHZhbGlkaXR5IHN0YXR1cyxcclxuICAgKiBwcmV2ZW50aW5nIHN1Ym1pdCB3aGVuIGlucHV0cyBhcmUgaW52YWxpZC5cclxuICAgKiBAbmFtZSBBbnN3ZXJGb3JtXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpGb3JtQ29tcG9uZW50c1xyXG4gICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IG9uQW5zd2VyIC0gRm9ybSBzdWJtaXQgZXZlbnQgaGFuZGxlci5cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2J0bkNvcnJlY3RBbmltQ2xhc3M9J2FuaW1hdGVkIGJvdW5jZSddIC0gVGhlIENTUyBhbmltYXRpb24gY2xhc3MgYXBwbGllZCB0byBzdWJtaXRcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uIHVwb24gYSBjb3JyZWN0IGFuc3dlci5cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2J0bkluY29ycmVjdEFuaW1DbGFzcz0nYW5pbWF0ZWQgc2hha2UnXSAtIFRoZSBDU1MgYW5pbWF0aW9uIGNsYXNzIGFwcGxpZWQgdG8gc3VibWl0XHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24gdXBvbiBhbiBpbmNvcnJlY3QgYW5zd2VyLlxyXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbZm9ybUNsYXNzPSdmb3JtLWhvcml6b250YWwnXSAtIEZvcm0gZWxlbWVudCdzIENTUyBjbGFzcy5cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2J0bkNsYXNzPSdidG4gYnRuLXN1Y2Nlc3MgYnRuLWxnIGJ0bi1ibG9jayddIC0gU3VibWl0IGJ1dHRvbidzIENTUyBjbGFzcy5cclxuICAgKi9cclxuICBmb3JtQ29tcG9uZW50cy5BbnN3ZXJGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQW5zd2VyRm9ybScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uQW5zd2VyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgICBidG5Db3JyZWN0QW5pbUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5JbmNvcnJlY3RBbmltQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGZvcm1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgYnRuQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcclxuICAgIH0sXHJcblxyXG4gICAgbWl4aW5zOiBbTWl4aW5zLlRyaWdnZXJBbmltYXRpb25NaXhpbl0sXHJcblxyXG4gICAgLy8gU3VibWl0IGFuc3dlciBpZiBmb3JtIGlzIHZhbGlkLlxyXG4gICAgaGFuZGxlU3VibWl0OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGlmIChlKVxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLnN0YXRlLmlzVmFsaWQpIHtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQW5zd2VyKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd0Vycm9yczogdHJ1ZX0pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYnRuID0gJCh0aGlzLnJlZnMuYnRuLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHRoaXMuYW5pbWF0ZShidG4sIHRoaXMucHJvcHMuYnRuQ29ycmVjdEFuaW1DbGFzcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUluY29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBidG4gPSAkKHRoaXMucmVmcy5idG4uZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdGhpcy5hbmltYXRlKGJ0biwgdGhpcy5wcm9wcy5idG5JbmNvcnJlY3RBbmltQ2xhc3MpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWxpZGl0eTogZnVuY3Rpb24oaXNWYWxpZCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtpc1ZhbGlkOiBpc1ZhbGlkLCBpc0RpcnR5OiB0cnVlfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENsZWFyIHZhbHVlcyBhbmQgdmFsaWRhdGlvbiBzdGF0ZXMgZm9yIGFsbCBjaGlsZCBlbGVtZW50cy5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICBzaG93RXJyb3JzOiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBmb3JtQ2xhc3M6IFwiZm9ybS1ob3Jpem9udGFsXCIsXHJcbiAgICAgICAgYnRuQ2xhc3M6IFwiYnRuIGJ0bi1zdWNjZXNzIGJ0bi1sZyBidG4tYmxvY2tcIixcclxuICAgICAgICBidG5Db3JyZWN0QW5pbUNsYXNzOiBcImFuaW1hdGVkIGJvdW5jZVwiLFxyXG4gICAgICAgIGJ0bkluY29ycmVjdEFuaW1DbGFzczogXCJhbmltYXRlZCBzaGFrZVwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICBzaG93RXJyb3JzOiBmYWxzZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBjaGlsZHJlbiA9IFtdLmNvbmNhdCh0aGlzLnByb3BzLmNoaWxkcmVuKS5tYXAoZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICBjaGlsZC5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlID0gdGhpcy5zZXRWYWxpZGl0eTtcclxuICAgICAgICBjaGlsZC5wcm9wcy5vblN1Ym1pdCA9IHRoaXMuaGFuZGxlU3VibWl0O1xyXG4gICAgICAgIGNoaWxkLnByb3BzLnNob3dFcnJvciA9IHRoaXMuc3RhdGUuc2hvd0Vycm9ycztcclxuICAgICAgICByZXR1cm4gY2hpbGQ7XHJcbiAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICB2YXIgYnRuQ2xhc3MgPSB0aGlzLnByb3BzLmJ0bkNsYXNzICsgKHRoaXMuc3RhdGUuaXNWYWxpZCA/IFwiXCIgOiBcIiBkaXNhYmxlZFwiKTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmZvcm0oIHtyb2xlOlwiZm9ybVwiLCBjbGFzc05hbWU6dGhpcy5wcm9wcy5mb3JtQ2xhc3MsIG9uU3VibWl0OnRoaXMuaGFuZGxlU3VibWl0LCBub1ZhbGlkYXRlOnRydWV9LCBcclxuICAgICAgICAgIGNoaWxkcmVuLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtyZWY6XCJidG5cIiwgdHlwZTpcInN1Ym1pdFwiLCB2YWx1ZTpcIlZhc3RhYVwiLCBjbGFzc05hbWU6YnRuQ2xhc3N9IClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICAvKipcclxuICAgKiBBbiBpbnB1dCB3aXRoIHJlZ3VsYXIgZXhwcmVzc2lvbiB2YWxpZGF0aW9uIGFuZCB2aXNpYmxlIHZhbGlkYXRpb24gc3RhdGVzLlxyXG4gICAqIEBuYW1lIFJlSW5wdXRcclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkZvcm1Db21wb25lbnRzXHJcbiAgICogQHByb3BlcnR5IHtSZWdFeHB9IFtyZT0vXlxccyotP1xcZCtcXHMqJC9dIC0gVGhlIHZhbGlkYXRpbmcgcmVndWxhciBleHByZXNzaW9uLlxyXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW3Nob3dFcnJvcj1mYWxzZV0gLSBJcyBhbiBlcnJvciBsYWJlbCBpcyBkaXNwbGF5ZWQuXHJcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBbcmVxdWlyZWQ9dHJ1ZV0gLSBJcyB0aGUgZmllbGQgcmVxdWlyZWQuXHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtwbGFjZWhvbGRlcl0gLSBJbnB1dCBmaWVsZCBwbGFjZWhvbGRlciB0ZXh0LlxyXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdHlwZT10ZXh0XSAtIElucHV0IGZpZWxkIHR5cGUuXHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtjbGFzc05hbWVdIC0gSW5wdXQgZmllbGQgY2xhc3MuXHJcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbihib29sZWFuKX0gW29uVmFsaWRpdHlDaGFuZ2VdIC0gSW5wdXQgdmFsaWRpdHkgY2hhbmdlIGV2ZW50IGhhbmRsZXIuXHJcbiAgICovXHJcbiAgZm9ybUNvbXBvbmVudHMuUmVJbnB1dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JlSW5wdXQnLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICByZTogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCxcclxuICAgICAgc2hvd0Vycm9yOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgICAgcmVxdWlyZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgICBwbGFjZWhvbGRlcjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgdHlwZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgY2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBvblZhbGlkaXR5Q2hhbmdlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiBSZWFkIHZhbHVlLCB2YWxpZGF0ZSwgbm90aWZ5IHBhcmVudCBlbGVtZW50IGlmIGFuIGV2ZW50IGlzIGF0dGFjaGVkLiAqL1xyXG4gICAgaGFuZGxlQ2hhbmdlOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy52YWxpZGF0b3IudGVzdChlLnRhcmdldC52YWx1ZSk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiBlLnRhcmdldC52YWx1ZSwgaXNWYWxpZDogaXNWYWxpZCwgaXNEaXJ0eTogdHJ1ZX0pO1xyXG5cclxuICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZShpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiB2YWx1ZX0pO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUudmFsdWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5pbnB1dC5nZXRET01Ob2RlKCkuc2VsZWN0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qIENsZWFyIHZhbHVlIGFuZCByZXNldCB2YWxpZGF0aW9uIHN0YXRlcy4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdmFsdWU6IFwiXCIsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsaWRhdG9yOiBmdW5jdGlvbihyZSkge1xyXG4gICAgICB0aGlzLnZhbGlkYXRvciA9IG5ldyBSZWdFeHAocmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsaWRhdG9yKHRoaXMucHJvcHMucmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXdQcm9wcykge1xyXG4gICAgICB0aGlzLnNldFZhbGlkYXRvcihuZXdQcm9wcy5yZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdmFsdWU6IFwiXCIsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICB0eXBlOiBcInRleHRcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlOiAvXlxccyotP1xcZCtcXHMqJC8sXHJcbiAgICAgICAgc2hvd0Vycm9yOiBmYWxzZSxcclxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICBjbGFzc05hbWU6IFwiXCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgdmFsaWRhdGlvblN0YXRlID0gUmVhY3QuYWRkb25zLmNsYXNzU2V0KHtcclxuICAgICAgICBcImhhcy1zdWNjZXNzXCI6IHRoaXMuc3RhdGUuaXNWYWxpZCAmJiB0aGlzLnN0YXRlLmlzRGlydHksXHJcbiAgICAgICAgXCJoYXMtd2FybmluZ1wiOiAhdGhpcy5zdGF0ZS5pc0RpcnR5ICYmIHRoaXMucHJvcHMuc2hvd0Vycm9yLFxyXG4gICAgICAgIFwiaGFzLWVycm9yXCI6ICF0aGlzLnN0YXRlLmlzVmFsaWRcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgZXJyb3I7XHJcbiAgICAgIGlmICh0aGlzLnByb3BzLnNob3dFcnJvcikge1xyXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5pc1ZhbGlkKSB7XHJcbiAgICAgICAgICBlcnJvciA9IFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbnRyb2wtbGFiZWxcIn0sIFwiVmlyaGVlbGxpbmVuIHN5w7Z0ZVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5wcm9wcy5yZXF1aXJlZCAmJiB0aGlzLnZhbHVlKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBlcnJvciA9IFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbnRyb2wtbGFiZWxcIn0sIFwiVMOkeXTDpCB0w6Rtw6Qga2VudHTDpFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwIFwiICsgdmFsaWRhdGlvblN0YXRlfSwgXHJcbiAgICAgICAgICBlcnJvcixcclxuICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcImlucHV0XCIsIG9uQ2hhbmdlOnRoaXMuaGFuZGxlQ2hhbmdlLCB2YWx1ZTp0aGlzLnN0YXRlLnZhbHVlLCBwbGFjZWhvbGRlcjp0aGlzLnByb3BzLnBsYWNlaG9sZGVyLFxyXG4gICAgICAgICAgdHlwZTp0aGlzLnByb3BzLnR5cGUsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBcIiArIHRoaXMucHJvcHMuY2xhc3NOYW1lfSApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBIG51bWJlciBpbnB1dCB3aXRoIGJ1dHRvbnMgb24gZWl0aGVyIHNpZGUgZm9yIGluY3JlbWVudGluZyBhbmQgZGVjcmVtZW50aW5nLlxyXG4gICAqIFVzZXMge0BsaW5rIG1vZHVsZTpGb3JtQ29tcG9uZW50cy5SZUlucHV0fFJlSW5wdXR9IGZvciB2YWxpZGF0aW9uLlxyXG4gICAqIEBuYW1lIE51bUlucHV0XHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpGb3JtQ29tcG9uZW50c1xyXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc3RlcD0xXSAtIEhvdyBtdWNoIHRoZSB2YWx1ZSBjaGFuZ2VzIG9uIGEgc2luZ2xlIGluY3JlbWVudC9kZWNyZW1lbnQuXHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtwbGFjZWhvbGRlcl0gLSBJbnB1dCBwbGFjZWhvbGRlciB0ZXh0LlxyXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnRuQ2xhc3M9J2J0biBidG4tbGcgYnRuLWluZm8nXSAtIEluY3JlbWVudC9kZWNyZW1lbnQgYnV0dG9uIGNsYXNzLlxyXG4gICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oYm9vbGVhbil9IFtvblZhbGlkaXR5Q2hhbmdlXSAtIElucHV0IHZhbGlkaXR5IGNoYW5nZSBldmVudCBoYW5kbGVyLlxyXG4gICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IFtvblN1Ym1pdF0gLSBJbnB1dCBzdWJtaXQgZXZlbnQgaGFuZGxlciwgdHJpZ2dlcmVkIHdoZW4gRW50ZXIgaXMgY2xpY2tlZC5cclxuICAgKi9cclxuICBmb3JtQ29tcG9uZW50cy5OdW1JbnB1dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ051bUlucHV0JyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgc3RlcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgICAgcGxhY2Vob2xkZXI6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGJ0bkNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBvblZhbGlkaXR5Q2hhbmdlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcclxuICAgICAgb25TdWJtaXQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbHVlQW5kVmFsaWRpdHk6IGZ1bmN0aW9uKHZhbHVlLCBpc1ZhbGlkKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHZhbHVlOiB2YWx1ZSwgaXNWYWxpZDogaXNWYWxpZFxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZShpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkoXCJcIiwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZURlY3JlbWVudDogZnVuY3Rpb24oZSkge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh0aGlzLnZhbHVlKCkgLSB0aGlzLnByb3BzLnN0ZXAsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVJbmNyZW1lbnQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkodGhpcy52YWx1ZSgpICsgdGhpcy5wcm9wcy5zdGVwLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyogUmVzZXQgc3RhdGUgdG8gaW5wdXQgdmFsdWUgaWYgaW5wdXQgdmFsdWUgaXMgYSBudW1iZXIuICovXHJcbiAgICBoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyIHZhbCA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICB2YXIgaXNWYWxpZCA9ICFpc05hTihwYXJzZUZsb2F0KHZhbCkpO1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkodmFsLCBpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyogVHJ5IHRvIHN1Ym1pdCBwYXJlbnQgZm9ybSB3aGVuIEVudGVyIGlzIGNsaWNrZWQuICovXHJcbiAgICBoYW5kbGVLZXlQcmVzczogZnVuY3Rpb24oZSkge1xyXG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZiAodGhpcy5wcm9wcy5vblN1Ym1pdClcclxuICAgICAgICAgIHRoaXMucHJvcHMub25TdWJtaXQoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHRoaXMuc3RhdGUudmFsdWUpIHx8IDA7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdmFsdWU6IG51bGwsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDEsXHJcbiAgICAgICAgYnRuQ2xhc3M6IFwiYnRuIGJ0bi1sZyBidG4taW5mb1wiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIFJlSW5wdXQgPSBmb3JtQ29tcG9uZW50cy5SZUlucHV0O1xyXG4gICAgICB2YXIgYnRuQ2xhc3MgPSB0aGlzLnByb3BzLmJ0bkNsYXNzO1xyXG4gICAgICB2YXIgdmFsaWRhdGlvblN0YXRlID0gdGhpcy5zdGF0ZS5pc1ZhbGlkID8gXCJoYXMtc3VjY2Vzc1wiIDogXCJoYXMtZXJyb3JcIjtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXAgXCIgKyB2YWxpZGF0aW9uU3RhdGV9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTMgY29sLXhzLTNcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0YWJJbmRleDpcIi0xXCIsIGNsYXNzTmFtZTpidG5DbGFzcyArIFwiIHB1bGwtcmlnaHRcIiwgb25DbGljazp0aGlzLmhhbmRsZURlY3JlbWVudH0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tbGVmdFwifSlcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBjb2wteHMtNlwifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7dHlwZTpcIm51bWJlclwiLCB2YWx1ZTp0aGlzLnN0YXRlLnZhbHVlLCBvbkNoYW5nZTp0aGlzLmhhbmRsZUNoYW5nZSwgb25LZXlQcmVzczp0aGlzLmhhbmRsZUtleVByZXNzLFxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1sZyB0ZXh0LWNlbnRlclwiLCBwbGFjZWhvbGRlcjp0aGlzLnByb3BzLnBsYWNlaG9sZGVyfSlcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS0zIGNvbC14cy0zXCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dGFiSW5kZXg6XCItMVwiLCBjbGFzc05hbWU6YnRuQ2xhc3MgKyBcIiBwdWxsLWxlZnRcIiwgb25DbGljazp0aGlzLmhhbmRsZUluY3JlbWVudH0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHRcIn0pXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gZm9ybUNvbXBvbmVudHM7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtQ29tcG9uZW50cztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDb21wbGV0ZSBhbnN3ZXIgZm9ybXMgZm9yIHRhc2tzLiBGb3JtcyBjb25zaXN0IG9mIHtAbGluayBtb2R1bGU6Rm9ybUNvbXBvbmVudHN8Zm9ybSBjb21wb25lbnRzfS5cclxuICogQG1vZHVsZSBGb3Jtc1xyXG4gKi9cclxudmFyIEZvcm1zID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgRm9ybUNvbXBvbmVudHMgPSByZXF1aXJlKFwiLi9mb3JtLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIEFuc3dlckZvcm0gPSBGb3JtQ29tcG9uZW50cy5BbnN3ZXJGb3JtO1xyXG4gIHZhciBOdW1JbnB1dCA9IEZvcm1Db21wb25lbnRzLk51bUlucHV0O1xyXG5cclxuICB2YXIgZm9ybXMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogRm9ybSB3aXRoIGEgc2luZ2xlIHtAbGluayBtb2R1bGU6Rm9ybUNvbXBvbmVudHMuTnVtSW5wdXR8TnVtSW5wdXR9LlxyXG4gICAqIEBuYW1lIFNpbmdsZU51bWJlckZvcm1cclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkZvcm1zXHJcbiAgICogQHByb3BlcnR5IHttb2R1bGU6Rm9ybXMuc2luZ2xlTnVtYmVyRm9ybU9uQW5zd2VyfSBvbkFuc3dlciAtIEZvcm0gYW5zd2VyIGV2ZW50IGhhbmRsZXIuXHJcbiAgICovXHJcbiAgZm9ybXMuU2luZ2xlTnVtYmVyRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NpbmdsZU51bWJlckZvcm0nLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICoge0BsaW5rIG1vZHVsZTpGb3Jtcy5TaW5nbGVOdW1iZXJGb3JtfFNpbmdsZU51bWJlckZvcm19J3MgYW5zd2VyIGV2ZW50IGhhbmRsZXIuXHJcbiAgICAgKiBAY2FsbGJhY2sgc2luZ2xlTnVtYmVyRm9ybU9uQW5zd2VyXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBUaGUgYW5zd2VyIHZhbHVlLlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdhcyB0aGUgYW5zd2VyIGNvcnJlY3QuXHJcbiAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOkZvcm1zXHJcbiAgICAgKi9cclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGlzQ29ycmVjdCA9IHRoaXMucHJvcHMub25BbnN3ZXIodGhpcy5yZWZzLmFuc3dlci52YWx1ZSgpKTtcclxuICAgICAgaWYgKGlzQ29ycmVjdCkge1xyXG4gICAgICAgIHRoaXMucmVmcy5mb3JtLmhhbmRsZUNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlSW5jb3JyZWN0QW5zd2VyKCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlZnMuZm9ybS5yZXNldCgpO1xyXG4gICAgICB0aGlzLnJlZnMuYW5zd2VyLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICAgIEFuc3dlckZvcm0oIHtyZWY6XCJmb3JtXCIsIGNsYXNzTmFtZTpcImZvcm0taG9yaXpvbnRhbFwiLCBvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0sIFxyXG4gICAgICAgICAgTnVtSW5wdXQoIHtyZWY6XCJhbnN3ZXJcIiwgcGxhY2Vob2xkZXI6XCJWYXN0YWEgdMOkaMOkblwifSlcclxuICAgICAgICApXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgICAgKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogRm9ybSB3aXRoIHR3byB7QGxpbmsgbW9kdWxlOkZvcm1Db21wb25lbnRzLk51bUlucHV0fE51bUlucHV0c30gZm9yIHggYW5kIHkgY29vcmRpbmF0ZXMuXHJcbiAgICogQG5hbWUgQ29vcmRzQW5zd2VyRm9ybVxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6Rm9ybXNcclxuICAgKiBAcHJvcGVydHkge21vZHVsZTpGb3Jtcy5jb29yZHNBbnN3ZXJGb3JtT25BbnN3ZXJ9IG9uQW5zd2VyIC0gQW5zd2VyIGV2ZW50IGhhbmRsZXIuXHJcbiAgICovXHJcbiAgZm9ybXMuQ29vcmRzQW5zd2VyRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nvb3Jkc0Fuc3dlckZvcm0nLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICoge0BsaW5rIG1vZHVsZTpGb3Jtcy5Db29yZHNBbnN3ZXJGb3JtfENvb3Jkc0Fuc3dlckZvcm19J3MgYW5zd2VyIGV2ZW50IGhhbmRsZXIuXHJcbiAgICAgKiBAY2FsbGJhY2sgY29vcmRzQW5zd2VyRm9ybU9uQW5zd2VyXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHlcclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXYXMgdGhlIGFuc3dlciBjb3JyZWN0LlxyXG4gICAgICogQG1lbWJlcm9mIG1vZHVsZTpGb3Jtc1xyXG4gICAgICovXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uQW5zd2VyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSB0aGlzLnByb3BzLm9uQW5zd2VyKHRoaXMucmVmcy54LnZhbHVlKCksIHRoaXMucmVmcy55LnZhbHVlKCkpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVJbmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5mb3JtLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBjbGFzc05hbWU6XCJmb3JtLWhvcml6b250YWxcIiwgb25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9LCBcclxuICAgICAgICAgIE51bUlucHV0KCB7cmVmOlwieFwiLCBwbGFjZWhvbGRlcjpcInhcIn0pLFxyXG4gICAgICAgICAgTnVtSW5wdXQoIHtyZWY6XCJ5XCIsIHBsYWNlaG9sZGVyOlwieVwifSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBmb3JtcztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1zO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBtb2R1bGUsIE1hdGhKYXggKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbXBvbmVudHMgZm9yIG1hdGhzIHRhc2tzLlxyXG4gKiBAbW9kdWxlIE1hdGhDb21wb25lbnRzXHJcbiAqL1xyXG52YXIgTWF0aENvbXBvbmVudHMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBtYXRoQ29tcG9uZW50cyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBSZW5kZXIgTGFUZXggbWF0aHMgbm90YXRpb24gaW50byB3ZWIgZm9udHMgdXNpbmcgTWF0aEpheC5cclxuICAgKiBAbmFtZSBNYXRoSmF4XHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpNYXRoQ29tcG9uZW50c1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiAvLyBSZW5kZXIgYSBzaW1wbGUgZm9ybXVsYTpcclxuICAgKlxyXG4gICAqIHZhciBjb250ZW50cyA9IFwiYV8xICsgYl8yID0gY18zXCI7XHJcbiAgICogdmFyIGZvcm11bGEgPSAoXHJcbiAgICogICA8TWF0aEpheD5cclxuICAgKiAgICAge2NvbnRlbnRzfVxyXG4gICAqICAgPC9NYXRoSmF4PlxyXG4gICAqICk7XHJcbiAgICpcclxuICAgKiBSZWFjdC5yZW5kZXJDb21wb25lbnQoXHJcbiAgICogICBmb3JtdWxhLFxyXG4gICAqICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0YXJnZXRcIilcclxuICAgKiApO1xyXG4gICAqL1xyXG4gIG1hdGhDb21wb25lbnRzLk1hdGhKYXggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNYXRoSmF4JyxcclxuICAgIHJlcHJvY2VzczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBlbGVtID0gdGhpcy5yZWZzLnNjcmlwdC5nZXRET01Ob2RlKCk7XHJcbiAgICAgIE1hdGhKYXguSHViLlF1ZXVlKFtcIlJlcHJvY2Vzc1wiLCBNYXRoSmF4Lkh1YiwgZWxlbV0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVwcm9jZXNzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVwcm9jZXNzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKG51bGwsIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLnNjcmlwdCgge3JlZjpcInNjcmlwdFwiLCB0eXBlOlwibWF0aC90ZXhcIn0sIHRoaXMucHJvcHMuY2hpbGRyZW4pXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbWF0aENvbXBvbmVudHM7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXRoQ29tcG9uZW50cztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbXBvbmVudCBleHRlbnNpb25zIGkuZS4ge0BsaW5rIGh0dHA6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvZG9jcy9yZXVzYWJsZS1jb21wb25lbnRzLmh0bWwjbWl4aW5zfG1peGluc30uXHJcbiAqIEBtb2R1bGUgTWl4aW5zXHJcbiAqL1xyXG52YXIgTWl4aW5zID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgbWl4aW5zID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIFByb3ZpZGVzIGEgc2V0SW50ZXJ2YWwgZnVuY3Rpb24gd2hpY2ggd2lsbCBnZXQgY2xlYW5lZCB1cCB3aGVuXHJcbiAgICogdGhlIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXHJcbiAgICogQG5hbWUgU2V0SW50ZXJ2YWxNaXhpblxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6TWl4aW5zXHJcbiAgICovXHJcbiAgbWl4aW5zLlNldEludGVydmFsTWl4aW4gPSB7XHJcbiAgICBzZXRJbnRlcnZhbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuaW50ZXJ2YWxzLnB1c2goc2V0SW50ZXJ2YWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyQWxsSW50ZXJ2YWxzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMubWFwKGNsZWFySW50ZXJ2YWwpO1xyXG4gICAgICB0aGlzLmludGVydmFscyA9IFtdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGluaXRpYWxpemVkLiAqL1xyXG4gICAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMgPSBbXTtcclxuICAgIH0sXHJcblxyXG4gICAgLyogSW52b2tlZCB3aGVuIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuICovXHJcbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2xlYXJBbGxJbnRlcnZhbHMoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBQcm92aWRlcyBhIHNldFRpbWVvdXQgZnVuY3Rpb24gd2hpY2ggd2lsbCBnZXQgY2xlYW5lZCB1cCB3aGVuXHJcbiAgICogdGhlIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXHJcbiAgICogQG5hbWUgU2V0VGltZW91dE1peGluXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpNaXhpbnNcclxuICAgKi9cclxuICBtaXhpbnMuU2V0VGltZW91dE1peGluID0ge1xyXG4gICAgc2V0VGltZW91dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMudGltZW91dHMucHVzaChzZXRUaW1lb3V0LmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhckFsbFRpbWVvdXRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy50aW1lb3V0cy5tYXAoY2xlYXJUaW1lb3V0KTtcclxuICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGluaXRpYWxpemVkLiAqL1xyXG4gICAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGRlc3Ryb3llZC4gKi9cclxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jbGVhckFsbFRpbWVvdXRzKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQXBwbHkgQ1NTIGNsYXNzZXMgZm9yIHNldCBkdXJhdGlvbiAtIHVzZWZ1bCBmb3Igc2luZ2xlc2hvdCBhbmltYXRpb25zLlxyXG4gICAqIEBuYW1lIFRyaWdnZXJBbmltYXRpb25NaXhpblxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6TWl4aW5zXHJcbiAgICovXHJcbiAgbWl4aW5zLlRyaWdnZXJBbmltYXRpb25NaXhpbiA9IHtcclxuXHJcbiAgICBhbmltYXRlOiBmdW5jdGlvbihlbGVtLCBjbGFzc05hbWUsIGR1cmF0aW9uKSB7XHJcbiAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgMTAwMDtcclxuICAgICAgaWYgKCF0aGlzLnRpbWVvdXQgJiYgdGhpcy50aW1lb3V0ICE9PSAwKSB7XHJcbiAgICAgICAgZWxlbS5hZGRDbGFzcyhjbGFzc05hbWUpO1xyXG4gICAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBlbGVtLnJlbW92ZUNsYXNzKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgICB0aGlzLnRpbWVvdXQgPSBudWxsO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSwgZHVyYXRpb24pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1peGlucztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1peGlucztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoqXHJcbiAqIENvbW1vbiB0YXNrIGNvbXBvbmVudHMuXHJcbiAqIEBtb2R1bGUgVGFza0NvbXBvbmVudHNcclxuICovXHJcbnZhciBUYXNrQ29tcG9uZW50cyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIE1peGlucyA9IHJlcXVpcmUoXCIuL21peGluc1wiKTtcclxuXHJcbiAgdmFyIHRhc2tDb21wb25lbnRzID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBmb3IgQm9vdHN0cmFwJ3MgcGFuZWwgY29tcG9uZW50LlxyXG4gICAqIEBuYW1lIFRhc2tQYW5lbFxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6VGFza0NvbXBvbmVudHNcclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2NsYXNzTmFtZT0ncGFuZWwtaW5mbyddIC0gUGFuZWwgY2xhc3MgbmFtZS5cclxuICAgKi9cclxuICB0YXNrQ29tcG9uZW50cy5UYXNrUGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrUGFuZWwnLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgY2xhc3NOYW1lID0gXCJwYW5lbCBcIiArICh0aGlzLnByb3BzLmNsYXNzTmFtZSB8fCBcInBhbmVsLWluZm9cIiApO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzTmFtZX0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWhlYWRpbmdcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDMoIHtjbGFzc05hbWU6XCJwYW5lbC10aXRsZVwifSwgdGhpcy5wcm9wcy5oZWFkZXIpXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWJvZHlcIn0sIFxyXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBIHdyYXBwZXIgZm9yIEJvb3RzdHJhcCdzIHByb2dyZXNzIGJhciBlbGVtZW50LlxyXG4gICAqIEBuYW1lIFRhc2tQcm9ncmVzc0JhclxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6VGFza0NvbXBvbmVudHNcclxuICAgKiBAcHJvcGVydHkge251bWJlcn0gbWF4IC0gVGhlIG1heGltdW0gcHJvZ3Jlc3MgdmFsdWUuXHJcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IG5vdyAtIFRoZSBjdXJyZW50IHByb2dyZXNzIHZhbHVlLlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tQcm9ncmVzc0JhciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tQcm9ncmVzc0JhcicsXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgbWF4OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIG5vdzogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHNpbmdsZVdpZHRoID0gTWF0aC5jZWlsKDEgLyB0aGlzLnByb3BzLm1heCAqIDEwMCk7XHJcbiAgICAgIHZhciBsZWZ0U3R5bGUgPSB7d2lkdGg6IHNpbmdsZVdpZHRoICogKHRoaXMucHJvcHMubm93IC0gMSkgKyBcIiVcIn07XHJcbiAgICAgIHZhciByaWdodFN0eWxlID0ge3dpZHRoOiBzaW5nbGVXaWR0aCAqICh0aGlzLnByb3BzLm1heCAtIHRoaXMucHJvcHMubm93ICsgMSkgKyBcIiVcIn07XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSB0YXNrLXByb2dyZXNzLWJhclwifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MtYmFyIHByb2dyZXNzLWJhci1zdWNjZXNzXCIsIHN0eWxlOmxlZnRTdHlsZX0pLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzLWJhciBwcm9ncmVzcy1iYXItd2FybmluZ1wiLCBzdHlsZTpyaWdodFN0eWxlfSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgdGltZXIgdGhhdCBjb3VudHMgZG93biBmcm9tIGEgc3BlY2lmaWVkIHRpbWUgYW5kIHRyaWdnZXJzIGFuIGV2ZW50XHJcbiAgICogd2hlbiBmaW5pc2hlZC4gUmVtYWluaW5nIHRpbWUgaXMgZGlzcGxheWVkIGluIGEgcHJvZ3Jlc3MgYmFyLlxyXG4gICAqIEBuYW1lIFRhc2tDb3VudGRvd25UaW1lclxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6VGFza0NvbXBvbmVudHNcclxuICAgKiBAcHJvcGVydHkge251bWJlcn0gdGltZSAtIENvdW50ZG93biBkdXJhdGlvbiBpbiBzZWNvbmRzLlxyXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW3N0YXJ0T25Nb3VudD1mYWxzZV0gLSBEb2VzIGNvdW50ZG93biBzdGFydCBhdXRvbWF0aWNhbGx5IHdoZW4gcmVuZGVyZWQuXHJcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gW29uRXhwaXJ5XSAtIENvdW50ZG93biBleHBpcnkgZXZlbnQgaGFuZGxlci5cclxuICAgKi9cclxuICB0YXNrQ29tcG9uZW50cy5UYXNrQ291bnRkb3duVGltZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrQ291bnRkb3duVGltZXInLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICB0aW1lOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIHN0YXJ0T25Nb3VudDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIG9uRXhwaXJ5OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xyXG4gICAgfSxcclxuXHJcbiAgICBtaXhpbnM6IFtNaXhpbnMuU2V0SW50ZXJ2YWxNaXhpbl0sXHJcblxyXG4gICAgc3RhcnRDb3VudGRvd246IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB0aW1lTGVmdDogdGhpcy5wcm9wcy50aW1lXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5zZXRJbnRlcnZhbCh0aGlzLnRpY2ssIDEwMDApO1xyXG4gICAgfSxcclxuXHJcbiAgICB0aWNrOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHRpbWVMZWZ0ID0gdGhpcy5zdGF0ZS50aW1lTGVmdCAtIDE7XHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB0aW1lTGVmdDogdGltZUxlZnRcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZiAodGltZUxlZnQgPCAxKSB7XHJcbiAgICAgICAgdGhpcy5jbGVhckFsbEludGVydmFscygpO1xyXG4gICAgICAgIGlmICgkLmlzRnVuY3Rpb24odGhpcy5wcm9wcy5vbkV4cGlyeSkpIHRoaXMucHJvcHMub25FeHBpcnkoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLnByb3BzLnN0YXJ0T25Nb3VudCkgdGhpcy5zdGFydENvdW50ZG93bigpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHRpbWVMZWZ0OiB0aGlzLnByb3BzLnRpbWVcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgc2luZ2xlV2lkdGggPSBNYXRoLmNlaWwoMSAvIHRoaXMucHJvcHMudGltZSAqIDEwMCk7XHJcbiAgICAgIHZhciB3aWR0aCA9IE1hdGguY2VpbCgxIC8gdGhpcy5wcm9wcy50aW1lICogMTAwICogdGhpcy5zdGF0ZS50aW1lTGVmdCk7XHJcbiAgICAgIHZhciBiYXJTdHlsZSA9IHt3aWR0aDogd2lkdGggKyBcIiVcIn07XHJcblxyXG4gICAgICB2YXIgYmFyQ2xhc3MgPSBSZWFjdC5hZGRvbnMuY2xhc3NTZXQoe1xyXG4gICAgICAgIFwicHJvZ3Jlc3MtYmFyLXN1Y2Nlc3NcIjogd2lkdGggPj0gNDAsXHJcbiAgICAgICAgXCJwcm9ncmVzcy1iYXItd2FybmluZ1wiOiB3aWR0aCA8IDQwICYmIHdpZHRoID4gMjAsXHJcbiAgICAgICAgXCJwcm9ncmVzcy1iYXItZGFuZ2VyXCI6IHdpZHRoIDw9IDIwLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIHRhc2stcHJvZ3Jlc3MtYmFyXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcy1iYXIgXCIgKyBiYXJDbGFzcywgc3R5bGU6YmFyU3R5bGV9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGFzayBoZWFkZXIuXHJcbiAgICogQG5hbWUgVGFza0hlYWRlclxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6VGFza0NvbXBvbmVudHNcclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZSAtIFRhc2sgbmFtZSB0byBkaXNwbGF5IGluIHRoZSBoZWFkZXIuXHJcbiAgICovXHJcbiAgdGFza0NvbXBvbmVudHMuVGFza0hlYWRlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tIZWFkZXInLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBuYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWhlYWRlciByb3dcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS03XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmgyKG51bGwsIHRoaXMucHJvcHMubmFtZSlcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTVcIn0sIFxyXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQSBwYW5lbCB0aGF0IGlzIHNob3duIGFmdGVyIGNvbXBsZXRpbmcgYSB0YXNrLlxyXG4gICAqIEBuYW1lIFRhc2tEb25lRGlzcGxheVxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6VGFza0NvbXBvbmVudHNcclxuICAgKiBAcHJvcGVydHkge251bWJlcn0gW3Njb3JlXSAtIFNjb3JlIHRvIGRpc3BsYXkuXHJcbiAgICovXHJcbiAgdGFza0NvbXBvbmVudHMuVGFza0RvbmVEaXNwbGF5ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza0RvbmVEaXNwbGF5JyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgc2NvcmU6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgc2NvcmUgPSB0aGlzLnByb3BzLnNjb3JlIHx8IDA7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWRvbmUtZGlzcGxheSBhbmltYXRlIGJvdW5jZS1pblwifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiYWxlcnQgYWxlcnQtc3VjY2Vzc1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJUZWh0w6R2w6Qgc3Vvcml0ZXR0dSFcIiksIFwiIFBpc3RlaXTDpDogXCIsIHNjb3JlXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBIGRpdiB3aXRoIGEgbWV0aG9kIGZvciBhcHBseWluZyBDU1MgYW5pbWF0aW9uIGNsYXNzZXMgZm9yIGEgc2V0IGR1cmF0aW9uLlxyXG4gICAqIEBuYW1lIFRhc2tUcmlnZ2VyQW5pbURpdlxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6VGFza0NvbXBvbmVudHNcclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2NsYXNzTmFtZV0gLSBDb250YWluZXIgZGl2J3MgQ1NTIGNsYXNzLlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tUcmlnZ2VyQW5pbURpdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tUcmlnZ2VyQW5pbURpdicsXHJcblxyXG4gICAgbWl4aW5zOiBbTWl4aW5zLlRyaWdnZXJBbmltYXRpb25NaXhpbl0sXHJcblxyXG4gICAgdHJpZ2dlckFuaW06IGZ1bmN0aW9uKGFuaW1hdGlvbkNsYXNzLCBkdXJhdGlvbikge1xyXG4gICAgICB2YXIgZWxlbSA9ICQodGhpcy5nZXRET01Ob2RlKCkpO1xyXG4gICAgICBhbmltYXRpb25DbGFzcyA9IGFuaW1hdGlvbkNsYXNzIHx8IFwiXCI7XHJcbiAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgMTAwMDtcclxuXHJcbiAgICAgIHRoaXMuYW5pbWF0ZShlbGVtLCBhbmltYXRpb25DbGFzcywgZHVyYXRpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jbGFzc05hbWUgfHwgXCJcIjtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFuaW1hdGVkIFwiICsgY2xhc3NOYW1lfSwgXHJcbiAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0YXNrQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tDb21wb25lbnRzO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgc2ltcGxlIGludGVnZXIgYWRkaXRpb24gdGFzay5cclxuICovXHJcbnZhciBBZGRpdGlvblRhc2sgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxuICB2YXIgU2luZ2xlTnVtYmVyRm9ybSA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Zvcm1zXCIpLlNpbmdsZU51bWJlckZvcm07XHJcbiAgdmFyIE1hdGhDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvbWF0aC1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50c1wiKTtcclxuXHJcblxyXG4gIHZhciBhZGRpdGlvblRhc2sgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdhZGRpdGlvblRhc2snLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzdGVwczogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgICBvblRhc2tEb25lOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZXNldCB0aGUgcXVlc3Rpb24uICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBhLCBiO1xyXG4gICAgICBkbyB7XHJcbiAgICAgICAgYSA9IFRhc2tVdGlscy5yYW5kUmFuZ2UoMSwgMTEpO1xyXG4gICAgICAgIGIgPSBUYXNrVXRpbHMucmFuZFJhbmdlKDEsIDExKTtcclxuICAgICAgfVxyXG4gICAgICB3aGlsZSAoVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihbYSxiXSwgW3RoaXMuc3RhdGUuYSwgdGhpcy5zdGF0ZS5iXSkpO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgYTogYSxcclxuICAgICAgICBiOiBiLFxyXG4gICAgICAgIGFuc3dlcjogYSArIGJcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDaGVjayBpZiBjb3JyZWN0LiAqL1xyXG4gICAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbihhbnN3ZXIpIHtcclxuICAgICAgdmFyIGlzQ29ycmVjdCA9IFRhc2tVdGlscy5tYXRjaGVzU29sdXRpb24oYW5zd2VyLCB0aGlzLnN0YXRlLmFuc3dlcik7XHJcbiAgICAgIGlmIChpc0NvcnJlY3QpXHJcbiAgICAgICAgdGhpcy5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcblxyXG4gICAgICByZXR1cm4gaXNDb3JyZWN0O1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVDb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHN0ZXAgPSB0aGlzLnN0YXRlLnN0ZXA7XHJcbiAgICAgIGlmIChzdGVwID09PSB0aGlzLnByb3BzLnN0ZXBzKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25UYXNrRG9uZSgpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7c3RlcDogc3RlcCArIDF9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMSxcclxuICAgICAgICBhbnN3ZXI6IG51bGxcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrUHJvZ3Jlc3NCYXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBNYXRoSmF4ID0gTWF0aENvbXBvbmVudHMuTWF0aEpheDtcclxuXHJcbiAgICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gdGhpcy5wcm9wcy5zdGVwcztcclxuICAgICAgdmFyIHF1ZXN0aW9uLCBzaWRlYmFyO1xyXG5cclxuICAgICAgaWYgKCF0YXNrSXNEb25lKSB7XHJcbiAgICAgICAgdmFyIHF1ZXN0aW9uQ29udGVudCA9IHRoaXMuc3RhdGUuYSArIFwiICsgXCIgKyB0aGlzLnN0YXRlLmIgKyBcIiA9ID9cIjtcclxuICAgICAgICBxdWVzdGlvbiA9IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0ZXh0LWNlbnRlclwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMShudWxsLCBcclxuICAgICAgICAgICAgICBNYXRoSmF4KG51bGwsIHF1ZXN0aW9uQ29udGVudClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHNpZGViYXIgPSAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKG51bGwsIFwiTWlrw6Qgb24geWh0ZWVubGFza3VuIHR1bG9zP1wiKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJWYXN0YXVzXCIsIGNsYXNzTmFtZTpcInBhbmVsLXN1Y2Nlc3MgcGFuZWwtZXh0cmEtcGFkZGluZ1wifSwgXHJcbiAgICAgICAgICAgICAgU2luZ2xlTnVtYmVyRm9ybSgge29uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHF1ZXN0aW9uID0gVGFza0RvbmVEaXNwbGF5KCB7c2NvcmU6MTB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgVGFza0hlYWRlcigge25hbWU6XCJZaHRlZW5sYXNrdVwifSwgXHJcbiAgICAgICAgICAgIFRhc2tQcm9ncmVzc0Jhcigge25vdzp0aGlzLnN0YXRlLnN0ZXAsIG1heDp0aGlzLnByb3BzLnN0ZXBzfSlcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgICBxdWVzdGlvblxyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gYWRkaXRpb25UYXNrO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWRkaXRpb25UYXNrO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBkMywgbW9kdWxlLCByZXF1aXJlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBEZXRlY3QgYXMgbWFueSBzaGFwZXMgYXMgeW91IGNhbiBpbiA2MCBzZWNvbmRzLlxyXG4gKi9cclxudmFyIEJhc2ljU2hhcGVzVGFzayA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIFRhc2tVdGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy90YXNrLXV0aWxzXCIpO1xyXG4gIHZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50c1wiKTtcclxuICB2YXIgQ29vcmRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvY29vcmRzLWNvbXBvbmVudHNcIikuQ29vcmRzO1xyXG4gIHZhciBNaXhpbnMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9taXhpbnNcIik7XHJcblxyXG4gIHZhciBiYXNpY1NoYXBlc1Rhc2sgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdiYXNpY1NoYXBlc1Rhc2snLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBvblRhc2tEb25lOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgICB0aW1lOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgbWl4aW5zOiBbTWl4aW5zLlNldFRpbWVvdXRNaXhpbl0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHNpeCBkaWZmZXJlbnQgc2hhcGVzIHRoYXQgZmlsbCB0aGUgY29vcmRzXHJcbiAgICAgKiBpbiBhIHJhbmRvbSBvcmRlci5cclxuICAgICAqL1xyXG4gICAgZ2V0UmFuZG9tU2hhcGVzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGMxID0gMC40NiwgYzIgPSAxLjIxLCBzMSA9IDEuNDMsIHMyID0gMC44ODU7XHJcbiAgICAgIHZhciBwZW50YWdvblB0cyA9IFtbLXMyLC1jMl0sIFstczEsYzFdLCBbMCwxLjVdLCBbczEsYzFdLCBbczIsLWMyXV07XHJcbiAgICAgIHBlbnRhZ29uUHRzID0gVGFza1V0aWxzLnRyYW5zbGF0ZShwZW50YWdvblB0cywgMi41LCAxLjUpO1xyXG5cclxuICAgICAgdmFyIHRyYW5zbGF0ZXMgPSBbWzAsMF0sIFs2LDBdLCBbMCw0XSwgWzYsNF0sIFswLDhdLCBbNiw4XV07XHJcbiAgICAgIHZhciBiYXNlcyA9IFtcclxuICAgICAgICB7bmFtZTpcImtvbG1pb1wiLCBwb2ludHM6W1sxLDBdLCBbMSwzXSwgWzQsMF1dfSxcclxuICAgICAgICB7bmFtZTpcIm5lbGnDtlwiLCBwb2ludHM6W1sxLDBdLCBbMSwzXSwgWzQsM10sIFs0LDBdXX0sXHJcbiAgICAgICAge25hbWU6XCJ5bXB5csOkXCIsIHBvaW50czpbWzIuNSwxLjVdXSwgcjoxLjV9LFxyXG4gICAgICAgIHtuYW1lOlwic3V1bm5pa2FzXCIsIHBvaW50czpbWzAsMF0sIFswLjUsM10sIFs0LjUsM10sIFs0LDBdXX0sXHJcbiAgICAgICAge25hbWU6XCJwdW9saXN1dW5uaWthc1wiLCBwb2ludHM6W1swLDBdLCBbMC41LDNdLCBbNCwzXSwgWzQuNSwwXV19LFxyXG4gICAgICAgIHtuYW1lOlwidmlpc2lrdWxtaW9cIiwgcG9pbnRzOnBlbnRhZ29uUHRzfVxyXG4gICAgICBdO1xyXG5cclxuICAgICAgYmFzZXMgPSBUYXNrVXRpbHMuc2h1ZmZsZShiYXNlcyk7XHJcbiAgICAgIHZhciBjbHJzID0gZDMuc2NhbGUuY2F0ZWdvcnkxMCgpO1xyXG5cclxuICAgICAgdmFyIHNoYXBlcyA9IGJhc2VzLm1hcChmdW5jdGlvbihiYXNlLCBpKSB7XHJcbiAgICAgICAgdmFyIHRyYW5zbGF0ZVggPSB0cmFuc2xhdGVzW2ldWzBdICsgTWF0aC5yYW5kb20oKTtcclxuICAgICAgICB2YXIgdHJhbnNsYXRlWSA9IHRyYW5zbGF0ZXNbaV1bMV0gKyBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICAgIGJhc2UucG9pbnRzID0gVGFza1V0aWxzLnRyYW5zbGF0ZShiYXNlLnBvaW50cywgdHJhbnNsYXRlWCwgdHJhbnNsYXRlWSk7XHJcbiAgICAgICAgYmFzZS5rZXkgPSBpO1xyXG4gICAgICAgIGJhc2Uub25DbGljayA9IHRoaXMuaGFuZGxlU2hhcGVDbGljaztcclxuICAgICAgICBiYXNlLnN0cm9rZSA9IFwiYmxhY2tcIjtcclxuICAgICAgICBiYXNlLmZpbGwgPSBjbHJzKFRhc2tVdGlscy5yYW5kKDkpKTtcclxuICAgICAgICByZXR1cm4gYmFzZTtcclxuICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgIHJldHVybiBzaGFwZXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZXNldCB0aGUgcXVlc3Rpb24sIGkuZS4gZ2VuZXJhdGUgbmV3IHNoYXBlcy4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHNoYXBlcyA9IHRoaXMuZ2V0UmFuZG9tU2hhcGVzKCk7XHJcblxyXG4gICAgICAvLyBQcmV2ZW50IGFza2luZyBmb3IgdGhlIHNhbWUgc2hhcGUgdHdpY2UgaW4gYSByb3cuXHJcbiAgICAgIHZhciBwb3NzaWJsZVRhcmdldHMgPSBzaGFwZXM7XHJcbiAgICAgIGlmICh0aGlzLnN0YXRlLnRhcmdldCkge1xyXG4gICAgICAgIHBvc3NpYmxlVGFyZ2V0cyA9IHBvc3NpYmxlVGFyZ2V0cy5maWx0ZXIoZnVuY3Rpb24oc2hhcGUpIHtcclxuICAgICAgICAgIHJldHVybiBzaGFwZS5uYW1lICE9PSB0aGlzLnN0YXRlLnRhcmdldC5uYW1lO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHRhcmdldCA9IHBvc3NpYmxlVGFyZ2V0c1tUYXNrVXRpbHMucmFuZChwb3NzaWJsZVRhcmdldHMubGVuZ3RoKV07XHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICBzaGFwZXM6IHRoaXMuZ2V0UmFuZG9tU2hhcGVzKCksXHJcbiAgICAgICAgdGFyZ2V0OiB0YXJnZXRcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZVN0YXJ0QnRuQ2xpY2s6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtpc1J1bm5pbmc6IHRydWUsIHNjb3JlOiAwfSk7XHJcbiAgICAgIHRoaXMucmVmcy50aW1lci5zdGFydENvdW50ZG93bigpO1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDaGVjayBpZiBjb3JyZWN0IHNoYXBlIGFuZCBwcm9jZWVkLiAqL1xyXG4gICAgaGFuZGxlU2hhcGVDbGljazogZnVuY3Rpb24oc2hhcGUpIHtcclxuICAgICAgdmFyIHNjb3JlSW5jcmVtZW50O1xyXG4gICAgICBpZiAoc2hhcGUubmFtZSA9PT0gdGhpcy5zdGF0ZS50YXJnZXQubmFtZSkge1xyXG4gICAgICAgIHNjb3JlSW5jcmVtZW50ID0gMTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzY29yZUluY3JlbWVudCA9IC0xO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgYW5pbSA9IHNjb3JlSW5jcmVtZW50ID4gMCA/IFwicHVsc2VcIiA6IFwic2hha2VcIjtcclxuICAgICAgdGhpcy5yZWZzLnNjb3JlLnRyaWdnZXJBbmltKGFuaW0sIDEwMDApO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7c2NvcmU6IE1hdGgubWF4KHRoaXMuc3RhdGUuc2NvcmUgKyBzY29yZUluY3JlbWVudCwgMCl9KTtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogVGFzayBmaW5pc2hlcyAoYWZ0ZXIgYSBzbWFsbCB0aW1lb3V0IGZvciBzbW9vdGhuZXNzKSB3aGVuIHRpbWVyIGV4cGlyZXMuICovXHJcbiAgICBoYW5kbGVUaW1lckV4cGlyeTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHsgaXNGaW5pc2hlZDogdHJ1ZSB9KTtcclxuICAgICAgfS5iaW5kKHRoaXMpLCA1MDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHNoYXBlczogW10sXHJcbiAgICAgICAgc2NvcmU6IDAsXHJcbiAgICAgICAgaXNSdW5uaW5nOiBmYWxzZSxcclxuICAgICAgICBpc0ZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBUYXNrUGFuZWwgPSBUYXNrQ29tcG9uZW50cy5UYXNrUGFuZWw7XHJcbiAgICAgIHZhciBUYXNrSGVhZGVyID0gVGFza0NvbXBvbmVudHMuVGFza0hlYWRlcjtcclxuICAgICAgdmFyIFRhc2tEb25lRGlzcGxheSA9IFRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheTtcclxuICAgICAgdmFyIFRhc2tDb3VudGRvd25UaW1lciA9IFRhc2tDb21wb25lbnRzLlRhc2tDb3VudGRvd25UaW1lcjtcclxuICAgICAgdmFyIFRhc2tUcmlnZ2VyQW5pbURpdiA9IFRhc2tDb21wb25lbnRzLlRhc2tUcmlnZ2VyQW5pbURpdjtcclxuXHJcbiAgICAgIHZhciBzaGFwZXMgPSB0aGlzLnN0YXRlLnNoYXBlcztcclxuICAgICAgdmFyIHF1ZXN0aW9uLCBzaWRlYmFyLCB0aW1lcjtcclxuXHJcbiAgICAgIGlmICghdGhpcy5zdGF0ZS5pc0ZpbmlzaGVkKSB7XHJcbiAgICAgICAgdmFyIGJvdW5kcyA9IHttYXhZOiAxMiwgbWF4WDogMTIsIG1pblk6IDAsIG1pblg6IDB9O1xyXG5cclxuICAgICAgICBxdWVzdGlvbiA9IENvb3Jkcygge2RyYXdBeGVzOmZhbHNlLCBzaGFwZXM6c2hhcGVzLCBib3VuZHM6Ym91bmRzLCBhc3BlY3Q6MX0gKTtcclxuXHJcbiAgICAgICAgdmFyIHNoYXBlVG9GaW5kID0gXCJrb2xtaW9cIjtcclxuXHJcbiAgICAgICAgdmFyIHN0YXJ0QnRuID0gdGhpcy5zdGF0ZS5pc1J1bm5pbmcgPyBudWxsIDogKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwiYW5pbWF0ZWQgYW5pbWF0ZWQtcmVwZWF0IGJvdW5jZSBidG4gYnRuLXByaW1hcnkgYnRuLWJsb2NrXCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVTdGFydEJ0bkNsaWNrfSwgXG4gICAgICAgICAgICAgIFwiQWxvaXRhIHBlbGlcIlxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHZhciB0YXJnZXREaXNwbGF5ID0gIXRoaXMuc3RhdGUudGFyZ2V0ID8gbnVsbCA6IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJhbmltYXRlZCBib3VuY2UtaW5cIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXG4gICAgICAgICAgICBcIktsaWthdHRhdmEga2FwcGFsZTogXCIsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgdGhpcy5zdGF0ZS50YXJnZXQubmFtZSksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcclxuICAgICAgICAgICAgVGFza1RyaWdnZXJBbmltRGl2KCB7cmVmOlwic2NvcmVcIiwgY2xhc3NOYW1lOlwidGV4dC1jZW50ZXJcIn0sIFxuICAgICAgICAgICAgICBcIlBpc3RlZXQ6IFwiLCBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImxhYmVsIGxhYmVsLXdhcm5pbmdcIn0sIHRoaXMuc3RhdGUuc2NvcmUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcbiAgICAgICAgICAgICAgXCJFdHNpIGtvb3JkaW5hYXRpc3Rvc3RhIG3DpMOkcsOkdHR5IHRhc29rdXZpbyBqYSBrbGlra2FhIHNpdMOkLlwiLFJlYWN0LkRPTS5icihudWxsKSxcbiAgICAgICAgICAgICAgXCJTaW51bGxhIG9uIFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHRoaXMucHJvcHMudGltZSwgXCIgc2VrdW50aWFcIiksIFwiIGFpa2FhLlwiLFxuICAgICAgICAgICAgICBzdGFydEJ0bixcclxuICAgICAgICAgICAgICB0YXJnZXREaXNwbGF5XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXN0aW9uID0gVGFza0RvbmVEaXNwbGF5KCB7c2NvcmU6dGhpcy5zdGF0ZS5zY29yZX0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIkthcHBhbGVpZGVuIHR1bm5pc3RhbWluZW5cIn0sIFxyXG4gICAgICAgICAgICBUYXNrQ291bnRkb3duVGltZXIoIHtyZWY6XCJ0aW1lclwiLCB0aW1lOnRoaXMucHJvcHMudGltZSwgb25FeHBpcnk6dGhpcy5oYW5kbGVUaW1lckV4cGlyeX0pXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBxdWVzdGlvblwifSwgXHJcbiAgICAgICAgICAgICAgcXVlc3Rpb25cclxuICAgICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNSBjb2wtc20tb2Zmc2V0LTFcIn0sIFxyXG4gICAgICAgICAgICAgIHNpZGViYXJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGJhc2ljU2hhcGVzVGFzaztcclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQmFzaWNTaGFwZXNUYXNrO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIERyYXcgYSBnaXZlbiBzaGFwZSBvbiB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAqL1xyXG52YXIgRHJhd1NoYXBlc1Rhc2sgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxuICB2YXIgVGFza0NvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIENvb3JkcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Nvb3Jkcy1jb21wb25lbnRzXCIpLkNvb3JkcztcclxuXHJcblxyXG4gIHZhciBkcmF3U2hhcGVzVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ2RyYXdTaGFwZXNUYXNrJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgc3RlcHM6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgb25UYXNrRG9uZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciB0YXJnZXRBcmVhO1xyXG4gICAgICBkbyB7XHJcbiAgICAgICAgdGFyZ2V0QXJlYSA9IFRhc2tVdGlscy5yYW5kUmFuZ2UoMSwgMTApO1xyXG4gICAgICB9IHdoaWxlICh0YXJnZXRBcmVhID09PSB0aGlzLnN0YXRlLnRhcmdldEFyZWEpO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgICB0YXJnZXRBcmVhOiB0YXJnZXRBcmVhLFxyXG4gICAgICAgIGNvb3Jkc0Rpc2FibGVkOiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hlY2tBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgcG9seWdvblB0cyA9IHRoaXMuc3RhdGUuc2hhcGVzLm1hcChmdW5jdGlvbihzaGFwZSkge1xyXG4gICAgICAgIHJldHVybiBzaGFwZS5wb2ludHNbMF07XHJcbiAgICAgIH0pO1xyXG4gICAgICB2YXIgdHJpYW5nbGUgPSB7cG9pbnRzOiBwb2x5Z29uUHRzLCBmaWxsOiBcInN0ZWVsYmx1ZVwifTtcclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHNoYXBlczogW3RyaWFuZ2xlXSxcclxuICAgICAgICBjb29yZHNEaXNhYmxlZDogdHJ1ZVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSBUYXNrVXRpbHMudHJpYW5nbGVBcmVhKHBvbHlnb25QdHMpID09PSB0aGlzLnN0YXRlLnRhcmdldEFyZWE7XHJcblxyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhbmltID0gaXNDb3JyZWN0ID8gXCJwdWxzZVwiIDogXCJzaGFrZVwiO1xyXG4gICAgICAgIHRoaXMucmVmcy5hbmltRGl2LnRyaWdnZXJBbmltKGFuaW0pO1xyXG5cclxuICAgICAgICB0cmlhbmdsZS5maWxsID0gaXNDb3JyZWN0ID8gXCIjMUFDODM0XCIgOiBcIiM4QjAwMDBcIjtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaGFwZXM6IFt0cmlhbmdsZV19KTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmIChpc0NvcnJlY3QpIHRoaXMuaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG4gICAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSwgMTAwMCk7XHJcblxyXG4gICAgICB9LmJpbmQodGhpcyksIDUwMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZVN0YXJ0QnRuQ2xpY2s6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtpc1J1bm5pbmc6IHRydWV9KTtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVDb29yZHNDbGljazogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICBpZiAodGhpcy5zdGF0ZS5jb29yZHNEaXNhYmxlZCB8fCAhdGhpcy5zdGF0ZS5pc1J1bm5pbmcpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgdmFyIHNoYXBlcyA9IHRoaXMuc3RhdGUuc2hhcGVzO1xyXG5cclxuICAgICAgdmFyIGNvbXBsZW1lbnQgPSBzaGFwZXMuZmlsdGVyKGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgICAgdmFyIHBvaW50ID0gc2hhcGUucG9pbnRzWzBdO1xyXG4gICAgICAgIHJldHVybiAhKHBvaW50WzBdID09PSB4ICYmIHBvaW50WzFdID09PSB5KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZiAoY29tcGxlbWVudC5sZW5ndGggPCBzaGFwZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgc2hhcGVzID0gY29tcGxlbWVudDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgbmV3U2hhcGUgPSB7cG9pbnRzOiBbW3gsIHldXX07XHJcbiAgICAgICAgc2hhcGVzLnB1c2gobmV3U2hhcGUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtzaGFwZXM6IHNoYXBlc30pO1xyXG5cclxuICAgICAgaWYgKHNoYXBlcy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgICB0aGlzLmNoZWNrQW5zd2VyKCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzdGVwID0gdGhpcy5zdGF0ZS5zdGVwO1xyXG4gICAgICBpZiAoc3RlcCA9PT0gdGhpcy5wcm9wcy5zdGVwcykgdGhpcy5wcm9wcy5vblRhc2tEb25lKCk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3N0ZXA6IHN0ZXAgKyAxfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMSxcclxuICAgICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICAgIGlzUnVubmluZzogZmFsc2VcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrUHJvZ3Jlc3NCYXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBUYXNrVHJpZ2dlckFuaW1EaXYgPSBUYXNrQ29tcG9uZW50cy5UYXNrVHJpZ2dlckFuaW1EaXY7XHJcblxyXG4gICAgICB2YXIgdGFza0lzRG9uZSA9IHRoaXMuc3RhdGUuc3RlcCA+IHRoaXMucHJvcHMuc3RlcHM7XHJcbiAgICAgIHZhciBxdWVzdGlvbiwgc2lkZWJhcjtcclxuXHJcbiAgICAgIGlmICghdGFza0lzRG9uZSkge1xyXG4gICAgICAgIHZhciBib3VuZHMgPSB7bWluWDogMCwgbWluWTogMCwgbWF4WDogNywgbWF4WTogN307XHJcbiAgICAgICAgcXVlc3Rpb24gPSAoXHJcbiAgICAgICAgICBDb29yZHMoIHtzaGFwZXM6dGhpcy5zdGF0ZS5zaGFwZXMsIGJvdW5kczpib3VuZHMsIG9uQ2xpY2s6dGhpcy5oYW5kbGVDb29yZHNDbGlja30gKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmlzUnVubmluZykge1xyXG4gICAgICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxyXG4gICAgICAgICAgICAgICAgVGFza1RyaWdnZXJBbmltRGl2KCB7cmVmOlwiYW5pbURpdlwifSwgXHJcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKG51bGwsIFxuICAgICAgICAgICAgICAgICAgICBcIk11b2Rvc3RhIGtvbG1pbywgam9ua2EgcGludGEtYWxhIG9uIFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHRoaXMuc3RhdGUudGFyZ2V0QXJlYSlcclxuICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxuICAgICAgICAgICAgICAgIFwiTXVvZG9zdGEgb2hqZWlkZW4gbXVrYWluZW4ga29sbWlvIGtsaWtrYWlsZW1hbGxhIGtvb3JkaW5hYXRpc3RvYS5cIixcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwiYW5pbWF0ZWQgYW5pbWF0ZWQtcmVwZWF0IGJvdW5jZSBidG4gYnRuLXByaW1hcnkgYnRuLWJsb2NrXCIsXHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlU3RhcnRCdG5DbGlja30sIFxuICAgICAgICAgICAgICAgICAgXCJBbG9pdGEgdGVodMOkdsOkXCJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBxdWVzdGlvbiA9IFRhc2tEb25lRGlzcGxheSgge3Njb3JlOnRoaXMucHJvcHMuc3RlcHN9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgVGFza0hlYWRlcigge25hbWU6XCJLb2xtaW9pZGVuIHBpaXJ0w6RtaW5lblwifSwgXHJcbiAgICAgICAgICAgIFRhc2tQcm9ncmVzc0Jhcigge25vdzp0aGlzLnN0YXRlLnN0ZXAsIG1heDp0aGlzLnByb3BzLnN0ZXBzfSlcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgICBxdWVzdGlvblxyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gZHJhd1NoYXBlc1Rhc2s7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEcmF3U2hhcGVzVGFzaztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZWFkIHBvc2l0aW9ucyBmcm9tIGEgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAqL1xyXG52YXIgU2ltcGxlQ29vcmRzVGFzayA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIFRhc2tVdGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy90YXNrLXV0aWxzXCIpO1xyXG4gIHZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50c1wiKTtcclxuICB2YXIgQ29vcmRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvY29vcmRzLWNvbXBvbmVudHNcIikuQ29vcmRzO1xyXG4gIHZhciBGb3JtcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Zvcm1zXCIpO1xyXG5cclxuXHJcbiAgdmFyIHNpbXBsZUNvb3Jkc1Rhc2sgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdzaW1wbGVDb29yZHNUYXNrJyxcclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzdGVwczogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgICBvblRhc2tEb25lOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZXNldCB0aGUgcXVlc3Rpb24sIGkuZS4gZ2VuZXJhdGUgYSBuZXcgcmFuZG9tIHBvaW50LiAqL1xyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgbmV3UG9pbnQ7XHJcbiAgICAgIGRvIHsgbmV3UG9pbnQgPSBbVGFza1V0aWxzLnJhbmRSYW5nZSgwLCAxMCksIFRhc2tVdGlscy5yYW5kUmFuZ2UoMCwgMTApXTsgfVxyXG4gICAgICB3aGlsZSAoVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihuZXdQb2ludCwgdGhpcy5zdGF0ZS5wb2ludCkpO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7cG9pbnQ6IG5ld1BvaW50fSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDaGVjayBpZiBjb3JyZWN0LiAqL1xyXG4gICAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSBUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKFt4LCB5XSwgdGhpcy5zdGF0ZS5wb2ludCk7XHJcbiAgICAgIGlmIChpc0NvcnJlY3QpXHJcbiAgICAgICAgdGhpcy5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcblxyXG4gICAgICByZXR1cm4gaXNDb3JyZWN0O1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVDb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHN0ZXAgPSB0aGlzLnN0YXRlLnN0ZXA7XHJcbiAgICAgIGlmIChzdGVwID09PSBwYXJzZUludCh0aGlzLnByb3BzLnN0ZXBzKSlcclxuICAgICAgICB0aGlzLnByb3BzLm9uVGFza0RvbmUoKTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3N0ZXA6IHN0ZXAgKyAxfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDEsXHJcbiAgICAgICAgcG9pbnQ6IG51bGxcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrUHJvZ3Jlc3NCYXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBDb29yZHNBbnN3ZXJGb3JtID0gRm9ybXMuQ29vcmRzQW5zd2VyRm9ybTtcclxuXHJcbiAgICAgIHZhciBwb2ludCA9IHRoaXMuc3RhdGUucG9pbnQ7XHJcbiAgICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcyk7XHJcbiAgICAgIHZhciBjb29yZHMsIHNpZGViYXI7XHJcblxyXG4gICAgICBpZiAocG9pbnQgJiYgIXRhc2tJc0RvbmUpIHtcclxuICAgICAgICB2YXIgYm91bmRzID0ge21heFk6IDEwLCBtYXhYOiAxMCwgbWluWTogLTIsIG1pblg6IC0yfTtcclxuICAgICAgICB2YXIgc2hhcGVzID0gW3twb2ludHM6IFtwb2ludF0sIHI6MC4yLCBzdHJva2VXaWR0aDogMywgc3Ryb2tlOiBcIiNGRjVCMjRcIiwgZmlsbDpcIiNGRDAwMDBcIn1dO1xyXG5cclxuICAgICAgICBjb29yZHMgPSBDb29yZHMoIHtzaGFwZXM6c2hhcGVzLCBib3VuZHM6Ym91bmRzLCBhc3BlY3Q6MX0gKTtcclxuXHJcbiAgICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXCJNaXRrw6Qgb3ZhdCBwaXN0ZWVuIHgtamEgeS1rb29yZGluYWF0aXQ/XCIpXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIlZhc3RhdXNcIiwgY2xhc3NOYW1lOlwicGFuZWwtc3VjY2VzcyBwYW5lbC1leHRyYS1wYWRkaW5nXCJ9LCBcclxuICAgICAgICAgICAgICBDb29yZHNBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0gKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICh0YXNrSXNEb25lKSB7XHJcbiAgICAgICAgY29vcmRzID0gVGFza0RvbmVEaXNwbGF5KCB7c2NvcmU6MTB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgVGFza0hlYWRlcigge25hbWU6XCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCJ9LCBcclxuICAgICAgICAgICAgVGFza1Byb2dyZXNzQmFyKCB7bm93OnRoaXMuc3RhdGUuc3RlcCwgbWF4OnRoaXMucHJvcHMuc3RlcHN9KVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICAgIGNvb3Jkc1xyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gc2ltcGxlQ29vcmRzVGFzaztcclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2ltcGxlQ29vcmRzVGFzaztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qIGdsb2JhbCBtb2R1bGUgKi9cclxuXHJcbi8qKlxyXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyAobWFpbmx5IG1hdGhzIHJlbGF0ZWQpIGZvciB0YXNrcy5cclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIFRhc2tVdGlscyA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgaW4gcmFuZ2UgW21pbiwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1pbiAgICAgICBJbmNsdXNpdmUgbG93ZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtYXggICAgICAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyPX0gY291bnQgICAgIElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7KG51bWJlcnxudW1iZXJbXSl9IEEgc2luZ2xlIG9yIG11bHRpcGxlIHJhbmRvbSBpbnRzLlxyXG4gICAgICovXHJcbiAgICByYW5kUmFuZ2U6IGZ1bmN0aW9uKG1pbiwgbWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmRSYW5nZShtaW4sIG1heCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByYW5kcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pbjtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBpbiByYW5nZSBbMCwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfG51bWJlcltdfSBBIHNpbmdsZSBvciBtdWx0aXBsZSByYW5kb20gaW50cy5cclxuICAgICAqL1xyXG4gICAgcmFuZDogZnVuY3Rpb24obWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmQobWF4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJhbmRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVvcmRlcnMgZ2l2ZW4gYXJyYXkgcmFuZG9tbHksIGRvZXNuJ3QgbW9kaWZ5IG9yaWdpbmFsIGFycmF5LlxyXG4gICAgICogQHBhcmFtICB7QXJyYXl9IGFyclxyXG4gICAgICogQHJldHVybiB7QXJyYXl9XHJcbiAgICAgKi9cclxuICAgIHNodWZmbGU6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBjbG9uZSA9IGFyci5zbGljZSgpO1xyXG4gICAgICAgIHZhciBzaHVmZmxlZCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gY2xvbmUubGVuZ3RoOyBpID4gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMucmFuZChpKTtcclxuICAgICAgICAgICAgc2h1ZmZsZWQucHVzaChjbG9uZS5zcGxpY2UoaW5kZXgsIDEpWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaHVmZmxlZDtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5nZSBvZiBpbnRlZ2Vycy5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSAgbWluICBJbmNsdXNpdmUgbG93ZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gIG1heCAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGVwPTFdIEluY3JlbWVudCB2YWx1ZS5cclxuICAgICAqIEByZXR1cm4ge251bWJlcltdfSAgICBUaGUgc3BlY2lmaWVkIHJhbmdlIG9mIG51bWJlcnMgaW4gYW4gYXJyYXkuXHJcbiAgICAgKi9cclxuICAgIHJhbmdlOiBmdW5jdGlvbihtaW4sIG1heCwgc3RlcCkge1xyXG4gICAgICAgIHN0ZXAgPSBzdGVwIHx8IDE7XHJcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xyXG4gICAgICAgIGlmIChzdGVwID4gMCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbWluOyBpIDwgbWF4OyBpICs9IHN0ZXApIHtcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IG1pbjsgaiA+IG1heDsgaiArPSBzdGVwKSB7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaChqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgd2hldGhlciBhcnJheXMgZXF1YWwuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIxXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIyXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBhcnJheXNFcXVhbDogZnVuY3Rpb24oYXJyMSwgYXJyMikge1xyXG4gICAgICAgIGlmIChhcnIxLmxlbmd0aCAhPT0gYXJyMi5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFycjEuZXZlcnkoZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZCA9PT0gYXJyMltpXTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhbnNsYXRlIGFuIGFycmF5IG9mIHBvaW50cyBieSBnaXZlbiB4IGFuZCB5IHZhbHVlcy5cclxuICAgICAqIEBwYXJhbSAge0FycmF5Ljxtb2R1bGU6Q29vcmRzQ29tcG9uZW50cy5Qb2ludD59IHBvaW50c1xyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgeFxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgeVxyXG4gICAgICogQHJldHVybiB7QXJyYXkuPG1vZHVsZTpDb29yZHNDb21wb25lbnRzLlBvaW50Pn1cclxuICAgICAqL1xyXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbihwb2ludHMsIHgsIHkpIHtcclxuICAgICAgICByZXR1cm4gcG9pbnRzLm1hcChmdW5jdGlvbihwb2ludCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW3BvaW50WzBdICsgeCwgcG9pbnRbMV0gKyB5XTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxjdWxhdGUgdGhlIGFyZWEgb2YgYSB0cmlhbmdsZS5cclxuICAgICAqIEBwYXJhbSAge0FycmF5Ljxtb2R1bGU6Q29vcmRzQ29tcG9uZW50cy5Qb2ludD59IHBvaW50c1xyXG4gICAgICogQHJldHVybiB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICB0cmlhbmdsZUFyZWE6IGZ1bmN0aW9uKHBvaW50cykge1xyXG4gICAgICAgIGlmIChwb2ludHMubGVuZ3RoICE9PSAzKVxyXG4gICAgICAgICAgICB0aHJvdyBcImludmFsaWQgbnVtYmVyIG9mIHBvaW50c1wiO1xyXG5cclxuICAgICAgICB2YXIgeDEgPSBwb2ludHNbMV1bMF0gLSBwb2ludHNbMF1bMF07XHJcbiAgICAgICAgdmFyIHkxID0gcG9pbnRzWzFdWzFdIC0gcG9pbnRzWzBdWzFdO1xyXG4gICAgICAgIHZhciB4MiA9IHBvaW50c1syXVswXSAtIHBvaW50c1swXVswXTtcclxuICAgICAgICB2YXIgeTIgPSBwb2ludHNbMl1bMV0gLSBwb2ludHNbMF1bMV07XHJcbiAgICAgICAgcmV0dXJuIDAuNSAqIE1hdGguYWJzKHgxKnkyIC0geDIqeTEpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbXBhcmUgZ2l2ZW4gYW5zd2VyIHRvIHRoZSBjb3JyZWN0IHNvbHV0aW9uLiBTdXBwb3J0cyB2YXJpb3VzIGRhdGEgdHlwZXMuXHJcbiAgICAgKiBAcGFyYW0gYW5zd2VyICAgVGhlIGFuc3dlciB2YWx1ZS5cclxuICAgICAqIEBwYXJhbSBzb2x1dGlvbiBUaGUgY29ycmVjdCBzb2x1dGlvbi5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZXBzaWxvbj0wLjAwMV0gIE1heCBlcnJvciB2YWx1ZSBmb3IgZmxvYXQgY29tcGFyaXNvbi5cclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgY29ycmVjdCwgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBtYXRjaGVzU29sdXRpb246IGZ1bmN0aW9uKGFuc3dlciwgc29sdXRpb24sIGVwc2lsb24pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGFuc3dlciA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIudHJpbSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBzb2x1dGlvbiA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICBhbnN3ZXIgPSBwYXJzZUZsb2F0KGFuc3dlcik7XHJcbiAgICAgICAgICAgIGlmIChpc05hTihhbnN3ZXIpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIGVwc2lsb24gPSBlcHNpbG9uID09PSB1bmRlZmluZWQgPyAwLjAwMSA6IGVwc2lsb247XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5hYnMoYW5zd2VyIC0gc29sdXRpb24pIDw9IGVwc2lsb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc29sdXRpb24gaW5zdGFuY2VvZiBSZWdFeHApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uLnRlc3QoYW5zd2VyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgaWYgKCFhbnN3ZXIgaW5zdGFuY2VvZiBBcnJheSB8fCBhbnN3ZXIubGVuZ3RoICE9PSBzb2x1dGlvbi5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYW5zd2VyLmV2ZXJ5KGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Lm1hdGNoZXNTb2x1dGlvbihkLCBzb2x1dGlvbltpXSwgZXBzaWxvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGlmICghYW5zd2VyIGluc3RhbmNlb2YgT2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGFuc0tleXMgPSBPYmplY3Qua2V5cyhhbnN3ZXIpO1xyXG4gICAgICAgICAgICBpZiAoYW5zS2V5cy5sZW5ndGggIT09IE9iamVjdC5rZXlzKHNvbHV0aW9uKS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYW5zS2V5cy5ldmVyeShmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5tYXRjaGVzU29sdXRpb24oYW5zd2VyW2RdLCBzb2x1dGlvbltkXSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFuc3dlciA9PT0gc29sdXRpb247XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tVdGlscztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIEFwcGxpY2F0aW9uID0gcmVxdWlyZShcIi4vanMvYXBwbGljYXRpb24uanNcIik7XHJcblxyXG4gICAgUmVhY3QucmVuZGVyQ29tcG9uZW50KFxyXG4gICAgICAgIEFwcGxpY2F0aW9uKG51bGwgKSxcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcGxpY2F0aW9uXCIpXHJcbiAgICApO1xyXG59KTtcclxuLyoganNoaW50IGlnbm9yZTplbmQgKi8iXX0=
