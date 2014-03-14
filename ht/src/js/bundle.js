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


/** A 2D coordinate system. */
var Coords = React.createClass({displayName: 'Coords',

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

  /** Translate and round screen position into coordinates, trigger event. */
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

/** A grid for the coordinate system. */
var Grid = React.createClass({displayName: 'Grid',

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
      React.DOM.g( {className:"axes"})
      /* jshint ignore:end */
    );
  }
});


/** Various geometric shapes to be drawn on the coordinate system. */
var Shapes = React.createClass({displayName: 'Shapes',

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
    return React.DOM.g( {className:"shapes"});
    /* jshint ignore:end */
  }
});

module.exports = Coords;

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
  var Coords = require("../components/coords");
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

},{"../components/coords":2,"../components/mixins":6,"../components/task-components":7,"../utils/task-utils":11}],10:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * Read positions from a coordinate system.
 */
var SimpleCoordsTask = (function() {

  var TaskUtils = require("../utils/task-utils");
  var TaskComponents = require("../components/task-components");
  var Coords = require("../components/coords");
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

},{"../components/coords":2,"../components/forms":4,"../components/task-components":7,"../utils/task-utils":11}],11:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGxvY2FsYWRtaW5cXEFwcERhdGFcXFJvYW1pbmdcXG5wbVxcbm9kZV9tb2R1bGVzXFx3YXRjaGlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiQzovVXNlcnMvbG9jYWxhZG1pbi9Eb3dubG9hZHMvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL2Nvb3Jkcy5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvanMvY29tcG9uZW50cy9mb3JtLWNvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvZm9ybXMuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvbWF0aC1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvbG9jYWxhZG1pbi9Eb3dubG9hZHMvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL21peGlucy5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvanMvY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL3Rhc2tzL2FkZGl0aW9uLXRhc2suanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL3Rhc2tzL2Jhc2ljLXNoYXBlcy10YXNrLmpzIiwiQzovVXNlcnMvbG9jYWxhZG1pbi9Eb3dubG9hZHMvZ2tvL2h0L3NyYy9qcy90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2suanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL3V0aWxzL3Rhc2stdXRpbHMuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuLyogZ2xvYmFscyBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblxyXG5cclxudmFyIEFkZGl0aW9uVGFzayA9IHJlcXVpcmUoXCIuL3Rhc2tzL2FkZGl0aW9uLXRhc2tcIik7XHJcbnZhciBTaW1wbGVDb29yZHNUYXNrID0gcmVxdWlyZShcIi4vdGFza3Mvc2ltcGxlLWNvb3Jkcy10YXNrXCIpO1xyXG52YXIgQmFzaWNTaGFwZXNUYXNrID0gcmVxdWlyZShcIi4vdGFza3MvYmFzaWMtc2hhcGVzLXRhc2tcIik7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbnRhaW5lciBhbmQgbGlua3MgZm9yIGV4YW1wbGUgdGFza3MuXHJcbiAqL1xyXG52YXIgQXBwbGljYXRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBcHBsaWNhdGlvbicsXHJcblxyXG4gIGhhbmRsZUxpc3RDbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdmFyIHRhc2tOYW1lID0gZS50YXJnZXQudGV4dDtcclxuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkVGFzazogdGFza05hbWV9KTtcclxuICB9LFxyXG5cclxuICBoYW5kbGVUYXNrRG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIlRhc2sgZG9uZSAtIGhlcmUncyB3aGVyZSB0aGUgdGFzayBjb25uZWN0cyB0byBhbiBleHRlcm5hbCBhcHAuXCIpO1xyXG4gIH0sXHJcblxyXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge3NlbGVjdGVkVGFzazogXCJLYXBwYWxlaWRlbiB0dW5uaXN0YW1pbmVuXCJ9O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgdGFza3MgPSB7XHJcbiAgICAgIFwiWWh0ZWVubGFza3VcIjogQWRkaXRpb25UYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lLCBzdGVwczo1fSksXHJcbiAgICAgIFwiS29vcmRpbmFhdGlzdG9uIGx1a2VtaW5lblwiOiBTaW1wbGVDb29yZHNUYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lLCBzdGVwczo1fSksXHJcbiAgICAgIFwiS2FwcGFsZWlkZW4gdHVubmlzdGFtaW5lblwiOiBCYXNpY1NoYXBlc1Rhc2soIHtvblRhc2tEb25lOnRoaXMuaGFuZGxlVGFza0RvbmUsIHRpbWU6MjB9KVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgdGFza0xpc3RFbGVtcyA9IE9iamVjdC5rZXlzKHRhc2tzKS5tYXAoZnVuY3Rpb24odGFza05hbWUpIHtcclxuICAgICAgdmFyIGNsYXNzTmFtZSA9IHRhc2tOYW1lID09PSB0aGlzLnN0YXRlLnNlbGVjdGVkVGFzayA/IFwidGV4dC1tdXRlZFwiIDogXCJcIjtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00ubGkobnVsbCwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uYSgge2NsYXNzTmFtZTpjbGFzc05hbWUsIGhyZWY6XCJcIiwgb25DbGljazp0aGlzLmhhbmRsZUxpc3RDbGlja30sIHRhc2tOYW1lKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdmFyIHRhc2sgPSB0YXNrc1t0aGlzLnN0YXRlLnNlbGVjdGVkVGFza107XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICBSZWFjdC5ET00udWwoIHtjbGFzc05hbWU6XCJsaXN0LWlubGluZVwifSwgXHJcbiAgICAgICAgICB0YXNrTGlzdEVsZW1zXHJcbiAgICAgICAgKSxcclxuXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhc2stY29udGFpbmVyXCJ9LCBcclxuICAgICAgICAgIHRhc2tcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFwcGxpY2F0aW9uO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBkMywgTWF0aFV0aWxzLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqIEEgMkQgY29vcmRpbmF0ZSBzeXN0ZW0uICovXHJcbnZhciBDb29yZHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb29yZHMnLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgIHNoYXBlczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LFxyXG4gICAgYm91bmRzOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgbWFyZ2luOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgYXNwZWN0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxyXG4gICAgb25DbGljazogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICB9LFxyXG5cclxuICBoYW5kbGVSZXNpemU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHBhcmVudCA9ICQodGhpcy5nZXRET01Ob2RlKCkucGFyZW50Tm9kZSk7XHJcblxyXG4gICAgdmFyIG1hcmdpbiA9IHRoaXMucHJvcHMubWFyZ2luO1xyXG4gICAgdmFyIHdpZHRoID0gcGFyZW50ID8gcGFyZW50LndpZHRoKCkgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCA6IDA7XHJcbiAgICB2YXIgaGVpZ2h0ID0gTWF0aC5yb3VuZCh3aWR0aCAqIHRoaXMucHJvcHMuYXNwZWN0KSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xyXG5cclxuICAgIHZhciBib3VuZHMgPSB0aGlzLnByb3BzLmJvdW5kcztcclxuICAgIHZhciBzcGFjaW5nID0gTWF0aC5yb3VuZChNYXRoLm1pbihcclxuICAgICAgd2lkdGggLyBNYXRoLmFicyhib3VuZHMubWF4WCAtIGJvdW5kcy5taW5YKSxcclxuICAgICAgaGVpZ2h0IC8gTWF0aC5hYnMoYm91bmRzLm1heFkgLSBib3VuZHMubWluWSlcclxuICAgICkpO1xyXG5cclxuICAgIHZhciB4ID0gZDMuc2NhbGUubGluZWFyKClcclxuICAgICAgLmRvbWFpbihbYm91bmRzLm1pblgsIGJvdW5kcy5taW5YICsgMV0pXHJcbiAgICAgIC5yYW5nZShbMCwgc3BhY2luZ10pO1xyXG5cclxuICAgIHZhciB5ID0gZDMuc2NhbGUubGluZWFyKClcclxuICAgICAgLmRvbWFpbihbYm91bmRzLm1pblksIGJvdW5kcy5taW5ZICsgMV0pXHJcbiAgICAgIC5yYW5nZShbaGVpZ2h0LCBoZWlnaHQgLSBzcGFjaW5nXSk7XHJcblxyXG5cclxuICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgIHNwYWNpbmc6IHNwYWNpbmcsXHJcbiAgICAgIHg6IHgsXHJcbiAgICAgIHk6IHlcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8qKiBUcmFuc2xhdGUgYW5kIHJvdW5kIHNjcmVlbiBwb3NpdGlvbiBpbnRvIGNvb3JkaW5hdGVzLCB0cmlnZ2VyIGV2ZW50LiAqL1xyXG4gIGhhbmRsZVNWR0NsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgaWYgKCEkLmlzRnVuY3Rpb24odGhpcy5wcm9wcy5vbkNsaWNrKSkgcmV0dXJuO1xyXG5cclxuICAgIHZhciBlbGVtID0gJCh0aGlzLnJlZnMuc3ZnLmdldERPTU5vZGUoKSk7XHJcbiAgICB2YXIgYm91bmRzID0gdGhpcy5wcm9wcy5ib3VuZHM7XHJcblxyXG4gICAgdmFyIHN2Z1ggPSBldmVudC5wYWdlWCAtIGVsZW0ub2Zmc2V0KCkubGVmdCAtIHRoaXMucHJvcHMubWFyZ2luLmxlZnQ7XHJcbiAgICB2YXIgc3ZnWSA9IGV2ZW50LnBhZ2VZIC0gZWxlbS5vZmZzZXQoKS50b3AgLSB0aGlzLnByb3BzLm1hcmdpbi50b3A7XHJcbiAgICB2YXIgY29vcmRzWCA9IE1hdGgubWF4KGJvdW5kcy5taW5YLCBNYXRoLm1pbihib3VuZHMubWF4WCwgTWF0aC5yb3VuZCh0aGlzLnN0YXRlLnguaW52ZXJ0KHN2Z1gpKSkpO1xyXG4gICAgdmFyIGNvb3Jkc1kgPSBNYXRoLm1heChib3VuZHMubWluWSwgTWF0aC5taW4oYm91bmRzLm1heFksIE1hdGgucm91bmQodGhpcy5zdGF0ZS55LmludmVydChzdmdZKSkpKTtcclxuXHJcbiAgICB0aGlzLnByb3BzLm9uQ2xpY2soY29vcmRzWCwgY29vcmRzWSk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7d2lkdGg6IDB9O1xyXG4gIH0sXHJcblxyXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBkcmF3QXhlczogdHJ1ZSxcclxuICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgYm91bmRzOiB7bWF4WToxMCwgbWF4WDoxMCwgbWluWTowLCBtaW5YOjB9LFxyXG4gICAgICBhc3BlY3Q6IDEsXHJcbiAgICAgIG1hcmdpbjoge3RvcDogMTAsIHJpZ2h0OiAxMCwgYm90dG9tOiAxMCwgbGVmdDogMTB9XHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMuaGFuZGxlUmVzaXplKTtcclxuICAgIHRoaXMuaGFuZGxlUmVzaXplKCk7XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdGhpcy5oYW5kbGVSZXNpemUpO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgbWFyZ2luID0gdGhpcy5wcm9wcy5tYXJnaW47XHJcbiAgICB2YXIgYm91bmRzID0gdGhpcy5wcm9wcy5ib3VuZHM7XHJcbiAgICB2YXIgd2lkdGggPSB0aGlzLnN0YXRlLndpZHRoO1xyXG4gICAgdmFyIGhlaWdodCA9IE1hdGgucm91bmQod2lkdGggKiB0aGlzLnByb3BzLmFzcGVjdCkgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcclxuICAgIHZhciBzcGFjaW5nID0gdGhpcy5zdGF0ZS5zcGFjaW5nO1xyXG4gICAgdmFyIHggPSB0aGlzLnN0YXRlLng7XHJcbiAgICB2YXIgeSA9IHRoaXMuc3RhdGUueTtcclxuXHJcbiAgICB2YXIgZnVsbFdpZHRoID0gd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodDtcclxuICAgIHZhciBmdWxsSGVpZ2h0ID0gaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b207XHJcbiAgICB2YXIgdHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiO1xyXG5cclxuICAgIHZhciBzaGFwZXMsIGdyaWQ7XHJcbiAgICBpZiAodGhpcy5zdGF0ZS53aWR0aCkge1xyXG4gICAgICBzaGFwZXMgPSBTaGFwZXMoIHt4OngsIHk6eSwgc3BhY2luZzpzcGFjaW5nLCBkYXRhOnRoaXMucHJvcHMuc2hhcGVzfSApO1xyXG4gICAgICBncmlkID0gR3JpZCgge2RyYXdBeGVzOnRoaXMucHJvcHMuZHJhd0F4ZXMsIHg6eCwgeTp5LCBib3VuZHM6Ym91bmRzfSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb29yZHMtY29udGFpbmVyXCJ9LCBcclxuICAgICAgICBSZWFjdC5ET00uc3ZnKCB7cmVmOlwic3ZnXCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVTVkdDbGljaywgd2lkdGg6ZnVsbFdpZHRoLCBoZWlnaHQ6ZnVsbEhlaWdodH0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmcoIHt0cmFuc2Zvcm06dHJhbnNmb3JtfSwgXHJcbiAgICAgICAgICAgIGdyaWQsXHJcbiAgICAgICAgICAgIHNoYXBlc1xyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbi8qKiBBIGdyaWQgZm9yIHRoZSBjb29yZGluYXRlIHN5c3RlbS4gKi9cclxudmFyIEdyaWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdHcmlkJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICB4OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgeTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIGJvdW5kczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxyXG4gICAgc3BhY2luZzogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIHRyYW5zaXRpb25EdXJhdGlvbjogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxyXG4gIH0sXHJcblxyXG4gIC8qKiBSZWRyYXcgZ3JpZC4gICovXHJcbiAgdXBkYXRlOiBmdW5jdGlvbihwcm9wcykge1xyXG4gICAgdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCh0aGlzLmdldERPTU5vZGUoKSk7XHJcbiAgICB2YXIgYm91bmRzID0gcHJvcHMuYm91bmRzO1xyXG4gICAgdmFyIHNwYWNpbmcgPSBwcm9wcy5zcGFjaW5nO1xyXG4gICAgdmFyIHggPSBwcm9wcy54O1xyXG4gICAgdmFyIHkgPSBwcm9wcy55O1xyXG5cclxuICAgIHZhciB4UmFuZ2UgPSBkMy5yYW5nZShNYXRoLmNlaWwoKGJvdW5kcy5taW5YKSAvIHNwYWNpbmcpLCBNYXRoLnJvdW5kKGJvdW5kcy5tYXhYKSArIHNwYWNpbmcsIHNwYWNpbmcpO1xyXG4gICAgdmFyIHlSYW5nZSA9IGQzLnJhbmdlKE1hdGguY2VpbCgoYm91bmRzLm1pblkpIC8gc3BhY2luZyksIE1hdGgucm91bmQoYm91bmRzLm1heFkpICsgc3BhY2luZywgc3BhY2luZyk7XHJcbiAgICB2YXIgZGF0YSA9IHhSYW5nZS5jb25jYXQoeVJhbmdlKTtcclxuICAgIHZhciBpc1ggPSBmdW5jdGlvbihpbmRleCkgeyByZXR1cm4gaW5kZXggPCB4UmFuZ2UubGVuZ3RoOyB9O1xyXG5cclxuICAgIHZhciBheGVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcIi5heGlzXCIpXHJcbiAgICAgIC5kYXRhKGRhdGEpO1xyXG5cclxuICAgIGF4ZXMuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgIHJldHVybiBcImF4aXMgXCIgKyAoKHByb3BzLmRyYXdBeGVzICYmIGQgPT09IDApID8gXCJ0aGlja1wiIDogXCJcIik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBheGVzLnRyYW5zaXRpb24oKS5kdXJhdGlvbihwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoYm91bmRzLm1pblgpOyB9KVxyXG4gICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1pblkpIDogeShkKTsgfSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB4KGQpIDogeChib3VuZHMubWF4WCk7IH0pXHJcbiAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geShib3VuZHMubWF4WSkgOiB5KGQpOyB9KTtcclxuXHJcbiAgICBheGVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICBpZiAocHJvcHMuZHJhd0F4ZXMpIHtcclxuICAgICAgdmFyIGxhYmVscyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCIubGFiZWxcIikuZGF0YShkYXRhKTtcclxuXHJcbiAgICAgIGxhYmVscy5lbnRlcigpLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwibGFiZWwgXCIgKyAoaXNYKGkpID8gXCJ4XCIgOiBcInlcIik7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkgeyBpZiAoIWQpIHJldHVybiBcIm5vbmVcIjsgfSlcclxuICAgICAgICAudGV4dChPYmplY3QpXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyBcIjEuNGVtXCIgOiBcIi4zZW1cIjsgfSlcclxuICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IG51bGwgOiBcIi0uOGVtXCI7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMSArIFwiZW1cIik7XHJcblxyXG4gICAgICBsYWJlbHMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoMCk7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoMCkgOiB5KGQpOyB9KTtcclxuXHJcbiAgICAgIGxhYmVscy5leGl0KCkucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRyYXdBeGVzOiB0cnVlLFxyXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDU1MCxcclxuICAgICAgc3BhY2luZzogMVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnVwZGF0ZSh0aGlzLnByb3BzKTtcclxuICB9LFxyXG5cclxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xyXG4gICAgdGhpcy51cGRhdGUobmV4dFByb3BzKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICBSZWFjdC5ET00uZygge2NsYXNzTmFtZTpcImF4ZXNcIn0pXHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICApO1xyXG4gIH1cclxufSk7XHJcblxyXG5cclxuLyoqIFZhcmlvdXMgZ2VvbWV0cmljIHNoYXBlcyB0byBiZSBkcmF3biBvbiB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0uICovXHJcbnZhciBTaGFwZXMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTaGFwZXMnLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIGRhdGE6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxyXG4gICAgeDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICBzcGFjaW5nOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICB0cmFuc2l0aW9uRHVyYXRpb246IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICB9LFxyXG5cclxuICAvKiogUmVkcmF3IHNoYXBlcy4gR2V0cyBjYWxsZWQgd2hlbmV2ZXIgc2hhcGVzIGFyZSB1cGRhdGVkIG9yIHNjcmVlbiByZXNpemVzLiAqL1xyXG4gIHVwZGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgIHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QodGhpcy5nZXRET01Ob2RlKCkpO1xyXG4gICAgdmFyIHRyYW5zaXRpb25EdXJhdGlvbiA9IHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbiB8fCA1NTA7XHJcblxyXG4gICAgdmFyIHBvbHlnb25zID0gY29udGFpbmVyLnNlbGVjdEFsbChcInBvbHlnb24uc2hhcGVcIilcclxuICAgICAgLmRhdGEocHJvcHMuZGF0YS5maWx0ZXIoZnVuY3Rpb24ocykgeyByZXR1cm4gcy5wb2ludHMubGVuZ3RoID4gMjsgfSkpO1xyXG5cclxuICAgIHZhciBhZGRlZFBvbHlnb25zID0gcG9seWdvbnMuZW50ZXIoKS5hcHBlbmQoXCJwb2x5Z29uXCIpLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpO1xyXG5cclxuICAgIHBvbHlnb25zLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwicG9pbnRzXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gZC5wb2ludHMubWFwKGZ1bmN0aW9uKHBzKSB7XHJcbiAgICAgICAgICByZXR1cm4gW3Byb3BzLngocHNbMF0pLCBwcm9wcy55KHBzWzFdKV07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIHBvbHlnb25zLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcblxyXG4gICAgdmFyIGNpcmNsZXMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwiY2lyY2xlLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA9PSAxOyB9KSk7XHJcblxyXG4gICAgdmFyIGFkZGVkQ2lyY2xlcyA9IGNpcmNsZXMuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgY2lyY2xlcy50cmFuc2l0aW9uKCkuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMF1bMF0pOyB9KVxyXG4gICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMF1bMV0pOyB9KVxyXG4gICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMuc3BhY2luZyAqIChkLnIgfHwgMC4yKTsgfSk7XHJcblxyXG4gICAgY2lyY2xlcy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG5cclxuICAgIHZhciBsaW5lcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJsaW5lLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA9PSAyOyB9KSk7XHJcblxyXG4gICAgdmFyIGFkZGVkTGluZXMgPSBsaW5lcy5lbnRlcigpLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgbGluZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzBdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzBdWzFdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzFdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzFdWzFdKTsgfSk7XHJcblxyXG4gICAgbGluZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIEF0dGFjaCBjbGljayBldmVudCBsaXN0ZW5lcnMuXHJcbiAgICBbYWRkZWRQb2x5Z29ucywgYWRkZWRDaXJjbGVzLCBhZGRlZExpbmVzXS5mb3JFYWNoKGZ1bmN0aW9uKGFkZGVkKSB7XHJcbiAgICAgIGFkZGVkLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIGlmICgkLmlzRnVuY3Rpb24oZC5vbkNsaWNrKSlcclxuICAgICAgICAgIGQub25DbGljayhkKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXQgY29tbW9uIGF0dHJpYnV0ZXMuXHJcbiAgICBjb250YWluZXIuc2VsZWN0QWxsKFwiLnNoYXBlXCIpXHJcbiAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KVxyXG4gICAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnN0cm9rZSB8fCBcInN0ZWVsYmx1ZVwiOyB9KVxyXG4gICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiAoZC5zdHJva2VXaWR0aCB8fCAyKSArIFwicHhcIjsgfSk7XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy51cGRhdGUodGhpcy5wcm9wcyk7XHJcbiAgfSxcclxuXHJcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcclxuICAgIHRoaXMudXBkYXRlKG5leHRQcm9wcyk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHJldHVybiBSZWFjdC5ET00uZygge2NsYXNzTmFtZTpcInNoYXBlc1wifSk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvb3JkcztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBWYXJpb3VzIGNvbW1vbiBmb3JtIGNvbXBvbmVudHMuXHJcbiAqL1xyXG52YXIgRm9ybUNvbXBvbmVudHMgPSAoZnVuY3Rpb24oKXtcclxuXHJcbiAgdmFyIE1peGlucyA9IHJlcXVpcmUoXCIuL21peGluc1wiKTtcclxuXHJcbiAgdmFyIGZvcm1Db21wb25lbnRzID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgZm9ybSB0aGF0IGRpc2FibGVzIHN1Ym1pdHRpbmcgd2hlbiBpbnB1dHMgYXJlIGludmFsaWQuXHJcbiAgICovXHJcbiAgZm9ybUNvbXBvbmVudHMuQW5zd2VyRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Fuc3dlckZvcm0nLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBvbkFuc3dlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgICAgYnRuQ29ycmVjdEFuaW1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgYnRuSW5jb3JyZWN0QW5pbUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBmb3JtQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGJ0bkNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXHJcbiAgICB9LFxyXG5cclxuICAgIG1peGluczogW01peGlucy5UcmlnZ2VyQW5pbWF0aW9uTWl4aW5dLFxyXG5cclxuICAgIC8qKiBTdWJtaXQgYW5zd2VyIGlmIGZvcm0gaXMgdmFsaWQuICovXHJcbiAgICBoYW5kbGVTdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgaWYgKGUpXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgaWYgKHRoaXMuc3RhdGUuaXNWYWxpZCkge1xyXG4gICAgICAgIHRoaXMucHJvcHMub25BbnN3ZXIoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93RXJyb3JzOiB0cnVlfSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBidG4gPSAkKHRoaXMucmVmcy5idG4uZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdGhpcy5hbmltYXRlKGJ0biwgdGhpcy5wcm9wcy5idG5Db3JyZWN0QW5pbUNsYXNzKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlSW5jb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGJ0biA9ICQodGhpcy5yZWZzLmJ0bi5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB0aGlzLmFuaW1hdGUoYnRuLCB0aGlzLnByb3BzLmJ0bkluY29ycmVjdEFuaW1DbGFzcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbGlkaXR5OiBmdW5jdGlvbihpc1ZhbGlkKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe2lzVmFsaWQ6IGlzVmFsaWQsIGlzRGlydHk6IHRydWV9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENsZWFyIHZhbHVlcyBhbmQgdmFsaWRhdGlvbiBzdGF0ZXMgZm9yIGFsbCBjaGlsZCBlbGVtZW50cy4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICBzaG93RXJyb3JzOiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBmb3JtQ2xhc3M6IFwiZm9ybS1ob3Jpem9udGFsXCIsXHJcbiAgICAgICAgYnRuQ2xhc3M6IFwiYnRuIGJ0bi1zdWNjZXNzIGJ0bi1sZyBidG4tYmxvY2tcIixcclxuICAgICAgICBidG5Db3JyZWN0QW5pbUNsYXNzOiBcImFuaW1hdGVkIGJvdW5jZVwiLFxyXG4gICAgICAgIGJ0bkluY29ycmVjdEFuaW1DbGFzczogXCJhbmltYXRlZCBzaGFrZVwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICBzaG93RXJyb3JzOiBmYWxzZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBjaGlsZHJlbiA9IFtdLmNvbmNhdCh0aGlzLnByb3BzLmNoaWxkcmVuKS5tYXAoZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICBjaGlsZC5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlID0gdGhpcy5zZXRWYWxpZGl0eTtcclxuICAgICAgICBjaGlsZC5wcm9wcy5vblN1Ym1pdCA9IHRoaXMuaGFuZGxlU3VibWl0O1xyXG4gICAgICAgIGNoaWxkLnByb3BzLnNob3dFcnJvciA9IHRoaXMuc3RhdGUuc2hvd0Vycm9ycztcclxuICAgICAgICByZXR1cm4gY2hpbGQ7XHJcbiAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICB2YXIgYnRuQ2xhc3MgPSB0aGlzLnByb3BzLmJ0bkNsYXNzICsgKHRoaXMuc3RhdGUuaXNWYWxpZCA/IFwiXCIgOiBcIiBkaXNhYmxlZFwiKTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmZvcm0oIHtyb2xlOlwiZm9ybVwiLCBjbGFzc05hbWU6dGhpcy5wcm9wcy5mb3JtQ2xhc3MsIG9uU3VibWl0OnRoaXMuaGFuZGxlU3VibWl0LCBub1ZhbGlkYXRlOnRydWV9LCBcclxuICAgICAgICAgIGNoaWxkcmVuLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtyZWY6XCJidG5cIiwgdHlwZTpcInN1Ym1pdFwiLCB2YWx1ZTpcIlZhc3RhYVwiLCBjbGFzc05hbWU6YnRuQ2xhc3N9IClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICAvKipcclxuICAgKiBBbiBpbnB1dCB3aXRoIHJlZ3VsYXIgZXhwcmVzc2lvbiB2YWxpZGF0aW9uLlxyXG4gICAqL1xyXG4gIGZvcm1Db21wb25lbnRzLlJlSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdSZUlucHV0JyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgcmU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXHJcbiAgICAgIHNob3dFcnJvcjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIHJlcXVpcmVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgICAgcGxhY2Vob2xkZXI6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIHR5cGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgb25WYWxpZGl0eUNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlYWQgdmFsdWUsIHZhbGlkYXRlLCBub3RpZnkgcGFyZW50IGVsZW1lbnQgaWYgYW4gZXZlbnQgaXMgYXR0YWNoZWQuICovXHJcbiAgICBoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyIGlzVmFsaWQgPSB0aGlzLnZhbGlkYXRvci50ZXN0KGUudGFyZ2V0LnZhbHVlKTtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IGUudGFyZ2V0LnZhbHVlLCBpc1ZhbGlkOiBpc1ZhbGlkLCBpc0RpcnR5OiB0cnVlfSk7XHJcblxyXG4gICAgICBpZiAoJC5pc0Z1bmN0aW9uKHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZSkpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICB2YWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IHZhbHVlfSk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS52YWx1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZWZzLmlucHV0LmdldERPTU5vZGUoKS5zZWxlY3QoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENsZWFyIHZhbHVlIGFuZCByZXNldCB2YWxpZGF0aW9uIHN0YXRlcy4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdmFsdWU6IFwiXCIsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsaWRhdG9yOiBmdW5jdGlvbihyZSkge1xyXG4gICAgICB0aGlzLnZhbGlkYXRvciA9IG5ldyBSZWdFeHAocmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsaWRhdG9yKHRoaXMucHJvcHMucmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXdQcm9wcykge1xyXG4gICAgICB0aGlzLnNldFZhbGlkYXRvcihuZXdQcm9wcy5yZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdmFsdWU6IFwiXCIsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICB0eXBlOiBcInRleHRcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlOiAvXlxccyotP1xcZCtcXHMqJC8sXHJcbiAgICAgICAgc2hvd0Vycm9yOiBmYWxzZSxcclxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICBjbGFzc05hbWU6IFwiXCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgdmFsaWRhdGlvblN0YXRlID0gUmVhY3QuYWRkb25zLmNsYXNzU2V0KHtcclxuICAgICAgICBcImhhcy1zdWNjZXNzXCI6IHRoaXMuc3RhdGUuaXNWYWxpZCAmJiB0aGlzLnN0YXRlLmlzRGlydHksXHJcbiAgICAgICAgXCJoYXMtd2FybmluZ1wiOiAhdGhpcy5zdGF0ZS5pc0RpcnR5ICYmIHRoaXMucHJvcHMuc2hvd0Vycm9yLFxyXG4gICAgICAgIFwiaGFzLWVycm9yXCI6ICF0aGlzLnN0YXRlLmlzVmFsaWRcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgZXJyb3I7XHJcbiAgICAgIGlmICh0aGlzLnByb3BzLnNob3dFcnJvcikge1xyXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5pc1ZhbGlkKSB7XHJcbiAgICAgICAgICBlcnJvciA9IFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbnRyb2wtbGFiZWxcIn0sIFwiVmlyaGVlbGxpbmVuIHN5w7Z0ZVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5wcm9wcy5yZXF1aXJlZCAmJiB0aGlzLnZhbHVlKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBlcnJvciA9IFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbnRyb2wtbGFiZWxcIn0sIFwiVMOkeXTDpCB0w6Rtw6Qga2VudHTDpFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwIFwiICsgdmFsaWRhdGlvblN0YXRlfSwgXHJcbiAgICAgICAgICBlcnJvcixcclxuICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcImlucHV0XCIsIG9uQ2hhbmdlOnRoaXMuaGFuZGxlQ2hhbmdlLCB2YWx1ZTp0aGlzLnN0YXRlLnZhbHVlLCBwbGFjZWhvbGRlcjp0aGlzLnByb3BzLnBsYWNlaG9sZGVyLFxyXG4gICAgICAgICAgdHlwZTp0aGlzLnByb3BzLnR5cGUsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBcIiArIHRoaXMucHJvcHMuY2xhc3NOYW1lfSApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBIG51bWJlciBpbnB1dCB3aXRoIHR3byBidXR0b25zIGZvciBpbmNyZW1lbnRpbmcgYW5kIGRlY3JlbWVudGluZy5cclxuICAgKi9cclxuICBmb3JtQ29tcG9uZW50cy5OdW1JbnB1dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ051bUlucHV0JyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgc3RlcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgICAgcGxhY2Vob2xkZXI6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGJ0bkNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBvblZhbGlkaXR5Q2hhbmdlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcclxuICAgICAgb25TdWJtaXQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbHVlQW5kVmFsaWRpdHk6IGZ1bmN0aW9uKHZhbHVlLCBpc1ZhbGlkKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHZhbHVlOiB2YWx1ZSwgaXNWYWxpZDogaXNWYWxpZFxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZShpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkoXCJcIiwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZURlY3JlbWVudDogZnVuY3Rpb24oZSkge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh0aGlzLnZhbHVlKCkgLSB0aGlzLnByb3BzLnN0ZXAsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVJbmNyZW1lbnQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkodGhpcy52YWx1ZSgpICsgdGhpcy5wcm9wcy5zdGVwLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlc2V0IHN0YXRlIHRvIGlucHV0IHZhbHVlIGlmIGlucHV0IHZhbHVlIGlzIGEgbnVtYmVyLiAqL1xyXG4gICAgaGFuZGxlQ2hhbmdlOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIHZhciB2YWwgPSBlLnRhcmdldC52YWx1ZTtcclxuICAgICAgdmFyIGlzVmFsaWQgPSAhaXNOYU4ocGFyc2VGbG9hdCh2YWwpKTtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KHZhbCwgaXNWYWxpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBUcnkgdG8gc3VibWl0IHBhcmVudCBmb3JtIHdoZW4gRW50ZXIgaXMgY2xpY2tlZC4gKi9cclxuICAgIGhhbmRsZUtleVByZXNzOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uU3VibWl0KVxyXG4gICAgICAgICAgdGhpcy5wcm9wcy5vblN1Ym1pdCgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodGhpcy5zdGF0ZS52YWx1ZSkgfHwgMDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB2YWx1ZTogbnVsbCxcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBSZUlucHV0ID0gZm9ybUNvbXBvbmVudHMuUmVJbnB1dDtcclxuICAgICAgdmFyIGJ0bkNsYXNzID0gdGhpcy5wcm9wcy5idG5DbGFzcyB8fCBcImJ0biBidG4tbGcgYnRuLWluZm9cIjtcclxuICAgICAgdmFyIHZhbGlkYXRpb25TdGF0ZSA9IHRoaXMuc3RhdGUuaXNWYWxpZCA/IFwiaGFzLXN1Y2Nlc3NcIiA6IFwiaGFzLWVycm9yXCI7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwIFwiICsgdmFsaWRhdGlvblN0YXRlfSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS0zIGNvbC14cy0zXCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dGFiSW5kZXg6XCItMVwiLCBjbGFzc05hbWU6YnRuQ2xhc3MgKyBcIiBwdWxsLXJpZ2h0XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVEZWNyZW1lbnR9LCBcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLWxlZnRcIn0pXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgY29sLXhzLTZcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3R5cGU6XCJudW1iZXJcIiwgdmFsdWU6dGhpcy5zdGF0ZS52YWx1ZSwgb25DaGFuZ2U6dGhpcy5oYW5kbGVDaGFuZ2UsIG9uS2V5UHJlc3M6dGhpcy5oYW5kbGVLZXlQcmVzcyxcclxuICAgICAgICAgICAgICBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgaW5wdXQtbGcgdGV4dC1jZW50ZXJcIiwgcGxhY2Vob2xkZXI6dGhpcy5wcm9wcy5wbGFjZWhvbGRlcn0pXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tMyBjb2wteHMtM1wifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3RhYkluZGV4OlwiLTFcIiwgY2xhc3NOYW1lOmJ0bkNsYXNzICsgXCIgcHVsbC1sZWZ0XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVJbmNyZW1lbnR9LCBcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0XCJ9KVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGZvcm1Db21wb25lbnRzO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRm9ybUNvbXBvbmVudHM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29tcGxldGUgYW5zd2VyIGZvcm1zIGZvciB0YXNrcy5cclxuICovXHJcbnZhciBGb3JtcyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIEZvcm1Db21wb25lbnRzID0gcmVxdWlyZShcIi4vZm9ybS1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBBbnN3ZXJGb3JtID0gRm9ybUNvbXBvbmVudHMuQW5zd2VyRm9ybTtcclxuICB2YXIgTnVtSW5wdXQgPSBGb3JtQ29tcG9uZW50cy5OdW1JbnB1dDtcclxuXHJcbiAgdmFyIGZvcm1zID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcm0gd2l0aCBhIHNpbmdsZSBudW1iZXIgaW5wdXQuXHJcbiAgICovXHJcbiAgZm9ybXMuU2luZ2xlTnVtYmVyRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NpbmdsZU51bWJlckZvcm0nLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBvbkFuc3dlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaXNDb3JyZWN0ID0gdGhpcy5wcm9wcy5vbkFuc3dlcih0aGlzLnJlZnMuYW5zd2VyLnZhbHVlKCkpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVJbmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5mb3JtLnJlc2V0KCk7XHJcbiAgICAgIHRoaXMucmVmcy5hbnN3ZXIucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgICAgQW5zd2VyRm9ybSgge3JlZjpcImZvcm1cIiwgY2xhc3NOYW1lOlwiZm9ybS1ob3Jpem9udGFsXCIsIG9uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSwgXHJcbiAgICAgICAgICBOdW1JbnB1dCgge3JlZjpcImFuc3dlclwiLCBwbGFjZWhvbGRlcjpcIlZhc3RhYSB0w6Row6RuXCJ9KVxyXG4gICAgICAgIClcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBGb3JtIHdpdGggdHdvIGlucHV0cyBmb3IgeCBhbmQgeSBjb29yZGluYXRlcy5cclxuICAgKi9cclxuICBmb3Jtcy5Db29yZHNBbnN3ZXJGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29vcmRzQW5zd2VyRm9ybScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uQW5zd2VyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSB0aGlzLnByb3BzLm9uQW5zd2VyKHRoaXMucmVmcy54LnZhbHVlKCksIHRoaXMucmVmcy55LnZhbHVlKCkpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVJbmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5mb3JtLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBjbGFzc05hbWU6XCJmb3JtLWhvcml6b250YWxcIiwgb25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9LCBcclxuICAgICAgICAgIE51bUlucHV0KCB7cmVmOlwieFwiLCBwbGFjZWhvbGRlcjpcInhcIn0pLFxyXG4gICAgICAgICAgTnVtSW5wdXQoIHtyZWY6XCJ5XCIsIHBsYWNlaG9sZGVyOlwieVwifSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBmb3JtcztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1zO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBtb2R1bGUsIE1hdGhKYXggKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbXBvbmVudHMgZm9yIG1hdGhzIHRhc2tzLlxyXG4gKi9cclxudmFyIE1hdGhDb21wb25lbnRzID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgbWF0aENvbXBvbmVudHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmVuZGVyIExhVGV4IG1hdGhzIG5vdGF0aW9uIGludG8gd2ViIGZvbnRzIHVzaW5nIE1hdGhKYXguXHJcbiAgICovXHJcbiAgbWF0aENvbXBvbmVudHMuTWF0aEpheCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01hdGhKYXgnLFxyXG4gICAgcmVwcm9jZXNzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGVsZW0gPSB0aGlzLnJlZnMuc2NyaXB0LmdldERPTU5vZGUoKTtcclxuICAgICAgTWF0aEpheC5IdWIuUXVldWUoW1wiUmVwcm9jZXNzXCIsIE1hdGhKYXguSHViLCBlbGVtXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXByb2Nlc3MoKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXByb2Nlc3MoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uc2NyaXB0KCB7cmVmOlwic2NyaXB0XCIsIHR5cGU6XCJtYXRoL3RleFwifSwgdGhpcy5wcm9wcy5jaGlsZHJlbilcclxuICAgICAgICApXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBtYXRoQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGhDb21wb25lbnRzO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29tcG9uZW50IGV4dGVuc2lvbnMgaS5lLiBtaXhpbnMuXHJcbiAqL1xyXG52YXIgTWl4aW5zID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgbWl4aW5zID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIFByb3ZpZGVzIGEgc2V0SW50ZXJ2YWwgZnVuY3Rpb24gd2hpY2ggd2lsbCBnZXQgY2xlYW5lZCB1cCB3aGVuXHJcbiAgICogdGhlIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXHJcbiAgICovXHJcbiAgbWl4aW5zLlNldEludGVydmFsTWl4aW4gPSB7XHJcbiAgICBzZXRJbnRlcnZhbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuaW50ZXJ2YWxzLnB1c2goc2V0SW50ZXJ2YWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyQWxsSW50ZXJ2YWxzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMubWFwKGNsZWFySW50ZXJ2YWwpO1xyXG4gICAgICB0aGlzLmludGVydmFscyA9IFtdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogSW52b2tlZCB3aGVuIGNvbXBvbmVudCBpcyBpbml0aWFsaXplZC4gKi9cclxuICAgIGNvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuaW50ZXJ2YWxzID0gW107XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGRlc3Ryb3llZC4gKi9cclxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jbGVhckFsbEludGVydmFscygpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFByb3ZpZGVzIGEgc2V0VGltZW91dCBmdW5jdGlvbiB3aGljaCB3aWxsIGdldCBjbGVhbmVkIHVwIHdoZW5cclxuICAgKiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cclxuICAgKi9cclxuICBtaXhpbnMuU2V0VGltZW91dE1peGluID0ge1xyXG4gICAgc2V0VGltZW91dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMudGltZW91dHMucHVzaChzZXRUaW1lb3V0LmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhckFsbFRpbWVvdXRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy50aW1lb3V0cy5tYXAoY2xlYXJUaW1lb3V0KTtcclxuICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogSW52b2tlZCB3aGVuIGNvbXBvbmVudCBpcyBpbml0aWFsaXplZC4gKi9cclxuICAgIGNvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMudGltZW91dHMgPSBbXTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgZGVzdHJveWVkLiAqL1xyXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNsZWFyQWxsVGltZW91dHMoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBcHBseSBDU1MgY2xhc3NlcyBmb3Igc2V0IGR1cmF0aW9uIC0gdXNlZnVsIGZvciBzaW5nbGVzaG90IGFuaW1hdGlvbnMuXHJcbiAgICovXHJcbiAgbWl4aW5zLlRyaWdnZXJBbmltYXRpb25NaXhpbiA9IHtcclxuICAgIGFuaW1hdGU6IGZ1bmN0aW9uKGVsZW0sIGNsYXNzTmFtZSwgZHVyYXRpb24pIHtcclxuICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbiB8fCAxMDAwO1xyXG4gICAgICBpZiAoIXRoaXMudGltZW91dCAmJiB0aGlzLnRpbWVvdXQgIT09IDApIHtcclxuICAgICAgICBlbGVtLmFkZENsYXNzKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGVsZW0ucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKTtcclxuICAgICAgICAgIHRoaXMudGltZW91dCA9IG51bGw7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpLCBkdXJhdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gbWl4aW5zO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWl4aW5zO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQ29tbW9uIHRhc2sgY29tcG9uZW50cy5cclxuICovXHJcbnZhciBUYXNrQ29tcG9uZW50cyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIE1peGlucyA9IHJlcXVpcmUoXCIuL21peGluc1wiKTtcclxuXHJcbiAgdmFyIHRhc2tDb21wb25lbnRzID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBmb3IgQm9vdHN0cmFwJ3MgcGFuZWwgY29tcG9uZW50LlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tQYW5lbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tQYW5lbCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBjbGFzc05hbWUgPSBcInBhbmVsIFwiICsgKHRoaXMucHJvcHMuY2xhc3NOYW1lIHx8IFwicGFuZWwtaW5mb1wiICk7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NOYW1lfSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtaGVhZGluZ1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMygge2NsYXNzTmFtZTpcInBhbmVsLXRpdGxlXCJ9LCB0aGlzLnByb3BzLmhlYWRlcilcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtYm9keVwifSwgXHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBmb3IgQm9vdHN0cmFwJ3MgcHJvZ3Jlc3MgYmFyIGVsZW1lbnQuXHJcbiAgICovXHJcbiAgdGFza0NvbXBvbmVudHMuVGFza1Byb2dyZXNzQmFyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza1Byb2dyZXNzQmFyJyxcclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBtYXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgbm93OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgc2luZ2xlV2lkdGggPSBNYXRoLmNlaWwoMSAvIHRoaXMucHJvcHMubWF4ICogMTAwKTtcclxuICAgICAgdmFyIGxlZnRTdHlsZSA9IHt3aWR0aDogc2luZ2xlV2lkdGggKiAodGhpcy5wcm9wcy5ub3cgLSAxKSArIFwiJVwifTtcclxuICAgICAgdmFyIHJpZ2h0U3R5bGUgPSB7d2lkdGg6IHNpbmdsZVdpZHRoICogKHRoaXMucHJvcHMubWF4IC0gdGhpcy5wcm9wcy5ub3cgKyAxKSArIFwiJVwifTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIHRhc2stcHJvZ3Jlc3MtYmFyXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcy1iYXIgcHJvZ3Jlc3MtYmFyLXN1Y2Nlc3NcIiwgc3R5bGU6bGVmdFN0eWxlfSksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MtYmFyIHByb2dyZXNzLWJhci13YXJuaW5nXCIsIHN0eWxlOnJpZ2h0U3R5bGV9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSB0aW1lciB0aGF0IGNvdW50cyBkb3duIGZyb20gYSBzcGVjaWZpZWQgdGltZSBhbmQgdHJpZ2dlcnMgYW4gZXZlbnRcclxuICAgKiB3aGVuIGZpbmlzaGVkLiBFbGFwc2VkIHRpbWUgaXMgZGlzcGxheWVkIGluIGEgcHJvZ3Jlc3MgYmFyLlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tDb3VudGRvd25UaW1lciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tDb3VudGRvd25UaW1lcicsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHRpbWU6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgc3RhcnRPbk1vdW50OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgICAgb25FeHBpcnk6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIG1peGluczogW01peGlucy5TZXRJbnRlcnZhbE1peGluXSxcclxuXHJcbiAgICBzdGFydENvdW50ZG93bjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHRpbWVMZWZ0OiB0aGlzLnByb3BzLnRpbWVcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0aGlzLnNldEludGVydmFsKHRoaXMudGljaywgMTAwMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRpY2s6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgdGltZUxlZnQgPSB0aGlzLnN0YXRlLnRpbWVMZWZ0IC0gMTtcclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHRpbWVMZWZ0OiB0aW1lTGVmdFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmICh0aW1lTGVmdCA8IDEpIHtcclxuICAgICAgICB0aGlzLmNsZWFyQWxsSW50ZXJ2YWxzKCk7XHJcbiAgICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uRXhwaXJ5KSkgdGhpcy5wcm9wcy5vbkV4cGlyeSgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMucHJvcHMuc3RhcnRPbk1vdW50KSB0aGlzLnN0YXJ0Q291bnRkb3duKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdGltZUxlZnQ6IHRoaXMucHJvcHMudGltZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBzaW5nbGVXaWR0aCA9IE1hdGguY2VpbCgxIC8gdGhpcy5wcm9wcy50aW1lICogMTAwKTtcclxuICAgICAgdmFyIHdpZHRoID0gTWF0aC5jZWlsKDEgLyB0aGlzLnByb3BzLnRpbWUgKiAxMDAgKiB0aGlzLnN0YXRlLnRpbWVMZWZ0KTtcclxuICAgICAgdmFyIGJhclN0eWxlID0ge3dpZHRoOiB3aWR0aCArIFwiJVwifTtcclxuXHJcbiAgICAgIHZhciBiYXJDbGFzcyA9IFJlYWN0LmFkZG9ucy5jbGFzc1NldCh7XHJcbiAgICAgICAgXCJwcm9ncmVzcy1iYXItc3VjY2Vzc1wiOiB3aWR0aCA+PSA0MCxcclxuICAgICAgICBcInByb2dyZXNzLWJhci13YXJuaW5nXCI6IHdpZHRoIDwgNDAgJiYgd2lkdGggPiAyMCxcclxuICAgICAgICBcInByb2dyZXNzLWJhci1kYW5nZXJcIjogd2lkdGggPD0gMjAsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmUgdGFzay1wcm9ncmVzcy1iYXJcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzLWJhciBcIiArIGJhckNsYXNzLCBzdHlsZTpiYXJTdHlsZX0pXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBUYXNrIGhlYWRlciwgZGlzcGxheXMgdGFzayBuYW1lLlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrSGVhZGVyJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgbmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1oZWFkZXIgcm93XCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tN1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMihudWxsLCB0aGlzLnByb3BzLm5hbWUpXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01XCJ9LCBcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGVsZW1lbnQgdGhhdCBpcyBzaG93biBhZnRlciBhIGNvbXBsZXRlZCB0YXNrLlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tEb25lRGlzcGxheScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHNjb3JlOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHNjb3JlID0gdGhpcy5wcm9wcy5zY29yZSB8fCAwO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1kb25lLWRpc3BsYXkgYW5pbWF0ZSBib3VuY2UtaW5cIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiVGVodMOkdsOkIHN1b3JpdGV0dHUhXCIpLCBcIiBQaXN0ZWl0w6Q6IFwiLCBzY29yZVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRhc2tDb21wb25lbnRzO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGFza0NvbXBvbmVudHM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQSBzaW1wbGUgaW50ZWdlciBhZGRpdGlvbiB0YXNrLlxyXG4gKi9cclxudmFyIEFkZGl0aW9uVGFzayA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIFRhc2tVdGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy90YXNrLXV0aWxzXCIpO1xyXG4gIHZhciBTaW5nbGVOdW1iZXJGb3JtID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvZm9ybXNcIikuU2luZ2xlTnVtYmVyRm9ybTtcclxuICB2YXIgTWF0aENvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9tYXRoLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzXCIpO1xyXG5cclxuXHJcbiAgdmFyIGFkZGl0aW9uVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ2FkZGl0aW9uVGFzaycsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXBzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlc2V0IHRoZSBxdWVzdGlvbi4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGEsIGI7XHJcbiAgICAgIGRvIHtcclxuICAgICAgICBhID0gVGFza1V0aWxzLnJhbmRSYW5nZSgxLCAxMSk7XHJcbiAgICAgICAgYiA9IFRhc2tVdGlscy5yYW5kUmFuZ2UoMSwgMTEpO1xyXG4gICAgICB9XHJcbiAgICAgIHdoaWxlIChUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKFthLGJdLCBbdGhpcy5zdGF0ZS5hLCB0aGlzLnN0YXRlLmJdKSk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIGE6IGEsXHJcbiAgICAgICAgYjogYixcclxuICAgICAgICBhbnN3ZXI6IGEgKyBiXHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2hlY2sgaWYgY29ycmVjdC4gKi9cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oYW5zd2VyKSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSBUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKGFuc3dlciwgdGhpcy5zdGF0ZS5hbnN3ZXIpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KVxyXG4gICAgICAgIHRoaXMuaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG5cclxuICAgICAgcmV0dXJuIGlzQ29ycmVjdDtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzdGVwID0gdGhpcy5zdGF0ZS5zdGVwO1xyXG4gICAgICBpZiAoc3RlcCA9PT0gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcykpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblRhc2tEb25lKCk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c3RlcDogc3RlcCArIDF9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMSxcclxuICAgICAgICBhbnN3ZXI6IG51bGxcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrUHJvZ3Jlc3NCYXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBNYXRoSmF4ID0gTWF0aENvbXBvbmVudHMuTWF0aEpheDtcclxuXHJcbiAgICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcyk7XHJcbiAgICAgIHZhciBxdWVzdGlvbiwgc2lkZWJhcjtcclxuXHJcbiAgICAgIGlmICghdGFza0lzRG9uZSkge1xyXG4gICAgICAgIHZhciBxdWVzdGlvbkNvbnRlbnQgPSB0aGlzLnN0YXRlLmEgKyBcIiArIFwiICsgdGhpcy5zdGF0ZS5iICsgXCIgPSA/XCI7XHJcbiAgICAgICAgcXVlc3Rpb24gPSAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGV4dC1jZW50ZXJcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDEobnVsbCwgXHJcbiAgICAgICAgICAgICAgTWF0aEpheChudWxsLCBxdWVzdGlvbkNvbnRlbnQpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcIk1pa8OkIG9uIHlodGVlbmxhc2t1biB0dWxvcz9cIilcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiVmFzdGF1c1wiLCBjbGFzc05hbWU6XCJwYW5lbC1zdWNjZXNzIHBhbmVsLWV4dHJhLXBhZGRpbmdcIn0sIFxyXG4gICAgICAgICAgICAgIFNpbmdsZU51bWJlckZvcm0oIHtvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0gKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBxdWVzdGlvbiA9IFRhc2tEb25lRGlzcGxheSgge3Njb3JlOjEwfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFRhc2tIZWFkZXIoIHtuYW1lOlwiWWh0ZWVubGFza3VcIn0sIFxyXG4gICAgICAgICAgICBUYXNrUHJvZ3Jlc3NCYXIoIHtub3c6dGhpcy5zdGF0ZS5zdGVwLCBtYXg6dGhpcy5wcm9wcy5zdGVwc30pXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBxdWVzdGlvblwifSwgXHJcbiAgICAgICAgICAgICAgcXVlc3Rpb25cclxuICAgICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNSBjb2wtc20tb2Zmc2V0LTFcIn0sIFxyXG4gICAgICAgICAgICAgIHNpZGViYXJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGFkZGl0aW9uVGFzaztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFkZGl0aW9uVGFzaztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgZDMsIG1vZHVsZSwgcmVxdWlyZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogRGV0ZWN0IGFzIG1hbnkgc2hhcGVzIGFzIHlvdSBjYW4gaW4gNjAgc2Vjb25kcy5cclxuICovXHJcbnZhciBCYXNpY1NoYXBlc1Rhc2sgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxuICB2YXIgVGFza0NvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIENvb3JkcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Nvb3Jkc1wiKTtcclxuICB2YXIgTWl4aW5zID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvbWl4aW5zXCIpO1xyXG5cclxuICB2YXIgYmFzaWNTaGFwZXNUYXNrID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnYmFzaWNTaGFwZXNUYXNrJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25UYXNrRG9uZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgICAgdGltZTogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIG1peGluczogW01peGlucy5UcmlnZ2VyQW5pbWF0aW9uTWl4aW4sIE1peGlucy5TZXRUaW1lb3V0TWl4aW5dLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiBzaXggZGlmZmVyZW50IHNoYXBlcyB0aGF0IGZpbGwgdGhlIGNvb3Jkc1xyXG4gICAgICogaW4gYSByYW5kb20gb3JkZXIuXHJcbiAgICAgKi9cclxuICAgIGdldFJhbmRvbVNoYXBlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBjMSA9IDAuNDYsIGMyID0gMS4yMSwgczEgPSAxLjQzLCBzMiA9IDAuODg1O1xyXG4gICAgICB2YXIgcGVudGFnb25QdHMgPSBbWy1zMiwtYzJdLCBbLXMxLGMxXSwgWzAsMS41XSwgW3MxLGMxXSwgW3MyLC1jMl1dO1xyXG4gICAgICBwZW50YWdvblB0cyA9IFRhc2tVdGlscy50cmFuc2xhdGUocGVudGFnb25QdHMsIDIuNSwgMS41KTtcclxuXHJcbiAgICAgIHZhciB0cmFuc2xhdGVzID0gW1swLDBdLCBbNiwwXSwgWzAsNF0sIFs2LDRdLCBbMCw4XSwgWzYsOF1dO1xyXG4gICAgICB2YXIgYmFzZXMgPSBbXHJcbiAgICAgICAge25hbWU6XCJrb2xtaW9cIiwgcG9pbnRzOltbMSwwXSwgWzEsM10sIFs0LDBdXX0sXHJcbiAgICAgICAge25hbWU6XCJuZWxpw7ZcIiwgcG9pbnRzOltbMSwwXSwgWzEsM10sIFs0LDNdLCBbNCwwXV19LFxyXG4gICAgICAgIHtuYW1lOlwieW1weXLDpFwiLCBwb2ludHM6W1syLjUsMS41XV0sIHI6MS41fSxcclxuICAgICAgICB7bmFtZTpcInN1dW5uaWthc1wiLCBwb2ludHM6W1swLDBdLCBbMC41LDNdLCBbNC41LDNdLCBbNCwwXV19LFxyXG4gICAgICAgIHtuYW1lOlwicHVvbGlzdXVubmlrYXNcIiwgcG9pbnRzOltbMCwwXSwgWzAuNSwzXSwgWzQsM10sIFs0LjUsMF1dfSxcclxuICAgICAgICB7bmFtZTpcInZpaXNpa3VsbWlvXCIsIHBvaW50czpwZW50YWdvblB0c31cclxuICAgICAgXTtcclxuXHJcbiAgICAgIGJhc2VzID0gVGFza1V0aWxzLnNodWZmbGUoYmFzZXMpO1xyXG4gICAgICB2YXIgY2xycyA9IGQzLnNjYWxlLmNhdGVnb3J5MTAoKTtcclxuXHJcbiAgICAgIHZhciBzaGFwZXMgPSBiYXNlcy5tYXAoZnVuY3Rpb24oYmFzZSwgaSkge1xyXG4gICAgICAgIHZhciB0cmFuc2xhdGVYID0gdHJhbnNsYXRlc1tpXVswXSArIE1hdGgucmFuZG9tKCk7XHJcbiAgICAgICAgdmFyIHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGVzW2ldWzFdICsgTWF0aC5yYW5kb20oKTtcclxuICAgICAgICBiYXNlLnBvaW50cyA9IFRhc2tVdGlscy50cmFuc2xhdGUoYmFzZS5wb2ludHMsIHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVkpO1xyXG4gICAgICAgIGJhc2Uua2V5ID0gaTtcclxuICAgICAgICBiYXNlLm9uQ2xpY2sgPSB0aGlzLmhhbmRsZVNoYXBlQ2xpY2s7XHJcbiAgICAgICAgYmFzZS5zdHJva2UgPSBcImJsYWNrXCI7XHJcbiAgICAgICAgYmFzZS5maWxsID0gY2xycyhUYXNrVXRpbHMucmFuZCg5KSk7XHJcbiAgICAgICAgcmV0dXJuIGJhc2U7XHJcbiAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICByZXR1cm4gc2hhcGVzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVzZXQgdGhlIHF1ZXN0aW9uLCBpLmUuIGdlbmVyYXRlIG5ldyBzaGFwZXMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzaGFwZXMgPSB0aGlzLmdldFJhbmRvbVNoYXBlcygpO1xyXG5cclxuICAgICAgLy8gUHJldmVudCBhc2tpbmcgZm9yIHRoZSBzYW1lIHNoYXBlIHR3aWNlIGluIGEgcm93LlxyXG4gICAgICB2YXIgcG9zc2libGVUYXJnZXRzID0gc2hhcGVzO1xyXG4gICAgICBpZiAodGhpcy5zdGF0ZS50YXJnZXQpIHtcclxuICAgICAgICBwb3NzaWJsZVRhcmdldHMgPSBwb3NzaWJsZVRhcmdldHMuZmlsdGVyKGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgICAgICByZXR1cm4gc2hhcGUubmFtZSAhPT0gdGhpcy5zdGF0ZS50YXJnZXQubmFtZTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciB0YXJnZXQgPSBwb3NzaWJsZVRhcmdldHNbVGFza1V0aWxzLnJhbmQocG9zc2libGVUYXJnZXRzLmxlbmd0aCldO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgc2hhcGVzOiB0aGlzLmdldFJhbmRvbVNoYXBlcygpLFxyXG4gICAgICAgIHRhcmdldDogdGFyZ2V0XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVTdGFydEJ0bkNsaWNrOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNSdW5uaW5nOiB0cnVlLCBzY29yZTogMH0pO1xyXG4gICAgICB0aGlzLnJlZnMudGltZXIuc3RhcnRDb3VudGRvd24oKTtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2hlY2sgaWYgY29ycmVjdCBzaGFwZSBhbmQgcHJvY2VlZC4gKi9cclxuICAgIGhhbmRsZVNoYXBlQ2xpY2s6IGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgIHZhciBzY29yZUluY3JlbWVudDtcclxuICAgICAgaWYgKHNoYXBlLm5hbWUgPT09IHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWUpIHtcclxuICAgICAgICBzY29yZUluY3JlbWVudCA9IDE7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2NvcmVJbmNyZW1lbnQgPSAtMTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGVsZW0gPSAkKHRoaXMucmVmcy5zY29yZS5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB2YXIgYW5pbSA9IHNjb3JlSW5jcmVtZW50ID4gMCA/IFwicHVsc2VcIiA6IFwic2hha2VcIjtcclxuICAgICAgdGhpcy5hbmltYXRlKGVsZW0sIGFuaW0sIDEwMDApO1xyXG5cclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3Njb3JlOiBNYXRoLm1heCh0aGlzLnN0YXRlLnNjb3JlICsgc2NvcmVJbmNyZW1lbnQsIDApfSk7XHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFRhc2sgZmluaXNoZXMgKGFmdGVyIGEgc21hbGwgdGltZW91dCBmb3Igc21vb3RobmVzcykgd2hlbiB0aW1lciBleHBpcmVzLiAqL1xyXG4gICAgaGFuZGxlVGltZXJFeHBpcnk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGlzRmluaXNoZWQ6IHRydWUgfSk7XHJcbiAgICAgIH0uYmluZCh0aGlzKSwgNTAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICAgIHNjb3JlOiAwLFxyXG4gICAgICAgIGlzUnVubmluZzogZmFsc2UsXHJcbiAgICAgICAgaXNGaW5pc2hlZDogZmFsc2VcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBUYXNrQ291bnRkb3duVGltZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrQ291bnRkb3duVGltZXI7XHJcblxyXG4gICAgICB2YXIgc2hhcGVzID0gdGhpcy5zdGF0ZS5zaGFwZXM7XHJcbiAgICAgIHZhciBxdWVzdGlvbiwgc2lkZWJhciwgdGltZXI7XHJcblxyXG4gICAgICBpZiAoIXRoaXMuc3RhdGUuaXNGaW5pc2hlZCkge1xyXG4gICAgICAgIHZhciBib3VuZHMgPSB7bWF4WTogMTIsIG1heFg6IDEyLCBtaW5ZOiAwLCBtaW5YOiAwfTtcclxuXHJcbiAgICAgICAgcXVlc3Rpb24gPSBDb29yZHMoIHtkcmF3QXhlczpmYWxzZSwgc2hhcGVzOnNoYXBlcywgYm91bmRzOmJvdW5kcywgYXNwZWN0OjF9ICk7XHJcblxyXG4gICAgICAgIHZhciBzaGFwZVRvRmluZCA9IFwia29sbWlvXCI7XHJcblxyXG4gICAgICAgIHZhciBzdGFydEJ0biA9IHRoaXMuc3RhdGUuaXNSdW5uaW5nID8gbnVsbCA6IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImFuaW1hdGVkIGFuaW1hdGVkLXJlcGVhdCBib3VuY2UgYnRuIGJ0bi1wcmltYXJ5IGJ0bi1ibG9ja1wiLCBvbkNsaWNrOnRoaXMuaGFuZGxlU3RhcnRCdG5DbGlja30sIFxuICAgICAgICAgICAgICBcIkFsb2l0YSBwZWxpXCJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0RGlzcGxheSA9ICF0aGlzLnN0YXRlLnRhcmdldCA/IG51bGwgOiAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiYW5pbWF0ZWQgYm91bmNlLWluXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxuICAgICAgICAgICAgXCJLbGlrYXR0YXZhIGthcHBhbGU6IFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWUpLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtyZWY6XCJzY29yZVwiLCBjbGFzc05hbWU6XCJhbmltYXRlZCB0ZXh0LWNlbnRlclwifSwgXG4gICAgICAgICAgICAgIFwiUGlzdGVldDogXCIsIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwibGFiZWwgbGFiZWwtd2FybmluZ1wifSwgdGhpcy5zdGF0ZS5zY29yZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHNpZGViYXIgPSAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxuICAgICAgICAgICAgICBcIkV0c2kga29vcmRpbmFhdGlzdG9zdGEgbcOkw6Ryw6R0dHkgdGFzb2t1dmlvIGphIGtsaWtrYWEgc2l0w6QuXCIsUmVhY3QuRE9NLmJyKG51bGwpLFxuICAgICAgICAgICAgICBcIlNpbnVsbGEgb24gXCIsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgdGhpcy5wcm9wcy50aW1lLCBcIiBzZWt1bnRpYVwiKSwgXCIgYWlrYWEuXCIsXG4gICAgICAgICAgICAgIHN0YXJ0QnRuLFxyXG4gICAgICAgICAgICAgIHRhcmdldERpc3BsYXlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcXVlc3Rpb24gPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZTp0aGlzLnN0YXRlLnNjb3JlfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFRhc2tIZWFkZXIoIHtuYW1lOlwiS2FwcGFsZWlkZW4gdHVubmlzdGFtaW5lblwifSwgXHJcbiAgICAgICAgICAgIFRhc2tDb3VudGRvd25UaW1lcigge3JlZjpcInRpbWVyXCIsIHRpbWU6dGhpcy5wcm9wcy50aW1lLCBvbkV4cGlyeTp0aGlzLmhhbmRsZVRpbWVyRXhwaXJ5fSlcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgICBxdWVzdGlvblxyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gYmFzaWNTaGFwZXNUYXNrO1xyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYXNpY1NoYXBlc1Rhc2s7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogUmVhZCBwb3NpdGlvbnMgZnJvbSBhIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gKi9cclxudmFyIFNpbXBsZUNvb3Jkc1Rhc2sgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxuICB2YXIgVGFza0NvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIENvb3JkcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Nvb3Jkc1wiKTtcclxuICB2YXIgRm9ybXMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9mb3Jtc1wiKTtcclxuXHJcblxyXG4gIHZhciBzaW1wbGVDb29yZHNUYXNrID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnc2ltcGxlQ29vcmRzVGFzaycsXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgc3RlcHM6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgb25UYXNrRG9uZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVzZXQgdGhlIHF1ZXN0aW9uLCBpLmUuIGdlbmVyYXRlIGEgbmV3IHJhbmRvbSBwb2ludC4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIG5ld1BvaW50O1xyXG4gICAgICBkbyB7IG5ld1BvaW50ID0gW1Rhc2tVdGlscy5yYW5kUmFuZ2UoMCwgMTApLCBUYXNrVXRpbHMucmFuZFJhbmdlKDAsIDEwKV07IH1cclxuICAgICAgd2hpbGUgKFRhc2tVdGlscy5tYXRjaGVzU29sdXRpb24obmV3UG9pbnQsIHRoaXMuc3RhdGUucG9pbnQpKTtcclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3BvaW50OiBuZXdQb2ludH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2hlY2sgaWYgY29ycmVjdC4gKi9cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICB2YXIgaXNDb3JyZWN0ID0gVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihbeCwgeV0sIHRoaXMuc3RhdGUucG9pbnQpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KVxyXG4gICAgICAgIHRoaXMuaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG5cclxuICAgICAgcmV0dXJuIGlzQ29ycmVjdDtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzdGVwID0gdGhpcy5zdGF0ZS5zdGVwO1xyXG4gICAgICBpZiAoc3RlcCA9PT0gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcykpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblRhc2tEb25lKCk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c3RlcDogc3RlcCArIDF9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMSxcclxuICAgICAgICBwb2ludDogbnVsbFxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBUYXNrUGFuZWwgPSBUYXNrQ29tcG9uZW50cy5UYXNrUGFuZWw7XHJcbiAgICAgIHZhciBUYXNrSGVhZGVyID0gVGFza0NvbXBvbmVudHMuVGFza0hlYWRlcjtcclxuICAgICAgdmFyIFRhc2tQcm9ncmVzc0JhciA9IFRhc2tDb21wb25lbnRzLlRhc2tQcm9ncmVzc0JhcjtcclxuICAgICAgdmFyIFRhc2tEb25lRGlzcGxheSA9IFRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheTtcclxuICAgICAgdmFyIENvb3Jkc0Fuc3dlckZvcm0gPSBGb3Jtcy5Db29yZHNBbnN3ZXJGb3JtO1xyXG5cclxuICAgICAgdmFyIHBvaW50ID0gdGhpcy5zdGF0ZS5wb2ludDtcclxuICAgICAgdmFyIHRhc2tJc0RvbmUgPSB0aGlzLnN0YXRlLnN0ZXAgPiBwYXJzZUludCh0aGlzLnByb3BzLnN0ZXBzKTtcclxuICAgICAgdmFyIGNvb3Jkcywgc2lkZWJhcjtcclxuXHJcbiAgICAgIGlmIChwb2ludCAmJiAhdGFza0lzRG9uZSkge1xyXG4gICAgICAgIHZhciBib3VuZHMgPSB7bWF4WTogMTAsIG1heFg6IDEwLCBtaW5ZOiAtMiwgbWluWDogLTJ9O1xyXG4gICAgICAgIHZhciBzaGFwZXMgPSBbe3BvaW50czogW3BvaW50XSwgcjowLjIsIHN0cm9rZVdpZHRoOiAzLCBzdHJva2U6IFwiI0ZGNUIyNFwiLCBmaWxsOlwiI0ZEMDAwMFwifV07XHJcblxyXG4gICAgICAgIGNvb3JkcyA9IENvb3Jkcygge3NoYXBlczpzaGFwZXMsIGJvdW5kczpib3VuZHMsIGFzcGVjdDoxfSApO1xyXG5cclxuICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcIk1pdGvDpCBvdmF0IHBpc3RlZW4geC1qYSB5LWtvb3JkaW5hYXRpdD9cIilcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiVmFzdGF1c1wiLCBjbGFzc05hbWU6XCJwYW5lbC1zdWNjZXNzIHBhbmVsLWV4dHJhLXBhZGRpbmdcIn0sIFxyXG4gICAgICAgICAgICAgIENvb3Jkc0Fuc3dlckZvcm0oIHtyZWY6XCJmb3JtXCIsIG9uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKHRhc2tJc0RvbmUpIHtcclxuICAgICAgICBjb29yZHMgPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZToxMH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIktvb3JkaW5hYXRpc3RvbiBsdWtlbWluZW5cIn0sIFxyXG4gICAgICAgICAgICBUYXNrUHJvZ3Jlc3NCYXIoIHtub3c6dGhpcy5zdGF0ZS5zdGVwLCBtYXg6dGhpcy5wcm9wcy5zdGVwc30pXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBxdWVzdGlvblwifSwgXHJcbiAgICAgICAgICAgICAgY29vcmRzXHJcbiAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTUgY29sLXNtLW9mZnNldC0xXCJ9LCBcclxuICAgICAgICAgICAgICBzaWRlYmFyXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBzaW1wbGVDb29yZHNUYXNrO1xyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGVDb29yZHNUYXNrO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuLyogZ2xvYmFsIG1vZHVsZSAqL1xyXG5cclxuLyoqXHJcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIChtYWlubHkgbWF0aHMgcmVsYXRlZCkgZm9yIHRhc2tzLlxyXG4gKi9cclxudmFyIFRhc2tVdGlscyA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgaW4gcmFuZ2UgW21pbiwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1pbiAgIEluY2x1c2l2ZSBsb3dlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7KG51bWJlcnxbbnVtYmVyXSl9IEEgc2luZ2xlIG9yIG11bHRpcGxlIHJhbmRvbSBpbnRzLlxyXG4gICAgICovXHJcbiAgICByYW5kUmFuZ2U6IGZ1bmN0aW9uKG1pbiwgbWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmRSYW5nZShtaW4sIG1heCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByYW5kcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pbjtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBpbiByYW5nZSBbMCwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfFtudW1iZXJdfSBBIHNpbmdsZSBvciBtdWx0aXBsZSByYW5kb20gaW50cy5cclxuICAgICAqL1xyXG4gICAgcmFuZDogZnVuY3Rpb24obWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmQobWF4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJhbmRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKiBSZW9yZGVycyBnaXZlbiBhcnJheSByYW5kb21seSwgZG9lc24ndCBtb2RpZnkgb3JpZ2luYWwgYXJyYXkuICovXHJcbiAgICBzaHVmZmxlOiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgY2xvbmUgPSBhcnIuc2xpY2UoKTtcclxuICAgICAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGNsb25lLmxlbmd0aDsgaSA+IDA7IGktLSkge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnJhbmQoaSk7XHJcbiAgICAgICAgICAgIHNodWZmbGVkLnB1c2goY2xvbmUuc3BsaWNlKGluZGV4LCAxKVswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2h1ZmZsZWQ7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZ2Ugb2YgaW50ZWdlcnMuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gIG1pbiAgSW5jbHVzaXZlIGxvd2VyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9ICBtYXggIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gc3RlcCBPcHRpb25hbCBpbmNyZW1lbnQgdmFsdWUsIGRlZmF1bHRzIHRvIDEuXHJcbiAgICAgKiBAcmV0dXJuIHtbbnVtYmVyXX0gICAgVGhlIHNwZWNpZmllZCByYW5nZSBvZiBudW1iZXJzIGluIGFuIGFycmF5LlxyXG4gICAgICovXHJcbiAgICByYW5nZTogZnVuY3Rpb24obWluLCBtYXgsIHN0ZXApIHtcclxuICAgICAgICBzdGVwID0gc3RlcCB8fCAxO1xyXG4gICAgICAgIHZhciByZXMgPSBbXTtcclxuICAgICAgICBpZiAoc3RlcCA+IDApIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IG1pbjsgaSA8IG1heDsgaSArPSBzdGVwKSB7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaChpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSBtaW47IGogPiBtYXg7IGogKz0gc3RlcCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2goaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIHdoZXRoZXIgYXJyYXlzIGVxdWFsLlxyXG4gICAgICogQHBhcmFtICBhcnIxXHJcbiAgICAgKiBAcGFyYW0gIGFycjJcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGFycmF5c0VxdWFsOiBmdW5jdGlvbihhcnIxLCBhcnIyKSB7XHJcbiAgICAgICAgaWYgKGFycjEubGVuZ3RoICE9PSBhcnIyLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICByZXR1cm4gYXJyMS5ldmVyeShmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkID09PSBhcnIyW2ldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFuc2xhdGUgYW4gYXJyYXkgb2YgcG9pbnRzIGJ5IGdpdmVuIHggYW5kIHkgdmFsdWVzLlxyXG4gICAgICogQHBhcmFtICB7W1tudW1iZXJdXX0gcG9pbnRzXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICB4XHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICB5XHJcbiAgICAgKiBAcmV0dXJuIHtbW251bWJlcl1dfVxyXG4gICAgICovXHJcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHBvaW50cywgeCwgeSkge1xyXG4gICAgICAgIHJldHVybiBwb2ludHMubWFwKGZ1bmN0aW9uKHBvaW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbcG9pbnRbMF0gKyB4LCBwb2ludFsxXSArIHldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb21wYXJlIGdpdmVuIGFuc3dlciB0byB0aGUgY29ycmVjdCBzb2x1dGlvbi4gU3VwcG9ydHMgdmFyaW91cyBkYXRhIHR5cGVzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBhbnN3ZXJcclxuICAgICAqIEBwYXJhbSBzb2x1dGlvbiBBIHN0cmluZywgbnVtYmVyLCBhcnJheSwgb2JqZWN0IG9yIFJlZ0V4cC5cclxuICAgICAqIEBwYXJhbSBlcHNpbG9uICBPcHRpb25hbCBtYXggZXJyb3IgdmFsdWUgZm9yIGZsb2F0IGNvbXBhcmlzb24sIGRlZmF1bHQgaXMgMC4wMDEuXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGNvcnJlY3QsIG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgbWF0Y2hlc1NvbHV0aW9uOiBmdW5jdGlvbihhbnN3ZXIsIHNvbHV0aW9uLCBlcHNpbG9uKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhbnN3ZXIgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLnRyaW0oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc29sdXRpb24gPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgYW5zd2VyID0gcGFyc2VGbG9hdChhbnN3ZXIpO1xyXG4gICAgICAgICAgICBpZiAoaXNOYU4oYW5zd2VyKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBlcHNpbG9uID0gZXBzaWxvbiA9PT0gdW5kZWZpbmVkID8gMC4wMDEgOiBlcHNpbG9uO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguYWJzKGFuc3dlciAtIHNvbHV0aW9uKSA8PSBlcHNpbG9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzb2x1dGlvbi50ZXN0KGFuc3dlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGlmICghYW5zd2VyIGluc3RhbmNlb2YgQXJyYXkgfHwgYW5zd2VyLmxlbmd0aCAhPT0gc29sdXRpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFuc3dlci5ldmVyeShmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5tYXRjaGVzU29sdXRpb24oZCwgc29sdXRpb25baV0sIGVwc2lsb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICBpZiAoIWFuc3dlciBpbnN0YW5jZW9mIE9iamVjdClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBhbnNLZXlzID0gT2JqZWN0LmtleXMoYW5zd2VyKTtcclxuICAgICAgICAgICAgaWYgKGFuc0tleXMubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhzb2x1dGlvbikubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFuc0tleXMuZXZlcnkoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQubWF0Y2hlc1NvbHV0aW9uKGFuc3dlcltkXSwgc29sdXRpb25bZF0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhbnN3ZXIgPT09IHNvbHV0aW9uO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUYXNrVXRpbHM7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIEFwcGxpY2F0aW9uID0gcmVxdWlyZShcIi4vanMvYXBwbGljYXRpb24uanNcIik7XHJcblxyXG4gICAgUmVhY3QucmVuZGVyQ29tcG9uZW50KFxyXG4gICAgICAgIEFwcGxpY2F0aW9uKG51bGwgKSxcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcGxpY2F0aW9uXCIpXHJcbiAgICApO1xyXG59KTtcclxuLyoganNoaW50IGlnbm9yZTplbmQgKi8iXX0=
