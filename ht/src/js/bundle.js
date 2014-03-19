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
    return {selectedTask: "Kappaleiden piirtäminen"};
  },

  render: function() {
    /* jshint ignore:start */
    var tasks = {
      "Yhteenlasku": AdditionTask( {onTaskDone:this.handleTaskDone, steps:5}),
      "Koordinaatiston lukeminen": SimpleCoordsTask( {onTaskDone:this.handleTaskDone, steps:5}),
      "Kappaleiden tunnistaminen": BasicShapesTask( {onTaskDone:this.handleTaskDone, time:20}),
      "Kappaleiden piirtäminen": DrawShapesTask( {onTaskDone:this.handleTaskDone, steps:5})
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
   */
  taskComponents.TaskTriggerAnimDiv = React.createClass({displayName: 'TaskTriggerAnimDiv',

    mixins: [Mixins.TriggerAnimationMixin],

    triggerAnim: function(animationClass, duration) {
      animationClass = animationClass || "";
      duration = duration || 1000;

      var elem = $(this.getDOMNode());
      this.animate(elem, animationClass, duration);
    },

    render: function() {
      return this.transferPropsTo(
        /* jshint ignore:start */
        React.DOM.div(null, 
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

      var taskIsDone = this.state.step > parseInt(this.props.steps);
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
            TaskTriggerAnimDiv( {ref:"score", className:"animated text-center"}, 
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
      var target = {name: "kolmio", area: 4, vertices: 3};

      this.setState({
        shapes: [],
        target: target,
        coordsDisabled: false
      });
    },

    checkAnswer: function() {
      this.setState({
        coordsDisabled: true
      });

      var shapes = this.state.shapes;

      var polygonPts = shapes.map(function(shape) {
        return shape.points[0];
      });

      shapes = [{points: polygonPts, fill: "steelblue"}];
      this.setState({shapes: shapes});

      var isCorrect = [true, false][Math.floor(Math.random() * 2)];

      setTimeout(function() {
        var polygon = this.state.shapes[0];
        polygon.fill = isCorrect ? "#1AC834" : "#8B0000";

        this.setState({
          shapes: [polygon],
        });

        setTimeout(this.reset, 1000);

      }.bind(this), 500);
    },

    handleStartBtnClick: function() {
      this.setState({isRunning: true});
      this.reset();
    },

    handleCoordsClick: function(x, y) {
      if (this.state.coordsDisabled || !this.state.isRunning)
        return;

      var target = this.state.target;
      var shapes = this.state.shapes;

      var complement = shapes.filter(function(shape) {
        var point = shape.points[0];
        return !(point[0] === x && point[1] === y);
      });

      if (complement.length < shapes.length) {
        // Remove a point
        shapes = complement;
      } else {
        // Add a point
        var newShape = {points: [[x, y]]};
        shapes.push(newShape);
      }

      this.setState({shapes: shapes});

      if (shapes.length === target.vertices) {
        this.checkAnswer();
      }
    },

    handleCorrectAnswer: function() {
      var step = this.state.step;
      if (step === this.props.steps)
        this.props.onTaskDone();
      else
        this.reset();
        this.setState({step: step + 1});
    },

    getInitialState: function() {
      return {
        step: 1,
        answer: null,
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
                  "Piirrä ", React.DOM.strong(null, this.state.target.name),", jonka pinta-ala on ", React.DOM.strong(null, this.state.target.area)
                )
              )
            )
          );
        } else {
          sidebar = (
            React.DOM.div(null, 
              TaskPanel( {header:"Ohjeet"}, 
                "Piirrä ohjeiden mukainen tasokuvio klikkailemalla koordinaatistoa.",
                React.DOM.hr(null),
                React.DOM.button( {className:"animated animated-repeat bounce btn btn-primary btn-block",
                onClick:this.handleStartBtnClick}, 
                  "Aloita tehtävä"
                )
              )
            )
          );
        }

      }
      else {
        question = TaskDoneDisplay( {score:this.props.steps});
      }

      return (
        React.DOM.div(null, 
          TaskHeader( {name:"Tasokuvioiden piirtäminen"}, 
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEFsZWtzaVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXHdhdGNoaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9jb29yZHMtY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvZm9ybS1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9mb3Jtcy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvbWF0aC1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9taXhpbnMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL3Rhc2tzL2FkZGl0aW9uLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9iYXNpYy1zaGFwZXMtdGFzay5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL3Rhc2tzL2RyYXctc2hhcGVzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy91dGlscy90YXNrLXV0aWxzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuLyogZ2xvYmFscyBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblxyXG5cclxudmFyIEFkZGl0aW9uVGFzayA9IHJlcXVpcmUoXCIuL3Rhc2tzL2FkZGl0aW9uLXRhc2tcIik7XHJcbnZhciBTaW1wbGVDb29yZHNUYXNrID0gcmVxdWlyZShcIi4vdGFza3Mvc2ltcGxlLWNvb3Jkcy10YXNrXCIpO1xyXG52YXIgQmFzaWNTaGFwZXNUYXNrID0gcmVxdWlyZShcIi4vdGFza3MvYmFzaWMtc2hhcGVzLXRhc2tcIik7XHJcbnZhciBEcmF3U2hhcGVzVGFzayA9IHJlcXVpcmUoXCIuL3Rhc2tzL2RyYXctc2hhcGVzLXRhc2tcIik7XHJcblxyXG4vKipcclxuICogQSBzbWFsbCBhcHBsaWNhdGlvbiB3aXRoIGEgZmV3IGV4YW1wbGUgdGFza3MuXHJcbiAqIEBtb2R1bGUgQXBwbGljYXRpb25cclxuICovXHJcbnZhciBBcHBsaWNhdGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FwcGxpY2F0aW9uJyxcclxuXHJcbiAgaGFuZGxlTGlzdENsaWNrOiBmdW5jdGlvbihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB2YXIgdGFza05hbWUgPSBlLnRhcmdldC50ZXh0O1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRUYXNrOiB0YXNrTmFtZX0pO1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZVRhc2tEb25lOiBmdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiVGFzayBkb25lIC0gaGVyZSdzIHdoZXJlIHRoZSB0YXNrIGNvbm5lY3RzIHRvIGFuIGV4dGVybmFsIGFwcC5cIik7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7c2VsZWN0ZWRUYXNrOiBcIkthcHBhbGVpZGVuIHBpaXJ0w6RtaW5lblwifTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgdmFyIHRhc2tzID0ge1xyXG4gICAgICBcIllodGVlbmxhc2t1XCI6IEFkZGl0aW9uVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZSwgc3RlcHM6NX0pLFxyXG4gICAgICBcIktvb3JkaW5hYXRpc3RvbiBsdWtlbWluZW5cIjogU2ltcGxlQ29vcmRzVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZSwgc3RlcHM6NX0pLFxyXG4gICAgICBcIkthcHBhbGVpZGVuIHR1bm5pc3RhbWluZW5cIjogQmFzaWNTaGFwZXNUYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lLCB0aW1lOjIwfSksXHJcbiAgICAgIFwiS2FwcGFsZWlkZW4gcGlpcnTDpG1pbmVuXCI6IERyYXdTaGFwZXNUYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lLCBzdGVwczo1fSlcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHRhc2tMaXN0RWxlbXMgPSBPYmplY3Qua2V5cyh0YXNrcykubWFwKGZ1bmN0aW9uKHRhc2tOYW1lKSB7XHJcbiAgICAgIHZhciBjbGFzc05hbWUgPSB0YXNrTmFtZSA9PT0gdGhpcy5zdGF0ZS5zZWxlY3RlZFRhc2sgPyBcInRleHQtbXV0ZWRcIiA6IFwiXCI7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmxpKG51bGwsIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6Y2xhc3NOYW1lLCBocmVmOlwiXCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVMaXN0Q2xpY2t9LCB0YXNrTmFtZSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIHZhciB0YXNrID0gdGFza3NbdGhpcy5zdGF0ZS5zZWxlY3RlZFRhc2tdO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibGlzdC1pbmxpbmVcIn0sIFxyXG4gICAgICAgICAgdGFza0xpc3RFbGVtc1xyXG4gICAgICAgICksXHJcblxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWNvbnRhaW5lclwifSwgXHJcbiAgICAgICAgICB0YXNrXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBsaWNhdGlvbjtcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgZDMsIE1hdGhVdGlscywgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDb21wb25lbnRzIGZvciBkcmF3aW5nIGdlb21ldHJpYyBzaGFwZXMgb24gdG8gYSBjb29yZGluYXRlIHN5c3RlbS5cclxuICogQG1vZHVsZSBDb29yZHNDb21wb25lbnRzXHJcbiAqL1xyXG52YXIgQ29vcmRzQ29tcG9uZW50cyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIGNvb3Jkc0NvbXBvbmVudHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogQW4gYXJyYXkgd2l0aCB0d28gZWxlbWVudHM6IHRoZSB4IGFuZCB5IGNvb3JkaW5hdGUuXHJcbiAgICogQHR5cGVkZWYge0FycmF5fSBQb2ludFxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6Q29vcmRzQ29tcG9uZW50c1xyXG4gICAqL1xyXG5cclxuICAvKipcclxuICAgKiBBIHNoYXBlIHRoYXQgaXMgZHJhd24gb24gdGhlIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gICAqIEB0eXBlZGVmIFNoYXBlXHJcbiAgICogQHR5cGUge09iamVjdH1cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZVxyXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBrZXlcclxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBvbkNsaWNrIC0gU2hhcGUgY2xpY2sgZXZlbnQgaGFuZGxlci5cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gc3Ryb2tlIC0gQSBDU1MgY29tcGF0aWJsZSBzdHJva2UgY29sb3IuXHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGZpbGwgLSBBIENTUyBjb21wYXRpYmxlIGZpbGwgY29sb3IuXHJcbiAgICogQHByb3BlcnR5IHtBcnJheS48bW9kdWxlOkNvb3Jkc0NvbXBvbmVudHMuUG9pbnQ+fSBwb2ludHMgLSBTaGFwZSB2ZXJ0aWNlcy5cclxuICAgKiBAcHJvcGVydHkge251bWJlcn0gciAtIENpcmNsZSByYWRpdXMgdGhhdCdzIHVzZWQgd2hlbiBvbmx5IG9uZSBwb2ludCBpcyBkZWZpbmVkLlxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6Q29vcmRzQ29tcG9uZW50c1xyXG4gICAqL1xyXG5cclxuICAvKipcclxuICAgKiBDb29yZGluYXRlIHN5c3RlbSBjbGljayBldmVudCBoYW5kbGVyLlxyXG4gICAqIEBjYWxsYmFjayBjb29yZHNPbkNsaWNrXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBDbGljayBwb3NpdGlvbidzIHggY29vcmRpbmF0ZSwgcm91bmRlZCB0byBuZWFyZXN0IGludGVnZXIuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBDbGljayBwb3NpdGlvbidzIHkgY29vcmRpbmF0ZSwgcm91bmRlZCB0byBuZWFyZXN0IGludGVnZXIuXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpDb29yZHNDb21wb25lbnRzXHJcbiAgICovXHJcblxyXG4gIC8qKlxyXG4gICAqIEEgMkQgY29vcmRpbmF0ZSBzeXN0ZW0sIGNvbnNpc3RzIG9mIGEgR3JpZCBhbmQgU2hhcGVzLlxyXG4gICAqIEBuYW1lIENvb3Jkc1xyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6Q29vcmRzQ29tcG9uZW50c1xyXG4gICAqXHJcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBbZHJhd0F4ZXM9dHJ1ZV0gLSBXaGV0aGVyIHRoZSB4IGFuZCB5IGF4ZXMgYXJlIGRyYXduLlxyXG4gICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG1vZHVsZTpDb29yZHNDb21wb25lbnRzLlNoYXBlPn0gW3NoYXBlcz1bXV0gLSBUaGUgZ2VvbWV0cmljIHNoYXBlcyB0byBkcmF3LlxyXG4gICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBbYm91bmRzPXttYXhZOjEwLCBtYXhYOjEwLCBtaW5ZOjAsIG1pblg6MH1dIC0gTWF4aW11bSBjb29yZGluYXRlIHZhbHVlcy5cclxuICAgKiBAcHJvcGVydHkge09iamVjdH0gW21hcmdpbj17dG9wOjIwLCByaWdodDoyMCwgYm90dG9tOjIwLCBsZWZ0OjIwfV0gLSBNYXJnaW4gYXJvdW5kIHRoZSBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgKiBAcHJvcGVydHkge251bWJlcn0gW2FzcGVjdD0xXSAtIENvb3JkaW5hdGUgc3lzdGVtIGFzcGVjdCByYXRpby5cclxuICAgKiBAcHJvcGVydHkge21vZHVsZTpDb29yZHNDb21wb25lbnRzLmNvb3Jkc09uQ2xpY2t9IFtvbkNsaWNrXSAtIENsaWNrIGV2ZW50IGhhbmRsZXIuXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIC8vIERyYXdpbmcgYSBzaW5nbGUgY2lyY2xlOlxyXG4gICAqIHZhciBjZW50ZXIgPSBbMSwgMl07XHJcbiAgICogdmFyIGJvdW5kcyA9IHttaW5YOiAwLCBtaW5ZOiAwLCBtYXhYOiAxMCwgbWF4WTogMTB9O1xyXG4gICAqIHZhciBzaGFwZXMgPSBbe3BvaW50czogW2NlbnRlcl0sIHI6IDAuNSwgc3Ryb2tlOiBcInJlZFwifV07XHJcbiAgICogUmVhY3QucmVuZGVyQ29tcG9uZW50KFxyXG4gICAqICAgPENvb3JkcyBzaGFwZXM9e3NoYXBlc30gYm91bmRzPXtib3VuZHN9Lz4sXHJcbiAgICogICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRhcmdldFwiKVxyXG4gICAqICk7XHJcbiAgICpcclxuICAgKiAvLyBEcmF3aW5nIGEgcG9seWdvbjpcclxuICAgKiB2YXIgdHJpYW5nbGUgPSBbe3BvaW50czogW1swLDBdLCBbMSwxXSwgWzIsMF1dfSwgZmlsbDogXCIjRkZGXCJdO1xyXG4gICAqIHZhciBzaGFwZXMgPSBbdHJpYW5nbGVdO1xyXG4gICAqIFJlYWN0LnJlbmRlckNvbXBvbmVudChcclxuICAgKiAgIDxDb29yZHMgc2hhcGVzPXtzaGFwZXN9IC8+LFxyXG4gICAqICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0YXJnZXRcIilcclxuICAgKiApO1xyXG4gICAqL1xyXG4gIGNvb3Jkc0NvbXBvbmVudHMuQ29vcmRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29vcmRzJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgZHJhd0F4ZXM6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgICBzaGFwZXM6IFJlYWN0LlByb3BUeXBlcy5hcnJheSxcclxuICAgICAgYm91bmRzOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgICBtYXJnaW46IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXHJcbiAgICAgIGFzcGVjdDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgICAgb25DbGljazogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlUmVzaXplOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHBhcmVudCA9ICQodGhpcy5nZXRET01Ob2RlKCkucGFyZW50Tm9kZSk7XHJcblxyXG4gICAgICB2YXIgbWFyZ2luID0gdGhpcy5wcm9wcy5tYXJnaW47XHJcbiAgICAgIHZhciB3aWR0aCA9IHBhcmVudCA/IHBhcmVudC53aWR0aCgpIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQgOiAwO1xyXG4gICAgICB2YXIgaGVpZ2h0ID0gTWF0aC5yb3VuZCh3aWR0aCAqIHRoaXMucHJvcHMuYXNwZWN0KSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xyXG5cclxuICAgICAgdmFyIGJvdW5kcyA9IHRoaXMucHJvcHMuYm91bmRzO1xyXG4gICAgICB2YXIgc3BhY2luZyA9IE1hdGgucm91bmQoTWF0aC5taW4oXHJcbiAgICAgICAgd2lkdGggLyBNYXRoLmFicyhib3VuZHMubWF4WCAtIGJvdW5kcy5taW5YKSxcclxuICAgICAgICBoZWlnaHQgLyBNYXRoLmFicyhib3VuZHMubWF4WSAtIGJvdW5kcy5taW5ZKVxyXG4gICAgICApKTtcclxuXHJcbiAgICAgIHZhciB4ID0gZDMuc2NhbGUubGluZWFyKClcclxuICAgICAgICAuZG9tYWluKFtib3VuZHMubWluWCwgYm91bmRzLm1pblggKyAxXSlcclxuICAgICAgICAucmFuZ2UoWzAsIHNwYWNpbmddKTtcclxuXHJcbiAgICAgIHZhciB5ID0gZDMuc2NhbGUubGluZWFyKClcclxuICAgICAgICAuZG9tYWluKFtib3VuZHMubWluWSwgYm91bmRzLm1pblkgKyAxXSlcclxuICAgICAgICAucmFuZ2UoW2hlaWdodCwgaGVpZ2h0IC0gc3BhY2luZ10pO1xyXG5cclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICBzcGFjaW5nOiBzcGFjaW5nLFxyXG4gICAgICAgIHg6IHgsXHJcbiAgICAgICAgeTogeVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyogVHJhbnNsYXRlIGFuZCByb3VuZCBzY3JlZW4gcG9zaXRpb24gaW50byBjb29yZGluYXRlcywgdHJpZ2dlciBldmVudC4gKi9cclxuICAgIGhhbmRsZVNWR0NsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBpZiAoISQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uQ2xpY2spKSByZXR1cm47XHJcblxyXG4gICAgICB2YXIgZWxlbSA9ICQodGhpcy5yZWZzLnN2Zy5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB2YXIgYm91bmRzID0gdGhpcy5wcm9wcy5ib3VuZHM7XHJcblxyXG4gICAgICB2YXIgc3ZnWCA9IGV2ZW50LnBhZ2VYIC0gZWxlbS5vZmZzZXQoKS5sZWZ0IC0gdGhpcy5wcm9wcy5tYXJnaW4ubGVmdDtcclxuICAgICAgdmFyIHN2Z1kgPSBldmVudC5wYWdlWSAtIGVsZW0ub2Zmc2V0KCkudG9wIC0gdGhpcy5wcm9wcy5tYXJnaW4udG9wO1xyXG4gICAgICB2YXIgY29vcmRzWCA9IE1hdGgubWF4KGJvdW5kcy5taW5YLCBNYXRoLm1pbihib3VuZHMubWF4WCwgTWF0aC5yb3VuZCh0aGlzLnN0YXRlLnguaW52ZXJ0KHN2Z1gpKSkpO1xyXG4gICAgICB2YXIgY29vcmRzWSA9IE1hdGgubWF4KGJvdW5kcy5taW5ZLCBNYXRoLm1pbihib3VuZHMubWF4WSwgTWF0aC5yb3VuZCh0aGlzLnN0YXRlLnkuaW52ZXJ0KHN2Z1kpKSkpO1xyXG5cclxuICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKGNvb3Jkc1gsIGNvb3Jkc1kpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge3dpZHRoOiAwfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBkcmF3QXhlczogdHJ1ZSxcclxuICAgICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICAgIGJvdW5kczoge21heFk6MTAsIG1heFg6MTAsIG1pblk6MCwgbWluWDowfSxcclxuICAgICAgICBhc3BlY3Q6IDEsXHJcbiAgICAgICAgbWFyZ2luOiB7dG9wOjIwLCByaWdodDoyMCwgYm90dG9tOjIwLCBsZWZ0OjIwfVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMuaGFuZGxlUmVzaXplKTtcclxuICAgICAgdGhpcy5oYW5kbGVSZXNpemUoKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLmhhbmRsZVJlc2l6ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIG1hcmdpbiA9IHRoaXMucHJvcHMubWFyZ2luO1xyXG4gICAgICB2YXIgYm91bmRzID0gdGhpcy5wcm9wcy5ib3VuZHM7XHJcbiAgICAgIHZhciB3aWR0aCA9IHRoaXMuc3RhdGUud2lkdGg7XHJcbiAgICAgIHZhciBoZWlnaHQgPSBNYXRoLnJvdW5kKHdpZHRoICogdGhpcy5wcm9wcy5hc3BlY3QpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcbiAgICAgIHZhciBzcGFjaW5nID0gdGhpcy5zdGF0ZS5zcGFjaW5nO1xyXG4gICAgICB2YXIgeCA9IHRoaXMuc3RhdGUueDtcclxuICAgICAgdmFyIHkgPSB0aGlzLnN0YXRlLnk7XHJcblxyXG4gICAgICB2YXIgZnVsbFdpZHRoID0gd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodDtcclxuICAgICAgdmFyIGZ1bGxIZWlnaHQgPSBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbTtcclxuICAgICAgdmFyIHRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIjtcclxuXHJcbiAgICAgIHZhciBzaGFwZXMsIGdyaWQ7XHJcbiAgICAgIGlmICh0aGlzLnN0YXRlLndpZHRoKSB7XHJcbiAgICAgICAgdmFyIFNoYXBlcyA9IGNvb3Jkc0NvbXBvbmVudHMuU2hhcGVzO1xyXG4gICAgICAgIHZhciBHcmlkID0gY29vcmRzQ29tcG9uZW50cy5HcmlkO1xyXG5cclxuICAgICAgICBzaGFwZXMgPSBTaGFwZXMoIHt4OngsIHk6eSwgc3BhY2luZzpzcGFjaW5nLCBkYXRhOnRoaXMucHJvcHMuc2hhcGVzfSApO1xyXG4gICAgICAgIGdyaWQgPSBHcmlkKCB7ZHJhd0F4ZXM6dGhpcy5wcm9wcy5kcmF3QXhlcywgeDp4LCB5OnksIGJvdW5kczpib3VuZHN9ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvb3Jkcy1jb250YWluZXJcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLnN2Zygge3JlZjpcInN2Z1wiLCBvbkNsaWNrOnRoaXMuaGFuZGxlU1ZHQ2xpY2ssIHdpZHRoOmZ1bGxXaWR0aCwgaGVpZ2h0OmZ1bGxIZWlnaHR9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmcoIHt0cmFuc2Zvcm06dHJhbnNmb3JtfSwgXHJcbiAgICAgICAgICAgICAgZ3JpZCxcclxuICAgICAgICAgICAgICBzaGFwZXNcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogRHJhdyBhIGdyaWQgb24gYSBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgKiBVc2VkIGJ5IHRoZSB7QGxpbmsgbW9kdWxlOkNvb3Jkc0NvbXBvbmVudHMuQ29vcmRzfENvb3JkcyBjb21wb25lbnR9LlxyXG4gICAqIEBuYW1lIEdyaWRcclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkNvb3Jkc0NvbXBvbmVudHNcclxuICAgKi9cclxuICBjb29yZHNDb21wb25lbnRzLkdyaWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdHcmlkJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgeDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgICAgeTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgICAgYm91bmRzOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXHJcbiAgICAgIHNwYWNpbmc6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIHRyYW5zaXRpb25EdXJhdGlvbjogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgICAgZHJhd0F4ZXM6IFJlYWN0LlByb3BUeXBlcy5ib29sXHJcbiAgICB9LFxyXG5cclxuICAgIHVwZGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgICAgdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCh0aGlzLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHZhciBib3VuZHMgPSBwcm9wcy5ib3VuZHM7XHJcbiAgICAgIHZhciBzcGFjaW5nID0gcHJvcHMuc3BhY2luZztcclxuICAgICAgdmFyIHggPSBwcm9wcy54O1xyXG4gICAgICB2YXIgeSA9IHByb3BzLnk7XHJcblxyXG4gICAgICB2YXIgeFJhbmdlID0gZDMucmFuZ2UoTWF0aC5jZWlsKChib3VuZHMubWluWCkgLyBzcGFjaW5nKSwgTWF0aC5yb3VuZChib3VuZHMubWF4WCkgKyBzcGFjaW5nLCBzcGFjaW5nKTtcclxuICAgICAgdmFyIHlSYW5nZSA9IGQzLnJhbmdlKE1hdGguY2VpbCgoYm91bmRzLm1pblkpIC8gc3BhY2luZyksIE1hdGgucm91bmQoYm91bmRzLm1heFkpICsgc3BhY2luZywgc3BhY2luZyk7XHJcbiAgICAgIHZhciBkYXRhID0geFJhbmdlLmNvbmNhdCh5UmFuZ2UpO1xyXG4gICAgICB2YXIgaXNYID0gZnVuY3Rpb24oaW5kZXgpIHsgcmV0dXJuIGluZGV4IDwgeFJhbmdlLmxlbmd0aDsgfTtcclxuXHJcbiAgICAgIHZhciBheGVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcIi5heGlzXCIpXHJcbiAgICAgICAgLmRhdGEoZGF0YSk7XHJcblxyXG4gICAgICBheGVzLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBcImF4aXMgXCIgKyAoKHByb3BzLmRyYXdBeGVzICYmIGQgPT09IDApID8gXCJ0aGlja1wiIDogXCJcIik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgYXhlcy50cmFuc2l0aW9uKCkuZHVyYXRpb24ocHJvcHMudHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoYm91bmRzLm1pblgpOyB9KVxyXG4gICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geShib3VuZHMubWluWSkgOiB5KGQpOyB9KVxyXG4gICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoYm91bmRzLm1heFgpOyB9KVxyXG4gICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geShib3VuZHMubWF4WSkgOiB5KGQpOyB9KTtcclxuXHJcbiAgICAgIGF4ZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgaWYgKHByb3BzLmRyYXdBeGVzKSB7XHJcbiAgICAgICAgdmFyIGxhYmVscyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCIubGFiZWxcIikuZGF0YShkYXRhKTtcclxuXHJcbiAgICAgICAgbGFiZWxzLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcImxhYmVsIFwiICsgKGlzWChpKSA/IFwieFwiIDogXCJ5XCIpOyB9KVxyXG4gICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbihkKSB7IGlmICghZCkgcmV0dXJuIFwibm9uZVwiOyB9KVxyXG4gICAgICAgICAgLnRleHQoT2JqZWN0KVxyXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyBcIjEuNGVtXCIgOiBcIi4zZW1cIjsgfSlcclxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8gbnVsbCA6IFwiLS44ZW1cIjsgfSlcclxuICAgICAgICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIDEgKyBcImVtXCIpO1xyXG5cclxuICAgICAgICBsYWJlbHMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB4KGQpIDogeCgwKTsgfSlcclxuICAgICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB5KDApIDogeShkKTsgfSk7XHJcblxyXG4gICAgICAgIGxhYmVscy5leGl0KCkucmVtb3ZlKCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBkcmF3QXhlczogdHJ1ZSxcclxuICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDU1MCxcclxuICAgICAgICBzcGFjaW5nOiAxXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy51cGRhdGUodGhpcy5wcm9wcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24obmV4dFByb3BzKSB7XHJcbiAgICAgIHRoaXMudXBkYXRlKG5leHRQcm9wcyk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgICAgUmVhY3QuRE9NLmcoIHtjbGFzc05hbWU6XCJheGVzXCJ9KVxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICAvKipcclxuICAgKiBEcmF3IHZhcmlvdXMgZ2VvbWV0cmljIHNoYXBlcyBvbiBhIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gICAqIFVzZWQgYnkgdGhlIHtAbGluayBtb2R1bGU6Q29vcmRzQ29tcG9uZW50cy5Db29yZHN8Q29vcmRzIGNvbXBvbmVudH0uXHJcbiAgICogQG5hbWUgU2hhcGVzXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpDb29yZHNDb21wb25lbnRzXHJcbiAgICovXHJcbiAgY29vcmRzQ29tcG9uZW50cy5TaGFwZXMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTaGFwZXMnLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBkYXRhOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZCxcclxuICAgICAgeDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgICAgeTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgICAgc3BhY2luZzogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICAgIH0sXHJcblxyXG4gICAgLyogUmVkcmF3IHNoYXBlcy4gR2V0cyBjYWxsZWQgd2hlbmV2ZXIgc2hhcGVzIGFyZSB1cGRhdGVkIG9yIHNjcmVlbiByZXNpemVzLiAqL1xyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihwcm9wcykge1xyXG4gICAgICB2YXIgY29udGFpbmVyID0gZDMuc2VsZWN0KHRoaXMuZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdmFyIHRyYW5zaXRpb25EdXJhdGlvbiA9IHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbiB8fCA1NTA7XHJcblxyXG4gICAgICB2YXIgcG9seWdvbnMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwicG9seWdvbi5zaGFwZVwiKVxyXG4gICAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA+IDI7IH0pKTtcclxuXHJcbiAgICAgIHZhciBhZGRlZFBvbHlnb25zID0gcG9seWdvbnMuZW50ZXIoKS5hcHBlbmQoXCJwb2x5Z29uXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZmlsbCB8fCBcInRyYW5zcGFyZW50XCI7IH0pO1xyXG5cclxuICAgICAgcG9seWdvbnMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcInBvaW50c1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICByZXR1cm4gZC5wb2ludHMubWFwKGZ1bmN0aW9uKHBzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbcHJvcHMueChwc1swXSksIHByb3BzLnkocHNbMV0pXTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZmlsbCB8fCBcInRyYW5zcGFyZW50XCI7IH0pO1xyXG5cclxuICAgICAgcG9seWdvbnMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuXHJcbiAgICAgIHZhciBjaXJjbGVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcImNpcmNsZS5zaGFwZVwiKVxyXG4gICAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA9PSAxOyB9KSk7XHJcblxyXG4gICAgICB2YXIgYWRkZWRDaXJjbGVzID0gY2lyY2xlcy5lbnRlcigpLmFwcGVuZChcImNpcmNsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzaGFwZVwiKVxyXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KTtcclxuXHJcbiAgICAgIGNpcmNsZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMF1bMF0pOyB9KVxyXG4gICAgICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueShkLnBvaW50c1swXVsxXSk7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnNwYWNpbmcgKiAoZC5yIHx8IDAuMik7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZmlsbCB8fCBcInRyYW5zcGFyZW50XCI7IH0pO1xyXG5cclxuICAgICAgY2lyY2xlcy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG5cclxuICAgICAgdmFyIGxpbmVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcImxpbmUuc2hhcGVcIilcclxuICAgICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPT0gMjsgfSkpO1xyXG5cclxuICAgICAgdmFyIGFkZGVkTGluZXMgPSBsaW5lcy5lbnRlcigpLmFwcGVuZChcImxpbmVcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIilcclxuICAgICAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5maWxsIHx8IFwidHJhbnNwYXJlbnRcIjsgfSk7XHJcblxyXG4gICAgICBsaW5lcy50cmFuc2l0aW9uKCkuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueChkLnBvaW50c1swXVswXSk7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzBdWzFdKTsgfSlcclxuICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMV1bMF0pOyB9KVxyXG4gICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueShkLnBvaW50c1sxXVsxXSk7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZmlsbCB8fCBcInRyYW5zcGFyZW50XCI7IH0pO1xyXG5cclxuICAgICAgbGluZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgLy8gQXR0YWNoIGNsaWNrIGV2ZW50IGxpc3RlbmVycy5cclxuICAgICAgW2FkZGVkUG9seWdvbnMsIGFkZGVkQ2lyY2xlcywgYWRkZWRMaW5lc10uZm9yRWFjaChmdW5jdGlvbihhZGRlZCkge1xyXG4gICAgICAgIGFkZGVkLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihkLm9uQ2xpY2spKVxyXG4gICAgICAgICAgICBkLm9uQ2xpY2soZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gU2V0IGNvbW1vbiBhdHRyaWJ1dGVzLlxyXG4gICAgICBjb250YWluZXIuc2VsZWN0QWxsKFwiLnNoYXBlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zdHJva2UgfHwgXCJzdGVlbGJsdWVcIjsgfSlcclxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiAoZC5zdHJva2VXaWR0aCB8fCAyKSArIFwicHhcIjsgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy51cGRhdGUodGhpcy5wcm9wcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24obmV4dFByb3BzKSB7XHJcbiAgICAgIHRoaXMudXBkYXRlKG5leHRQcm9wcyk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICByZXR1cm4gUmVhY3QuRE9NLmcoIHtjbGFzc05hbWU6XCJzaGFwZXNcIn0pO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gY29vcmRzQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29vcmRzQ29tcG9uZW50cztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBWYXJpb3VzIGNvbXBvbmVudHMgZm9yIGNyZWF0aW5nIHtAbGluayBtb2R1bGU6Rm9ybXN8YW5zd2VyIGZvcm1zfS5cclxuICogQG1vZHVsZSBGb3JtQ29tcG9uZW50c1xyXG4gKi9cclxudmFyIEZvcm1Db21wb25lbnRzID0gKGZ1bmN0aW9uKCl7XHJcblxyXG4gIHZhciBNaXhpbnMgPSByZXF1aXJlKFwiLi9taXhpbnNcIik7XHJcblxyXG4gIHZhciBmb3JtQ29tcG9uZW50cyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBBIGJsYW5rIGZvcm0gd2l0aCBhIHN1Ym1pdCBidXR0b24sIHVzZWQgYXMgYSBjb250YWluZXIgZm9yIHZhcmlvdXNcclxuICAgKiBpbnB1dCBjb21wb25lbnRzLiBUaGUgY2hpbGQgY29tcG9uZW50cyBjYW4gdG9nZ2xlIHRoZSBmb3JtJ3MgdmFsaWRpdHkgc3RhdHVzLFxyXG4gICAqIHByZXZlbnRpbmcgc3VibWl0IHdoZW4gaW5wdXRzIGFyZSBpbnZhbGlkLlxyXG4gICAqIEBuYW1lIEFuc3dlckZvcm1cclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkZvcm1Db21wb25lbnRzXHJcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gb25BbnN3ZXIgLSBGb3JtIHN1Ym1pdCBldmVudCBoYW5kbGVyLlxyXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnRuQ29ycmVjdEFuaW1DbGFzcz0nYW5pbWF0ZWQgYm91bmNlJ10gLSBUaGUgQ1NTIGFuaW1hdGlvbiBjbGFzcyBhcHBsaWVkIHRvIHN1Ym1pdFxyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24gdXBvbiBhIGNvcnJlY3QgYW5zd2VyLlxyXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnRuSW5jb3JyZWN0QW5pbUNsYXNzPSdhbmltYXRlZCBzaGFrZSddIC0gVGhlIENTUyBhbmltYXRpb24gY2xhc3MgYXBwbGllZCB0byBzdWJtaXRcclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbiB1cG9uIGFuIGluY29ycmVjdCBhbnN3ZXIuXHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtmb3JtQ2xhc3M9J2Zvcm0taG9yaXpvbnRhbCddIC0gRm9ybSBlbGVtZW50J3MgQ1NTIGNsYXNzLlxyXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYnRuQ2xhc3M9J2J0biBidG4tc3VjY2VzcyBidG4tbGcgYnRuLWJsb2NrJ10gLSBTdWJtaXQgYnV0dG9uJ3MgQ1NTIGNsYXNzLlxyXG4gICAqL1xyXG4gIGZvcm1Db21wb25lbnRzLkFuc3dlckZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBbnN3ZXJGb3JtJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIGJ0bkNvcnJlY3RBbmltQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGJ0bkluY29ycmVjdEFuaW1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgZm9ybUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICBtaXhpbnM6IFtNaXhpbnMuVHJpZ2dlckFuaW1hdGlvbk1peGluXSxcclxuXHJcbiAgICAvLyBTdWJtaXQgYW5zd2VyIGlmIGZvcm0gaXMgdmFsaWQuXHJcbiAgICBoYW5kbGVTdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgaWYgKGUpXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgaWYgKHRoaXMuc3RhdGUuaXNWYWxpZCkge1xyXG4gICAgICAgIHRoaXMucHJvcHMub25BbnN3ZXIoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93RXJyb3JzOiB0cnVlfSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBidG4gPSAkKHRoaXMucmVmcy5idG4uZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdGhpcy5hbmltYXRlKGJ0biwgdGhpcy5wcm9wcy5idG5Db3JyZWN0QW5pbUNsYXNzKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlSW5jb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGJ0biA9ICQodGhpcy5yZWZzLmJ0bi5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB0aGlzLmFuaW1hdGUoYnRuLCB0aGlzLnByb3BzLmJ0bkluY29ycmVjdEFuaW1DbGFzcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbGlkaXR5OiBmdW5jdGlvbihpc1ZhbGlkKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe2lzVmFsaWQ6IGlzVmFsaWQsIGlzRGlydHk6IHRydWV9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ2xlYXIgdmFsdWVzIGFuZCB2YWxpZGF0aW9uIHN0YXRlcyBmb3IgYWxsIGNoaWxkIGVsZW1lbnRzLlxyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxyXG4gICAgICAgIGlzRGlydHk6IGZhbHNlLFxyXG4gICAgICAgIHNob3dFcnJvcnM6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGZvcm1DbGFzczogXCJmb3JtLWhvcml6b250YWxcIixcclxuICAgICAgICBidG5DbGFzczogXCJidG4gYnRuLXN1Y2Nlc3MgYnRuLWxnIGJ0bi1ibG9ja1wiLFxyXG4gICAgICAgIGJ0bkNvcnJlY3RBbmltQ2xhc3M6IFwiYW5pbWF0ZWQgYm91bmNlXCIsXHJcbiAgICAgICAgYnRuSW5jb3JyZWN0QW5pbUNsYXNzOiBcImFuaW1hdGVkIHNoYWtlXCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxyXG4gICAgICAgIGlzRGlydHk6IGZhbHNlLFxyXG4gICAgICAgIHNob3dFcnJvcnM6IGZhbHNlXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIGNoaWxkcmVuID0gW10uY29uY2F0KHRoaXMucHJvcHMuY2hpbGRyZW4pLm1hcChmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGNoaWxkLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UgPSB0aGlzLnNldFZhbGlkaXR5O1xyXG4gICAgICAgIGNoaWxkLnByb3BzLm9uU3VibWl0ID0gdGhpcy5oYW5kbGVTdWJtaXQ7XHJcbiAgICAgICAgY2hpbGQucHJvcHMuc2hvd0Vycm9yID0gdGhpcy5zdGF0ZS5zaG93RXJyb3JzO1xyXG4gICAgICAgIHJldHVybiBjaGlsZDtcclxuICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgIHZhciBidG5DbGFzcyA9IHRoaXMucHJvcHMuYnRuQ2xhc3MgKyAodGhpcy5zdGF0ZS5pc1ZhbGlkID8gXCJcIiA6IFwiIGRpc2FibGVkXCIpO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZm9ybSgge3JvbGU6XCJmb3JtXCIsIGNsYXNzTmFtZTp0aGlzLnByb3BzLmZvcm1DbGFzcywgb25TdWJtaXQ6dGhpcy5oYW5kbGVTdWJtaXQsIG5vVmFsaWRhdGU6dHJ1ZX0sIFxyXG4gICAgICAgICAgY2hpbGRyZW4sXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcImJ0blwiLCB0eXBlOlwic3VibWl0XCIsIHZhbHVlOlwiVmFzdGFhXCIsIGNsYXNzTmFtZTpidG5DbGFzc30gKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGlucHV0IHdpdGggcmVndWxhciBleHByZXNzaW9uIHZhbGlkYXRpb24gYW5kIHZpc2libGUgdmFsaWRhdGlvbiBzdGF0ZXMuXHJcbiAgICogQG5hbWUgUmVJbnB1dFxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6Rm9ybUNvbXBvbmVudHNcclxuICAgKiBAcHJvcGVydHkge1JlZ0V4cH0gW3JlPS9eXFxzKi0/XFxkK1xccyokL10gLSBUaGUgdmFsaWRhdGluZyByZWd1bGFyIGV4cHJlc3Npb24uXHJcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBbc2hvd0Vycm9yPWZhbHNlXSAtIElzIGFuIGVycm9yIGxhYmVsIGlzIGRpc3BsYXllZC5cclxuICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IFtyZXF1aXJlZD10cnVlXSAtIElzIHRoZSBmaWVsZCByZXF1aXJlZC5cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW3BsYWNlaG9sZGVyXSAtIElucHV0IGZpZWxkIHBsYWNlaG9sZGVyIHRleHQuXHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IFt0eXBlPXRleHRdIC0gSW5wdXQgZmllbGQgdHlwZS5cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2NsYXNzTmFtZV0gLSBJbnB1dCBmaWVsZCBjbGFzcy5cclxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9uKGJvb2xlYW4pfSBbb25WYWxpZGl0eUNoYW5nZV0gLSBJbnB1dCB2YWxpZGl0eSBjaGFuZ2UgZXZlbnQgaGFuZGxlci5cclxuICAgKi9cclxuICBmb3JtQ29tcG9uZW50cy5SZUlucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUmVJbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHJlOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgICBzaG93RXJyb3I6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgICByZXF1aXJlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICB0eXBlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIG9uVmFsaWRpdHlDaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIC8qIFJlYWQgdmFsdWUsIHZhbGlkYXRlLCBub3RpZnkgcGFyZW50IGVsZW1lbnQgaWYgYW4gZXZlbnQgaXMgYXR0YWNoZWQuICovXHJcbiAgICBoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyIGlzVmFsaWQgPSB0aGlzLnZhbGlkYXRvci50ZXN0KGUudGFyZ2V0LnZhbHVlKTtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IGUudGFyZ2V0LnZhbHVlLCBpc1ZhbGlkOiBpc1ZhbGlkLCBpc0RpcnR5OiB0cnVlfSk7XHJcblxyXG4gICAgICBpZiAoJC5pc0Z1bmN0aW9uKHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZSkpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICB2YWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IHZhbHVlfSk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS52YWx1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZWZzLmlucHV0LmdldERPTU5vZGUoKS5zZWxlY3QoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyogQ2xlYXIgdmFsdWUgYW5kIHJlc2V0IHZhbGlkYXRpb24gc3RhdGVzLiAqL1xyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB2YWx1ZTogXCJcIixcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxyXG4gICAgICAgIGlzRGlydHk6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWxpZGF0b3I6IGZ1bmN0aW9uKHJlKSB7XHJcbiAgICAgIHRoaXMudmFsaWRhdG9yID0gbmV3IFJlZ0V4cChyZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRWYWxpZGF0b3IodGhpcy5wcm9wcy5yZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uKG5ld1Byb3BzKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsaWRhdG9yKG5ld1Byb3BzLnJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB2YWx1ZTogXCJcIixcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxyXG4gICAgICAgIGlzRGlydHk6IGZhbHNlLFxyXG4gICAgICAgIHR5cGU6IFwidGV4dFwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmU6IC9eXFxzKi0/XFxkK1xccyokLyxcclxuICAgICAgICBzaG93RXJyb3I6IGZhbHNlLFxyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogXCJcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciB2YWxpZGF0aW9uU3RhdGUgPSBSZWFjdC5hZGRvbnMuY2xhc3NTZXQoe1xyXG4gICAgICAgIFwiaGFzLXN1Y2Nlc3NcIjogdGhpcy5zdGF0ZS5pc1ZhbGlkICYmIHRoaXMuc3RhdGUuaXNEaXJ0eSxcclxuICAgICAgICBcImhhcy13YXJuaW5nXCI6ICF0aGlzLnN0YXRlLmlzRGlydHkgJiYgdGhpcy5wcm9wcy5zaG93RXJyb3IsXHJcbiAgICAgICAgXCJoYXMtZXJyb3JcIjogIXRoaXMuc3RhdGUuaXNWYWxpZFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBlcnJvcjtcclxuICAgICAgaWYgKHRoaXMucHJvcHMuc2hvd0Vycm9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmlzVmFsaWQpIHtcclxuICAgICAgICAgIGVycm9yID0gUmVhY3QuRE9NLmxhYmVsKCB7Y2xhc3NOYW1lOlwiY29udHJvbC1sYWJlbFwifSwgXCJWaXJoZWVsbGluZW4gc3nDtnRlXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLnByb3BzLnJlcXVpcmVkICYmIHRoaXMudmFsdWUoKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGVycm9yID0gUmVhY3QuRE9NLmxhYmVsKCB7Y2xhc3NOYW1lOlwiY29udHJvbC1sYWJlbFwifSwgXCJUw6R5dMOkIHTDpG3DpCBrZW50dMOkXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXAgXCIgKyB2YWxpZGF0aW9uU3RhdGV9LCBcclxuICAgICAgICAgIGVycm9yLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7cmVmOlwiaW5wdXRcIiwgb25DaGFuZ2U6dGhpcy5oYW5kbGVDaGFuZ2UsIHZhbHVlOnRoaXMuc3RhdGUudmFsdWUsIHBsYWNlaG9sZGVyOnRoaXMucHJvcHMucGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICB0eXBlOnRoaXMucHJvcHMudHlwZSwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIFwiICsgdGhpcy5wcm9wcy5jbGFzc05hbWV9IClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgbnVtYmVyIGlucHV0IHdpdGggYnV0dG9ucyBvbiBlaXRoZXIgc2lkZSBmb3IgaW5jcmVtZW50aW5nIGFuZCBkZWNyZW1lbnRpbmcuXHJcbiAgICogVXNlcyB7QGxpbmsgbW9kdWxlOkZvcm1Db21wb25lbnRzLlJlSW5wdXR8UmVJbnB1dH0gZm9yIHZhbGlkYXRpb24uXHJcbiAgICogQG5hbWUgTnVtSW5wdXRcclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkZvcm1Db21wb25lbnRzXHJcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IFtzdGVwPTFdIC0gSG93IG11Y2ggdGhlIHZhbHVlIGNoYW5nZXMgb24gYSBzaW5nbGUgaW5jcmVtZW50L2RlY3JlbWVudC5cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW3BsYWNlaG9sZGVyXSAtIElucHV0IHBsYWNlaG9sZGVyIHRleHQuXHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtidG5DbGFzcz0nYnRuIGJ0bi1sZyBidG4taW5mbyddIC0gSW5jcmVtZW50L2RlY3JlbWVudCBidXR0b24gY2xhc3MuXHJcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbihib29sZWFuKX0gW29uVmFsaWRpdHlDaGFuZ2VdIC0gSW5wdXQgdmFsaWRpdHkgY2hhbmdlIGV2ZW50IGhhbmRsZXIuXHJcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gW29uU3VibWl0XSAtIElucHV0IHN1Ym1pdCBldmVudCBoYW5kbGVyLCB0cmlnZ2VyZWQgd2hlbiBFbnRlciBpcyBjbGlja2VkLlxyXG4gICAqL1xyXG4gIGZvcm1Db21wb25lbnRzLk51bUlucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTnVtSW5wdXQnLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzdGVwOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxyXG4gICAgICBwbGFjZWhvbGRlcjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgYnRuQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIG9uVmFsaWRpdHlDaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxyXG4gICAgICBvblN1Ym1pdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsdWVBbmRWYWxpZGl0eTogZnVuY3Rpb24odmFsdWUsIGlzVmFsaWQpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdmFsdWU6IHZhbHVlLCBpc1ZhbGlkOiBpc1ZhbGlkXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoJC5pc0Z1bmN0aW9uKHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZSkpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eShcIlwiLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlRGVjcmVtZW50OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KHRoaXMudmFsdWUoKSAtIHRoaXMucHJvcHMuc3RlcCwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUluY3JlbWVudDogZnVuY3Rpb24oZSkge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh0aGlzLnZhbHVlKCkgKyB0aGlzLnByb3BzLnN0ZXAsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiBSZXNldCBzdGF0ZSB0byBpbnB1dCB2YWx1ZSBpZiBpbnB1dCB2YWx1ZSBpcyBhIG51bWJlci4gKi9cclxuICAgIGhhbmRsZUNoYW5nZTogZnVuY3Rpb24oZSkge1xyXG4gICAgICB2YXIgdmFsID0gZS50YXJnZXQudmFsdWU7XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gIWlzTmFOKHBhcnNlRmxvYXQodmFsKSk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh2YWwsIGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiBUcnkgdG8gc3VibWl0IHBhcmVudCBmb3JtIHdoZW4gRW50ZXIgaXMgY2xpY2tlZC4gKi9cclxuICAgIGhhbmRsZUtleVByZXNzOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uU3VibWl0KVxyXG4gICAgICAgICAgdGhpcy5wcm9wcy5vblN1Ym1pdCgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodGhpcy5zdGF0ZS52YWx1ZSkgfHwgMDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB2YWx1ZTogbnVsbCxcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMSxcclxuICAgICAgICBidG5DbGFzczogXCJidG4gYnRuLWxnIGJ0bi1pbmZvXCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgUmVJbnB1dCA9IGZvcm1Db21wb25lbnRzLlJlSW5wdXQ7XHJcbiAgICAgIHZhciBidG5DbGFzcyA9IHRoaXMucHJvcHMuYnRuQ2xhc3M7XHJcbiAgICAgIHZhciB2YWxpZGF0aW9uU3RhdGUgPSB0aGlzLnN0YXRlLmlzVmFsaWQgPyBcImhhcy1zdWNjZXNzXCIgOiBcImhhcy1lcnJvclwiO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cCBcIiArIHZhbGlkYXRpb25TdGF0ZX0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tMyBjb2wteHMtM1wifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3RhYkluZGV4OlwiLTFcIiwgY2xhc3NOYW1lOmJ0bkNsYXNzICsgXCIgcHVsbC1yaWdodFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlRGVjcmVtZW50fSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1sZWZ0XCJ9KVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IGNvbC14cy02XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwibnVtYmVyXCIsIHZhbHVlOnRoaXMuc3RhdGUudmFsdWUsIG9uQ2hhbmdlOnRoaXMuaGFuZGxlQ2hhbmdlLCBvbktleVByZXNzOnRoaXMuaGFuZGxlS2V5UHJlc3MsXHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LWxnIHRleHQtY2VudGVyXCIsIHBsYWNlaG9sZGVyOnRoaXMucHJvcHMucGxhY2Vob2xkZXJ9KVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTMgY29sLXhzLTNcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0YWJJbmRleDpcIi0xXCIsIGNsYXNzTmFtZTpidG5DbGFzcyArIFwiIHB1bGwtbGVmdFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlSW5jcmVtZW50fSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodFwifSlcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBmb3JtQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1Db21wb25lbnRzO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbXBsZXRlIGFuc3dlciBmb3JtcyBmb3IgdGFza3MuIEZvcm1zIGNvbnNpc3Qgb2Yge0BsaW5rIG1vZHVsZTpGb3JtQ29tcG9uZW50c3xmb3JtIGNvbXBvbmVudHN9LlxyXG4gKiBAbW9kdWxlIEZvcm1zXHJcbiAqL1xyXG52YXIgRm9ybXMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBGb3JtQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuL2Zvcm0tY29tcG9uZW50c1wiKTtcclxuICB2YXIgQW5zd2VyRm9ybSA9IEZvcm1Db21wb25lbnRzLkFuc3dlckZvcm07XHJcbiAgdmFyIE51bUlucHV0ID0gRm9ybUNvbXBvbmVudHMuTnVtSW5wdXQ7XHJcblxyXG4gIHZhciBmb3JtcyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBGb3JtIHdpdGggYSBzaW5nbGUge0BsaW5rIG1vZHVsZTpGb3JtQ29tcG9uZW50cy5OdW1JbnB1dHxOdW1JbnB1dH0uXHJcbiAgICogQG5hbWUgU2luZ2xlTnVtYmVyRm9ybVxyXG4gICAqIEBtZW1iZXJvZiBtb2R1bGU6Rm9ybXNcclxuICAgKiBAcHJvcGVydHkge21vZHVsZTpGb3Jtcy5zaW5nbGVOdW1iZXJGb3JtT25BbnN3ZXJ9IG9uQW5zd2VyIC0gRm9ybSBhbnN3ZXIgZXZlbnQgaGFuZGxlci5cclxuICAgKi9cclxuICBmb3Jtcy5TaW5nbGVOdW1iZXJGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU2luZ2xlTnVtYmVyRm9ybScsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB7QGxpbmsgbW9kdWxlOkZvcm1zLlNpbmdsZU51bWJlckZvcm18U2luZ2xlTnVtYmVyRm9ybX0ncyBhbnN3ZXIgZXZlbnQgaGFuZGxlci5cclxuICAgICAqIEBjYWxsYmFjayBzaW5nbGVOdW1iZXJGb3JtT25BbnN3ZXJcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIFRoZSBhbnN3ZXIgdmFsdWUuXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2FzIHRoZSBhbnN3ZXIgY29ycmVjdC5cclxuICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6Rm9ybXNcclxuICAgICAqL1xyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBvbkFuc3dlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaXNDb3JyZWN0ID0gdGhpcy5wcm9wcy5vbkFuc3dlcih0aGlzLnJlZnMuYW5zd2VyLnZhbHVlKCkpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVJbmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5mb3JtLnJlc2V0KCk7XHJcbiAgICAgIHRoaXMucmVmcy5hbnN3ZXIucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgICAgQW5zd2VyRm9ybSgge3JlZjpcImZvcm1cIiwgY2xhc3NOYW1lOlwiZm9ybS1ob3Jpem9udGFsXCIsIG9uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSwgXHJcbiAgICAgICAgICBOdW1JbnB1dCgge3JlZjpcImFuc3dlclwiLCBwbGFjZWhvbGRlcjpcIlZhc3RhYSB0w6Row6RuXCJ9KVxyXG4gICAgICAgIClcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBGb3JtIHdpdGggdHdvIHtAbGluayBtb2R1bGU6Rm9ybUNvbXBvbmVudHMuTnVtSW5wdXR8TnVtSW5wdXRzfSBmb3IgeCBhbmQgeSBjb29yZGluYXRlcy5cclxuICAgKiBAbmFtZSBDb29yZHNBbnN3ZXJGb3JtXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpGb3Jtc1xyXG4gICAqIEBwcm9wZXJ0eSB7bW9kdWxlOkZvcm1zLmNvb3Jkc0Fuc3dlckZvcm1PbkFuc3dlcn0gb25BbnN3ZXIgLSBBbnN3ZXIgZXZlbnQgaGFuZGxlci5cclxuICAgKi9cclxuICBmb3Jtcy5Db29yZHNBbnN3ZXJGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29vcmRzQW5zd2VyRm9ybScsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB7QGxpbmsgbW9kdWxlOkZvcm1zLkNvb3Jkc0Fuc3dlckZvcm18Q29vcmRzQW5zd2VyRm9ybX0ncyBhbnN3ZXIgZXZlbnQgaGFuZGxlci5cclxuICAgICAqIEBjYWxsYmFjayBjb29yZHNBbnN3ZXJGb3JtT25BbnN3ZXJcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geVxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFdhcyB0aGUgYW5zd2VyIGNvcnJlY3QuXHJcbiAgICAgKiBAbWVtYmVyb2YgbW9kdWxlOkZvcm1zXHJcbiAgICAgKi9cclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGlzQ29ycmVjdCA9IHRoaXMucHJvcHMub25BbnN3ZXIodGhpcy5yZWZzLngudmFsdWUoKSwgdGhpcy5yZWZzLnkudmFsdWUoKSk7XHJcbiAgICAgIGlmIChpc0NvcnJlY3QpIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMucmVmcy5mb3JtLmhhbmRsZUluY29ycmVjdEFuc3dlcigpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZWZzLmZvcm0ucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIEFuc3dlckZvcm0oIHtyZWY6XCJmb3JtXCIsIGNsYXNzTmFtZTpcImZvcm0taG9yaXpvbnRhbFwiLCBvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0sIFxyXG4gICAgICAgICAgTnVtSW5wdXQoIHtyZWY6XCJ4XCIsIHBsYWNlaG9sZGVyOlwieFwifSksXHJcbiAgICAgICAgICBOdW1JbnB1dCgge3JlZjpcInlcIiwgcGxhY2Vob2xkZXI6XCJ5XCJ9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGZvcm1zO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRm9ybXM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIG1vZHVsZSwgTWF0aEpheCAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29tcG9uZW50cyBmb3IgbWF0aHMgdGFza3MuXHJcbiAqIEBtb2R1bGUgTWF0aENvbXBvbmVudHNcclxuICovXHJcbnZhciBNYXRoQ29tcG9uZW50cyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIG1hdGhDb21wb25lbnRzID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbmRlciBMYVRleCBtYXRocyBub3RhdGlvbiBpbnRvIHdlYiBmb250cyB1c2luZyBNYXRoSmF4LlxyXG4gICAqIEBuYW1lIE1hdGhKYXhcclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOk1hdGhDb21wb25lbnRzXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIC8vIFJlbmRlciBhIHNpbXBsZSBmb3JtdWxhOlxyXG4gICAqXHJcbiAgICogdmFyIGNvbnRlbnRzID0gXCJhXzEgKyBiXzIgPSBjXzNcIjtcclxuICAgKiB2YXIgZm9ybXVsYSA9IChcclxuICAgKiAgIDxNYXRoSmF4PlxyXG4gICAqICAgICB7Y29udGVudHN9XHJcbiAgICogICA8L01hdGhKYXg+XHJcbiAgICogKTtcclxuICAgKlxyXG4gICAqIFJlYWN0LnJlbmRlckNvbXBvbmVudChcclxuICAgKiAgIGZvcm11bGEsXHJcbiAgICogICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRhcmdldFwiKVxyXG4gICAqICk7XHJcbiAgICovXHJcbiAgbWF0aENvbXBvbmVudHMuTWF0aEpheCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01hdGhKYXgnLFxyXG4gICAgcmVwcm9jZXNzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGVsZW0gPSB0aGlzLnJlZnMuc2NyaXB0LmdldERPTU5vZGUoKTtcclxuICAgICAgTWF0aEpheC5IdWIuUXVldWUoW1wiUmVwcm9jZXNzXCIsIE1hdGhKYXguSHViLCBlbGVtXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXByb2Nlc3MoKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXByb2Nlc3MoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uc2NyaXB0KCB7cmVmOlwic2NyaXB0XCIsIHR5cGU6XCJtYXRoL3RleFwifSwgdGhpcy5wcm9wcy5jaGlsZHJlbilcclxuICAgICAgICApXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBtYXRoQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGhDb21wb25lbnRzO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29tcG9uZW50IGV4dGVuc2lvbnMgaS5lLiB7QGxpbmsgaHR0cDovL2ZhY2Vib29rLmdpdGh1Yi5pby9yZWFjdC9kb2NzL3JldXNhYmxlLWNvbXBvbmVudHMuaHRtbCNtaXhpbnN8bWl4aW5zfS5cclxuICogQG1vZHVsZSBNaXhpbnNcclxuICovXHJcbnZhciBNaXhpbnMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBtaXhpbnMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogUHJvdmlkZXMgYSBzZXRJbnRlcnZhbCBmdW5jdGlvbiB3aGljaCB3aWxsIGdldCBjbGVhbmVkIHVwIHdoZW5cclxuICAgKiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cclxuICAgKiBAbmFtZSBTZXRJbnRlcnZhbE1peGluXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpNaXhpbnNcclxuICAgKi9cclxuICBtaXhpbnMuU2V0SW50ZXJ2YWxNaXhpbiA9IHtcclxuICAgIHNldEludGVydmFsOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMucHVzaChzZXRJbnRlcnZhbC5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJBbGxJbnRlcnZhbHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmludGVydmFscy5tYXAoY2xlYXJJbnRlcnZhbCk7XHJcbiAgICAgIHRoaXMuaW50ZXJ2YWxzID0gW107XHJcbiAgICB9LFxyXG5cclxuICAgIC8qIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgaW5pdGlhbGl6ZWQuICovXHJcbiAgICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmludGVydmFscyA9IFtdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGRlc3Ryb3llZC4gKi9cclxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jbGVhckFsbEludGVydmFscygpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFByb3ZpZGVzIGEgc2V0VGltZW91dCBmdW5jdGlvbiB3aGljaCB3aWxsIGdldCBjbGVhbmVkIHVwIHdoZW5cclxuICAgKiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cclxuICAgKiBAbmFtZSBTZXRUaW1lb3V0TWl4aW5cclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOk1peGluc1xyXG4gICAqL1xyXG4gIG1peGlucy5TZXRUaW1lb3V0TWl4aW4gPSB7XHJcbiAgICBzZXRUaW1lb3V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyQWxsVGltZW91dHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnRpbWVvdXRzLm1hcChjbGVhclRpbWVvdXQpO1xyXG4gICAgICB0aGlzLnRpbWVvdXRzID0gW107XHJcbiAgICB9LFxyXG5cclxuICAgIC8qIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgaW5pdGlhbGl6ZWQuICovXHJcbiAgICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnRpbWVvdXRzID0gW107XHJcbiAgICB9LFxyXG5cclxuICAgIC8qIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgZGVzdHJveWVkLiAqL1xyXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNsZWFyQWxsVGltZW91dHMoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBcHBseSBDU1MgY2xhc3NlcyBmb3Igc2V0IGR1cmF0aW9uIC0gdXNlZnVsIGZvciBzaW5nbGVzaG90IGFuaW1hdGlvbnMuXHJcbiAgICogQG5hbWUgVHJpZ2dlckFuaW1hdGlvbk1peGluXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpNaXhpbnNcclxuICAgKi9cclxuICBtaXhpbnMuVHJpZ2dlckFuaW1hdGlvbk1peGluID0ge1xyXG5cclxuICAgIGFuaW1hdGU6IGZ1bmN0aW9uKGVsZW0sIGNsYXNzTmFtZSwgZHVyYXRpb24pIHtcclxuICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbiB8fCAxMDAwO1xyXG4gICAgICBpZiAoIXRoaXMudGltZW91dCAmJiB0aGlzLnRpbWVvdXQgIT09IDApIHtcclxuICAgICAgICBlbGVtLmFkZENsYXNzKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGVsZW0ucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKTtcclxuICAgICAgICAgIHRoaXMudGltZW91dCA9IG51bGw7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpLCBkdXJhdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gbWl4aW5zO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWl4aW5zO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQ29tbW9uIHRhc2sgY29tcG9uZW50cy5cclxuICogQG1vZHVsZSBUYXNrQ29tcG9uZW50c1xyXG4gKi9cclxudmFyIFRhc2tDb21wb25lbnRzID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgTWl4aW5zID0gcmVxdWlyZShcIi4vbWl4aW5zXCIpO1xyXG5cclxuICB2YXIgdGFza0NvbXBvbmVudHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSB3cmFwcGVyIGZvciBCb290c3RyYXAncyBwYW5lbCBjb21wb25lbnQuXHJcbiAgICogQG5hbWUgVGFza1BhbmVsXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpUYXNrQ29tcG9uZW50c1xyXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY2xhc3NOYW1lPSdwYW5lbC1pbmZvJ10gLSBQYW5lbCBjbGFzcyBuYW1lLlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tQYW5lbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tQYW5lbCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBjbGFzc05hbWUgPSBcInBhbmVsIFwiICsgKHRoaXMucHJvcHMuY2xhc3NOYW1lIHx8IFwicGFuZWwtaW5mb1wiICk7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NOYW1lfSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtaGVhZGluZ1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMygge2NsYXNzTmFtZTpcInBhbmVsLXRpdGxlXCJ9LCB0aGlzLnByb3BzLmhlYWRlcilcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtYm9keVwifSwgXHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBmb3IgQm9vdHN0cmFwJ3MgcHJvZ3Jlc3MgYmFyIGVsZW1lbnQuXHJcbiAgICogQG5hbWUgVGFza1Byb2dyZXNzQmFyXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpUYXNrQ29tcG9uZW50c1xyXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBtYXggLSBUaGUgbWF4aW11bSBwcm9ncmVzcyB2YWx1ZS5cclxuICAgKiBAcHJvcGVydHkge251bWJlcn0gbm93IC0gVGhlIGN1cnJlbnQgcHJvZ3Jlc3MgdmFsdWUuXHJcbiAgICovXHJcbiAgdGFza0NvbXBvbmVudHMuVGFza1Byb2dyZXNzQmFyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza1Byb2dyZXNzQmFyJyxcclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBtYXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgbm93OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgc2luZ2xlV2lkdGggPSBNYXRoLmNlaWwoMSAvIHRoaXMucHJvcHMubWF4ICogMTAwKTtcclxuICAgICAgdmFyIGxlZnRTdHlsZSA9IHt3aWR0aDogc2luZ2xlV2lkdGggKiAodGhpcy5wcm9wcy5ub3cgLSAxKSArIFwiJVwifTtcclxuICAgICAgdmFyIHJpZ2h0U3R5bGUgPSB7d2lkdGg6IHNpbmdsZVdpZHRoICogKHRoaXMucHJvcHMubWF4IC0gdGhpcy5wcm9wcy5ub3cgKyAxKSArIFwiJVwifTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIHRhc2stcHJvZ3Jlc3MtYmFyXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcy1iYXIgcHJvZ3Jlc3MtYmFyLXN1Y2Nlc3NcIiwgc3R5bGU6bGVmdFN0eWxlfSksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MtYmFyIHByb2dyZXNzLWJhci13YXJuaW5nXCIsIHN0eWxlOnJpZ2h0U3R5bGV9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSB0aW1lciB0aGF0IGNvdW50cyBkb3duIGZyb20gYSBzcGVjaWZpZWQgdGltZSBhbmQgdHJpZ2dlcnMgYW4gZXZlbnRcclxuICAgKiB3aGVuIGZpbmlzaGVkLiBSZW1haW5pbmcgdGltZSBpcyBkaXNwbGF5ZWQgaW4gYSBwcm9ncmVzcyBiYXIuXHJcbiAgICogQG5hbWUgVGFza0NvdW50ZG93blRpbWVyXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpUYXNrQ29tcG9uZW50c1xyXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0aW1lIC0gQ291bnRkb3duIGR1cmF0aW9uIGluIHNlY29uZHMuXHJcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBbc3RhcnRPbk1vdW50PWZhbHNlXSAtIERvZXMgY291bnRkb3duIHN0YXJ0IGF1dG9tYXRpY2FsbHkgd2hlbiByZW5kZXJlZC5cclxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBbb25FeHBpcnldIC0gQ291bnRkb3duIGV4cGlyeSBldmVudCBoYW5kbGVyLlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tDb3VudGRvd25UaW1lciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tDb3VudGRvd25UaW1lcicsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHRpbWU6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgc3RhcnRPbk1vdW50OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgICAgb25FeHBpcnk6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIG1peGluczogW01peGlucy5TZXRJbnRlcnZhbE1peGluXSxcclxuXHJcbiAgICBzdGFydENvdW50ZG93bjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHRpbWVMZWZ0OiB0aGlzLnByb3BzLnRpbWVcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0aGlzLnNldEludGVydmFsKHRoaXMudGljaywgMTAwMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRpY2s6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgdGltZUxlZnQgPSB0aGlzLnN0YXRlLnRpbWVMZWZ0IC0gMTtcclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHRpbWVMZWZ0OiB0aW1lTGVmdFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmICh0aW1lTGVmdCA8IDEpIHtcclxuICAgICAgICB0aGlzLmNsZWFyQWxsSW50ZXJ2YWxzKCk7XHJcbiAgICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uRXhwaXJ5KSkgdGhpcy5wcm9wcy5vbkV4cGlyeSgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMucHJvcHMuc3RhcnRPbk1vdW50KSB0aGlzLnN0YXJ0Q291bnRkb3duKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdGltZUxlZnQ6IHRoaXMucHJvcHMudGltZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBzaW5nbGVXaWR0aCA9IE1hdGguY2VpbCgxIC8gdGhpcy5wcm9wcy50aW1lICogMTAwKTtcclxuICAgICAgdmFyIHdpZHRoID0gTWF0aC5jZWlsKDEgLyB0aGlzLnByb3BzLnRpbWUgKiAxMDAgKiB0aGlzLnN0YXRlLnRpbWVMZWZ0KTtcclxuICAgICAgdmFyIGJhclN0eWxlID0ge3dpZHRoOiB3aWR0aCArIFwiJVwifTtcclxuXHJcbiAgICAgIHZhciBiYXJDbGFzcyA9IFJlYWN0LmFkZG9ucy5jbGFzc1NldCh7XHJcbiAgICAgICAgXCJwcm9ncmVzcy1iYXItc3VjY2Vzc1wiOiB3aWR0aCA+PSA0MCxcclxuICAgICAgICBcInByb2dyZXNzLWJhci13YXJuaW5nXCI6IHdpZHRoIDwgNDAgJiYgd2lkdGggPiAyMCxcclxuICAgICAgICBcInByb2dyZXNzLWJhci1kYW5nZXJcIjogd2lkdGggPD0gMjAsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmUgdGFzay1wcm9ncmVzcy1iYXJcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzLWJhciBcIiArIGJhckNsYXNzLCBzdHlsZTpiYXJTdHlsZX0pXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBUYXNrIGhlYWRlci5cclxuICAgKiBAbmFtZSBUYXNrSGVhZGVyXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpUYXNrQ29tcG9uZW50c1xyXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lIC0gVGFzayBuYW1lIHRvIGRpc3BsYXkgaW4gdGhlIGhlYWRlci5cclxuICAgKi9cclxuICB0YXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza0hlYWRlcicsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG5hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhc2staGVhZGVyIHJvd1wifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTdcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDIobnVsbCwgdGhpcy5wcm9wcy5uYW1lKVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNVwifSwgXHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICAvKipcclxuICAgKiBBIHBhbmVsIHRoYXQgaXMgc2hvd24gYWZ0ZXIgY29tcGxldGluZyBhIHRhc2suXHJcbiAgICogQG5hbWUgVGFza0RvbmVEaXNwbGF5XHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpUYXNrQ29tcG9uZW50c1xyXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2NvcmVdIC0gU2NvcmUgdG8gZGlzcGxheS5cclxuICAgKi9cclxuICB0YXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXkgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrRG9uZURpc3BsYXknLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzY29yZTogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBzY29yZSA9IHRoaXMucHJvcHMuc2NvcmUgfHwgMDtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhc2stZG9uZS1kaXNwbGF5IGFuaW1hdGUgYm91bmNlLWluXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJhbGVydCBhbGVydC1zdWNjZXNzXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBcIlRlaHTDpHbDpCBzdW9yaXRldHR1IVwiKSwgXCIgUGlzdGVpdMOkOiBcIiwgc2NvcmVcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgZGl2IHdpdGggYSBtZXRob2QgZm9yIGFwcGx5aW5nIENTUyBhbmltYXRpb24gY2xhc3NlcyBmb3IgYSBzZXQgZHVyYXRpb24uXHJcbiAgICogQG5hbWUgVGFza1RyaWdnZXJBbmltRGl2XHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpUYXNrQ29tcG9uZW50c1xyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tUcmlnZ2VyQW5pbURpdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tUcmlnZ2VyQW5pbURpdicsXHJcblxyXG4gICAgbWl4aW5zOiBbTWl4aW5zLlRyaWdnZXJBbmltYXRpb25NaXhpbl0sXHJcblxyXG4gICAgdHJpZ2dlckFuaW06IGZ1bmN0aW9uKGFuaW1hdGlvbkNsYXNzLCBkdXJhdGlvbikge1xyXG4gICAgICBhbmltYXRpb25DbGFzcyA9IGFuaW1hdGlvbkNsYXNzIHx8IFwiXCI7XHJcbiAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgMTAwMDtcclxuXHJcbiAgICAgIHZhciBlbGVtID0gJCh0aGlzLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHRoaXMuYW5pbWF0ZShlbGVtLCBhbmltYXRpb25DbGFzcywgZHVyYXRpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0YXNrQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tDb21wb25lbnRzO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgc2ltcGxlIGludGVnZXIgYWRkaXRpb24gdGFzay5cclxuICovXHJcbnZhciBBZGRpdGlvblRhc2sgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxuICB2YXIgU2luZ2xlTnVtYmVyRm9ybSA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Zvcm1zXCIpLlNpbmdsZU51bWJlckZvcm07XHJcbiAgdmFyIE1hdGhDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvbWF0aC1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50c1wiKTtcclxuXHJcblxyXG4gIHZhciBhZGRpdGlvblRhc2sgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdhZGRpdGlvblRhc2snLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzdGVwczogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgICBvblRhc2tEb25lOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZXNldCB0aGUgcXVlc3Rpb24uICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBhLCBiO1xyXG4gICAgICBkbyB7XHJcbiAgICAgICAgYSA9IFRhc2tVdGlscy5yYW5kUmFuZ2UoMSwgMTEpO1xyXG4gICAgICAgIGIgPSBUYXNrVXRpbHMucmFuZFJhbmdlKDEsIDExKTtcclxuICAgICAgfVxyXG4gICAgICB3aGlsZSAoVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihbYSxiXSwgW3RoaXMuc3RhdGUuYSwgdGhpcy5zdGF0ZS5iXSkpO1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICBhOiBhLFxyXG4gICAgICAgIGI6IGIsXHJcbiAgICAgICAgYW5zd2VyOiBhICsgYlxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENoZWNrIGlmIGNvcnJlY3QuICovXHJcbiAgICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKGFuc3dlcikge1xyXG4gICAgICB2YXIgaXNDb3JyZWN0ID0gVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihhbnN3ZXIsIHRoaXMuc3RhdGUuYW5zd2VyKTtcclxuICAgICAgaWYgKGlzQ29ycmVjdClcclxuICAgICAgICB0aGlzLmhhbmRsZUNvcnJlY3RBbnN3ZXIoKTtcclxuXHJcbiAgICAgIHJldHVybiBpc0NvcnJlY3Q7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgc3RlcCA9IHRoaXMuc3RhdGUuc3RlcDtcclxuICAgICAgaWYgKHN0ZXAgPT09IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25UYXNrRG9uZSgpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3N0ZXA6IHN0ZXAgKyAxfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDEsXHJcbiAgICAgICAgYW5zd2VyOiBudWxsXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIFRhc2tQYW5lbCA9IFRhc2tDb21wb25lbnRzLlRhc2tQYW5lbDtcclxuICAgICAgdmFyIFRhc2tIZWFkZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyO1xyXG4gICAgICB2YXIgVGFza1Byb2dyZXNzQmFyID0gVGFza0NvbXBvbmVudHMuVGFza1Byb2dyZXNzQmFyO1xyXG4gICAgICB2YXIgVGFza0RvbmVEaXNwbGF5ID0gVGFza0NvbXBvbmVudHMuVGFza0RvbmVEaXNwbGF5O1xyXG4gICAgICB2YXIgTWF0aEpheCA9IE1hdGhDb21wb25lbnRzLk1hdGhKYXg7XHJcblxyXG4gICAgICB2YXIgdGFza0lzRG9uZSA9IHRoaXMuc3RhdGUuc3RlcCA+IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpO1xyXG4gICAgICB2YXIgcXVlc3Rpb24sIHNpZGViYXI7XHJcblxyXG4gICAgICBpZiAoIXRhc2tJc0RvbmUpIHtcclxuICAgICAgICB2YXIgcXVlc3Rpb25Db250ZW50ID0gdGhpcy5zdGF0ZS5hICsgXCIgKyBcIiArIHRoaXMuc3RhdGUuYiArIFwiID0gP1wiO1xyXG4gICAgICAgIHF1ZXN0aW9uID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRleHQtY2VudGVyXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmgxKG51bGwsIFxyXG4gICAgICAgICAgICAgIE1hdGhKYXgobnVsbCwgcXVlc3Rpb25Db250ZW50KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXCJNaWvDpCBvbiB5aHRlZW5sYXNrdW4gdHVsb3M/XCIpXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIlZhc3RhdXNcIiwgY2xhc3NOYW1lOlwicGFuZWwtc3VjY2VzcyBwYW5lbC1leHRyYS1wYWRkaW5nXCJ9LCBcclxuICAgICAgICAgICAgICBTaW5nbGVOdW1iZXJGb3JtKCB7b25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9IClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcXVlc3Rpb24gPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZToxMH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIllodGVlbmxhc2t1XCJ9LCBcclxuICAgICAgICAgICAgVGFza1Byb2dyZXNzQmFyKCB7bm93OnRoaXMuc3RhdGUuc3RlcCwgbWF4OnRoaXMucHJvcHMuc3RlcHN9KVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICAgIHF1ZXN0aW9uXHJcbiAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTUgY29sLXNtLW9mZnNldC0xXCJ9LCBcclxuICAgICAgICAgICAgICBzaWRlYmFyXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBhZGRpdGlvblRhc2s7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBZGRpdGlvblRhc2s7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIGQzLCBtb2R1bGUsIHJlcXVpcmUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIERldGVjdCBhcyBtYW55IHNoYXBlcyBhcyB5b3UgY2FuIGluIDYwIHNlY29uZHMuXHJcbiAqL1xyXG52YXIgQmFzaWNTaGFwZXNUYXNrID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgVGFza1V0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzL3Rhc2stdXRpbHNcIik7XHJcbiAgdmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBDb29yZHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9jb29yZHMtY29tcG9uZW50c1wiKS5Db29yZHM7XHJcbiAgdmFyIE1peGlucyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL21peGluc1wiKTtcclxuXHJcbiAgdmFyIGJhc2ljU2hhcGVzVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ2Jhc2ljU2hhcGVzVGFzaycsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIHRpbWU6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICBtaXhpbnM6IFtNaXhpbnMuU2V0VGltZW91dE1peGluXSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2Ygc2l4IGRpZmZlcmVudCBzaGFwZXMgdGhhdCBmaWxsIHRoZSBjb29yZHNcclxuICAgICAqIGluIGEgcmFuZG9tIG9yZGVyLlxyXG4gICAgICovXHJcbiAgICBnZXRSYW5kb21TaGFwZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYzEgPSAwLjQ2LCBjMiA9IDEuMjEsIHMxID0gMS40MywgczIgPSAwLjg4NTtcclxuICAgICAgdmFyIHBlbnRhZ29uUHRzID0gW1stczIsLWMyXSwgWy1zMSxjMV0sIFswLDEuNV0sIFtzMSxjMV0sIFtzMiwtYzJdXTtcclxuICAgICAgcGVudGFnb25QdHMgPSBUYXNrVXRpbHMudHJhbnNsYXRlKHBlbnRhZ29uUHRzLCAyLjUsIDEuNSk7XHJcblxyXG4gICAgICB2YXIgdHJhbnNsYXRlcyA9IFtbMCwwXSwgWzYsMF0sIFswLDRdLCBbNiw0XSwgWzAsOF0sIFs2LDhdXTtcclxuICAgICAgdmFyIGJhc2VzID0gW1xyXG4gICAgICAgIHtuYW1lOlwia29sbWlvXCIsIHBvaW50czpbWzEsMF0sIFsxLDNdLCBbNCwwXV19LFxyXG4gICAgICAgIHtuYW1lOlwibmVsacO2XCIsIHBvaW50czpbWzEsMF0sIFsxLDNdLCBbNCwzXSwgWzQsMF1dfSxcclxuICAgICAgICB7bmFtZTpcInltcHlyw6RcIiwgcG9pbnRzOltbMi41LDEuNV1dLCByOjEuNX0sXHJcbiAgICAgICAge25hbWU6XCJzdXVubmlrYXNcIiwgcG9pbnRzOltbMCwwXSwgWzAuNSwzXSwgWzQuNSwzXSwgWzQsMF1dfSxcclxuICAgICAgICB7bmFtZTpcInB1b2xpc3V1bm5pa2FzXCIsIHBvaW50czpbWzAsMF0sIFswLjUsM10sIFs0LDNdLCBbNC41LDBdXX0sXHJcbiAgICAgICAge25hbWU6XCJ2aWlzaWt1bG1pb1wiLCBwb2ludHM6cGVudGFnb25QdHN9XHJcbiAgICAgIF07XHJcblxyXG4gICAgICBiYXNlcyA9IFRhc2tVdGlscy5zaHVmZmxlKGJhc2VzKTtcclxuICAgICAgdmFyIGNscnMgPSBkMy5zY2FsZS5jYXRlZ29yeTEwKCk7XHJcblxyXG4gICAgICB2YXIgc2hhcGVzID0gYmFzZXMubWFwKGZ1bmN0aW9uKGJhc2UsIGkpIHtcclxuICAgICAgICB2YXIgdHJhbnNsYXRlWCA9IHRyYW5zbGF0ZXNbaV1bMF0gKyBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICAgIHZhciB0cmFuc2xhdGVZID0gdHJhbnNsYXRlc1tpXVsxXSArIE1hdGgucmFuZG9tKCk7XHJcbiAgICAgICAgYmFzZS5wb2ludHMgPSBUYXNrVXRpbHMudHJhbnNsYXRlKGJhc2UucG9pbnRzLCB0cmFuc2xhdGVYLCB0cmFuc2xhdGVZKTtcclxuICAgICAgICBiYXNlLmtleSA9IGk7XHJcbiAgICAgICAgYmFzZS5vbkNsaWNrID0gdGhpcy5oYW5kbGVTaGFwZUNsaWNrO1xyXG4gICAgICAgIGJhc2Uuc3Ryb2tlID0gXCJibGFja1wiO1xyXG4gICAgICAgIGJhc2UuZmlsbCA9IGNscnMoVGFza1V0aWxzLnJhbmQoOSkpO1xyXG4gICAgICAgIHJldHVybiBiYXNlO1xyXG4gICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgcmV0dXJuIHNoYXBlcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlc2V0IHRoZSBxdWVzdGlvbiwgaS5lLiBnZW5lcmF0ZSBuZXcgc2hhcGVzLiAqL1xyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgc2hhcGVzID0gdGhpcy5nZXRSYW5kb21TaGFwZXMoKTtcclxuXHJcbiAgICAgIC8vIFByZXZlbnQgYXNraW5nIGZvciB0aGUgc2FtZSBzaGFwZSB0d2ljZSBpbiBhIHJvdy5cclxuICAgICAgdmFyIHBvc3NpYmxlVGFyZ2V0cyA9IHNoYXBlcztcclxuICAgICAgaWYgKHRoaXMuc3RhdGUudGFyZ2V0KSB7XHJcbiAgICAgICAgcG9zc2libGVUYXJnZXRzID0gcG9zc2libGVUYXJnZXRzLmZpbHRlcihmdW5jdGlvbihzaGFwZSkge1xyXG4gICAgICAgICAgcmV0dXJuIHNoYXBlLm5hbWUgIT09IHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWU7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgfVxyXG4gICAgICB2YXIgdGFyZ2V0ID0gcG9zc2libGVUYXJnZXRzW1Rhc2tVdGlscy5yYW5kKHBvc3NpYmxlVGFyZ2V0cy5sZW5ndGgpXTtcclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHNoYXBlczogdGhpcy5nZXRSYW5kb21TaGFwZXMoKSxcclxuICAgICAgICB0YXJnZXQ6IHRhcmdldFxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlU3RhcnRCdG5DbGljazogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe2lzUnVubmluZzogdHJ1ZSwgc2NvcmU6IDB9KTtcclxuICAgICAgdGhpcy5yZWZzLnRpbWVyLnN0YXJ0Q291bnRkb3duKCk7XHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENoZWNrIGlmIGNvcnJlY3Qgc2hhcGUgYW5kIHByb2NlZWQuICovXHJcbiAgICBoYW5kbGVTaGFwZUNsaWNrOiBmdW5jdGlvbihzaGFwZSkge1xyXG4gICAgICB2YXIgc2NvcmVJbmNyZW1lbnQ7XHJcbiAgICAgIGlmIChzaGFwZS5uYW1lID09PSB0aGlzLnN0YXRlLnRhcmdldC5uYW1lKSB7XHJcbiAgICAgICAgc2NvcmVJbmNyZW1lbnQgPSAxO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNjb3JlSW5jcmVtZW50ID0gLTE7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBhbmltID0gc2NvcmVJbmNyZW1lbnQgPiAwID8gXCJwdWxzZVwiIDogXCJzaGFrZVwiO1xyXG4gICAgICB0aGlzLnJlZnMuc2NvcmUudHJpZ2dlckFuaW0oYW5pbSwgMTAwMCk7XHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtzY29yZTogTWF0aC5tYXgodGhpcy5zdGF0ZS5zY29yZSArIHNjb3JlSW5jcmVtZW50LCAwKX0pO1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBUYXNrIGZpbmlzaGVzIChhZnRlciBhIHNtYWxsIHRpbWVvdXQgZm9yIHNtb290aG5lc3MpIHdoZW4gdGltZXIgZXhwaXJlcy4gKi9cclxuICAgIGhhbmRsZVRpbWVyRXhwaXJ5OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBpc0ZpbmlzaGVkOiB0cnVlIH0pO1xyXG4gICAgICB9LmJpbmQodGhpcyksIDUwMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgICBzY29yZTogMCxcclxuICAgICAgICBpc1J1bm5pbmc6IGZhbHNlLFxyXG4gICAgICAgIGlzRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIFRhc2tQYW5lbCA9IFRhc2tDb21wb25lbnRzLlRhc2tQYW5lbDtcclxuICAgICAgdmFyIFRhc2tIZWFkZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyO1xyXG4gICAgICB2YXIgVGFza0RvbmVEaXNwbGF5ID0gVGFza0NvbXBvbmVudHMuVGFza0RvbmVEaXNwbGF5O1xyXG4gICAgICB2YXIgVGFza0NvdW50ZG93blRpbWVyID0gVGFza0NvbXBvbmVudHMuVGFza0NvdW50ZG93blRpbWVyO1xyXG4gICAgICB2YXIgVGFza1RyaWdnZXJBbmltRGl2ID0gVGFza0NvbXBvbmVudHMuVGFza1RyaWdnZXJBbmltRGl2O1xyXG5cclxuICAgICAgdmFyIHNoYXBlcyA9IHRoaXMuc3RhdGUuc2hhcGVzO1xyXG4gICAgICB2YXIgcXVlc3Rpb24sIHNpZGViYXIsIHRpbWVyO1xyXG5cclxuICAgICAgaWYgKCF0aGlzLnN0YXRlLmlzRmluaXNoZWQpIHtcclxuICAgICAgICB2YXIgYm91bmRzID0ge21heFk6IDEyLCBtYXhYOiAxMiwgbWluWTogMCwgbWluWDogMH07XHJcblxyXG4gICAgICAgIHF1ZXN0aW9uID0gQ29vcmRzKCB7ZHJhd0F4ZXM6ZmFsc2UsIHNoYXBlczpzaGFwZXMsIGJvdW5kczpib3VuZHMsIGFzcGVjdDoxfSApO1xyXG5cclxuICAgICAgICB2YXIgc2hhcGVUb0ZpbmQgPSBcImtvbG1pb1wiO1xyXG5cclxuICAgICAgICB2YXIgc3RhcnRCdG4gPSB0aGlzLnN0YXRlLmlzUnVubmluZyA/IG51bGwgOiAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJhbmltYXRlZCBhbmltYXRlZC1yZXBlYXQgYm91bmNlIGJ0biBidG4tcHJpbWFyeSBidG4tYmxvY2tcIiwgb25DbGljazp0aGlzLmhhbmRsZVN0YXJ0QnRuQ2xpY2t9LCBcbiAgICAgICAgICAgICAgXCJBbG9pdGEgcGVsaVwiXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgdmFyIHRhcmdldERpc3BsYXkgPSAhdGhpcy5zdGF0ZS50YXJnZXQgPyBudWxsIDogKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFuaW1hdGVkIGJvdW5jZS1pblwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcbiAgICAgICAgICAgIFwiS2xpa2F0dGF2YSBrYXBwYWxlOiBcIiwgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCB0aGlzLnN0YXRlLnRhcmdldC5uYW1lKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxyXG4gICAgICAgICAgICBUYXNrVHJpZ2dlckFuaW1EaXYoIHtyZWY6XCJzY29yZVwiLCBjbGFzc05hbWU6XCJhbmltYXRlZCB0ZXh0LWNlbnRlclwifSwgXG4gICAgICAgICAgICAgIFwiUGlzdGVldDogXCIsIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwibGFiZWwgbGFiZWwtd2FybmluZ1wifSwgdGhpcy5zdGF0ZS5zY29yZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHNpZGViYXIgPSAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxuICAgICAgICAgICAgICBcIkV0c2kga29vcmRpbmFhdGlzdG9zdGEgbcOkw6Ryw6R0dHkgdGFzb2t1dmlvIGphIGtsaWtrYWEgc2l0w6QuXCIsUmVhY3QuRE9NLmJyKG51bGwpLFxuICAgICAgICAgICAgICBcIlNpbnVsbGEgb24gXCIsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgdGhpcy5wcm9wcy50aW1lLCBcIiBzZWt1bnRpYVwiKSwgXCIgYWlrYWEuXCIsXG4gICAgICAgICAgICAgIHN0YXJ0QnRuLFxyXG4gICAgICAgICAgICAgIHRhcmdldERpc3BsYXlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcXVlc3Rpb24gPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZTp0aGlzLnN0YXRlLnNjb3JlfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFRhc2tIZWFkZXIoIHtuYW1lOlwiS2FwcGFsZWlkZW4gdHVubmlzdGFtaW5lblwifSwgXHJcbiAgICAgICAgICAgIFRhc2tDb3VudGRvd25UaW1lcigge3JlZjpcInRpbWVyXCIsIHRpbWU6dGhpcy5wcm9wcy50aW1lLCBvbkV4cGlyeTp0aGlzLmhhbmRsZVRpbWVyRXhwaXJ5fSlcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgICBxdWVzdGlvblxyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gYmFzaWNTaGFwZXNUYXNrO1xyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYXNpY1NoYXBlc1Rhc2s7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogRHJhdyBhIGdpdmVuIHNoYXBlIG9uIHRoZSBjb29yZGluYXRlIHN5c3RlbS5cclxuICovXHJcbnZhciBEcmF3U2hhcGVzVGFzayA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIFRhc2tVdGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy90YXNrLXV0aWxzXCIpO1xyXG4gIHZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50c1wiKTtcclxuICB2YXIgQ29vcmRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvY29vcmRzLWNvbXBvbmVudHNcIikuQ29vcmRzO1xyXG5cclxuXHJcbiAgdmFyIGRyYXdTaGFwZXNUYXNrID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnZHJhd1NoYXBlc1Rhc2snLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzdGVwczogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgICBvblRhc2tEb25lOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHRhcmdldCA9IHtuYW1lOiBcImtvbG1pb1wiLCBhcmVhOiA0LCB2ZXJ0aWNlczogM307XHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgIGNvb3Jkc0Rpc2FibGVkOiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hlY2tBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICBjb29yZHNEaXNhYmxlZDogdHJ1ZVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBzaGFwZXMgPSB0aGlzLnN0YXRlLnNoYXBlcztcclxuXHJcbiAgICAgIHZhciBwb2x5Z29uUHRzID0gc2hhcGVzLm1hcChmdW5jdGlvbihzaGFwZSkge1xyXG4gICAgICAgIHJldHVybiBzaGFwZS5wb2ludHNbMF07XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgc2hhcGVzID0gW3twb2ludHM6IHBvbHlnb25QdHMsIGZpbGw6IFwic3RlZWxibHVlXCJ9XTtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hhcGVzOiBzaGFwZXN9KTtcclxuXHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSBbdHJ1ZSwgZmFsc2VdW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpXTtcclxuXHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHBvbHlnb24gPSB0aGlzLnN0YXRlLnNoYXBlc1swXTtcclxuICAgICAgICBwb2x5Z29uLmZpbGwgPSBpc0NvcnJlY3QgPyBcIiMxQUM4MzRcIiA6IFwiIzhCMDAwMFwiO1xyXG5cclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICAgIHNoYXBlczogW3BvbHlnb25dLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KHRoaXMucmVzZXQsIDEwMDApO1xyXG5cclxuICAgICAgfS5iaW5kKHRoaXMpLCA1MDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVTdGFydEJ0bkNsaWNrOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNSdW5uaW5nOiB0cnVlfSk7XHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29vcmRzQ2xpY2s6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgaWYgKHRoaXMuc3RhdGUuY29vcmRzRGlzYWJsZWQgfHwgIXRoaXMuc3RhdGUuaXNSdW5uaW5nKVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnN0YXRlLnRhcmdldDtcclxuICAgICAgdmFyIHNoYXBlcyA9IHRoaXMuc3RhdGUuc2hhcGVzO1xyXG5cclxuICAgICAgdmFyIGNvbXBsZW1lbnQgPSBzaGFwZXMuZmlsdGVyKGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgICAgdmFyIHBvaW50ID0gc2hhcGUucG9pbnRzWzBdO1xyXG4gICAgICAgIHJldHVybiAhKHBvaW50WzBdID09PSB4ICYmIHBvaW50WzFdID09PSB5KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZiAoY29tcGxlbWVudC5sZW5ndGggPCBzaGFwZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGEgcG9pbnRcclxuICAgICAgICBzaGFwZXMgPSBjb21wbGVtZW50O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEFkZCBhIHBvaW50XHJcbiAgICAgICAgdmFyIG5ld1NoYXBlID0ge3BvaW50czogW1t4LCB5XV19O1xyXG4gICAgICAgIHNoYXBlcy5wdXNoKG5ld1NoYXBlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hhcGVzOiBzaGFwZXN9KTtcclxuXHJcbiAgICAgIGlmIChzaGFwZXMubGVuZ3RoID09PSB0YXJnZXQudmVydGljZXMpIHtcclxuICAgICAgICB0aGlzLmNoZWNrQW5zd2VyKCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzdGVwID0gdGhpcy5zdGF0ZS5zdGVwO1xyXG4gICAgICBpZiAoc3RlcCA9PT0gdGhpcy5wcm9wcy5zdGVwcylcclxuICAgICAgICB0aGlzLnByb3BzLm9uVGFza0RvbmUoKTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtzdGVwOiBzdGVwICsgMX0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDEsXHJcbiAgICAgICAgYW5zd2VyOiBudWxsLFxyXG4gICAgICAgIHNoYXBlczogW10sXHJcbiAgICAgICAgaXNSdW5uaW5nOiBmYWxzZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBUYXNrUGFuZWwgPSBUYXNrQ29tcG9uZW50cy5UYXNrUGFuZWw7XHJcbiAgICAgIHZhciBUYXNrSGVhZGVyID0gVGFza0NvbXBvbmVudHMuVGFza0hlYWRlcjtcclxuICAgICAgdmFyIFRhc2tQcm9ncmVzc0JhciA9IFRhc2tDb21wb25lbnRzLlRhc2tQcm9ncmVzc0JhcjtcclxuICAgICAgdmFyIFRhc2tEb25lRGlzcGxheSA9IFRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheTtcclxuICAgICAgdmFyIFRhc2tUcmlnZ2VyQW5pbURpdiA9IFRhc2tDb21wb25lbnRzLlRhc2tUcmlnZ2VyQW5pbURpdjtcclxuXHJcbiAgICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gdGhpcy5wcm9wcy5zdGVwcztcclxuICAgICAgdmFyIHF1ZXN0aW9uLCBzaWRlYmFyO1xyXG5cclxuICAgICAgaWYgKCF0YXNrSXNEb25lKSB7XHJcbiAgICAgICAgdmFyIGJvdW5kcyA9IHttaW5YOiAwLCBtaW5ZOiAwLCBtYXhYOiA3LCBtYXhZOiA3fTtcclxuICAgICAgICBxdWVzdGlvbiA9IChcclxuICAgICAgICAgIENvb3Jkcygge3NoYXBlczp0aGlzLnN0YXRlLnNoYXBlcywgYm91bmRzOmJvdW5kcywgb25DbGljazp0aGlzLmhhbmRsZUNvb3Jkc0NsaWNrfSApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuaXNSdW5uaW5nKSB7XHJcbiAgICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXHJcbiAgICAgICAgICAgICAgICBUYXNrVHJpZ2dlckFuaW1EaXYoIHtyZWY6XCJhbmltRGl2XCJ9LCBcbiAgICAgICAgICAgICAgICAgIFwiUGlpcnLDpCBcIiwgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCB0aGlzLnN0YXRlLnRhcmdldC5uYW1lKSxcIiwgam9ua2EgcGludGEtYWxhIG9uIFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHRoaXMuc3RhdGUudGFyZ2V0LmFyZWEpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXG4gICAgICAgICAgICAgICAgXCJQaWlycsOkIG9oamVpZGVuIG11a2FpbmVuIHRhc29rdXZpbyBrbGlra2FpbGVtYWxsYSBrb29yZGluYWF0aXN0b2EuXCIsXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImFuaW1hdGVkIGFuaW1hdGVkLXJlcGVhdCBib3VuY2UgYnRuIGJ0bi1wcmltYXJ5IGJ0bi1ibG9ja1wiLFxyXG4gICAgICAgICAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZVN0YXJ0QnRuQ2xpY2t9LCBcbiAgICAgICAgICAgICAgICAgIFwiQWxvaXRhIHRlaHTDpHbDpFwiXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHF1ZXN0aW9uID0gVGFza0RvbmVEaXNwbGF5KCB7c2NvcmU6dGhpcy5wcm9wcy5zdGVwc30pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIlRhc29rdXZpb2lkZW4gcGlpcnTDpG1pbmVuXCJ9LCBcclxuICAgICAgICAgICAgVGFza1Byb2dyZXNzQmFyKCB7bm93OnRoaXMuc3RhdGUuc3RlcCwgbWF4OnRoaXMucHJvcHMuc3RlcHN9KVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICAgIHF1ZXN0aW9uXHJcbiAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTUgY29sLXNtLW9mZnNldC0xXCJ9LCBcclxuICAgICAgICAgICAgICBzaWRlYmFyXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBkcmF3U2hhcGVzVGFzaztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERyYXdTaGFwZXNUYXNrO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlYWQgcG9zaXRpb25zIGZyb20gYSBjb29yZGluYXRlIHN5c3RlbS5cclxuICovXHJcbnZhciBTaW1wbGVDb29yZHNUYXNrID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgVGFza1V0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzL3Rhc2stdXRpbHNcIik7XHJcbiAgdmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBDb29yZHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9jb29yZHMtY29tcG9uZW50c1wiKS5Db29yZHM7XHJcbiAgdmFyIEZvcm1zID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvZm9ybXNcIik7XHJcblxyXG5cclxuICB2YXIgc2ltcGxlQ29vcmRzVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ3NpbXBsZUNvb3Jkc1Rhc2snLFxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXBzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlc2V0IHRoZSBxdWVzdGlvbiwgaS5lLiBnZW5lcmF0ZSBhIG5ldyByYW5kb20gcG9pbnQuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBuZXdQb2ludDtcclxuICAgICAgZG8geyBuZXdQb2ludCA9IFtUYXNrVXRpbHMucmFuZFJhbmdlKDAsIDEwKSwgVGFza1V0aWxzLnJhbmRSYW5nZSgwLCAxMCldOyB9XHJcbiAgICAgIHdoaWxlIChUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKG5ld1BvaW50LCB0aGlzLnN0YXRlLnBvaW50KSk7XHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtwb2ludDogbmV3UG9pbnR9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENoZWNrIGlmIGNvcnJlY3QuICovXHJcbiAgICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgdmFyIGlzQ29ycmVjdCA9IFRhc2tVdGlscy5tYXRjaGVzU29sdXRpb24oW3gsIHldLCB0aGlzLnN0YXRlLnBvaW50KTtcclxuICAgICAgaWYgKGlzQ29ycmVjdClcclxuICAgICAgICB0aGlzLmhhbmRsZUNvcnJlY3RBbnN3ZXIoKTtcclxuXHJcbiAgICAgIHJldHVybiBpc0NvcnJlY3Q7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgc3RlcCA9IHRoaXMuc3RhdGUuc3RlcDtcclxuICAgICAgaWYgKHN0ZXAgPT09IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25UYXNrRG9uZSgpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3N0ZXA6IHN0ZXAgKyAxfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDEsXHJcbiAgICAgICAgcG9pbnQ6IG51bGxcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrUHJvZ3Jlc3NCYXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBDb29yZHNBbnN3ZXJGb3JtID0gRm9ybXMuQ29vcmRzQW5zd2VyRm9ybTtcclxuXHJcbiAgICAgIHZhciBwb2ludCA9IHRoaXMuc3RhdGUucG9pbnQ7XHJcbiAgICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcyk7XHJcbiAgICAgIHZhciBjb29yZHMsIHNpZGViYXI7XHJcblxyXG4gICAgICBpZiAocG9pbnQgJiYgIXRhc2tJc0RvbmUpIHtcclxuICAgICAgICB2YXIgYm91bmRzID0ge21heFk6IDEwLCBtYXhYOiAxMCwgbWluWTogLTIsIG1pblg6IC0yfTtcclxuICAgICAgICB2YXIgc2hhcGVzID0gW3twb2ludHM6IFtwb2ludF0sIHI6MC4yLCBzdHJva2VXaWR0aDogMywgc3Ryb2tlOiBcIiNGRjVCMjRcIiwgZmlsbDpcIiNGRDAwMDBcIn1dO1xyXG5cclxuICAgICAgICBjb29yZHMgPSBDb29yZHMoIHtzaGFwZXM6c2hhcGVzLCBib3VuZHM6Ym91bmRzLCBhc3BlY3Q6MX0gKTtcclxuXHJcbiAgICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXCJNaXRrw6Qgb3ZhdCBwaXN0ZWVuIHgtamEgeS1rb29yZGluYWF0aXQ/XCIpXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIlZhc3RhdXNcIiwgY2xhc3NOYW1lOlwicGFuZWwtc3VjY2VzcyBwYW5lbC1leHRyYS1wYWRkaW5nXCJ9LCBcclxuICAgICAgICAgICAgICBDb29yZHNBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0gKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICh0YXNrSXNEb25lKSB7XHJcbiAgICAgICAgY29vcmRzID0gVGFza0RvbmVEaXNwbGF5KCB7c2NvcmU6MTB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgVGFza0hlYWRlcigge25hbWU6XCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCJ9LCBcclxuICAgICAgICAgICAgVGFza1Byb2dyZXNzQmFyKCB7bm93OnRoaXMuc3RhdGUuc3RlcCwgbWF4OnRoaXMucHJvcHMuc3RlcHN9KVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICAgIGNvb3Jkc1xyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gc2ltcGxlQ29vcmRzVGFzaztcclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2ltcGxlQ29vcmRzVGFzaztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qIGdsb2JhbCBtb2R1bGUgKi9cclxuXHJcbi8qKlxyXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyAobWFpbmx5IG1hdGhzIHJlbGF0ZWQpIGZvciB0YXNrcy5cclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxudmFyIFRhc2tVdGlscyA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgaW4gcmFuZ2UgW21pbiwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1pbiAgICAgICBJbmNsdXNpdmUgbG93ZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtYXggICAgICAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyPX0gY291bnQgICAgIElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7KG51bWJlcnxudW1iZXJbXSl9IEEgc2luZ2xlIG9yIG11bHRpcGxlIHJhbmRvbSBpbnRzLlxyXG4gICAgICovXHJcbiAgICByYW5kUmFuZ2U6IGZ1bmN0aW9uKG1pbiwgbWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmRSYW5nZShtaW4sIG1heCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByYW5kcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pbjtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBpbiByYW5nZSBbMCwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfG51bWJlcltdfSBBIHNpbmdsZSBvciBtdWx0aXBsZSByYW5kb20gaW50cy5cclxuICAgICAqL1xyXG4gICAgcmFuZDogZnVuY3Rpb24obWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmQobWF4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJhbmRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVvcmRlcnMgZ2l2ZW4gYXJyYXkgcmFuZG9tbHksIGRvZXNuJ3QgbW9kaWZ5IG9yaWdpbmFsIGFycmF5LlxyXG4gICAgICogQHBhcmFtICB7QXJyYXl9IGFyclxyXG4gICAgICogQHJldHVybiB7QXJyYXl9XHJcbiAgICAgKi9cclxuICAgIHNodWZmbGU6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBjbG9uZSA9IGFyci5zbGljZSgpO1xyXG4gICAgICAgIHZhciBzaHVmZmxlZCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gY2xvbmUubGVuZ3RoOyBpID4gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMucmFuZChpKTtcclxuICAgICAgICAgICAgc2h1ZmZsZWQucHVzaChjbG9uZS5zcGxpY2UoaW5kZXgsIDEpWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaHVmZmxlZDtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5nZSBvZiBpbnRlZ2Vycy5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSAgbWluICBJbmNsdXNpdmUgbG93ZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gIG1heCAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGVwPTFdIEluY3JlbWVudCB2YWx1ZS5cclxuICAgICAqIEByZXR1cm4ge251bWJlcltdfSAgICBUaGUgc3BlY2lmaWVkIHJhbmdlIG9mIG51bWJlcnMgaW4gYW4gYXJyYXkuXHJcbiAgICAgKi9cclxuICAgIHJhbmdlOiBmdW5jdGlvbihtaW4sIG1heCwgc3RlcCkge1xyXG4gICAgICAgIHN0ZXAgPSBzdGVwIHx8IDE7XHJcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xyXG4gICAgICAgIGlmIChzdGVwID4gMCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbWluOyBpIDwgbWF4OyBpICs9IHN0ZXApIHtcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IG1pbjsgaiA+IG1heDsgaiArPSBzdGVwKSB7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaChqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgd2hldGhlciBhcnJheXMgZXF1YWwuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIxXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnIyXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBhcnJheXNFcXVhbDogZnVuY3Rpb24oYXJyMSwgYXJyMikge1xyXG4gICAgICAgIGlmIChhcnIxLmxlbmd0aCAhPT0gYXJyMi5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFycjEuZXZlcnkoZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZCA9PT0gYXJyMltpXTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhbnNsYXRlIGFuIGFycmF5IG9mIHBvaW50cyBieSBnaXZlbiB4IGFuZCB5IHZhbHVlcy5cclxuICAgICAqIEBwYXJhbSAge0FycmF5Ljxtb2R1bGU6Q29vcmRzQ29tcG9uZW50cy5Qb2ludD59IHBvaW50c1xyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgeFxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgeVxyXG4gICAgICogQHJldHVybiB7QXJyYXkuPG1vZHVsZTpDb29yZHNDb21wb25lbnRzLlBvaW50Pn1cclxuICAgICAqL1xyXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbihwb2ludHMsIHgsIHkpIHtcclxuICAgICAgICByZXR1cm4gcG9pbnRzLm1hcChmdW5jdGlvbihwb2ludCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW3BvaW50WzBdICsgeCwgcG9pbnRbMV0gKyB5XTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29tcGFyZSBnaXZlbiBhbnN3ZXIgdG8gdGhlIGNvcnJlY3Qgc29sdXRpb24uIFN1cHBvcnRzIHZhcmlvdXMgZGF0YSB0eXBlcy5cclxuICAgICAqIEBwYXJhbSBhbnN3ZXIgICBUaGUgYW5zd2VyIHZhbHVlLlxyXG4gICAgICogQHBhcmFtIHNvbHV0aW9uIFRoZSBjb3JyZWN0IHNvbHV0aW9uLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtlcHNpbG9uPTAuMDAxXSAgTWF4IGVycm9yIHZhbHVlIGZvciBmbG9hdCBjb21wYXJpc29uLlxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiBjb3JyZWN0LCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIG1hdGNoZXNTb2x1dGlvbjogZnVuY3Rpb24oYW5zd2VyLCBzb2x1dGlvbiwgZXBzaWxvbikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgYW5zd2VyID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci50cmltKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHNvbHV0aW9uID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgIGFuc3dlciA9IHBhcnNlRmxvYXQoYW5zd2VyKTtcclxuICAgICAgICAgICAgaWYgKGlzTmFOKGFuc3dlcikpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgZXBzaWxvbiA9IGVwc2lsb24gPT09IHVuZGVmaW5lZCA/IDAuMDAxIDogZXBzaWxvbjtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmFicyhhbnN3ZXIgLSBzb2x1dGlvbikgPD0gZXBzaWxvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIFJlZ0V4cCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc29sdXRpb24udGVzdChhbnN3ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoc29sdXRpb24gaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICBpZiAoIWFuc3dlciBpbnN0YW5jZW9mIEFycmF5IHx8IGFuc3dlci5sZW5ndGggIT09IHNvbHV0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhbnN3ZXIuZXZlcnkoZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQubWF0Y2hlc1NvbHV0aW9uKGQsIHNvbHV0aW9uW2ldLCBlcHNpbG9uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc29sdXRpb24gaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgaWYgKCFhbnN3ZXIgaW5zdGFuY2VvZiBPYmplY3QpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgYW5zS2V5cyA9IE9iamVjdC5rZXlzKGFuc3dlcik7XHJcbiAgICAgICAgICAgIGlmIChhbnNLZXlzLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoc29sdXRpb24pLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhbnNLZXlzLmV2ZXJ5KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Lm1hdGNoZXNTb2x1dGlvbihhbnN3ZXJbZF0sIHNvbHV0aW9uW2RdKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYW5zd2VyID09PSBzb2x1dGlvbjtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGFza1V0aWxzO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiQoZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgQXBwbGljYXRpb24gPSByZXF1aXJlKFwiLi9qcy9hcHBsaWNhdGlvbi5qc1wiKTtcclxuXHJcbiAgICBSZWFjdC5yZW5kZXJDb21wb25lbnQoXHJcbiAgICAgICAgQXBwbGljYXRpb24obnVsbCApLFxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXBwbGljYXRpb25cIilcclxuICAgICk7XHJcbn0pO1xyXG4vKiBqc2hpbnQgaWdub3JlOmVuZCAqLyJdfQ==
