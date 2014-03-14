(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */
"use strict";
/* globals React, require, module */


var AdditionTask = require("./tasks/addition-task");
var SimpleCoordsTask = require("./tasks/simple-coords-task");
var BasicShapesTask = require("./tasks/basic-shapes-task");


/**
 * Container and links for example tasks.
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
    return {selectedTask: "Kappaleiden tunnistaminen"};
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
 * Various components for drawing a coordinate system and shapes.
 * @module CoordsComponents
 */
var CoordsComponents = (function() {

  var coordsComponents = {};

  /**
   * An array with two elements: the x and y coordinates.
   * @typedef {Array} Point
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
   * @property {Array.<Point>} points - Shape vertices.
   * @property {number} r - Circle radius that's used when only one point is defined.
   */

  /**
   * Coordinate system click event handler.
   * @callback coordsOnClick
   * @param {number} x - Click position's x coordinate, rounded to nearest integer.
   * @param {number} y - Click position's y coordinate, rounded to nearest integer.
   */

  /**
   * A 2D coordinate system - consists of a Grid and Shapes.
   * @name Coords
   *
   * @property {boolean} [drawAxes=true] - Whether the x and y axes are drawn.
   * @property {Array.<Shape>} [shapes=[]] - The geometric shapes to draw.
   * @property {Object} [bounds={maxY:10, maxX:10, minY:0, minX:0}] - Maximum coordinate values.
   * @property {Object} [margin] - Margin around the coordinate system.
   * @property {number} [aspect] - Coordinate system aspect ratio.
   * @property {coordsOnClick} [onClick] - Click event handler.
   * @memberof module:CoordsComponents
   * @example
   * // Drawing a single circle:
   * var center = [1, 2];
   * var bounds = {minX: 0, minY: 0, maxX: 10, maxY: 10};
   * var shapes = [{points: [center], r: 0.5, stroke: "red"}];
   * <Coords shapes={shapes} bounds={bounds}/>
   *
   * // Drawing a polygon:
   * var triangle = [{points: [[0,0], [1,1], [2,0]]}, fill: "#FFF"];
   * <Coords shapes={[triangle]} />
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

    /**
     * Translate and round screen position into coordinates, trigger event.
     * @private
     */
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
        margin: {top: 10, right: 10, bottom: 10, left: 10}
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
   * A grid for the coordinate system.
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
   * Various geometric shapes to be drawn on the coordinate system.
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

    /**
     * Redraw shapes. Gets called whenever shapes are updated or screen resizes.
     * @private
     */
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
 * Various common form components.
 */
var FormComponents = (function(){

  var Mixins = require("./mixins");

  var formComponents = {};

  /**
   * A form that disables submitting when inputs are invalid.
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

    /** Submit answer if form is valid. */
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

    /** Clear values and validation states for all child elements. */
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
   * An input with regular expression validation.
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

    /** Read value, validate, notify parent element if an event is attached. */
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

    /** Clear value and reset validation states. */
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
   * A number input with two buttons for incrementing and decrementing.
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

    /** Reset state to input value if input value is a number. */
    handleChange: function(e) {
      var val = e.target.value;
      var isValid = !isNaN(parseFloat(val));
      this.setValueAndValidity(val, isValid);
    },

    /** Try to submit parent form when Enter is clicked. */
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
        step: 1
      };
    },

    render: function() {
      /* jshint ignore:start */
      var ReInput = formComponents.ReInput;
      var btnClass = this.props.btnClass || "btn btn-lg btn-info";
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
 * Complete answer forms for tasks.
 */
var Forms = (function() {

  var FormComponents = require("./form-components");
  var AnswerForm = FormComponents.AnswerForm;
  var NumInput = FormComponents.NumInput;

  var forms = {};

  /**
   * Form with a single number input.
   */
  forms.SingleNumberForm = React.createClass({displayName: 'SingleNumberForm',

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
   * Form with two inputs for x and y coordinates.
   */
  forms.CoordsAnswerForm = React.createClass({displayName: 'CoordsAnswerForm',

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
 */
var MathComponents = (function() {

  var mathComponents = {};

  /**
   * Render LaTex maths notation into web fonts using MathJax.
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
 * Component extensions i.e. mixins.
 */
var Mixins = (function() {

  var mixins = {};

  /**
   * Provides a setInterval function which will get cleaned up when
   * the component is destroyed.
   */
  mixins.SetIntervalMixin = {
    setInterval: function() {
      this.intervals.push(setInterval.apply(null, arguments));
    },

    clearAllIntervals: function() {
      this.intervals.map(clearInterval);
      this.intervals = [];
    },

    /** Invoked when component is initialized. */
    componentWillMount: function() {
      this.intervals = [];
    },

    /** Invoked when component is destroyed. */
    componentWillUnmount: function() {
      this.clearAllIntervals();
    }
  };

  /**
   * Provides a setTimeout function which will get cleaned up when
   * the component is destroyed.
   */
  mixins.SetTimeoutMixin = {
    setTimeout: function() {
      this.timeouts.push(setTimeout.apply(null, arguments));
    },

    clearAllTimeouts: function() {
      this.timeouts.map(clearTimeout);
      this.timeouts = [];
    },

    /** Invoked when component is initialized. */
    componentWillMount: function() {
      this.timeouts = [];
    },

    /** Invoked when component is destroyed. */
    componentWillUnmount: function() {
      this.clearAllTimeouts();
    }
  };

  /**
   * Apply CSS classes for set duration - useful for singleshot animations.
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
 */
var TaskComponents = (function() {

  var Mixins = require("./mixins");

  var taskComponents = {};

  /**
   * A wrapper for Bootstrap's panel component.
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
   * when finished. Elapsed time is displayed in a progress bar.
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
   * Task header, displays task name.
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
   * An element that is shown after a completed task.
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
 */
var TaskUtils = {

    /**
     * Generate a random integer in range [min, max[.
     * @param  {number}  min   Inclusive lower bound.
     * @param  {number}  max   Exclusive upper bound.
     * @param  {number=} count If set, return a list of random values.
     * @return {(number|[number])} A single or multiple random ints.
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
     * @return {number|[number]} A single or multiple random ints.
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


    /** Reorders given array randomly, doesn't modify original array. */
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
     * @param {number=} step Optional increment value, defaults to 1.
     * @return {[number]}    The specified range of numbers in an array.
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
     * @param  arr1
     * @param  arr2
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
     * @param  {[[number]]} points
     * @param  {number}     x
     * @param  {number}     y
     * @return {[[number]]}
     */
    translate: function(points, x, y) {
        return points.map(function(point) {
            return [point[0] + x, point[1] + y];
        });
    },


    /**
     * Compare given answer to the correct solution. Supports various data types.
     *
     * @param answer
     * @param solution A string, number, array, object or RegExp.
     * @param epsilon  Optional max error value for float comparison, default is 0.001.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGxvY2FsYWRtaW5cXEFwcERhdGFcXFJvYW1pbmdcXG5wbVxcbm9kZV9tb2R1bGVzXFx3YXRjaGlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiQzovVXNlcnMvbG9jYWxhZG1pbi9Eb3dubG9hZHMvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL2Nvb3Jkcy1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvbG9jYWxhZG1pbi9Eb3dubG9hZHMvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL2Zvcm0tY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvanMvY29tcG9uZW50cy9mb3Jtcy5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvanMvY29tcG9uZW50cy9tYXRoLWNvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvbWl4aW5zLmpzIiwiQzovVXNlcnMvbG9jYWxhZG1pbi9Eb3dubG9hZHMvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvanMvdGFza3MvYWRkaXRpb24tdGFzay5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvanMvdGFza3MvYmFzaWMtc2hhcGVzLXRhc2suanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL3Rhc2tzL3NpbXBsZS1jb29yZHMtdGFzay5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvanMvdXRpbHMvdGFzay11dGlscy5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qIGdsb2JhbHMgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cclxuXHJcbnZhciBBZGRpdGlvblRhc2sgPSByZXF1aXJlKFwiLi90YXNrcy9hZGRpdGlvbi10YXNrXCIpO1xyXG52YXIgU2ltcGxlQ29vcmRzVGFzayA9IHJlcXVpcmUoXCIuL3Rhc2tzL3NpbXBsZS1jb29yZHMtdGFza1wiKTtcclxudmFyIEJhc2ljU2hhcGVzVGFzayA9IHJlcXVpcmUoXCIuL3Rhc2tzL2Jhc2ljLXNoYXBlcy10YXNrXCIpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDb250YWluZXIgYW5kIGxpbmtzIGZvciBleGFtcGxlIHRhc2tzLlxyXG4gKi9cclxudmFyIEFwcGxpY2F0aW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQXBwbGljYXRpb24nLFxyXG5cclxuICBoYW5kbGVMaXN0Q2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHZhciB0YXNrTmFtZSA9IGUudGFyZ2V0LnRleHQ7XHJcbiAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZFRhc2s6IHRhc2tOYW1lfSk7XHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlVGFza0RvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJUYXNrIGRvbmUgLSBoZXJlJ3Mgd2hlcmUgdGhlIHRhc2sgY29ubmVjdHMgdG8gYW4gZXh0ZXJuYWwgYXBwLlwiKTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtzZWxlY3RlZFRhc2s6IFwiS2FwcGFsZWlkZW4gdHVubmlzdGFtaW5lblwifTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgdmFyIHRhc2tzID0ge1xyXG4gICAgICBcIllodGVlbmxhc2t1XCI6IEFkZGl0aW9uVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZSwgc3RlcHM6NX0pLFxyXG4gICAgICBcIktvb3JkaW5hYXRpc3RvbiBsdWtlbWluZW5cIjogU2ltcGxlQ29vcmRzVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZSwgc3RlcHM6NX0pLFxyXG4gICAgICBcIkthcHBhbGVpZGVuIHR1bm5pc3RhbWluZW5cIjogQmFzaWNTaGFwZXNUYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lLCB0aW1lOjIwfSlcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHRhc2tMaXN0RWxlbXMgPSBPYmplY3Qua2V5cyh0YXNrcykubWFwKGZ1bmN0aW9uKHRhc2tOYW1lKSB7XHJcbiAgICAgIHZhciBjbGFzc05hbWUgPSB0YXNrTmFtZSA9PT0gdGhpcy5zdGF0ZS5zZWxlY3RlZFRhc2sgPyBcInRleHQtbXV0ZWRcIiA6IFwiXCI7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmxpKG51bGwsIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6Y2xhc3NOYW1lLCBocmVmOlwiXCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVMaXN0Q2xpY2t9LCB0YXNrTmFtZSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIHZhciB0YXNrID0gdGFza3NbdGhpcy5zdGF0ZS5zZWxlY3RlZFRhc2tdO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibGlzdC1pbmxpbmVcIn0sIFxyXG4gICAgICAgICAgdGFza0xpc3RFbGVtc1xyXG4gICAgICAgICksXHJcblxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWNvbnRhaW5lclwifSwgXHJcbiAgICAgICAgICB0YXNrXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBsaWNhdGlvbjtcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgZDMsIE1hdGhVdGlscywgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBWYXJpb3VzIGNvbXBvbmVudHMgZm9yIGRyYXdpbmcgYSBjb29yZGluYXRlIHN5c3RlbSBhbmQgc2hhcGVzLlxyXG4gKiBAbW9kdWxlIENvb3Jkc0NvbXBvbmVudHNcclxuICovXHJcbnZhciBDb29yZHNDb21wb25lbnRzID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgY29vcmRzQ29tcG9uZW50cyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBBbiBhcnJheSB3aXRoIHR3byBlbGVtZW50czogdGhlIHggYW5kIHkgY29vcmRpbmF0ZXMuXHJcbiAgICogQHR5cGVkZWYge0FycmF5fSBQb2ludFxyXG4gICAqL1xyXG5cclxuICAvKipcclxuICAgKiBBIHNoYXBlIHRoYXQgaXMgZHJhd24gb24gdGhlIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gICAqIEB0eXBlZGVmIFNoYXBlXHJcbiAgICogQHR5cGUge09iamVjdH1cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZVxyXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBrZXlcclxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBvbkNsaWNrIC0gU2hhcGUgY2xpY2sgZXZlbnQgaGFuZGxlci5cclxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gc3Ryb2tlIC0gQSBDU1MgY29tcGF0aWJsZSBzdHJva2UgY29sb3IuXHJcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGZpbGwgLSBBIENTUyBjb21wYXRpYmxlIGZpbGwgY29sb3IuXHJcbiAgICogQHByb3BlcnR5IHtBcnJheS48UG9pbnQ+fSBwb2ludHMgLSBTaGFwZSB2ZXJ0aWNlcy5cclxuICAgKiBAcHJvcGVydHkge251bWJlcn0gciAtIENpcmNsZSByYWRpdXMgdGhhdCdzIHVzZWQgd2hlbiBvbmx5IG9uZSBwb2ludCBpcyBkZWZpbmVkLlxyXG4gICAqL1xyXG5cclxuICAvKipcclxuICAgKiBDb29yZGluYXRlIHN5c3RlbSBjbGljayBldmVudCBoYW5kbGVyLlxyXG4gICAqIEBjYWxsYmFjayBjb29yZHNPbkNsaWNrXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBDbGljayBwb3NpdGlvbidzIHggY29vcmRpbmF0ZSwgcm91bmRlZCB0byBuZWFyZXN0IGludGVnZXIuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBDbGljayBwb3NpdGlvbidzIHkgY29vcmRpbmF0ZSwgcm91bmRlZCB0byBuZWFyZXN0IGludGVnZXIuXHJcbiAgICovXHJcblxyXG4gIC8qKlxyXG4gICAqIEEgMkQgY29vcmRpbmF0ZSBzeXN0ZW0gLSBjb25zaXN0cyBvZiBhIEdyaWQgYW5kIFNoYXBlcy5cclxuICAgKiBAbmFtZSBDb29yZHNcclxuICAgKlxyXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2RyYXdBeGVzPXRydWVdIC0gV2hldGhlciB0aGUgeCBhbmQgeSBheGVzIGFyZSBkcmF3bi5cclxuICAgKiBAcHJvcGVydHkge0FycmF5LjxTaGFwZT59IFtzaGFwZXM9W11dIC0gVGhlIGdlb21ldHJpYyBzaGFwZXMgdG8gZHJhdy5cclxuICAgKiBAcHJvcGVydHkge09iamVjdH0gW2JvdW5kcz17bWF4WToxMCwgbWF4WDoxMCwgbWluWTowLCBtaW5YOjB9XSAtIE1heGltdW0gY29vcmRpbmF0ZSB2YWx1ZXMuXHJcbiAgICogQHByb3BlcnR5IHtPYmplY3R9IFttYXJnaW5dIC0gTWFyZ2luIGFyb3VuZCB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IFthc3BlY3RdIC0gQ29vcmRpbmF0ZSBzeXN0ZW0gYXNwZWN0IHJhdGlvLlxyXG4gICAqIEBwcm9wZXJ0eSB7Y29vcmRzT25DbGlja30gW29uQ2xpY2tdIC0gQ2xpY2sgZXZlbnQgaGFuZGxlci5cclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkNvb3Jkc0NvbXBvbmVudHNcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIC8vIERyYXdpbmcgYSBzaW5nbGUgY2lyY2xlOlxyXG4gICAqIHZhciBjZW50ZXIgPSBbMSwgMl07XHJcbiAgICogdmFyIGJvdW5kcyA9IHttaW5YOiAwLCBtaW5ZOiAwLCBtYXhYOiAxMCwgbWF4WTogMTB9O1xyXG4gICAqIHZhciBzaGFwZXMgPSBbe3BvaW50czogW2NlbnRlcl0sIHI6IDAuNSwgc3Ryb2tlOiBcInJlZFwifV07XHJcbiAgICogPENvb3JkcyBzaGFwZXM9e3NoYXBlc30gYm91bmRzPXtib3VuZHN9Lz5cclxuICAgKlxyXG4gICAqIC8vIERyYXdpbmcgYSBwb2x5Z29uOlxyXG4gICAqIHZhciB0cmlhbmdsZSA9IFt7cG9pbnRzOiBbWzAsMF0sIFsxLDFdLCBbMiwwXV19LCBmaWxsOiBcIiNGRkZcIl07XHJcbiAgICogPENvb3JkcyBzaGFwZXM9e1t0cmlhbmdsZV19IC8+XHJcbiAgICovXHJcbiAgY29vcmRzQ29tcG9uZW50cy5Db29yZHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb29yZHMnLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBkcmF3QXhlczogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIHNoYXBlczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LFxyXG4gICAgICBib3VuZHM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXHJcbiAgICAgIG1hcmdpbjogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCxcclxuICAgICAgYXNwZWN0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxyXG4gICAgICBvbkNsaWNrOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVSZXNpemU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgcGFyZW50ID0gJCh0aGlzLmdldERPTU5vZGUoKS5wYXJlbnROb2RlKTtcclxuXHJcbiAgICAgIHZhciBtYXJnaW4gPSB0aGlzLnByb3BzLm1hcmdpbjtcclxuICAgICAgdmFyIHdpZHRoID0gcGFyZW50ID8gcGFyZW50LndpZHRoKCkgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCA6IDA7XHJcbiAgICAgIHZhciBoZWlnaHQgPSBNYXRoLnJvdW5kKHdpZHRoICogdGhpcy5wcm9wcy5hc3BlY3QpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcblxyXG4gICAgICB2YXIgYm91bmRzID0gdGhpcy5wcm9wcy5ib3VuZHM7XHJcbiAgICAgIHZhciBzcGFjaW5nID0gTWF0aC5yb3VuZChNYXRoLm1pbihcclxuICAgICAgICB3aWR0aCAvIE1hdGguYWJzKGJvdW5kcy5tYXhYIC0gYm91bmRzLm1pblgpLFxyXG4gICAgICAgIGhlaWdodCAvIE1hdGguYWJzKGJvdW5kcy5tYXhZIC0gYm91bmRzLm1pblkpXHJcbiAgICAgICkpO1xyXG5cclxuICAgICAgdmFyIHggPSBkMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAgIC5kb21haW4oW2JvdW5kcy5taW5YLCBib3VuZHMubWluWCArIDFdKVxyXG4gICAgICAgIC5yYW5nZShbMCwgc3BhY2luZ10pO1xyXG5cclxuICAgICAgdmFyIHkgPSBkMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAgIC5kb21haW4oW2JvdW5kcy5taW5ZLCBib3VuZHMubWluWSArIDFdKVxyXG4gICAgICAgIC5yYW5nZShbaGVpZ2h0LCBoZWlnaHQgLSBzcGFjaW5nXSk7XHJcblxyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgd2lkdGg6IHdpZHRoLFxyXG4gICAgICAgIHNwYWNpbmc6IHNwYWNpbmcsXHJcbiAgICAgICAgeDogeCxcclxuICAgICAgICB5OiB5XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYW5zbGF0ZSBhbmQgcm91bmQgc2NyZWVuIHBvc2l0aW9uIGludG8gY29vcmRpbmF0ZXMsIHRyaWdnZXIgZXZlbnQuXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBoYW5kbGVTVkdDbGljazogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKCEkLmlzRnVuY3Rpb24odGhpcy5wcm9wcy5vbkNsaWNrKSkgcmV0dXJuO1xyXG5cclxuICAgICAgdmFyIGVsZW0gPSAkKHRoaXMucmVmcy5zdmcuZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdmFyIGJvdW5kcyA9IHRoaXMucHJvcHMuYm91bmRzO1xyXG5cclxuICAgICAgdmFyIHN2Z1ggPSBldmVudC5wYWdlWCAtIGVsZW0ub2Zmc2V0KCkubGVmdCAtIHRoaXMucHJvcHMubWFyZ2luLmxlZnQ7XHJcbiAgICAgIHZhciBzdmdZID0gZXZlbnQucGFnZVkgLSBlbGVtLm9mZnNldCgpLnRvcCAtIHRoaXMucHJvcHMubWFyZ2luLnRvcDtcclxuICAgICAgdmFyIGNvb3Jkc1ggPSBNYXRoLm1heChib3VuZHMubWluWCwgTWF0aC5taW4oYm91bmRzLm1heFgsIE1hdGgucm91bmQodGhpcy5zdGF0ZS54LmludmVydChzdmdYKSkpKTtcclxuICAgICAgdmFyIGNvb3Jkc1kgPSBNYXRoLm1heChib3VuZHMubWluWSwgTWF0aC5taW4oYm91bmRzLm1heFksIE1hdGgucm91bmQodGhpcy5zdGF0ZS55LmludmVydChzdmdZKSkpKTtcclxuXHJcbiAgICAgIHRoaXMucHJvcHMub25DbGljayhjb29yZHNYLCBjb29yZHNZKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHt3aWR0aDogMH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZHJhd0F4ZXM6IHRydWUsXHJcbiAgICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgICBib3VuZHM6IHttYXhZOjEwLCBtYXhYOjEwLCBtaW5ZOjAsIG1pblg6MH0sXHJcbiAgICAgICAgYXNwZWN0OiAxLFxyXG4gICAgICAgIG1hcmdpbjoge3RvcDogMTAsIHJpZ2h0OiAxMCwgYm90dG9tOiAxMCwgbGVmdDogMTB9XHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdGhpcy5oYW5kbGVSZXNpemUpO1xyXG4gICAgICB0aGlzLmhhbmRsZVJlc2l6ZSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMuaGFuZGxlUmVzaXplKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgbWFyZ2luID0gdGhpcy5wcm9wcy5tYXJnaW47XHJcbiAgICAgIHZhciBib3VuZHMgPSB0aGlzLnByb3BzLmJvdW5kcztcclxuICAgICAgdmFyIHdpZHRoID0gdGhpcy5zdGF0ZS53aWR0aDtcclxuICAgICAgdmFyIGhlaWdodCA9IE1hdGgucm91bmQod2lkdGggKiB0aGlzLnByb3BzLmFzcGVjdCkgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcclxuICAgICAgdmFyIHNwYWNpbmcgPSB0aGlzLnN0YXRlLnNwYWNpbmc7XHJcbiAgICAgIHZhciB4ID0gdGhpcy5zdGF0ZS54O1xyXG4gICAgICB2YXIgeSA9IHRoaXMuc3RhdGUueTtcclxuXHJcbiAgICAgIHZhciBmdWxsV2lkdGggPSB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0O1xyXG4gICAgICB2YXIgZnVsbEhlaWdodCA9IGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tO1xyXG4gICAgICB2YXIgdHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiO1xyXG5cclxuICAgICAgdmFyIHNoYXBlcywgZ3JpZDtcclxuICAgICAgaWYgKHRoaXMuc3RhdGUud2lkdGgpIHtcclxuICAgICAgICB2YXIgU2hhcGVzID0gY29vcmRzQ29tcG9uZW50cy5TaGFwZXM7XHJcbiAgICAgICAgdmFyIEdyaWQgPSBjb29yZHNDb21wb25lbnRzLkdyaWQ7XHJcblxyXG4gICAgICAgIHNoYXBlcyA9IFNoYXBlcygge3g6eCwgeTp5LCBzcGFjaW5nOnNwYWNpbmcsIGRhdGE6dGhpcy5wcm9wcy5zaGFwZXN9ICk7XHJcbiAgICAgICAgZ3JpZCA9IEdyaWQoIHtkcmF3QXhlczp0aGlzLnByb3BzLmRyYXdBeGVzLCB4OngsIHk6eSwgYm91bmRzOmJvdW5kc30gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29vcmRzLWNvbnRhaW5lclwifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uc3ZnKCB7cmVmOlwic3ZnXCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVTVkdDbGljaywgd2lkdGg6ZnVsbFdpZHRoLCBoZWlnaHQ6ZnVsbEhlaWdodH0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZygge3RyYW5zZm9ybTp0cmFuc2Zvcm19LCBcclxuICAgICAgICAgICAgICBncmlkLFxyXG4gICAgICAgICAgICAgIHNoYXBlc1xyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBIGdyaWQgZm9yIHRoZSBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgKiBAbmFtZSBHcmlkXHJcbiAgICogQG1lbWJlcm9mIG1vZHVsZTpDb29yZHNDb21wb25lbnRzXHJcbiAgICovXHJcbiAgY29vcmRzQ29tcG9uZW50cy5HcmlkID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnR3JpZCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHg6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIGJvdW5kczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxyXG4gICAgICBzcGFjaW5nOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxyXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKHByb3BzKSB7XHJcbiAgICAgIHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QodGhpcy5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB2YXIgYm91bmRzID0gcHJvcHMuYm91bmRzO1xyXG4gICAgICB2YXIgc3BhY2luZyA9IHByb3BzLnNwYWNpbmc7XHJcbiAgICAgIHZhciB4ID0gcHJvcHMueDtcclxuICAgICAgdmFyIHkgPSBwcm9wcy55O1xyXG5cclxuICAgICAgdmFyIHhSYW5nZSA9IGQzLnJhbmdlKE1hdGguY2VpbCgoYm91bmRzLm1pblgpIC8gc3BhY2luZyksIE1hdGgucm91bmQoYm91bmRzLm1heFgpICsgc3BhY2luZywgc3BhY2luZyk7XHJcbiAgICAgIHZhciB5UmFuZ2UgPSBkMy5yYW5nZShNYXRoLmNlaWwoKGJvdW5kcy5taW5ZKSAvIHNwYWNpbmcpLCBNYXRoLnJvdW5kKGJvdW5kcy5tYXhZKSArIHNwYWNpbmcsIHNwYWNpbmcpO1xyXG4gICAgICB2YXIgZGF0YSA9IHhSYW5nZS5jb25jYXQoeVJhbmdlKTtcclxuICAgICAgdmFyIGlzWCA9IGZ1bmN0aW9uKGluZGV4KSB7IHJldHVybiBpbmRleCA8IHhSYW5nZS5sZW5ndGg7IH07XHJcblxyXG4gICAgICB2YXIgYXhlcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCIuYXhpc1wiKVxyXG4gICAgICAgIC5kYXRhKGRhdGEpO1xyXG5cclxuICAgICAgYXhlcy5lbnRlcigpLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gXCJheGlzIFwiICsgKChwcm9wcy5kcmF3QXhlcyAmJiBkID09PSAwKSA/IFwidGhpY2tcIiA6IFwiXCIpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGF4ZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHgoZCkgOiB4KGJvdW5kcy5taW5YKTsgfSlcclxuICAgICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1pblkpIDogeShkKTsgfSlcclxuICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHgoZCkgOiB4KGJvdW5kcy5tYXhYKTsgfSlcclxuICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1heFkpIDogeShkKTsgfSk7XHJcblxyXG4gICAgICBheGVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgIGlmIChwcm9wcy5kcmF3QXhlcykge1xyXG4gICAgICAgIHZhciBsYWJlbHMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwiLmxhYmVsXCIpLmRhdGEoZGF0YSk7XHJcblxyXG4gICAgICAgIGxhYmVscy5lbnRlcigpLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJsYWJlbCBcIiArIChpc1goaSkgPyBcInhcIiA6IFwieVwiKTsgfSlcclxuICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkgeyBpZiAoIWQpIHJldHVybiBcIm5vbmVcIjsgfSlcclxuICAgICAgICAgIC50ZXh0KE9iamVjdClcclxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8gXCIxLjRlbVwiIDogXCIuM2VtXCI7IH0pXHJcbiAgICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IG51bGwgOiBcIi0uOGVtXCI7IH0pXHJcbiAgICAgICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCAxICsgXCJlbVwiKTtcclxuXHJcbiAgICAgICAgbGFiZWxzLnRyYW5zaXRpb24oKS5kdXJhdGlvbihwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoMCk7IH0pXHJcbiAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geSgwKSA6IHkoZCk7IH0pO1xyXG5cclxuICAgICAgICBsYWJlbHMuZXhpdCgpLnJlbW92ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZHJhd0F4ZXM6IHRydWUsXHJcbiAgICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uOiA1NTAsXHJcbiAgICAgICAgc3BhY2luZzogMVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMudXBkYXRlKHRoaXMucHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xyXG4gICAgICB0aGlzLnVwZGF0ZShuZXh0UHJvcHMpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICAgIFJlYWN0LkRPTS5nKCB7Y2xhc3NOYW1lOlwiYXhlc1wifSlcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogVmFyaW91cyBnZW9tZXRyaWMgc2hhcGVzIHRvIGJlIGRyYXduIG9uIHRoZSBjb29yZGluYXRlIHN5c3RlbS5cclxuICAgKiBAbmFtZSBTaGFwZXNcclxuICAgKiBAbWVtYmVyb2YgbW9kdWxlOkNvb3Jkc0NvbXBvbmVudHNcclxuICAgKi9cclxuICBjb29yZHNDb21wb25lbnRzLlNoYXBlcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NoYXBlcycsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIGRhdGE6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxyXG4gICAgICB4OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgICB5OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgICBzcGFjaW5nOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIHRyYW5zaXRpb25EdXJhdGlvbjogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZHJhdyBzaGFwZXMuIEdldHMgY2FsbGVkIHdoZW5ldmVyIHNoYXBlcyBhcmUgdXBkYXRlZCBvciBzY3JlZW4gcmVzaXplcy5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgICAgdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCh0aGlzLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHZhciB0cmFuc2l0aW9uRHVyYXRpb24gPSBwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24gfHwgNTUwO1xyXG5cclxuICAgICAgdmFyIHBvbHlnb25zID0gY29udGFpbmVyLnNlbGVjdEFsbChcInBvbHlnb24uc2hhcGVcIilcclxuICAgICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPiAyOyB9KSk7XHJcblxyXG4gICAgICB2YXIgYWRkZWRQb2x5Z29ucyA9IHBvbHlnb25zLmVudGVyKCkuYXBwZW5kKFwicG9seWdvblwiKS5hdHRyKFwiY2xhc3NcIiwgXCJzaGFwZVwiKTtcclxuXHJcbiAgICAgIHBvbHlnb25zLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJwb2ludHNcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgcmV0dXJuIGQucG9pbnRzLm1hcChmdW5jdGlvbihwcykge1xyXG4gICAgICAgICAgICByZXR1cm4gW3Byb3BzLngocHNbMF0pLCBwcm9wcy55KHBzWzFdKV07XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIHBvbHlnb25zLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcblxyXG4gICAgICB2YXIgY2lyY2xlcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJjaXJjbGUuc2hhcGVcIilcclxuICAgICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPT0gMTsgfSkpO1xyXG5cclxuICAgICAgdmFyIGFkZGVkQ2lyY2xlcyA9IGNpcmNsZXMuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgICBjaXJjbGVzLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzBdWzBdKTsgfSlcclxuICAgICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMF1bMV0pOyB9KVxyXG4gICAgICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy5zcGFjaW5nICogKGQuciB8fCAwLjIpOyB9KTtcclxuXHJcbiAgICAgIGNpcmNsZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuXHJcbiAgICAgIHZhciBsaW5lcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJsaW5lLnNoYXBlXCIpXHJcbiAgICAgICAgLmRhdGEocHJvcHMuZGF0YS5maWx0ZXIoZnVuY3Rpb24ocykgeyByZXR1cm4gcy5wb2ludHMubGVuZ3RoID09IDI7IH0pKTtcclxuXHJcbiAgICAgIHZhciBhZGRlZExpbmVzID0gbGluZXMuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpO1xyXG5cclxuICAgICAgbGluZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMF1bMF0pOyB9KVxyXG4gICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueShkLnBvaW50c1swXVsxXSk7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzFdWzBdKTsgfSlcclxuICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMV1bMV0pOyB9KTtcclxuXHJcbiAgICAgIGxpbmVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgIC8vIEF0dGFjaCBjbGljayBldmVudCBsaXN0ZW5lcnMuXHJcbiAgICAgIFthZGRlZFBvbHlnb25zLCBhZGRlZENpcmNsZXMsIGFkZGVkTGluZXNdLmZvckVhY2goZnVuY3Rpb24oYWRkZWQpIHtcclxuICAgICAgICBhZGRlZC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24oZC5vbkNsaWNrKSlcclxuICAgICAgICAgICAgZC5vbkNsaWNrKGQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIFNldCBjb21tb24gYXR0cmlidXRlcy5cclxuICAgICAgY29udGFpbmVyLnNlbGVjdEFsbChcIi5zaGFwZVwiKVxyXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KVxyXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc3Ryb2tlIHx8IFwic3RlZWxibHVlXCI7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gKGQuc3Ryb2tlV2lkdGggfHwgMikgKyBcInB4XCI7IH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMudXBkYXRlKHRoaXMucHJvcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xyXG4gICAgICB0aGlzLnVwZGF0ZShuZXh0UHJvcHMpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgcmV0dXJuIFJlYWN0LkRPTS5nKCB7Y2xhc3NOYW1lOlwic2hhcGVzXCJ9KTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGNvb3Jkc0NvbXBvbmVudHM7XHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvb3Jkc0NvbXBvbmVudHM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogVmFyaW91cyBjb21tb24gZm9ybSBjb21wb25lbnRzLlxyXG4gKi9cclxudmFyIEZvcm1Db21wb25lbnRzID0gKGZ1bmN0aW9uKCl7XHJcblxyXG4gIHZhciBNaXhpbnMgPSByZXF1aXJlKFwiLi9taXhpbnNcIik7XHJcblxyXG4gIHZhciBmb3JtQ29tcG9uZW50cyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBBIGZvcm0gdGhhdCBkaXNhYmxlcyBzdWJtaXR0aW5nIHdoZW4gaW5wdXRzIGFyZSBpbnZhbGlkLlxyXG4gICAqL1xyXG4gIGZvcm1Db21wb25lbnRzLkFuc3dlckZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBbnN3ZXJGb3JtJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIGJ0bkNvcnJlY3RBbmltQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGJ0bkluY29ycmVjdEFuaW1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgZm9ybUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICBtaXhpbnM6IFtNaXhpbnMuVHJpZ2dlckFuaW1hdGlvbk1peGluXSxcclxuXHJcbiAgICAvKiogU3VibWl0IGFuc3dlciBpZiBmb3JtIGlzIHZhbGlkLiAqL1xyXG4gICAgaGFuZGxlU3VibWl0OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGlmIChlKVxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLnN0YXRlLmlzVmFsaWQpIHtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQW5zd2VyKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd0Vycm9yczogdHJ1ZX0pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYnRuID0gJCh0aGlzLnJlZnMuYnRuLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHRoaXMuYW5pbWF0ZShidG4sIHRoaXMucHJvcHMuYnRuQ29ycmVjdEFuaW1DbGFzcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUluY29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBidG4gPSAkKHRoaXMucmVmcy5idG4uZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdGhpcy5hbmltYXRlKGJ0biwgdGhpcy5wcm9wcy5idG5JbmNvcnJlY3RBbmltQ2xhc3MpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWxpZGl0eTogZnVuY3Rpb24oaXNWYWxpZCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtpc1ZhbGlkOiBpc1ZhbGlkLCBpc0RpcnR5OiB0cnVlfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDbGVhciB2YWx1ZXMgYW5kIHZhbGlkYXRpb24gc3RhdGVzIGZvciBhbGwgY2hpbGQgZWxlbWVudHMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgc2hvd0Vycm9yczogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybUNsYXNzOiBcImZvcm0taG9yaXpvbnRhbFwiLFxyXG4gICAgICAgIGJ0bkNsYXNzOiBcImJ0biBidG4tc3VjY2VzcyBidG4tbGcgYnRuLWJsb2NrXCIsXHJcbiAgICAgICAgYnRuQ29ycmVjdEFuaW1DbGFzczogXCJhbmltYXRlZCBib3VuY2VcIixcclxuICAgICAgICBidG5JbmNvcnJlY3RBbmltQ2xhc3M6IFwiYW5pbWF0ZWQgc2hha2VcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgc2hvd0Vycm9yczogZmFsc2VcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXS5jb25jYXQodGhpcy5wcm9wcy5jaGlsZHJlbikubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgY2hpbGQucHJvcHMub25WYWxpZGl0eUNoYW5nZSA9IHRoaXMuc2V0VmFsaWRpdHk7XHJcbiAgICAgICAgY2hpbGQucHJvcHMub25TdWJtaXQgPSB0aGlzLmhhbmRsZVN1Ym1pdDtcclxuICAgICAgICBjaGlsZC5wcm9wcy5zaG93RXJyb3IgPSB0aGlzLnN0YXRlLnNob3dFcnJvcnM7XHJcbiAgICAgICAgcmV0dXJuIGNoaWxkO1xyXG4gICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgdmFyIGJ0bkNsYXNzID0gdGhpcy5wcm9wcy5idG5DbGFzcyArICh0aGlzLnN0YXRlLmlzVmFsaWQgPyBcIlwiIDogXCIgZGlzYWJsZWRcIik7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5mb3JtKCB7cm9sZTpcImZvcm1cIiwgY2xhc3NOYW1lOnRoaXMucHJvcHMuZm9ybUNsYXNzLCBvblN1Ym1pdDp0aGlzLmhhbmRsZVN1Ym1pdCwgbm9WYWxpZGF0ZTp0cnVlfSwgXHJcbiAgICAgICAgICBjaGlsZHJlbixcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7cmVmOlwiYnRuXCIsIHR5cGU6XCJzdWJtaXRcIiwgdmFsdWU6XCJWYXN0YWFcIiwgY2xhc3NOYW1lOmJ0bkNsYXNzfSApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQW4gaW5wdXQgd2l0aCByZWd1bGFyIGV4cHJlc3Npb24gdmFsaWRhdGlvbi5cclxuICAgKi9cclxuICBmb3JtQ29tcG9uZW50cy5SZUlucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUmVJbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHJlOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgICBzaG93RXJyb3I6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgICByZXF1aXJlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICB0eXBlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIG9uVmFsaWRpdHlDaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZWFkIHZhbHVlLCB2YWxpZGF0ZSwgbm90aWZ5IHBhcmVudCBlbGVtZW50IGlmIGFuIGV2ZW50IGlzIGF0dGFjaGVkLiAqL1xyXG4gICAgaGFuZGxlQ2hhbmdlOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy52YWxpZGF0b3IudGVzdChlLnRhcmdldC52YWx1ZSk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiBlLnRhcmdldC52YWx1ZSwgaXNWYWxpZDogaXNWYWxpZCwgaXNEaXJ0eTogdHJ1ZX0pO1xyXG5cclxuICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZShpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiB2YWx1ZX0pO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUudmFsdWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5pbnB1dC5nZXRET01Ob2RlKCkuc2VsZWN0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDbGVhciB2YWx1ZSBhbmQgcmVzZXQgdmFsaWRhdGlvbiBzdGF0ZXMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbGlkYXRvcjogZnVuY3Rpb24ocmUpIHtcclxuICAgICAgdGhpcy52YWxpZGF0b3IgPSBuZXcgUmVnRXhwKHJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFZhbGlkYXRvcih0aGlzLnByb3BzLnJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24obmV3UHJvcHMpIHtcclxuICAgICAgdGhpcy5zZXRWYWxpZGF0b3IobmV3UHJvcHMucmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZTogL15cXHMqLT9cXGQrXFxzKiQvLFxyXG4gICAgICAgIHNob3dFcnJvcjogZmFsc2UsXHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiBcIlwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHZhbGlkYXRpb25TdGF0ZSA9IFJlYWN0LmFkZG9ucy5jbGFzc1NldCh7XHJcbiAgICAgICAgXCJoYXMtc3VjY2Vzc1wiOiB0aGlzLnN0YXRlLmlzVmFsaWQgJiYgdGhpcy5zdGF0ZS5pc0RpcnR5LFxyXG4gICAgICAgIFwiaGFzLXdhcm5pbmdcIjogIXRoaXMuc3RhdGUuaXNEaXJ0eSAmJiB0aGlzLnByb3BzLnNob3dFcnJvcixcclxuICAgICAgICBcImhhcy1lcnJvclwiOiAhdGhpcy5zdGF0ZS5pc1ZhbGlkXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGVycm9yO1xyXG4gICAgICBpZiAodGhpcy5wcm9wcy5zaG93RXJyb3IpIHtcclxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuaXNWYWxpZCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJjb250cm9sLWxhYmVsXCJ9LCBcIlZpcmhlZWxsaW5lbiBzecO2dGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMucHJvcHMucmVxdWlyZWQgJiYgdGhpcy52YWx1ZSgpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJjb250cm9sLWxhYmVsXCJ9LCBcIlTDpHl0w6QgdMOkbcOkIGtlbnR0w6RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cCBcIiArIHZhbGlkYXRpb25TdGF0ZX0sIFxyXG4gICAgICAgICAgZXJyb3IsXHJcbiAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtyZWY6XCJpbnB1dFwiLCBvbkNoYW5nZTp0aGlzLmhhbmRsZUNoYW5nZSwgdmFsdWU6dGhpcy5zdGF0ZS52YWx1ZSwgcGxhY2Vob2xkZXI6dGhpcy5wcm9wcy5wbGFjZWhvbGRlcixcclxuICAgICAgICAgIHR5cGU6dGhpcy5wcm9wcy50eXBlLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgXCIgKyB0aGlzLnByb3BzLmNsYXNzTmFtZX0gKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSBudW1iZXIgaW5wdXQgd2l0aCB0d28gYnV0dG9ucyBmb3IgaW5jcmVtZW50aW5nIGFuZCBkZWNyZW1lbnRpbmcuXHJcbiAgICovXHJcbiAgZm9ybUNvbXBvbmVudHMuTnVtSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOdW1JbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXA6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgb25WYWxpZGl0eUNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXHJcbiAgICAgIG9uU3VibWl0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWx1ZUFuZFZhbGlkaXR5OiBmdW5jdGlvbih2YWx1ZSwgaXNWYWxpZCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB2YWx1ZTogdmFsdWUsIGlzVmFsaWQ6IGlzVmFsaWRcclxuICAgICAgfSk7XHJcbiAgICAgIGlmICgkLmlzRnVuY3Rpb24odGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKSlcclxuICAgICAgICB0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UoaXNWYWxpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KFwiXCIsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVEZWNyZW1lbnQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkodGhpcy52YWx1ZSgpIC0gdGhpcy5wcm9wcy5zdGVwLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlSW5jcmVtZW50OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KHRoaXMudmFsdWUoKSArIHRoaXMucHJvcHMuc3RlcCwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZXNldCBzdGF0ZSB0byBpbnB1dCB2YWx1ZSBpZiBpbnB1dCB2YWx1ZSBpcyBhIG51bWJlci4gKi9cclxuICAgIGhhbmRsZUNoYW5nZTogZnVuY3Rpb24oZSkge1xyXG4gICAgICB2YXIgdmFsID0gZS50YXJnZXQudmFsdWU7XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gIWlzTmFOKHBhcnNlRmxvYXQodmFsKSk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh2YWwsIGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogVHJ5IHRvIHN1Ym1pdCBwYXJlbnQgZm9ybSB3aGVuIEVudGVyIGlzIGNsaWNrZWQuICovXHJcbiAgICBoYW5kbGVLZXlQcmVzczogZnVuY3Rpb24oZSkge1xyXG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZiAodGhpcy5wcm9wcy5vblN1Ym1pdClcclxuICAgICAgICAgIHRoaXMucHJvcHMub25TdWJtaXQoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHRoaXMuc3RhdGUudmFsdWUpIHx8IDA7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdmFsdWU6IG51bGwsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDFcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgUmVJbnB1dCA9IGZvcm1Db21wb25lbnRzLlJlSW5wdXQ7XHJcbiAgICAgIHZhciBidG5DbGFzcyA9IHRoaXMucHJvcHMuYnRuQ2xhc3MgfHwgXCJidG4gYnRuLWxnIGJ0bi1pbmZvXCI7XHJcbiAgICAgIHZhciB2YWxpZGF0aW9uU3RhdGUgPSB0aGlzLnN0YXRlLmlzVmFsaWQgPyBcImhhcy1zdWNjZXNzXCIgOiBcImhhcy1lcnJvclwiO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cCBcIiArIHZhbGlkYXRpb25TdGF0ZX0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tMyBjb2wteHMtM1wifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3RhYkluZGV4OlwiLTFcIiwgY2xhc3NOYW1lOmJ0bkNsYXNzICsgXCIgcHVsbC1yaWdodFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlRGVjcmVtZW50fSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1sZWZ0XCJ9KVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IGNvbC14cy02XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwibnVtYmVyXCIsIHZhbHVlOnRoaXMuc3RhdGUudmFsdWUsIG9uQ2hhbmdlOnRoaXMuaGFuZGxlQ2hhbmdlLCBvbktleVByZXNzOnRoaXMuaGFuZGxlS2V5UHJlc3MsXHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LWxnIHRleHQtY2VudGVyXCIsIHBsYWNlaG9sZGVyOnRoaXMucHJvcHMucGxhY2Vob2xkZXJ9KVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTMgY29sLXhzLTNcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0YWJJbmRleDpcIi0xXCIsIGNsYXNzTmFtZTpidG5DbGFzcyArIFwiIHB1bGwtbGVmdFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlSW5jcmVtZW50fSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodFwifSlcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBmb3JtQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1Db21wb25lbnRzO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbXBsZXRlIGFuc3dlciBmb3JtcyBmb3IgdGFza3MuXHJcbiAqL1xyXG52YXIgRm9ybXMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBGb3JtQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuL2Zvcm0tY29tcG9uZW50c1wiKTtcclxuICB2YXIgQW5zd2VyRm9ybSA9IEZvcm1Db21wb25lbnRzLkFuc3dlckZvcm07XHJcbiAgdmFyIE51bUlucHV0ID0gRm9ybUNvbXBvbmVudHMuTnVtSW5wdXQ7XHJcblxyXG4gIHZhciBmb3JtcyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBGb3JtIHdpdGggYSBzaW5nbGUgbnVtYmVyIGlucHV0LlxyXG4gICAqL1xyXG4gIGZvcm1zLlNpbmdsZU51bWJlckZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTaW5nbGVOdW1iZXJGb3JtJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGlzQ29ycmVjdCA9IHRoaXMucHJvcHMub25BbnN3ZXIodGhpcy5yZWZzLmFuc3dlci52YWx1ZSgpKTtcclxuICAgICAgaWYgKGlzQ29ycmVjdCkge1xyXG4gICAgICAgIHRoaXMucmVmcy5mb3JtLmhhbmRsZUNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlSW5jb3JyZWN0QW5zd2VyKCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlZnMuZm9ybS5yZXNldCgpO1xyXG4gICAgICB0aGlzLnJlZnMuYW5zd2VyLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICAgIEFuc3dlckZvcm0oIHtyZWY6XCJmb3JtXCIsIGNsYXNzTmFtZTpcImZvcm0taG9yaXpvbnRhbFwiLCBvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0sIFxyXG4gICAgICAgICAgTnVtSW5wdXQoIHtyZWY6XCJhbnN3ZXJcIiwgcGxhY2Vob2xkZXI6XCJWYXN0YWEgdMOkaMOkblwifSlcclxuICAgICAgICApXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgICAgKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogRm9ybSB3aXRoIHR3byBpbnB1dHMgZm9yIHggYW5kIHkgY29vcmRpbmF0ZXMuXHJcbiAgICovXHJcbiAgZm9ybXMuQ29vcmRzQW5zd2VyRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nvb3Jkc0Fuc3dlckZvcm0nLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBvbkFuc3dlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaXNDb3JyZWN0ID0gdGhpcy5wcm9wcy5vbkFuc3dlcih0aGlzLnJlZnMueC52YWx1ZSgpLCB0aGlzLnJlZnMueS52YWx1ZSgpKTtcclxuICAgICAgaWYgKGlzQ29ycmVjdCkge1xyXG4gICAgICAgIHRoaXMucmVmcy5mb3JtLmhhbmRsZUNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlSW5jb3JyZWN0QW5zd2VyKCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlZnMuZm9ybS5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgQW5zd2VyRm9ybSgge3JlZjpcImZvcm1cIiwgY2xhc3NOYW1lOlwiZm9ybS1ob3Jpem9udGFsXCIsIG9uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSwgXHJcbiAgICAgICAgICBOdW1JbnB1dCgge3JlZjpcInhcIiwgcGxhY2Vob2xkZXI6XCJ4XCJ9KSxcclxuICAgICAgICAgIE51bUlucHV0KCB7cmVmOlwieVwiLCBwbGFjZWhvbGRlcjpcInlcIn0pXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gZm9ybXM7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtcztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgbW9kdWxlLCBNYXRoSmF4ICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDb21wb25lbnRzIGZvciBtYXRocyB0YXNrcy5cclxuICovXHJcbnZhciBNYXRoQ29tcG9uZW50cyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIG1hdGhDb21wb25lbnRzID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbmRlciBMYVRleCBtYXRocyBub3RhdGlvbiBpbnRvIHdlYiBmb250cyB1c2luZyBNYXRoSmF4LlxyXG4gICAqL1xyXG4gIG1hdGhDb21wb25lbnRzLk1hdGhKYXggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNYXRoSmF4JyxcclxuICAgIHJlcHJvY2VzczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBlbGVtID0gdGhpcy5yZWZzLnNjcmlwdC5nZXRET01Ob2RlKCk7XHJcbiAgICAgIE1hdGhKYXguSHViLlF1ZXVlKFtcIlJlcHJvY2Vzc1wiLCBNYXRoSmF4Lkh1YiwgZWxlbV0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVwcm9jZXNzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVwcm9jZXNzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKG51bGwsIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLnNjcmlwdCgge3JlZjpcInNjcmlwdFwiLCB0eXBlOlwibWF0aC90ZXhcIn0sIHRoaXMucHJvcHMuY2hpbGRyZW4pXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbWF0aENvbXBvbmVudHM7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXRoQ29tcG9uZW50cztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbXBvbmVudCBleHRlbnNpb25zIGkuZS4gbWl4aW5zLlxyXG4gKi9cclxudmFyIE1peGlucyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIG1peGlucyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBQcm92aWRlcyBhIHNldEludGVydmFsIGZ1bmN0aW9uIHdoaWNoIHdpbGwgZ2V0IGNsZWFuZWQgdXAgd2hlblxyXG4gICAqIHRoZSBjb21wb25lbnQgaXMgZGVzdHJveWVkLlxyXG4gICAqL1xyXG4gIG1peGlucy5TZXRJbnRlcnZhbE1peGluID0ge1xyXG4gICAgc2V0SW50ZXJ2YWw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmludGVydmFscy5wdXNoKHNldEludGVydmFsLmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhckFsbEludGVydmFsczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuaW50ZXJ2YWxzLm1hcChjbGVhckludGVydmFsKTtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMgPSBbXTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgaW5pdGlhbGl6ZWQuICovXHJcbiAgICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmludGVydmFscyA9IFtdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogSW52b2tlZCB3aGVuIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuICovXHJcbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2xlYXJBbGxJbnRlcnZhbHMoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBQcm92aWRlcyBhIHNldFRpbWVvdXQgZnVuY3Rpb24gd2hpY2ggd2lsbCBnZXQgY2xlYW5lZCB1cCB3aGVuXHJcbiAgICogdGhlIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXHJcbiAgICovXHJcbiAgbWl4aW5zLlNldFRpbWVvdXRNaXhpbiA9IHtcclxuICAgIHNldFRpbWVvdXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnRpbWVvdXRzLnB1c2goc2V0VGltZW91dC5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJBbGxUaW1lb3V0czogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMudGltZW91dHMubWFwKGNsZWFyVGltZW91dCk7XHJcbiAgICAgIHRoaXMudGltZW91dHMgPSBbXTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgaW5pdGlhbGl6ZWQuICovXHJcbiAgICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnRpbWVvdXRzID0gW107XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGRlc3Ryb3llZC4gKi9cclxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jbGVhckFsbFRpbWVvdXRzKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQXBwbHkgQ1NTIGNsYXNzZXMgZm9yIHNldCBkdXJhdGlvbiAtIHVzZWZ1bCBmb3Igc2luZ2xlc2hvdCBhbmltYXRpb25zLlxyXG4gICAqL1xyXG4gIG1peGlucy5UcmlnZ2VyQW5pbWF0aW9uTWl4aW4gPSB7XHJcbiAgICBhbmltYXRlOiBmdW5jdGlvbihlbGVtLCBjbGFzc05hbWUsIGR1cmF0aW9uKSB7XHJcbiAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgMTAwMDtcclxuICAgICAgaWYgKCF0aGlzLnRpbWVvdXQgJiYgdGhpcy50aW1lb3V0ICE9PSAwKSB7XHJcbiAgICAgICAgZWxlbS5hZGRDbGFzcyhjbGFzc05hbWUpO1xyXG4gICAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBlbGVtLnJlbW92ZUNsYXNzKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgICB0aGlzLnRpbWVvdXQgPSBudWxsO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSwgZHVyYXRpb24pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1peGlucztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1peGlucztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoqXHJcbiAqIENvbW1vbiB0YXNrIGNvbXBvbmVudHMuXHJcbiAqL1xyXG52YXIgVGFza0NvbXBvbmVudHMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBNaXhpbnMgPSByZXF1aXJlKFwiLi9taXhpbnNcIik7XHJcblxyXG4gIHZhciB0YXNrQ29tcG9uZW50cyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBBIHdyYXBwZXIgZm9yIEJvb3RzdHJhcCdzIHBhbmVsIGNvbXBvbmVudC5cclxuICAgKi9cclxuICB0YXNrQ29tcG9uZW50cy5UYXNrUGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrUGFuZWwnLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgY2xhc3NOYW1lID0gXCJwYW5lbCBcIiArICh0aGlzLnByb3BzLmNsYXNzTmFtZSB8fCBcInBhbmVsLWluZm9cIiApO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzTmFtZX0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWhlYWRpbmdcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDMoIHtjbGFzc05hbWU6XCJwYW5lbC10aXRsZVwifSwgdGhpcy5wcm9wcy5oZWFkZXIpXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWJvZHlcIn0sIFxyXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBIHdyYXBwZXIgZm9yIEJvb3RzdHJhcCdzIHByb2dyZXNzIGJhciBlbGVtZW50LlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tQcm9ncmVzc0JhciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tQcm9ncmVzc0JhcicsXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgbWF4OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIG5vdzogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHNpbmdsZVdpZHRoID0gTWF0aC5jZWlsKDEgLyB0aGlzLnByb3BzLm1heCAqIDEwMCk7XHJcbiAgICAgIHZhciBsZWZ0U3R5bGUgPSB7d2lkdGg6IHNpbmdsZVdpZHRoICogKHRoaXMucHJvcHMubm93IC0gMSkgKyBcIiVcIn07XHJcbiAgICAgIHZhciByaWdodFN0eWxlID0ge3dpZHRoOiBzaW5nbGVXaWR0aCAqICh0aGlzLnByb3BzLm1heCAtIHRoaXMucHJvcHMubm93ICsgMSkgKyBcIiVcIn07XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSB0YXNrLXByb2dyZXNzLWJhclwifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MtYmFyIHByb2dyZXNzLWJhci1zdWNjZXNzXCIsIHN0eWxlOmxlZnRTdHlsZX0pLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzLWJhciBwcm9ncmVzcy1iYXItd2FybmluZ1wiLCBzdHlsZTpyaWdodFN0eWxlfSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgdGltZXIgdGhhdCBjb3VudHMgZG93biBmcm9tIGEgc3BlY2lmaWVkIHRpbWUgYW5kIHRyaWdnZXJzIGFuIGV2ZW50XHJcbiAgICogd2hlbiBmaW5pc2hlZC4gRWxhcHNlZCB0aW1lIGlzIGRpc3BsYXllZCBpbiBhIHByb2dyZXNzIGJhci5cclxuICAgKi9cclxuICB0YXNrQ29tcG9uZW50cy5UYXNrQ291bnRkb3duVGltZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrQ291bnRkb3duVGltZXInLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICB0aW1lOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIHN0YXJ0T25Nb3VudDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIG9uRXhwaXJ5OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xyXG4gICAgfSxcclxuXHJcbiAgICBtaXhpbnM6IFtNaXhpbnMuU2V0SW50ZXJ2YWxNaXhpbl0sXHJcblxyXG4gICAgc3RhcnRDb3VudGRvd246IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB0aW1lTGVmdDogdGhpcy5wcm9wcy50aW1lXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5zZXRJbnRlcnZhbCh0aGlzLnRpY2ssIDEwMDApO1xyXG4gICAgfSxcclxuXHJcbiAgICB0aWNrOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHRpbWVMZWZ0ID0gdGhpcy5zdGF0ZS50aW1lTGVmdCAtIDE7XHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB0aW1lTGVmdDogdGltZUxlZnRcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZiAodGltZUxlZnQgPCAxKSB7XHJcbiAgICAgICAgdGhpcy5jbGVhckFsbEludGVydmFscygpO1xyXG4gICAgICAgIGlmICgkLmlzRnVuY3Rpb24odGhpcy5wcm9wcy5vbkV4cGlyeSkpIHRoaXMucHJvcHMub25FeHBpcnkoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLnByb3BzLnN0YXJ0T25Nb3VudCkgdGhpcy5zdGFydENvdW50ZG93bigpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHRpbWVMZWZ0OiB0aGlzLnByb3BzLnRpbWVcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgc2luZ2xlV2lkdGggPSBNYXRoLmNlaWwoMSAvIHRoaXMucHJvcHMudGltZSAqIDEwMCk7XHJcbiAgICAgIHZhciB3aWR0aCA9IE1hdGguY2VpbCgxIC8gdGhpcy5wcm9wcy50aW1lICogMTAwICogdGhpcy5zdGF0ZS50aW1lTGVmdCk7XHJcbiAgICAgIHZhciBiYXJTdHlsZSA9IHt3aWR0aDogd2lkdGggKyBcIiVcIn07XHJcblxyXG4gICAgICB2YXIgYmFyQ2xhc3MgPSBSZWFjdC5hZGRvbnMuY2xhc3NTZXQoe1xyXG4gICAgICAgIFwicHJvZ3Jlc3MtYmFyLXN1Y2Nlc3NcIjogd2lkdGggPj0gNDAsXHJcbiAgICAgICAgXCJwcm9ncmVzcy1iYXItd2FybmluZ1wiOiB3aWR0aCA8IDQwICYmIHdpZHRoID4gMjAsXHJcbiAgICAgICAgXCJwcm9ncmVzcy1iYXItZGFuZ2VyXCI6IHdpZHRoIDw9IDIwLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIHRhc2stcHJvZ3Jlc3MtYmFyXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcy1iYXIgXCIgKyBiYXJDbGFzcywgc3R5bGU6YmFyU3R5bGV9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGFzayBoZWFkZXIsIGRpc3BsYXlzIHRhc2sgbmFtZS5cclxuICAgKi9cclxuICB0YXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza0hlYWRlcicsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG5hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhc2staGVhZGVyIHJvd1wifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTdcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDIobnVsbCwgdGhpcy5wcm9wcy5uYW1lKVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNVwifSwgXHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICAvKipcclxuICAgKiBBbiBlbGVtZW50IHRoYXQgaXMgc2hvd24gYWZ0ZXIgYSBjb21wbGV0ZWQgdGFzay5cclxuICAgKi9cclxuICB0YXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXkgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrRG9uZURpc3BsYXknLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzY29yZTogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBzY29yZSA9IHRoaXMucHJvcHMuc2NvcmUgfHwgMDtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhc2stZG9uZS1kaXNwbGF5IGFuaW1hdGUgYm91bmNlLWluXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJhbGVydCBhbGVydC1zdWNjZXNzXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBcIlRlaHTDpHbDpCBzdW9yaXRldHR1IVwiKSwgXCIgUGlzdGVpdMOkOiBcIiwgc2NvcmVcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0YXNrQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tDb21wb25lbnRzO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIEEgc2ltcGxlIGludGVnZXIgYWRkaXRpb24gdGFzay5cclxuICovXHJcbnZhciBBZGRpdGlvblRhc2sgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxuICB2YXIgU2luZ2xlTnVtYmVyRm9ybSA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Zvcm1zXCIpLlNpbmdsZU51bWJlckZvcm07XHJcbiAgdmFyIE1hdGhDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvbWF0aC1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50c1wiKTtcclxuXHJcblxyXG4gIHZhciBhZGRpdGlvblRhc2sgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdhZGRpdGlvblRhc2snLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzdGVwczogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgICBvblRhc2tEb25lOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZXNldCB0aGUgcXVlc3Rpb24uICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBhLCBiO1xyXG4gICAgICBkbyB7XHJcbiAgICAgICAgYSA9IFRhc2tVdGlscy5yYW5kUmFuZ2UoMSwgMTEpO1xyXG4gICAgICAgIGIgPSBUYXNrVXRpbHMucmFuZFJhbmdlKDEsIDExKTtcclxuICAgICAgfVxyXG4gICAgICB3aGlsZSAoVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihbYSxiXSwgW3RoaXMuc3RhdGUuYSwgdGhpcy5zdGF0ZS5iXSkpO1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICBhOiBhLFxyXG4gICAgICAgIGI6IGIsXHJcbiAgICAgICAgYW5zd2VyOiBhICsgYlxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENoZWNrIGlmIGNvcnJlY3QuICovXHJcbiAgICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKGFuc3dlcikge1xyXG4gICAgICB2YXIgaXNDb3JyZWN0ID0gVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihhbnN3ZXIsIHRoaXMuc3RhdGUuYW5zd2VyKTtcclxuICAgICAgaWYgKGlzQ29ycmVjdClcclxuICAgICAgICB0aGlzLmhhbmRsZUNvcnJlY3RBbnN3ZXIoKTtcclxuXHJcbiAgICAgIHJldHVybiBpc0NvcnJlY3Q7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgc3RlcCA9IHRoaXMuc3RhdGUuc3RlcDtcclxuICAgICAgaWYgKHN0ZXAgPT09IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25UYXNrRG9uZSgpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3N0ZXA6IHN0ZXAgKyAxfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDEsXHJcbiAgICAgICAgYW5zd2VyOiBudWxsXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIFRhc2tQYW5lbCA9IFRhc2tDb21wb25lbnRzLlRhc2tQYW5lbDtcclxuICAgICAgdmFyIFRhc2tIZWFkZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyO1xyXG4gICAgICB2YXIgVGFza1Byb2dyZXNzQmFyID0gVGFza0NvbXBvbmVudHMuVGFza1Byb2dyZXNzQmFyO1xyXG4gICAgICB2YXIgVGFza0RvbmVEaXNwbGF5ID0gVGFza0NvbXBvbmVudHMuVGFza0RvbmVEaXNwbGF5O1xyXG4gICAgICB2YXIgTWF0aEpheCA9IE1hdGhDb21wb25lbnRzLk1hdGhKYXg7XHJcblxyXG4gICAgICB2YXIgdGFza0lzRG9uZSA9IHRoaXMuc3RhdGUuc3RlcCA+IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpO1xyXG4gICAgICB2YXIgcXVlc3Rpb24sIHNpZGViYXI7XHJcblxyXG4gICAgICBpZiAoIXRhc2tJc0RvbmUpIHtcclxuICAgICAgICB2YXIgcXVlc3Rpb25Db250ZW50ID0gdGhpcy5zdGF0ZS5hICsgXCIgKyBcIiArIHRoaXMuc3RhdGUuYiArIFwiID0gP1wiO1xyXG4gICAgICAgIHF1ZXN0aW9uID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRleHQtY2VudGVyXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmgxKG51bGwsIFxyXG4gICAgICAgICAgICAgIE1hdGhKYXgobnVsbCwgcXVlc3Rpb25Db250ZW50KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXCJNaWvDpCBvbiB5aHRlZW5sYXNrdW4gdHVsb3M/XCIpXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIlZhc3RhdXNcIiwgY2xhc3NOYW1lOlwicGFuZWwtc3VjY2VzcyBwYW5lbC1leHRyYS1wYWRkaW5nXCJ9LCBcclxuICAgICAgICAgICAgICBTaW5nbGVOdW1iZXJGb3JtKCB7b25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9IClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcXVlc3Rpb24gPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZToxMH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIllodGVlbmxhc2t1XCJ9LCBcclxuICAgICAgICAgICAgVGFza1Byb2dyZXNzQmFyKCB7bm93OnRoaXMuc3RhdGUuc3RlcCwgbWF4OnRoaXMucHJvcHMuc3RlcHN9KVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICAgIHF1ZXN0aW9uXHJcbiAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTUgY29sLXNtLW9mZnNldC0xXCJ9LCBcclxuICAgICAgICAgICAgICBzaWRlYmFyXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBhZGRpdGlvblRhc2s7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBZGRpdGlvblRhc2s7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIGQzLCBtb2R1bGUsIHJlcXVpcmUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIERldGVjdCBhcyBtYW55IHNoYXBlcyBhcyB5b3UgY2FuIGluIDYwIHNlY29uZHMuXHJcbiAqL1xyXG52YXIgQmFzaWNTaGFwZXNUYXNrID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgVGFza1V0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzL3Rhc2stdXRpbHNcIik7XHJcbiAgdmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBDb29yZHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9jb29yZHMtY29tcG9uZW50c1wiKS5Db29yZHM7XHJcbiAgdmFyIE1peGlucyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL21peGluc1wiKTtcclxuXHJcbiAgdmFyIGJhc2ljU2hhcGVzVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ2Jhc2ljU2hhcGVzVGFzaycsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIHRpbWU6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICBtaXhpbnM6IFtNaXhpbnMuVHJpZ2dlckFuaW1hdGlvbk1peGluLCBNaXhpbnMuU2V0VGltZW91dE1peGluXSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2Ygc2l4IGRpZmZlcmVudCBzaGFwZXMgdGhhdCBmaWxsIHRoZSBjb29yZHNcclxuICAgICAqIGluIGEgcmFuZG9tIG9yZGVyLlxyXG4gICAgICovXHJcbiAgICBnZXRSYW5kb21TaGFwZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYzEgPSAwLjQ2LCBjMiA9IDEuMjEsIHMxID0gMS40MywgczIgPSAwLjg4NTtcclxuICAgICAgdmFyIHBlbnRhZ29uUHRzID0gW1stczIsLWMyXSwgWy1zMSxjMV0sIFswLDEuNV0sIFtzMSxjMV0sIFtzMiwtYzJdXTtcclxuICAgICAgcGVudGFnb25QdHMgPSBUYXNrVXRpbHMudHJhbnNsYXRlKHBlbnRhZ29uUHRzLCAyLjUsIDEuNSk7XHJcblxyXG4gICAgICB2YXIgdHJhbnNsYXRlcyA9IFtbMCwwXSwgWzYsMF0sIFswLDRdLCBbNiw0XSwgWzAsOF0sIFs2LDhdXTtcclxuICAgICAgdmFyIGJhc2VzID0gW1xyXG4gICAgICAgIHtuYW1lOlwia29sbWlvXCIsIHBvaW50czpbWzEsMF0sIFsxLDNdLCBbNCwwXV19LFxyXG4gICAgICAgIHtuYW1lOlwibmVsacO2XCIsIHBvaW50czpbWzEsMF0sIFsxLDNdLCBbNCwzXSwgWzQsMF1dfSxcclxuICAgICAgICB7bmFtZTpcInltcHlyw6RcIiwgcG9pbnRzOltbMi41LDEuNV1dLCByOjEuNX0sXHJcbiAgICAgICAge25hbWU6XCJzdXVubmlrYXNcIiwgcG9pbnRzOltbMCwwXSwgWzAuNSwzXSwgWzQuNSwzXSwgWzQsMF1dfSxcclxuICAgICAgICB7bmFtZTpcInB1b2xpc3V1bm5pa2FzXCIsIHBvaW50czpbWzAsMF0sIFswLjUsM10sIFs0LDNdLCBbNC41LDBdXX0sXHJcbiAgICAgICAge25hbWU6XCJ2aWlzaWt1bG1pb1wiLCBwb2ludHM6cGVudGFnb25QdHN9XHJcbiAgICAgIF07XHJcblxyXG4gICAgICBiYXNlcyA9IFRhc2tVdGlscy5zaHVmZmxlKGJhc2VzKTtcclxuICAgICAgdmFyIGNscnMgPSBkMy5zY2FsZS5jYXRlZ29yeTEwKCk7XHJcblxyXG4gICAgICB2YXIgc2hhcGVzID0gYmFzZXMubWFwKGZ1bmN0aW9uKGJhc2UsIGkpIHtcclxuICAgICAgICB2YXIgdHJhbnNsYXRlWCA9IHRyYW5zbGF0ZXNbaV1bMF0gKyBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICAgIHZhciB0cmFuc2xhdGVZID0gdHJhbnNsYXRlc1tpXVsxXSArIE1hdGgucmFuZG9tKCk7XHJcbiAgICAgICAgYmFzZS5wb2ludHMgPSBUYXNrVXRpbHMudHJhbnNsYXRlKGJhc2UucG9pbnRzLCB0cmFuc2xhdGVYLCB0cmFuc2xhdGVZKTtcclxuICAgICAgICBiYXNlLmtleSA9IGk7XHJcbiAgICAgICAgYmFzZS5vbkNsaWNrID0gdGhpcy5oYW5kbGVTaGFwZUNsaWNrO1xyXG4gICAgICAgIGJhc2Uuc3Ryb2tlID0gXCJibGFja1wiO1xyXG4gICAgICAgIGJhc2UuZmlsbCA9IGNscnMoVGFza1V0aWxzLnJhbmQoOSkpO1xyXG4gICAgICAgIHJldHVybiBiYXNlO1xyXG4gICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgcmV0dXJuIHNoYXBlcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlc2V0IHRoZSBxdWVzdGlvbiwgaS5lLiBnZW5lcmF0ZSBuZXcgc2hhcGVzLiAqL1xyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgc2hhcGVzID0gdGhpcy5nZXRSYW5kb21TaGFwZXMoKTtcclxuXHJcbiAgICAgIC8vIFByZXZlbnQgYXNraW5nIGZvciB0aGUgc2FtZSBzaGFwZSB0d2ljZSBpbiBhIHJvdy5cclxuICAgICAgdmFyIHBvc3NpYmxlVGFyZ2V0cyA9IHNoYXBlcztcclxuICAgICAgaWYgKHRoaXMuc3RhdGUudGFyZ2V0KSB7XHJcbiAgICAgICAgcG9zc2libGVUYXJnZXRzID0gcG9zc2libGVUYXJnZXRzLmZpbHRlcihmdW5jdGlvbihzaGFwZSkge1xyXG4gICAgICAgICAgcmV0dXJuIHNoYXBlLm5hbWUgIT09IHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWU7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgfVxyXG4gICAgICB2YXIgdGFyZ2V0ID0gcG9zc2libGVUYXJnZXRzW1Rhc2tVdGlscy5yYW5kKHBvc3NpYmxlVGFyZ2V0cy5sZW5ndGgpXTtcclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHNoYXBlczogdGhpcy5nZXRSYW5kb21TaGFwZXMoKSxcclxuICAgICAgICB0YXJnZXQ6IHRhcmdldFxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlU3RhcnRCdG5DbGljazogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe2lzUnVubmluZzogdHJ1ZSwgc2NvcmU6IDB9KTtcclxuICAgICAgdGhpcy5yZWZzLnRpbWVyLnN0YXJ0Q291bnRkb3duKCk7XHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENoZWNrIGlmIGNvcnJlY3Qgc2hhcGUgYW5kIHByb2NlZWQuICovXHJcbiAgICBoYW5kbGVTaGFwZUNsaWNrOiBmdW5jdGlvbihzaGFwZSkge1xyXG4gICAgICB2YXIgc2NvcmVJbmNyZW1lbnQ7XHJcbiAgICAgIGlmIChzaGFwZS5uYW1lID09PSB0aGlzLnN0YXRlLnRhcmdldC5uYW1lKSB7XHJcbiAgICAgICAgc2NvcmVJbmNyZW1lbnQgPSAxO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNjb3JlSW5jcmVtZW50ID0gLTE7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBlbGVtID0gJCh0aGlzLnJlZnMuc2NvcmUuZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdmFyIGFuaW0gPSBzY29yZUluY3JlbWVudCA+IDAgPyBcInB1bHNlXCIgOiBcInNoYWtlXCI7XHJcbiAgICAgIHRoaXMuYW5pbWF0ZShlbGVtLCBhbmltLCAxMDAwKTtcclxuXHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtzY29yZTogTWF0aC5tYXgodGhpcy5zdGF0ZS5zY29yZSArIHNjb3JlSW5jcmVtZW50LCAwKX0pO1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBUYXNrIGZpbmlzaGVzIChhZnRlciBhIHNtYWxsIHRpbWVvdXQgZm9yIHNtb290aG5lc3MpIHdoZW4gdGltZXIgZXhwaXJlcy4gKi9cclxuICAgIGhhbmRsZVRpbWVyRXhwaXJ5OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBpc0ZpbmlzaGVkOiB0cnVlIH0pO1xyXG4gICAgICB9LmJpbmQodGhpcyksIDUwMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgICBzY29yZTogMCxcclxuICAgICAgICBpc1J1bm5pbmc6IGZhbHNlLFxyXG4gICAgICAgIGlzRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIFRhc2tQYW5lbCA9IFRhc2tDb21wb25lbnRzLlRhc2tQYW5lbDtcclxuICAgICAgdmFyIFRhc2tIZWFkZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyO1xyXG4gICAgICB2YXIgVGFza0RvbmVEaXNwbGF5ID0gVGFza0NvbXBvbmVudHMuVGFza0RvbmVEaXNwbGF5O1xyXG4gICAgICB2YXIgVGFza0NvdW50ZG93blRpbWVyID0gVGFza0NvbXBvbmVudHMuVGFza0NvdW50ZG93blRpbWVyO1xyXG5cclxuICAgICAgdmFyIHNoYXBlcyA9IHRoaXMuc3RhdGUuc2hhcGVzO1xyXG4gICAgICB2YXIgcXVlc3Rpb24sIHNpZGViYXIsIHRpbWVyO1xyXG5cclxuICAgICAgaWYgKCF0aGlzLnN0YXRlLmlzRmluaXNoZWQpIHtcclxuICAgICAgICB2YXIgYm91bmRzID0ge21heFk6IDEyLCBtYXhYOiAxMiwgbWluWTogMCwgbWluWDogMH07XHJcblxyXG4gICAgICAgIHF1ZXN0aW9uID0gQ29vcmRzKCB7ZHJhd0F4ZXM6ZmFsc2UsIHNoYXBlczpzaGFwZXMsIGJvdW5kczpib3VuZHMsIGFzcGVjdDoxfSApO1xyXG5cclxuICAgICAgICB2YXIgc2hhcGVUb0ZpbmQgPSBcImtvbG1pb1wiO1xyXG5cclxuICAgICAgICB2YXIgc3RhcnRCdG4gPSB0aGlzLnN0YXRlLmlzUnVubmluZyA/IG51bGwgOiAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJhbmltYXRlZCBhbmltYXRlZC1yZXBlYXQgYm91bmNlIGJ0biBidG4tcHJpbWFyeSBidG4tYmxvY2tcIiwgb25DbGljazp0aGlzLmhhbmRsZVN0YXJ0QnRuQ2xpY2t9LCBcbiAgICAgICAgICAgICAgXCJBbG9pdGEgcGVsaVwiXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgdmFyIHRhcmdldERpc3BsYXkgPSAhdGhpcy5zdGF0ZS50YXJnZXQgPyBudWxsIDogKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFuaW1hdGVkIGJvdW5jZS1pblwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcbiAgICAgICAgICAgIFwiS2xpa2F0dGF2YSBrYXBwYWxlOiBcIiwgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCB0aGlzLnN0YXRlLnRhcmdldC5uYW1lKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7cmVmOlwic2NvcmVcIiwgY2xhc3NOYW1lOlwiYW5pbWF0ZWQgdGV4dC1jZW50ZXJcIn0sIFxuICAgICAgICAgICAgICBcIlBpc3RlZXQ6IFwiLCBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImxhYmVsIGxhYmVsLXdhcm5pbmdcIn0sIHRoaXMuc3RhdGUuc2NvcmUpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcbiAgICAgICAgICAgICAgXCJFdHNpIGtvb3JkaW5hYXRpc3Rvc3RhIG3DpMOkcsOkdHR5IHRhc29rdXZpbyBqYSBrbGlra2FhIHNpdMOkLlwiLFJlYWN0LkRPTS5icihudWxsKSxcbiAgICAgICAgICAgICAgXCJTaW51bGxhIG9uIFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHRoaXMucHJvcHMudGltZSwgXCIgc2VrdW50aWFcIiksIFwiIGFpa2FhLlwiLFxuICAgICAgICAgICAgICBzdGFydEJ0bixcclxuICAgICAgICAgICAgICB0YXJnZXREaXNwbGF5XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXN0aW9uID0gVGFza0RvbmVEaXNwbGF5KCB7c2NvcmU6dGhpcy5zdGF0ZS5zY29yZX0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIkthcHBhbGVpZGVuIHR1bm5pc3RhbWluZW5cIn0sIFxyXG4gICAgICAgICAgICBUYXNrQ291bnRkb3duVGltZXIoIHtyZWY6XCJ0aW1lclwiLCB0aW1lOnRoaXMucHJvcHMudGltZSwgb25FeHBpcnk6dGhpcy5oYW5kbGVUaW1lckV4cGlyeX0pXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBxdWVzdGlvblwifSwgXHJcbiAgICAgICAgICAgICAgcXVlc3Rpb25cclxuICAgICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNSBjb2wtc20tb2Zmc2V0LTFcIn0sIFxyXG4gICAgICAgICAgICAgIHNpZGViYXJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGJhc2ljU2hhcGVzVGFzaztcclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQmFzaWNTaGFwZXNUYXNrO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlYWQgcG9zaXRpb25zIGZyb20gYSBjb29yZGluYXRlIHN5c3RlbS5cclxuICovXHJcbnZhciBTaW1wbGVDb29yZHNUYXNrID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgVGFza1V0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzL3Rhc2stdXRpbHNcIik7XHJcbiAgdmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBDb29yZHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9jb29yZHMtY29tcG9uZW50c1wiKS5Db29yZHM7XHJcbiAgdmFyIEZvcm1zID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvZm9ybXNcIik7XHJcblxyXG5cclxuICB2YXIgc2ltcGxlQ29vcmRzVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ3NpbXBsZUNvb3Jkc1Rhc2snLFxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXBzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlc2V0IHRoZSBxdWVzdGlvbiwgaS5lLiBnZW5lcmF0ZSBhIG5ldyByYW5kb20gcG9pbnQuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBuZXdQb2ludDtcclxuICAgICAgZG8geyBuZXdQb2ludCA9IFtUYXNrVXRpbHMucmFuZFJhbmdlKDAsIDEwKSwgVGFza1V0aWxzLnJhbmRSYW5nZSgwLCAxMCldOyB9XHJcbiAgICAgIHdoaWxlIChUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKG5ld1BvaW50LCB0aGlzLnN0YXRlLnBvaW50KSk7XHJcblxyXG4gICAgICB0aGlzLnNldFN0YXRlKHtwb2ludDogbmV3UG9pbnR9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENoZWNrIGlmIGNvcnJlY3QuICovXHJcbiAgICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgdmFyIGlzQ29ycmVjdCA9IFRhc2tVdGlscy5tYXRjaGVzU29sdXRpb24oW3gsIHldLCB0aGlzLnN0YXRlLnBvaW50KTtcclxuICAgICAgaWYgKGlzQ29ycmVjdClcclxuICAgICAgICB0aGlzLmhhbmRsZUNvcnJlY3RBbnN3ZXIoKTtcclxuXHJcbiAgICAgIHJldHVybiBpc0NvcnJlY3Q7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgc3RlcCA9IHRoaXMuc3RhdGUuc3RlcDtcclxuICAgICAgaWYgKHN0ZXAgPT09IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25UYXNrRG9uZSgpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3N0ZXA6IHN0ZXAgKyAxfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDEsXHJcbiAgICAgICAgcG9pbnQ6IG51bGxcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrUHJvZ3Jlc3NCYXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBDb29yZHNBbnN3ZXJGb3JtID0gRm9ybXMuQ29vcmRzQW5zd2VyRm9ybTtcclxuXHJcbiAgICAgIHZhciBwb2ludCA9IHRoaXMuc3RhdGUucG9pbnQ7XHJcbiAgICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcyk7XHJcbiAgICAgIHZhciBjb29yZHMsIHNpZGViYXI7XHJcblxyXG4gICAgICBpZiAocG9pbnQgJiYgIXRhc2tJc0RvbmUpIHtcclxuICAgICAgICB2YXIgYm91bmRzID0ge21heFk6IDEwLCBtYXhYOiAxMCwgbWluWTogLTIsIG1pblg6IC0yfTtcclxuICAgICAgICB2YXIgc2hhcGVzID0gW3twb2ludHM6IFtwb2ludF0sIHI6MC4yLCBzdHJva2VXaWR0aDogMywgc3Ryb2tlOiBcIiNGRjVCMjRcIiwgZmlsbDpcIiNGRDAwMDBcIn1dO1xyXG5cclxuICAgICAgICBjb29yZHMgPSBDb29yZHMoIHtzaGFwZXM6c2hhcGVzLCBib3VuZHM6Ym91bmRzLCBhc3BlY3Q6MX0gKTtcclxuXHJcbiAgICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXCJNaXRrw6Qgb3ZhdCBwaXN0ZWVuIHgtamEgeS1rb29yZGluYWF0aXQ/XCIpXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIlZhc3RhdXNcIiwgY2xhc3NOYW1lOlwicGFuZWwtc3VjY2VzcyBwYW5lbC1leHRyYS1wYWRkaW5nXCJ9LCBcclxuICAgICAgICAgICAgICBDb29yZHNBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0gKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICh0YXNrSXNEb25lKSB7XHJcbiAgICAgICAgY29vcmRzID0gVGFza0RvbmVEaXNwbGF5KCB7c2NvcmU6MTB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgVGFza0hlYWRlcigge25hbWU6XCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCJ9LCBcclxuICAgICAgICAgICAgVGFza1Byb2dyZXNzQmFyKCB7bm93OnRoaXMuc3RhdGUuc3RlcCwgbWF4OnRoaXMucHJvcHMuc3RlcHN9KVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICAgIGNvb3Jkc1xyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gc2ltcGxlQ29vcmRzVGFzaztcclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2ltcGxlQ29vcmRzVGFzaztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qIGdsb2JhbCBtb2R1bGUgKi9cclxuXHJcbi8qKlxyXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyAobWFpbmx5IG1hdGhzIHJlbGF0ZWQpIGZvciB0YXNrcy5cclxuICovXHJcbnZhciBUYXNrVXRpbHMgPSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBpbnRlZ2VyIGluIHJhbmdlIFttaW4sIG1heFsuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtaW4gICBJbmNsdXNpdmUgbG93ZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtYXggICBFeGNsdXNpdmUgdXBwZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXI9fSBjb3VudCBJZiBzZXQsIHJldHVybiBhIGxpc3Qgb2YgcmFuZG9tIHZhbHVlcy5cclxuICAgICAqIEByZXR1cm4geyhudW1iZXJ8W251bWJlcl0pfSBBIHNpbmdsZSBvciBtdWx0aXBsZSByYW5kb20gaW50cy5cclxuICAgICAqL1xyXG4gICAgcmFuZFJhbmdlOiBmdW5jdGlvbihtaW4sIG1heCwgY291bnQpIHtcclxuICAgICAgICBpZiAoY291bnQgJiYgY291bnQgPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciByYW5kcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHJhbmRzLnB1c2godGhpcy5yYW5kUmFuZ2UobWluLCBtYXgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmFuZHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSkgKyBtaW47XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgaW4gcmFuZ2UgWzAsIG1heFsuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtYXggICBFeGNsdXNpdmUgdXBwZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXI9fSBjb3VudCBJZiBzZXQsIHJldHVybiBhIGxpc3Qgb2YgcmFuZG9tIHZhbHVlcy5cclxuICAgICAqIEByZXR1cm4ge251bWJlcnxbbnVtYmVyXX0gQSBzaW5nbGUgb3IgbXVsdGlwbGUgcmFuZG9tIGludHMuXHJcbiAgICAgKi9cclxuICAgIHJhbmQ6IGZ1bmN0aW9uKG1heCwgY291bnQpIHtcclxuICAgICAgICBpZiAoY291bnQgJiYgY291bnQgPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciByYW5kcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHJhbmRzLnB1c2godGhpcy5yYW5kKG1heCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByYW5kcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKiogUmVvcmRlcnMgZ2l2ZW4gYXJyYXkgcmFuZG9tbHksIGRvZXNuJ3QgbW9kaWZ5IG9yaWdpbmFsIGFycmF5LiAqL1xyXG4gICAgc2h1ZmZsZTogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGNsb25lID0gYXJyLnNsaWNlKCk7XHJcbiAgICAgICAgdmFyIHNodWZmbGVkID0gW107XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSBjbG9uZS5sZW5ndGg7IGkgPiAwOyBpLS0pIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5yYW5kKGkpO1xyXG4gICAgICAgICAgICBzaHVmZmxlZC5wdXNoKGNsb25lLnNwbGljZShpbmRleCwgMSlbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNodWZmbGVkO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmdlIG9mIGludGVnZXJzLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9ICBtaW4gIEluY2x1c2l2ZSBsb3dlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSAgbWF4ICBFeGNsdXNpdmUgdXBwZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcj19IHN0ZXAgT3B0aW9uYWwgaW5jcmVtZW50IHZhbHVlLCBkZWZhdWx0cyB0byAxLlxyXG4gICAgICogQHJldHVybiB7W251bWJlcl19ICAgIFRoZSBzcGVjaWZpZWQgcmFuZ2Ugb2YgbnVtYmVycyBpbiBhbiBhcnJheS5cclxuICAgICAqL1xyXG4gICAgcmFuZ2U6IGZ1bmN0aW9uKG1pbiwgbWF4LCBzdGVwKSB7XHJcbiAgICAgICAgc3RlcCA9IHN0ZXAgfHwgMTtcclxuICAgICAgICB2YXIgcmVzID0gW107XHJcbiAgICAgICAgaWYgKHN0ZXAgPiAwKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBtaW47IGkgPCBtYXg7IGkgKz0gc3RlcCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2goaSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gbWluOyBqID4gbWF4OyBqICs9IHN0ZXApIHtcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayB3aGV0aGVyIGFycmF5cyBlcXVhbC5cclxuICAgICAqIEBwYXJhbSAgYXJyMVxyXG4gICAgICogQHBhcmFtICBhcnIyXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBhcnJheXNFcXVhbDogZnVuY3Rpb24oYXJyMSwgYXJyMikge1xyXG4gICAgICAgIGlmIChhcnIxLmxlbmd0aCAhPT0gYXJyMi5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFycjEuZXZlcnkoZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZCA9PT0gYXJyMltpXTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhbnNsYXRlIGFuIGFycmF5IG9mIHBvaW50cyBieSBnaXZlbiB4IGFuZCB5IHZhbHVlcy5cclxuICAgICAqIEBwYXJhbSAge1tbbnVtYmVyXV19IHBvaW50c1xyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgeFxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgeVxyXG4gICAgICogQHJldHVybiB7W1tudW1iZXJdXX1cclxuICAgICAqL1xyXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbihwb2ludHMsIHgsIHkpIHtcclxuICAgICAgICByZXR1cm4gcG9pbnRzLm1hcChmdW5jdGlvbihwb2ludCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW3BvaW50WzBdICsgeCwgcG9pbnRbMV0gKyB5XTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29tcGFyZSBnaXZlbiBhbnN3ZXIgdG8gdGhlIGNvcnJlY3Qgc29sdXRpb24uIFN1cHBvcnRzIHZhcmlvdXMgZGF0YSB0eXBlcy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gYW5zd2VyXHJcbiAgICAgKiBAcGFyYW0gc29sdXRpb24gQSBzdHJpbmcsIG51bWJlciwgYXJyYXksIG9iamVjdCBvciBSZWdFeHAuXHJcbiAgICAgKiBAcGFyYW0gZXBzaWxvbiAgT3B0aW9uYWwgbWF4IGVycm9yIHZhbHVlIGZvciBmbG9hdCBjb21wYXJpc29uLCBkZWZhdWx0IGlzIDAuMDAxLlxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiBjb3JyZWN0LCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIG1hdGNoZXNTb2x1dGlvbjogZnVuY3Rpb24oYW5zd2VyLCBzb2x1dGlvbiwgZXBzaWxvbikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgYW5zd2VyID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci50cmltKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHNvbHV0aW9uID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgIGFuc3dlciA9IHBhcnNlRmxvYXQoYW5zd2VyKTtcclxuICAgICAgICAgICAgaWYgKGlzTmFOKGFuc3dlcikpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgZXBzaWxvbiA9IGVwc2lsb24gPT09IHVuZGVmaW5lZCA/IDAuMDAxIDogZXBzaWxvbjtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmFicyhhbnN3ZXIgLSBzb2x1dGlvbikgPD0gZXBzaWxvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIFJlZ0V4cCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc29sdXRpb24udGVzdChhbnN3ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoc29sdXRpb24gaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICBpZiAoIWFuc3dlciBpbnN0YW5jZW9mIEFycmF5IHx8IGFuc3dlci5sZW5ndGggIT09IHNvbHV0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhbnN3ZXIuZXZlcnkoZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQubWF0Y2hlc1NvbHV0aW9uKGQsIHNvbHV0aW9uW2ldLCBlcHNpbG9uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc29sdXRpb24gaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgaWYgKCFhbnN3ZXIgaW5zdGFuY2VvZiBPYmplY3QpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgYW5zS2V5cyA9IE9iamVjdC5rZXlzKGFuc3dlcik7XHJcbiAgICAgICAgICAgIGlmIChhbnNLZXlzLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoc29sdXRpb24pLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhbnNLZXlzLmV2ZXJ5KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Lm1hdGNoZXNTb2x1dGlvbihhbnN3ZXJbZF0sIHNvbHV0aW9uW2RdKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYW5zd2VyID09PSBzb2x1dGlvbjtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGFza1V0aWxzOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuJChmdW5jdGlvbigpIHtcclxuICAgIHZhciBBcHBsaWNhdGlvbiA9IHJlcXVpcmUoXCIuL2pzL2FwcGxpY2F0aW9uLmpzXCIpO1xyXG5cclxuICAgIFJlYWN0LnJlbmRlckNvbXBvbmVudChcclxuICAgICAgICBBcHBsaWNhdGlvbihudWxsICksXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHBsaWNhdGlvblwiKVxyXG4gICAgKTtcclxufSk7XHJcbi8qIGpzaGludCBpZ25vcmU6ZW5kICovIl19
