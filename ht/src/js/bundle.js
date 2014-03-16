(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */
"use strict";
/* globals React, require, module */


var AdditionTask = require("./tasks/addition-task");
var SimpleCoordsTask = require("./tasks/simple-coords-task");
var BasicShapesTask = require("./tasks/basic-shapes-task");


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
      "Kappaleiden tunnistaminen": BasicShapesTask( {onTaskDone:this.handleTaskDone, time:20})
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

},{"./tasks/addition-task":8,"./tasks/basic-shapes-task":9,"./tasks/simple-coords-task":10}],2:[function(require,module,exports){
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
   * @property {Object} [margin={top:10, right:10, bottom:10, left:10}] - Margin around the coordinate system.
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
        margin: {top:10, right:10, bottom:10, left:10}
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

},{"../components/forms":4,"../components/math-components":5,"../components/task-components":7,"../utils/task-utils":11}],9:[function(require,module,exports){
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

    mixins: [Mixins.TriggerAnimationMixin, Mixins.SetTimeoutMixin],

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

      var elem = $(this.refs.score.getDOMNode());
      var anim = scoreIncrement > 0 ? "pulse" : "shake";
      this.animate(elem, anim, 1000);


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
            React.DOM.div( {ref:"score", className:"animated text-center"}, 
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

},{"../components/coords-components":2,"../components/mixins":6,"../components/task-components":7,"../utils/task-utils":11}],10:[function(require,module,exports){
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

},{"../components/coords-components":2,"../components/forms":4,"../components/task-components":7,"../utils/task-utils":11}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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
},{"./js/application.js":1}]},{},[12])