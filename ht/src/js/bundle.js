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
      shapes = Shapes( {x:x, y:y, spacing:spacing, data:this.props.shapes} );
      grid = Grid( {drawAxes:this.props.drawAxes, x:x, y:y, bounds:bounds} );
    }

    return (
      React.DOM.div( {className:"coords-container"}, 
        React.DOM.svg( {width:fullWidth, height:fullHeight}, 
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

      console.log("timeLeft", this.state.timeLeft);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGxvY2FsYWRtaW5cXEFwcERhdGFcXFJvYW1pbmdcXG5wbVxcbm9kZV9tb2R1bGVzXFx3YXRjaGlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiQzovVXNlcnMvbG9jYWxhZG1pbi9Eb3dubG9hZHMvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL2Nvb3Jkcy5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvanMvY29tcG9uZW50cy9mb3JtLWNvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvZm9ybXMuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvbWF0aC1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvbG9jYWxhZG1pbi9Eb3dubG9hZHMvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL21peGlucy5qcyIsIkM6L1VzZXJzL2xvY2FsYWRtaW4vRG93bmxvYWRzL2drby9odC9zcmMvanMvY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL3Rhc2tzL2FkZGl0aW9uLXRhc2suanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL3Rhc2tzL2Jhc2ljLXNoYXBlcy10YXNrLmpzIiwiQzovVXNlcnMvbG9jYWxhZG1pbi9Eb3dubG9hZHMvZ2tvL2h0L3NyYy9qcy90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2suanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL2pzL3V0aWxzL3Rhc2stdXRpbHMuanMiLCJDOi9Vc2Vycy9sb2NhbGFkbWluL0Rvd25sb2Fkcy9na28vaHQvc3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblwidXNlIHN0cmljdFwiO1xyXG4vKiBnbG9iYWxzIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXHJcblxyXG52YXIgQWRkaXRpb25UYXNrID0gcmVxdWlyZShcIi4vdGFza3MvYWRkaXRpb24tdGFza1wiKTtcclxudmFyIFNpbXBsZUNvb3Jkc1Rhc2sgPSByZXF1aXJlKFwiLi90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2tcIik7XHJcbnZhciBCYXNpY1NoYXBlc1Rhc2sgPSByZXF1aXJlKFwiLi90YXNrcy9iYXNpYy1zaGFwZXMtdGFza1wiKTtcclxuXHJcblxyXG4vKipcclxuICogQ29udGFpbmVyIGFuZCBsaW5rcyBmb3IgZXhhbXBsZSB0YXNrcy5cclxuICovXHJcbnZhciBBcHBsaWNhdGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FwcGxpY2F0aW9uJyxcclxuXHJcbiAgaGFuZGxlTGlzdENsaWNrOiBmdW5jdGlvbihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB2YXIgdGFza05hbWUgPSBlLnRhcmdldC50ZXh0O1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRUYXNrOiB0YXNrTmFtZX0pO1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZVRhc2tEb25lOiBmdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiVGFzayBkb25lIC0gaGVyZSdzIHdoZXJlIHRoZSB0YXNrIGNvbm5lY3RzIHRvIGFuIGV4dGVybmFsIGFwcC5cIik7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7c2VsZWN0ZWRUYXNrOiBcIkthcHBhbGVpZGVuIHR1bm5pc3RhbWluZW5cIn07XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciB0YXNrcyA9IHtcclxuICAgICAgXCJZaHRlZW5sYXNrdVwiOiBBZGRpdGlvblRhc2soIHtvblRhc2tEb25lOnRoaXMuaGFuZGxlVGFza0RvbmUsIHN0ZXBzOjV9KSxcclxuICAgICAgXCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCI6IFNpbXBsZUNvb3Jkc1Rhc2soIHtvblRhc2tEb25lOnRoaXMuaGFuZGxlVGFza0RvbmUsIHN0ZXBzOjV9KSxcclxuICAgICAgXCJLYXBwYWxlaWRlbiB0dW5uaXN0YW1pbmVuXCI6IEJhc2ljU2hhcGVzVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZSwgdGltZToyMH0pXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB0YXNrTGlzdEVsZW1zID0gT2JqZWN0LmtleXModGFza3MpLm1hcChmdW5jdGlvbih0YXNrTmFtZSkge1xyXG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGFza05hbWUgPT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRUYXNrID8gXCJ0ZXh0LW11dGVkXCIgOiBcIlwiO1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5saShudWxsLCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOmNsYXNzTmFtZSwgaHJlZjpcIlwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlTGlzdENsaWNrfSwgdGFza05hbWUpXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB2YXIgdGFzayA9IHRhc2tzW3RoaXMuc3RhdGUuc2VsZWN0ZWRUYXNrXTtcclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgIFJlYWN0LkRPTS51bCgge2NsYXNzTmFtZTpcImxpc3QtaW5saW5lXCJ9LCBcclxuICAgICAgICAgIHRhc2tMaXN0RWxlbXNcclxuICAgICAgICApLFxyXG5cclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1jb250YWluZXJcIn0sIFxyXG4gICAgICAgICAgdGFza1xyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIGQzLCBNYXRoVXRpbHMsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKiogQSAyRCBjb29yZGluYXRlIHN5c3RlbS4gKi9cclxudmFyIENvb3JkcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nvb3JkcycsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgZHJhd0F4ZXM6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgc2hhcGVzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXksXHJcbiAgICBib3VuZHM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXHJcbiAgICBhc3BlY3Q6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICB9LFxyXG5cclxuICBoYW5kbGVSZXNpemU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHBhcmVudCA9ICQodGhpcy5nZXRET01Ob2RlKCkucGFyZW50Tm9kZSk7XHJcbiAgICB0aGlzLnNldFN0YXRlKHt3aWR0aDogcGFyZW50LndpZHRoKCl9KTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHt3aWR0aDogMH07XHJcbiAgfSxcclxuXHJcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRyYXdBeGVzOiB0cnVlLFxyXG4gICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICBib3VuZHM6IHttYXhZOjEwLCBtYXhYOjEwLCBtaW5ZOjAsIG1pblg6MH0sXHJcbiAgICAgIGFzcGVjdDogMVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLmhhbmRsZVJlc2l6ZSk7XHJcbiAgICB0aGlzLmhhbmRsZVJlc2l6ZSgpO1xyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMuaGFuZGxlUmVzaXplKTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgdmFyIG1hcmdpbiA9IHtcclxuICAgICAgdG9wOiAxMCxcclxuICAgICAgcmlnaHQ6IDEwLFxyXG4gICAgICBib3R0b206IDEwLFxyXG4gICAgICBsZWZ0OiAxMFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgd2lkdGggPSB0aGlzLnN0YXRlLndpZHRoID8gdGhpcy5zdGF0ZS53aWR0aCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0IDogMDtcclxuICAgIHZhciBoZWlnaHQgPSBNYXRoLnJvdW5kKHdpZHRoICogdGhpcy5wcm9wcy5hc3BlY3QpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcblxyXG4gICAgdmFyIGJvdW5kcyA9IHRoaXMucHJvcHMuYm91bmRzO1xyXG4gICAgdmFyIHNwYWNpbmcgPSBNYXRoLnJvdW5kKE1hdGgubWluKFxyXG4gICAgICB3aWR0aCAvIE1hdGguYWJzKGJvdW5kcy5tYXhYIC0gYm91bmRzLm1pblgpLFxyXG4gICAgICBoZWlnaHQgLyBNYXRoLmFicyhib3VuZHMubWF4WSAtIGJvdW5kcy5taW5ZKVxyXG4gICAgKSk7XHJcblxyXG4gICAgdmFyIHggPSBkMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAuZG9tYWluKFtib3VuZHMubWluWCwgYm91bmRzLm1pblggKyAxXSlcclxuICAgICAgLnJhbmdlKFswLCBzcGFjaW5nXSk7XHJcblxyXG4gICAgdmFyIHkgPSBkMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAuZG9tYWluKFtib3VuZHMubWluWSwgYm91bmRzLm1pblkgKyAxXSlcclxuICAgICAgLnJhbmdlKFtoZWlnaHQsIGhlaWdodCAtIHNwYWNpbmddKTtcclxuXHJcbiAgICB2YXIgZnVsbFdpZHRoID0gd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodDtcclxuICAgIHZhciBmdWxsSGVpZ2h0ID0gaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b207XHJcbiAgICB2YXIgdHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiO1xyXG5cclxuICAgIHZhciBzaGFwZXMsIGdyaWQ7XHJcbiAgICBpZiAodGhpcy5zdGF0ZS53aWR0aCkge1xyXG4gICAgICBzaGFwZXMgPSBTaGFwZXMoIHt4OngsIHk6eSwgc3BhY2luZzpzcGFjaW5nLCBkYXRhOnRoaXMucHJvcHMuc2hhcGVzfSApO1xyXG4gICAgICBncmlkID0gR3JpZCgge2RyYXdBeGVzOnRoaXMucHJvcHMuZHJhd0F4ZXMsIHg6eCwgeTp5LCBib3VuZHM6Ym91bmRzfSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb29yZHMtY29udGFpbmVyXCJ9LCBcclxuICAgICAgICBSZWFjdC5ET00uc3ZnKCB7d2lkdGg6ZnVsbFdpZHRoLCBoZWlnaHQ6ZnVsbEhlaWdodH0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmcoIHt0cmFuc2Zvcm06dHJhbnNmb3JtfSwgXHJcbiAgICAgICAgICAgIGdyaWQsXHJcbiAgICAgICAgICAgIHNoYXBlc1xyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbi8qKiBBIGdyaWQgZm9yIHRoZSBjb29yZGluYXRlIHN5c3RlbS4gKi9cclxudmFyIEdyaWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdHcmlkJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICB4OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgeTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIGJvdW5kczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxyXG4gICAgc3BhY2luZzogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIHRyYW5zaXRpb25EdXJhdGlvbjogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxyXG4gIH0sXHJcblxyXG4gIC8qKiBSZWRyYXcgZ3JpZC4gICovXHJcbiAgdXBkYXRlOiBmdW5jdGlvbihwcm9wcykge1xyXG4gICAgdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCh0aGlzLmdldERPTU5vZGUoKSk7XHJcbiAgICB2YXIgYm91bmRzID0gcHJvcHMuYm91bmRzO1xyXG4gICAgdmFyIHNwYWNpbmcgPSBwcm9wcy5zcGFjaW5nO1xyXG4gICAgdmFyIHggPSBwcm9wcy54O1xyXG4gICAgdmFyIHkgPSBwcm9wcy55O1xyXG5cclxuICAgIHZhciB4UmFuZ2UgPSBkMy5yYW5nZShNYXRoLmNlaWwoKGJvdW5kcy5taW5YKSAvIHNwYWNpbmcpLCBNYXRoLnJvdW5kKGJvdW5kcy5tYXhYKSArIHNwYWNpbmcsIHNwYWNpbmcpO1xyXG4gICAgdmFyIHlSYW5nZSA9IGQzLnJhbmdlKE1hdGguY2VpbCgoYm91bmRzLm1pblkpIC8gc3BhY2luZyksIE1hdGgucm91bmQoYm91bmRzLm1heFkpICsgc3BhY2luZywgc3BhY2luZyk7XHJcbiAgICB2YXIgZGF0YSA9IHhSYW5nZS5jb25jYXQoeVJhbmdlKTtcclxuICAgIHZhciBpc1ggPSBmdW5jdGlvbihpbmRleCkgeyByZXR1cm4gaW5kZXggPCB4UmFuZ2UubGVuZ3RoOyB9O1xyXG5cclxuICAgIHZhciBheGVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcIi5heGlzXCIpXHJcbiAgICAgIC5kYXRhKGRhdGEpO1xyXG5cclxuICAgIGF4ZXMuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgIHJldHVybiBcImF4aXMgXCIgKyAoKHByb3BzLmRyYXdBeGVzICYmIGQgPT09IDApID8gXCJ0aGlja1wiIDogXCJcIik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBheGVzLnRyYW5zaXRpb24oKS5kdXJhdGlvbihwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoYm91bmRzLm1pblgpOyB9KVxyXG4gICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1pblkpIDogeShkKTsgfSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB4KGQpIDogeChib3VuZHMubWF4WCk7IH0pXHJcbiAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geShib3VuZHMubWF4WSkgOiB5KGQpOyB9KTtcclxuXHJcbiAgICBheGVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICBpZiAocHJvcHMuZHJhd0F4ZXMpIHtcclxuICAgICAgdmFyIGxhYmVscyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCIubGFiZWxcIikuZGF0YShkYXRhKTtcclxuXHJcbiAgICAgIGxhYmVscy5lbnRlcigpLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwibGFiZWwgXCIgKyAoaXNYKGkpID8gXCJ4XCIgOiBcInlcIik7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkgeyBpZiAoIWQpIHJldHVybiBcIm5vbmVcIjsgfSlcclxuICAgICAgICAudGV4dChPYmplY3QpXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyBcIjEuNGVtXCIgOiBcIi4zZW1cIjsgfSlcclxuICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IG51bGwgOiBcIi0uOGVtXCI7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMSArIFwiZW1cIik7XHJcblxyXG4gICAgICBsYWJlbHMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoMCk7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoMCkgOiB5KGQpOyB9KTtcclxuXHJcbiAgICAgIGxhYmVscy5leGl0KCkucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRyYXdBeGVzOiB0cnVlLFxyXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDU1MCxcclxuICAgICAgc3BhY2luZzogMVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnVwZGF0ZSh0aGlzLnByb3BzKTtcclxuICB9LFxyXG5cclxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xyXG4gICAgdGhpcy51cGRhdGUobmV4dFByb3BzKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICBSZWFjdC5ET00uZygge2NsYXNzTmFtZTpcImF4ZXNcIn0pXHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICApO1xyXG4gIH1cclxufSk7XHJcblxyXG5cclxuLyoqIFZhcmlvdXMgZ2VvbWV0cmljIHNoYXBlcyB0byBiZSBkcmF3biBvbiB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0uICovXHJcbnZhciBTaGFwZXMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTaGFwZXMnLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIGRhdGE6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxyXG4gICAgeDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICBzcGFjaW5nOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICB0cmFuc2l0aW9uRHVyYXRpb246IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICB9LFxyXG5cclxuICAvKiogUmVkcmF3IHNoYXBlcy4gR2V0cyBjYWxsZWQgd2hlbmV2ZXIgc2hhcGVzIGFyZSB1cGRhdGVkIG9yIHNjcmVlbiByZXNpemVzLiAqL1xyXG4gIHVwZGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgIHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QodGhpcy5nZXRET01Ob2RlKCkpO1xyXG4gICAgdmFyIHRyYW5zaXRpb25EdXJhdGlvbiA9IHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbiB8fCA1NTA7XHJcblxyXG4gICAgdmFyIHBvbHlnb25zID0gY29udGFpbmVyLnNlbGVjdEFsbChcInBvbHlnb24uc2hhcGVcIilcclxuICAgICAgLmRhdGEocHJvcHMuZGF0YS5maWx0ZXIoZnVuY3Rpb24ocykgeyByZXR1cm4gcy5wb2ludHMubGVuZ3RoID4gMjsgfSkpO1xyXG5cclxuICAgIHZhciBhZGRlZFBvbHlnb25zID0gcG9seWdvbnMuZW50ZXIoKS5hcHBlbmQoXCJwb2x5Z29uXCIpLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpO1xyXG5cclxuICAgIHBvbHlnb25zLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwicG9pbnRzXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gZC5wb2ludHMubWFwKGZ1bmN0aW9uKHBzKSB7XHJcbiAgICAgICAgICByZXR1cm4gW3Byb3BzLngocHNbMF0pLCBwcm9wcy55KHBzWzFdKV07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIHBvbHlnb25zLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcblxyXG4gICAgdmFyIGNpcmNsZXMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwiY2lyY2xlLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA9PSAxOyB9KSk7XHJcblxyXG4gICAgdmFyIGFkZGVkQ2lyY2xlcyA9IGNpcmNsZXMuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgY2lyY2xlcy50cmFuc2l0aW9uKCkuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMF1bMF0pOyB9KVxyXG4gICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMF1bMV0pOyB9KVxyXG4gICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMuc3BhY2luZyAqIChkLnIgfHwgMC4yKTsgfSk7XHJcblxyXG4gICAgY2lyY2xlcy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG5cclxuICAgIHZhciBsaW5lcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJsaW5lLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA9PSAyOyB9KSk7XHJcblxyXG4gICAgdmFyIGFkZGVkTGluZXMgPSBsaW5lcy5lbnRlcigpLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgbGluZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzBdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzBdWzFdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzFdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzFdWzFdKTsgfSk7XHJcblxyXG4gICAgbGluZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIEF0dGFjaCBjbGljayBldmVudCBsaXN0ZW5lcnMuXHJcbiAgICBbYWRkZWRQb2x5Z29ucywgYWRkZWRDaXJjbGVzLCBhZGRlZExpbmVzXS5mb3JFYWNoKGZ1bmN0aW9uKGFkZGVkKSB7XHJcbiAgICAgIGFkZGVkLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIGlmICgkLmlzRnVuY3Rpb24oZC5vbkNsaWNrKSlcclxuICAgICAgICAgIGQub25DbGljayhkKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXQgY29tbW9uIGF0dHJpYnV0ZXMuXHJcbiAgICBjb250YWluZXIuc2VsZWN0QWxsKFwiLnNoYXBlXCIpXHJcbiAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KVxyXG4gICAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnN0cm9rZSB8fCBcInN0ZWVsYmx1ZVwiOyB9KVxyXG4gICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiAoZC5zdHJva2VXaWR0aCB8fCAyKSArIFwicHhcIjsgfSk7XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy51cGRhdGUodGhpcy5wcm9wcyk7XHJcbiAgfSxcclxuXHJcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcclxuICAgIHRoaXMudXBkYXRlKG5leHRQcm9wcyk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHJldHVybiBSZWFjdC5ET00uZygge2NsYXNzTmFtZTpcInNoYXBlc1wifSk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvb3JkczsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFZhcmlvdXMgY29tbW9uIGZvcm0gY29tcG9uZW50cy5cclxuICovXHJcbnZhciBGb3JtQ29tcG9uZW50cyA9IChmdW5jdGlvbigpe1xyXG5cclxuICB2YXIgTWl4aW5zID0gcmVxdWlyZShcIi4vbWl4aW5zXCIpO1xyXG5cclxuICB2YXIgZm9ybUNvbXBvbmVudHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSBmb3JtIHRoYXQgZGlzYWJsZXMgc3VibWl0dGluZyB3aGVuIGlucHV0cyBhcmUgaW52YWxpZC5cclxuICAgKi9cclxuICBmb3JtQ29tcG9uZW50cy5BbnN3ZXJGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQW5zd2VyRm9ybScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uQW5zd2VyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgICBidG5Db3JyZWN0QW5pbUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5JbmNvcnJlY3RBbmltQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGZvcm1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgYnRuQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcclxuICAgIH0sXHJcblxyXG4gICAgbWl4aW5zOiBbTWl4aW5zLlRyaWdnZXJBbmltYXRpb25NaXhpbl0sXHJcblxyXG4gICAgLyoqIFN1Ym1pdCBhbnN3ZXIgaWYgZm9ybSBpcyB2YWxpZC4gKi9cclxuICAgIGhhbmRsZVN1Ym1pdDogZnVuY3Rpb24oZSkge1xyXG4gICAgICBpZiAoZSlcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICBpZiAodGhpcy5zdGF0ZS5pc1ZhbGlkKSB7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkFuc3dlcigpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dFcnJvcnM6IHRydWV9KTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVDb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGJ0biA9ICQodGhpcy5yZWZzLmJ0bi5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB0aGlzLmFuaW1hdGUoYnRuLCB0aGlzLnByb3BzLmJ0bkNvcnJlY3RBbmltQ2xhc3MpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVJbmNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYnRuID0gJCh0aGlzLnJlZnMuYnRuLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHRoaXMuYW5pbWF0ZShidG4sIHRoaXMucHJvcHMuYnRuSW5jb3JyZWN0QW5pbUNsYXNzKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsaWRpdHk6IGZ1bmN0aW9uKGlzVmFsaWQpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNWYWxpZDogaXNWYWxpZCwgaXNEaXJ0eTogdHJ1ZX0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2xlYXIgdmFsdWVzIGFuZCB2YWxpZGF0aW9uIHN0YXRlcyBmb3IgYWxsIGNoaWxkIGVsZW1lbnRzLiAqL1xyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxyXG4gICAgICAgIGlzRGlydHk6IGZhbHNlLFxyXG4gICAgICAgIHNob3dFcnJvcnM6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGZvcm1DbGFzczogXCJmb3JtLWhvcml6b250YWxcIixcclxuICAgICAgICBidG5DbGFzczogXCJidG4gYnRuLXN1Y2Nlc3MgYnRuLWxnIGJ0bi1ibG9ja1wiLFxyXG4gICAgICAgIGJ0bkNvcnJlY3RBbmltQ2xhc3M6IFwiYW5pbWF0ZWQgYm91bmNlXCIsXHJcbiAgICAgICAgYnRuSW5jb3JyZWN0QW5pbUNsYXNzOiBcImFuaW1hdGVkIHNoYWtlXCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxyXG4gICAgICAgIGlzRGlydHk6IGZhbHNlLFxyXG4gICAgICAgIHNob3dFcnJvcnM6IGZhbHNlXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIGNoaWxkcmVuID0gW10uY29uY2F0KHRoaXMucHJvcHMuY2hpbGRyZW4pLm1hcChmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGNoaWxkLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UgPSB0aGlzLnNldFZhbGlkaXR5O1xyXG4gICAgICAgIGNoaWxkLnByb3BzLm9uU3VibWl0ID0gdGhpcy5oYW5kbGVTdWJtaXQ7XHJcbiAgICAgICAgY2hpbGQucHJvcHMuc2hvd0Vycm9yID0gdGhpcy5zdGF0ZS5zaG93RXJyb3JzO1xyXG4gICAgICAgIHJldHVybiBjaGlsZDtcclxuICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgIHZhciBidG5DbGFzcyA9IHRoaXMucHJvcHMuYnRuQ2xhc3MgKyAodGhpcy5zdGF0ZS5pc1ZhbGlkID8gXCJcIiA6IFwiIGRpc2FibGVkXCIpO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZm9ybSgge3JvbGU6XCJmb3JtXCIsIGNsYXNzTmFtZTp0aGlzLnByb3BzLmZvcm1DbGFzcywgb25TdWJtaXQ6dGhpcy5oYW5kbGVTdWJtaXQsIG5vVmFsaWRhdGU6dHJ1ZX0sIFxyXG4gICAgICAgICAgY2hpbGRyZW4sXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcImJ0blwiLCB0eXBlOlwic3VibWl0XCIsIHZhbHVlOlwiVmFzdGFhXCIsIGNsYXNzTmFtZTpidG5DbGFzc30gKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGlucHV0IHdpdGggcmVndWxhciBleHByZXNzaW9uIHZhbGlkYXRpb24uXHJcbiAgICovXHJcbiAgZm9ybUNvbXBvbmVudHMuUmVJbnB1dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JlSW5wdXQnLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICByZTogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCxcclxuICAgICAgc2hvd0Vycm9yOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgICAgcmVxdWlyZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgICBwbGFjZWhvbGRlcjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgdHlwZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgY2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBvblZhbGlkaXR5Q2hhbmdlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVhZCB2YWx1ZSwgdmFsaWRhdGUsIG5vdGlmeSBwYXJlbnQgZWxlbWVudCBpZiBhbiBldmVudCBpcyBhdHRhY2hlZC4gKi9cclxuICAgIGhhbmRsZUNoYW5nZTogZnVuY3Rpb24oZSkge1xyXG4gICAgICB2YXIgaXNWYWxpZCA9IHRoaXMudmFsaWRhdG9yLnRlc3QoZS50YXJnZXQudmFsdWUpO1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHt2YWx1ZTogZS50YXJnZXQudmFsdWUsIGlzVmFsaWQ6IGlzVmFsaWQsIGlzRGlydHk6IHRydWV9KTtcclxuXHJcbiAgICAgIGlmICgkLmlzRnVuY3Rpb24odGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKSlcclxuICAgICAgICB0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UoaXNWYWxpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZClcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHt2YWx1ZTogdmFsdWV9KTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLnZhbHVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZWxlY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlZnMuaW5wdXQuZ2V0RE9NTm9kZSgpLnNlbGVjdCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2xlYXIgdmFsdWUgYW5kIHJlc2V0IHZhbGlkYXRpb24gc3RhdGVzLiAqL1xyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB2YWx1ZTogXCJcIixcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxyXG4gICAgICAgIGlzRGlydHk6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWxpZGF0b3I6IGZ1bmN0aW9uKHJlKSB7XHJcbiAgICAgIHRoaXMudmFsaWRhdG9yID0gbmV3IFJlZ0V4cChyZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRWYWxpZGF0b3IodGhpcy5wcm9wcy5yZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uKG5ld1Byb3BzKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsaWRhdG9yKG5ld1Byb3BzLnJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB2YWx1ZTogXCJcIixcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxyXG4gICAgICAgIGlzRGlydHk6IGZhbHNlLFxyXG4gICAgICAgIHR5cGU6IFwidGV4dFwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgcmU6IC9eXFxzKi0/XFxkK1xccyokLyxcclxuICAgICAgICBzaG93RXJyb3I6IGZhbHNlLFxyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgIGNsYXNzTmFtZTogXCJcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciB2YWxpZGF0aW9uU3RhdGUgPSBSZWFjdC5hZGRvbnMuY2xhc3NTZXQoe1xyXG4gICAgICAgIFwiaGFzLXN1Y2Nlc3NcIjogdGhpcy5zdGF0ZS5pc1ZhbGlkICYmIHRoaXMuc3RhdGUuaXNEaXJ0eSxcclxuICAgICAgICBcImhhcy13YXJuaW5nXCI6ICF0aGlzLnN0YXRlLmlzRGlydHkgJiYgdGhpcy5wcm9wcy5zaG93RXJyb3IsXHJcbiAgICAgICAgXCJoYXMtZXJyb3JcIjogIXRoaXMuc3RhdGUuaXNWYWxpZFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBlcnJvcjtcclxuICAgICAgaWYgKHRoaXMucHJvcHMuc2hvd0Vycm9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmlzVmFsaWQpIHtcclxuICAgICAgICAgIGVycm9yID0gUmVhY3QuRE9NLmxhYmVsKCB7Y2xhc3NOYW1lOlwiY29udHJvbC1sYWJlbFwifSwgXCJWaXJoZWVsbGluZW4gc3nDtnRlXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLnByb3BzLnJlcXVpcmVkICYmIHRoaXMudmFsdWUoKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGVycm9yID0gUmVhY3QuRE9NLmxhYmVsKCB7Y2xhc3NOYW1lOlwiY29udHJvbC1sYWJlbFwifSwgXCJUw6R5dMOkIHTDpG3DpCBrZW50dMOkXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXAgXCIgKyB2YWxpZGF0aW9uU3RhdGV9LCBcclxuICAgICAgICAgIGVycm9yLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7cmVmOlwiaW5wdXRcIiwgb25DaGFuZ2U6dGhpcy5oYW5kbGVDaGFuZ2UsIHZhbHVlOnRoaXMuc3RhdGUudmFsdWUsIHBsYWNlaG9sZGVyOnRoaXMucHJvcHMucGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICB0eXBlOnRoaXMucHJvcHMudHlwZSwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIFwiICsgdGhpcy5wcm9wcy5jbGFzc05hbWV9IClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgbnVtYmVyIGlucHV0IHdpdGggdHdvIGJ1dHRvbnMgZm9yIGluY3JlbWVudGluZyBhbmQgZGVjcmVtZW50aW5nLlxyXG4gICAqL1xyXG4gIGZvcm1Db21wb25lbnRzLk51bUlucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTnVtSW5wdXQnLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzdGVwOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxyXG4gICAgICBwbGFjZWhvbGRlcjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgYnRuQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIG9uVmFsaWRpdHlDaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxyXG4gICAgICBvblN1Ym1pdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsdWVBbmRWYWxpZGl0eTogZnVuY3Rpb24odmFsdWUsIGlzVmFsaWQpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdmFsdWU6IHZhbHVlLCBpc1ZhbGlkOiBpc1ZhbGlkXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoJC5pc0Z1bmN0aW9uKHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZSkpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eShcIlwiLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlRGVjcmVtZW50OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KHRoaXMudmFsdWUoKSAtIHRoaXMucHJvcHMuc3RlcCwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUluY3JlbWVudDogZnVuY3Rpb24oZSkge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh0aGlzLnZhbHVlKCkgKyB0aGlzLnByb3BzLnN0ZXAsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVzZXQgc3RhdGUgdG8gaW5wdXQgdmFsdWUgaWYgaW5wdXQgdmFsdWUgaXMgYSBudW1iZXIuICovXHJcbiAgICBoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyIHZhbCA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICB2YXIgaXNWYWxpZCA9ICFpc05hTihwYXJzZUZsb2F0KHZhbCkpO1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkodmFsLCBpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFRyeSB0byBzdWJtaXQgcGFyZW50IGZvcm0gd2hlbiBFbnRlciBpcyBjbGlja2VkLiAqL1xyXG4gICAgaGFuZGxlS2V5UHJlc3M6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaWYgKHRoaXMucHJvcHMub25TdWJtaXQpXHJcbiAgICAgICAgICB0aGlzLnByb3BzLm9uU3VibWl0KCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gcGFyc2VGbG9hdCh0aGlzLnN0YXRlLnZhbHVlKSB8fCAwO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHZhbHVlOiBudWxsLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWVcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdGVwOiAxXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIFJlSW5wdXQgPSBmb3JtQ29tcG9uZW50cy5SZUlucHV0O1xyXG4gICAgICB2YXIgYnRuQ2xhc3MgPSB0aGlzLnByb3BzLmJ0bkNsYXNzIHx8IFwiYnRuIGJ0bi1sZyBidG4taW5mb1wiO1xyXG4gICAgICB2YXIgdmFsaWRhdGlvblN0YXRlID0gdGhpcy5zdGF0ZS5pc1ZhbGlkID8gXCJoYXMtc3VjY2Vzc1wiIDogXCJoYXMtZXJyb3JcIjtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXAgXCIgKyB2YWxpZGF0aW9uU3RhdGV9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTMgY29sLXhzLTNcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0YWJJbmRleDpcIi0xXCIsIGNsYXNzTmFtZTpidG5DbGFzcyArIFwiIHB1bGwtcmlnaHRcIiwgb25DbGljazp0aGlzLmhhbmRsZURlY3JlbWVudH0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tbGVmdFwifSlcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBjb2wteHMtNlwifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7dHlwZTpcIm51bWJlclwiLCB2YWx1ZTp0aGlzLnN0YXRlLnZhbHVlLCBvbkNoYW5nZTp0aGlzLmhhbmRsZUNoYW5nZSwgb25LZXlQcmVzczp0aGlzLmhhbmRsZUtleVByZXNzLFxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBpbnB1dC1sZyB0ZXh0LWNlbnRlclwiLCBwbGFjZWhvbGRlcjp0aGlzLnByb3BzLnBsYWNlaG9sZGVyfSlcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS0zIGNvbC14cy0zXCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dGFiSW5kZXg6XCItMVwiLCBjbGFzc05hbWU6YnRuQ2xhc3MgKyBcIiBwdWxsLWxlZnRcIiwgb25DbGljazp0aGlzLmhhbmRsZUluY3JlbWVudH0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHRcIn0pXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gZm9ybUNvbXBvbmVudHM7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtQ29tcG9uZW50cztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDb21wbGV0ZSBhbnN3ZXIgZm9ybXMgZm9yIHRhc2tzLlxyXG4gKi9cclxudmFyIEZvcm1zID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgRm9ybUNvbXBvbmVudHMgPSByZXF1aXJlKFwiLi9mb3JtLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIEFuc3dlckZvcm0gPSBGb3JtQ29tcG9uZW50cy5BbnN3ZXJGb3JtO1xyXG4gIHZhciBOdW1JbnB1dCA9IEZvcm1Db21wb25lbnRzLk51bUlucHV0O1xyXG5cclxuICB2YXIgZm9ybXMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogRm9ybSB3aXRoIGEgc2luZ2xlIG51bWJlciBpbnB1dC5cclxuICAgKi9cclxuICBmb3Jtcy5TaW5nbGVOdW1iZXJGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU2luZ2xlTnVtYmVyRm9ybScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uQW5zd2VyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSB0aGlzLnByb3BzLm9uQW5zd2VyKHRoaXMucmVmcy5hbnN3ZXIudmFsdWUoKSk7XHJcbiAgICAgIGlmIChpc0NvcnJlY3QpIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMucmVmcy5mb3JtLmhhbmRsZUluY29ycmVjdEFuc3dlcigpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZWZzLmZvcm0ucmVzZXQoKTtcclxuICAgICAgdGhpcy5yZWZzLmFuc3dlci5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgICBBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBjbGFzc05hbWU6XCJmb3JtLWhvcml6b250YWxcIiwgb25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9LCBcclxuICAgICAgICAgIE51bUlucHV0KCB7cmVmOlwiYW5zd2VyXCIsIHBsYWNlaG9sZGVyOlwiVmFzdGFhIHTDpGjDpG5cIn0pXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcm0gd2l0aCB0d28gaW5wdXRzIGZvciB4IGFuZCB5IGNvb3JkaW5hdGVzLlxyXG4gICAqL1xyXG4gIGZvcm1zLkNvb3Jkc0Fuc3dlckZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb29yZHNBbnN3ZXJGb3JtJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGlzQ29ycmVjdCA9IHRoaXMucHJvcHMub25BbnN3ZXIodGhpcy5yZWZzLngudmFsdWUoKSwgdGhpcy5yZWZzLnkudmFsdWUoKSk7XHJcbiAgICAgIGlmIChpc0NvcnJlY3QpIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMucmVmcy5mb3JtLmhhbmRsZUluY29ycmVjdEFuc3dlcigpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZWZzLmZvcm0ucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIEFuc3dlckZvcm0oIHtyZWY6XCJmb3JtXCIsIGNsYXNzTmFtZTpcImZvcm0taG9yaXpvbnRhbFwiLCBvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0sIFxyXG4gICAgICAgICAgTnVtSW5wdXQoIHtyZWY6XCJ4XCIsIHBsYWNlaG9sZGVyOlwieFwifSksXHJcbiAgICAgICAgICBOdW1JbnB1dCgge3JlZjpcInlcIiwgcGxhY2Vob2xkZXI6XCJ5XCJ9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGZvcm1zO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRm9ybXM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIG1vZHVsZSwgTWF0aEpheCAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29tcG9uZW50cyBmb3IgbWF0aHMgdGFza3MuXHJcbiAqL1xyXG52YXIgTWF0aENvbXBvbmVudHMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBtYXRoQ29tcG9uZW50cyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBSZW5kZXIgTGFUZXggbWF0aHMgbm90YXRpb24gaW50byB3ZWIgZm9udHMgdXNpbmcgTWF0aEpheC5cclxuICAgKi9cclxuICBtYXRoQ29tcG9uZW50cy5NYXRoSmF4ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTWF0aEpheCcsXHJcbiAgICByZXByb2Nlc3M6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgZWxlbSA9IHRoaXMucmVmcy5zY3JpcHQuZ2V0RE9NTm9kZSgpO1xyXG4gICAgICBNYXRoSmF4Lkh1Yi5RdWV1ZShbXCJSZXByb2Nlc3NcIiwgTWF0aEpheC5IdWIsIGVsZW1dKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlcHJvY2VzcygpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlcHJvY2VzcygpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5zY3JpcHQoIHtyZWY6XCJzY3JpcHRcIiwgdHlwZTpcIm1hdGgvdGV4XCJ9LCB0aGlzLnByb3BzLmNoaWxkcmVuKVxyXG4gICAgICAgIClcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIG1hdGhDb21wb25lbnRzO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWF0aENvbXBvbmVudHM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDb21wb25lbnQgZXh0ZW5zaW9ucyBpLmUuIG1peGlucy5cclxuICovXHJcbnZhciBNaXhpbnMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBtaXhpbnMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogUHJvdmlkZXMgYSBzZXRJbnRlcnZhbCBmdW5jdGlvbiB3aGljaCB3aWxsIGdldCBjbGVhbmVkIHVwIHdoZW5cclxuICAgKiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cclxuICAgKi9cclxuICBtaXhpbnMuU2V0SW50ZXJ2YWxNaXhpbiA9IHtcclxuICAgIHNldEludGVydmFsOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMucHVzaChzZXRJbnRlcnZhbC5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJBbGxJbnRlcnZhbHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmludGVydmFscy5tYXAoY2xlYXJJbnRlcnZhbCk7XHJcbiAgICAgIHRoaXMuaW50ZXJ2YWxzID0gW107XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGluaXRpYWxpemVkLiAqL1xyXG4gICAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMgPSBbXTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgZGVzdHJveWVkLiAqL1xyXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNsZWFyQWxsSW50ZXJ2YWxzKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUHJvdmlkZXMgYSBzZXRUaW1lb3V0IGZ1bmN0aW9uIHdoaWNoIHdpbGwgZ2V0IGNsZWFuZWQgdXAgd2hlblxyXG4gICAqIHRoZSBjb21wb25lbnQgaXMgZGVzdHJveWVkLlxyXG4gICAqL1xyXG4gIG1peGlucy5TZXRUaW1lb3V0TWl4aW4gPSB7XHJcbiAgICBzZXRUaW1lb3V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyQWxsVGltZW91dHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnRpbWVvdXRzLm1hcChjbGVhclRpbWVvdXQpO1xyXG4gICAgICB0aGlzLnRpbWVvdXRzID0gW107XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGluaXRpYWxpemVkLiAqL1xyXG4gICAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogSW52b2tlZCB3aGVuIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuICovXHJcbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2xlYXJBbGxUaW1lb3V0cygpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcGx5IENTUyBjbGFzc2VzIGZvciBzZXQgZHVyYXRpb24gLSB1c2VmdWwgZm9yIHNpbmdsZXNob3QgYW5pbWF0aW9ucy5cclxuICAgKi9cclxuICBtaXhpbnMuVHJpZ2dlckFuaW1hdGlvbk1peGluID0ge1xyXG4gICAgYW5pbWF0ZTogZnVuY3Rpb24oZWxlbSwgY2xhc3NOYW1lLCBkdXJhdGlvbikge1xyXG4gICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uIHx8IDEwMDA7XHJcbiAgICAgIGlmICghdGhpcy50aW1lb3V0ICYmIHRoaXMudGltZW91dCAhPT0gMCkge1xyXG4gICAgICAgIGVsZW0uYWRkQ2xhc3MoY2xhc3NOYW1lKTtcclxuICAgICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgZWxlbS5yZW1vdmVDbGFzcyhjbGFzc05hbWUpO1xyXG4gICAgICAgICAgdGhpcy50aW1lb3V0ID0gbnVsbDtcclxuICAgICAgICB9LmJpbmQodGhpcyksIGR1cmF0aW9uKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJldHVybiBtaXhpbnM7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNaXhpbnM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKlxyXG4gKiBDb21tb24gdGFzayBjb21wb25lbnRzLlxyXG4gKi9cclxudmFyIFRhc2tDb21wb25lbnRzID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgTWl4aW5zID0gcmVxdWlyZShcIi4vbWl4aW5zXCIpO1xyXG5cclxuICB2YXIgdGFza0NvbXBvbmVudHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSB3cmFwcGVyIGZvciBCb290c3RyYXAncyBwYW5lbCBjb21wb25lbnQuXHJcbiAgICovXHJcbiAgdGFza0NvbXBvbmVudHMuVGFza1BhbmVsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza1BhbmVsJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgY2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIGNsYXNzTmFtZSA9IFwicGFuZWwgXCIgKyAodGhpcy5wcm9wcy5jbGFzc05hbWUgfHwgXCJwYW5lbC1pbmZvXCIgKTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc05hbWV9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1oZWFkaW5nXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmgzKCB7Y2xhc3NOYW1lOlwicGFuZWwtdGl0bGVcIn0sIHRoaXMucHJvcHMuaGVhZGVyKVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1ib2R5XCJ9LCBcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSB3cmFwcGVyIGZvciBCb290c3RyYXAncyBwcm9ncmVzcyBiYXIgZWxlbWVudC5cclxuICAgKi9cclxuICB0YXNrQ29tcG9uZW50cy5UYXNrUHJvZ3Jlc3NCYXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrUHJvZ3Jlc3NCYXInLFxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG1heDogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgICBub3c6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBzaW5nbGVXaWR0aCA9IE1hdGguY2VpbCgxIC8gdGhpcy5wcm9wcy5tYXggKiAxMDApO1xyXG4gICAgICB2YXIgbGVmdFN0eWxlID0ge3dpZHRoOiBzaW5nbGVXaWR0aCAqICh0aGlzLnByb3BzLm5vdyAtIDEpICsgXCIlXCJ9O1xyXG4gICAgICB2YXIgcmlnaHRTdHlsZSA9IHt3aWR0aDogc2luZ2xlV2lkdGggKiAodGhpcy5wcm9wcy5tYXggLSB0aGlzLnByb3BzLm5vdyArIDEpICsgXCIlXCJ9O1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmUgdGFzay1wcm9ncmVzcy1iYXJcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzLWJhciBwcm9ncmVzcy1iYXItc3VjY2Vzc1wiLCBzdHlsZTpsZWZ0U3R5bGV9KSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcy1iYXIgcHJvZ3Jlc3MtYmFyLXdhcm5pbmdcIiwgc3R5bGU6cmlnaHRTdHlsZX0pXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBIHRpbWVyIHRoYXQgY291bnRzIGRvd24gZnJvbSBhIHNwZWNpZmllZCB0aW1lIGFuZCB0cmlnZ2VycyBhbiBldmVudFxyXG4gICAqIHdoZW4gZmluaXNoZWQuIEVsYXBzZWQgdGltZSBpcyBkaXNwbGF5ZWQgaW4gYSBwcm9ncmVzcyBiYXIuXHJcbiAgICovXHJcbiAgdGFza0NvbXBvbmVudHMuVGFza0NvdW50ZG93blRpbWVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza0NvdW50ZG93blRpbWVyJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgdGltZTogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgICBzdGFydE9uTW91bnQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgICBvbkV4cGlyeTogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICAgIH0sXHJcblxyXG4gICAgbWl4aW5zOiBbTWl4aW5zLlNldEludGVydmFsTWl4aW5dLFxyXG5cclxuICAgIHN0YXJ0Q291bnRkb3duOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdGltZUxlZnQ6IHRoaXMucHJvcHMudGltZVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHRoaXMuc2V0SW50ZXJ2YWwodGhpcy50aWNrLCAxMDAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgdGljazogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciB0aW1lTGVmdCA9IHRoaXMuc3RhdGUudGltZUxlZnQgLSAxO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdGltZUxlZnQ6IHRpbWVMZWZ0XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coXCJ0aW1lTGVmdFwiLCB0aGlzLnN0YXRlLnRpbWVMZWZ0KTtcclxuXHJcbiAgICAgIGlmICh0aW1lTGVmdCA8IDEpIHtcclxuICAgICAgICB0aGlzLmNsZWFyQWxsSW50ZXJ2YWxzKCk7XHJcbiAgICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uRXhwaXJ5KSkgdGhpcy5wcm9wcy5vbkV4cGlyeSgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMucHJvcHMuc3RhcnRPbk1vdW50KSB0aGlzLnN0YXJ0Q291bnRkb3duKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdGltZUxlZnQ6IHRoaXMucHJvcHMudGltZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBzaW5nbGVXaWR0aCA9IE1hdGguY2VpbCgxIC8gdGhpcy5wcm9wcy50aW1lICogMTAwKTtcclxuICAgICAgdmFyIHdpZHRoID0gTWF0aC5jZWlsKDEgLyB0aGlzLnByb3BzLnRpbWUgKiAxMDAgKiB0aGlzLnN0YXRlLnRpbWVMZWZ0KTtcclxuICAgICAgdmFyIGJhclN0eWxlID0ge3dpZHRoOiB3aWR0aCArIFwiJVwifTtcclxuXHJcbiAgICAgIHZhciBiYXJDbGFzcyA9IFJlYWN0LmFkZG9ucy5jbGFzc1NldCh7XHJcbiAgICAgICAgXCJwcm9ncmVzcy1iYXItc3VjY2Vzc1wiOiB3aWR0aCA+PSA0MCxcclxuICAgICAgICBcInByb2dyZXNzLWJhci13YXJuaW5nXCI6IHdpZHRoIDwgNDAgJiYgd2lkdGggPiAyMCxcclxuICAgICAgICBcInByb2dyZXNzLWJhci1kYW5nZXJcIjogd2lkdGggPD0gMjAsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmUgdGFzay1wcm9ncmVzcy1iYXJcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzLWJhciBcIiArIGJhckNsYXNzLCBzdHlsZTpiYXJTdHlsZX0pXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBUYXNrIGhlYWRlciwgZGlzcGxheXMgdGFzayBuYW1lLlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrSGVhZGVyJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgbmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1oZWFkZXIgcm93XCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tN1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMihudWxsLCB0aGlzLnByb3BzLm5hbWUpXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01XCJ9LCBcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGVsZW1lbnQgdGhhdCBpcyBzaG93biBhZnRlciBhIGNvbXBsZXRlZCB0YXNrLlxyXG4gICAqL1xyXG4gIHRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tEb25lRGlzcGxheScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHNjb3JlOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHNjb3JlID0gdGhpcy5wcm9wcy5zY29yZSB8fCAwO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1kb25lLWRpc3BsYXkgYW5pbWF0ZSBib3VuY2UtaW5cIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiVGVodMOkdsOkIHN1b3JpdGV0dHUhXCIpLCBcIiBQaXN0ZWl0w6Q6IFwiLCBzY29yZVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRhc2tDb21wb25lbnRzO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGFza0NvbXBvbmVudHM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQSBzaW1wbGUgaW50ZWdlciBhZGRpdGlvbiB0YXNrLlxyXG4gKi9cclxudmFyIEFkZGl0aW9uVGFzayA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIFRhc2tVdGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy90YXNrLXV0aWxzXCIpO1xyXG4gIHZhciBTaW5nbGVOdW1iZXJGb3JtID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvZm9ybXNcIikuU2luZ2xlTnVtYmVyRm9ybTtcclxuICB2YXIgTWF0aENvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9tYXRoLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzXCIpO1xyXG5cclxuXHJcbiAgdmFyIGFkZGl0aW9uVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ2FkZGl0aW9uVGFzaycsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXBzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlc2V0IHRoZSBxdWVzdGlvbi4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGEsIGI7XHJcbiAgICAgIGRvIHtcclxuICAgICAgICBhID0gVGFza1V0aWxzLnJhbmRSYW5nZSgxLCAxMSk7XHJcbiAgICAgICAgYiA9IFRhc2tVdGlscy5yYW5kUmFuZ2UoMSwgMTEpO1xyXG4gICAgICB9XHJcbiAgICAgIHdoaWxlIChUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKFthLGJdLCBbdGhpcy5zdGF0ZS5hLCB0aGlzLnN0YXRlLmJdKSk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIGE6IGEsXHJcbiAgICAgICAgYjogYixcclxuICAgICAgICBhbnN3ZXI6IGEgKyBiXHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2hlY2sgaWYgY29ycmVjdC4gKi9cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oYW5zd2VyKSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSBUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKGFuc3dlciwgdGhpcy5zdGF0ZS5hbnN3ZXIpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KVxyXG4gICAgICAgIHRoaXMuaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG5cclxuICAgICAgcmV0dXJuIGlzQ29ycmVjdDtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzdGVwID0gdGhpcy5zdGF0ZS5zdGVwO1xyXG4gICAgICBpZiAoc3RlcCA9PT0gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcykpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblRhc2tEb25lKCk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c3RlcDogc3RlcCArIDF9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMSxcclxuICAgICAgICBhbnN3ZXI6IG51bGxcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrUHJvZ3Jlc3NCYXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBNYXRoSmF4ID0gTWF0aENvbXBvbmVudHMuTWF0aEpheDtcclxuXHJcbiAgICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcyk7XHJcbiAgICAgIHZhciBxdWVzdGlvbiwgc2lkZWJhcjtcclxuXHJcbiAgICAgIGlmICghdGFza0lzRG9uZSkge1xyXG4gICAgICAgIHZhciBxdWVzdGlvbkNvbnRlbnQgPSB0aGlzLnN0YXRlLmEgKyBcIiArIFwiICsgdGhpcy5zdGF0ZS5iICsgXCIgPSA/XCI7XHJcbiAgICAgICAgcXVlc3Rpb24gPSAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGV4dC1jZW50ZXJcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDEobnVsbCwgXHJcbiAgICAgICAgICAgICAgTWF0aEpheChudWxsLCBxdWVzdGlvbkNvbnRlbnQpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcIk1pa8OkIG9uIHlodGVlbmxhc2t1biB0dWxvcz9cIilcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiVmFzdGF1c1wiLCBjbGFzc05hbWU6XCJwYW5lbC1zdWNjZXNzIHBhbmVsLWV4dHJhLXBhZGRpbmdcIn0sIFxyXG4gICAgICAgICAgICAgIFNpbmdsZU51bWJlckZvcm0oIHtvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0gKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBxdWVzdGlvbiA9IFRhc2tEb25lRGlzcGxheSgge3Njb3JlOjEwfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFRhc2tIZWFkZXIoIHtuYW1lOlwiWWh0ZWVubGFza3VcIn0sIFxyXG4gICAgICAgICAgICBUYXNrUHJvZ3Jlc3NCYXIoIHtub3c6dGhpcy5zdGF0ZS5zdGVwLCBtYXg6dGhpcy5wcm9wcy5zdGVwc30pXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBxdWVzdGlvblwifSwgXHJcbiAgICAgICAgICAgICAgcXVlc3Rpb25cclxuICAgICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNSBjb2wtc20tb2Zmc2V0LTFcIn0sIFxyXG4gICAgICAgICAgICAgIHNpZGViYXJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGFkZGl0aW9uVGFzaztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFkZGl0aW9uVGFzaztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgZDMsIG1vZHVsZSwgcmVxdWlyZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogRGV0ZWN0IGFzIG1hbnkgc2hhcGVzIGFzIHlvdSBjYW4gaW4gNjAgc2Vjb25kcy5cclxuICovXHJcbnZhciBCYXNpY1NoYXBlc1Rhc2sgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxuICB2YXIgVGFza0NvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIENvb3JkcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Nvb3Jkc1wiKTtcclxuICB2YXIgTWl4aW5zID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvbWl4aW5zXCIpO1xyXG5cclxuICB2YXIgYmFzaWNTaGFwZXNUYXNrID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnYmFzaWNTaGFwZXNUYXNrJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25UYXNrRG9uZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgICAgdGltZTogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIG1peGluczogW01peGlucy5UcmlnZ2VyQW5pbWF0aW9uTWl4aW4sIE1peGlucy5TZXRUaW1lb3V0TWl4aW5dLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiBzaXggZGlmZmVyZW50IHNoYXBlcyB0aGF0IGZpbGwgdGhlIGNvb3Jkc1xyXG4gICAgICogaW4gYSByYW5kb20gb3JkZXIuXHJcbiAgICAgKi9cclxuICAgIGdldFJhbmRvbVNoYXBlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBjMSA9IDAuNDYsIGMyID0gMS4yMSwgczEgPSAxLjQzLCBzMiA9IDAuODg1O1xyXG4gICAgICB2YXIgcGVudGFnb25QdHMgPSBbWy1zMiwtYzJdLCBbLXMxLGMxXSwgWzAsMS41XSwgW3MxLGMxXSwgW3MyLC1jMl1dO1xyXG4gICAgICBwZW50YWdvblB0cyA9IFRhc2tVdGlscy50cmFuc2xhdGUocGVudGFnb25QdHMsIDIuNSwgMS41KTtcclxuXHJcbiAgICAgIHZhciB0cmFuc2xhdGVzID0gW1swLDBdLCBbNiwwXSwgWzAsNF0sIFs2LDRdLCBbMCw4XSwgWzYsOF1dO1xyXG4gICAgICB2YXIgYmFzZXMgPSBbXHJcbiAgICAgICAge25hbWU6XCJrb2xtaW9cIiwgcG9pbnRzOltbMSwwXSwgWzEsM10sIFs0LDBdXX0sXHJcbiAgICAgICAge25hbWU6XCJuZWxpw7ZcIiwgcG9pbnRzOltbMSwwXSwgWzEsM10sIFs0LDNdLCBbNCwwXV19LFxyXG4gICAgICAgIHtuYW1lOlwieW1weXLDpFwiLCBwb2ludHM6W1syLjUsMS41XV0sIHI6MS41fSxcclxuICAgICAgICB7bmFtZTpcInN1dW5uaWthc1wiLCBwb2ludHM6W1swLDBdLCBbMC41LDNdLCBbNC41LDNdLCBbNCwwXV19LFxyXG4gICAgICAgIHtuYW1lOlwicHVvbGlzdXVubmlrYXNcIiwgcG9pbnRzOltbMCwwXSwgWzAuNSwzXSwgWzQsM10sIFs0LjUsMF1dfSxcclxuICAgICAgICB7bmFtZTpcInZpaXNpa3VsbWlvXCIsIHBvaW50czpwZW50YWdvblB0c31cclxuICAgICAgXTtcclxuXHJcbiAgICAgIGJhc2VzID0gVGFza1V0aWxzLnNodWZmbGUoYmFzZXMpO1xyXG4gICAgICB2YXIgY2xycyA9IGQzLnNjYWxlLmNhdGVnb3J5MTAoKTtcclxuXHJcbiAgICAgIHZhciBzaGFwZXMgPSBiYXNlcy5tYXAoZnVuY3Rpb24oYmFzZSwgaSkge1xyXG4gICAgICAgIHZhciB0cmFuc2xhdGVYID0gdHJhbnNsYXRlc1tpXVswXSArIE1hdGgucmFuZG9tKCk7XHJcbiAgICAgICAgdmFyIHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGVzW2ldWzFdICsgTWF0aC5yYW5kb20oKTtcclxuICAgICAgICBiYXNlLnBvaW50cyA9IFRhc2tVdGlscy50cmFuc2xhdGUoYmFzZS5wb2ludHMsIHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVkpO1xyXG4gICAgICAgIGJhc2Uua2V5ID0gaTtcclxuICAgICAgICBiYXNlLm9uQ2xpY2sgPSB0aGlzLmhhbmRsZVNoYXBlQ2xpY2s7XHJcbiAgICAgICAgYmFzZS5zdHJva2UgPSBcImJsYWNrXCI7XHJcbiAgICAgICAgYmFzZS5maWxsID0gY2xycyhUYXNrVXRpbHMucmFuZCg5KSk7XHJcbiAgICAgICAgcmV0dXJuIGJhc2U7XHJcbiAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICByZXR1cm4gc2hhcGVzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVzZXQgdGhlIHF1ZXN0aW9uLCBpLmUuIGdlbmVyYXRlIG5ldyBzaGFwZXMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzaGFwZXMgPSB0aGlzLmdldFJhbmRvbVNoYXBlcygpO1xyXG5cclxuICAgICAgLy8gUHJldmVudCBhc2tpbmcgZm9yIHRoZSBzYW1lIHNoYXBlIHR3aWNlIGluIGEgcm93LlxyXG4gICAgICB2YXIgcG9zc2libGVUYXJnZXRzID0gc2hhcGVzO1xyXG4gICAgICBpZiAodGhpcy5zdGF0ZS50YXJnZXQpIHtcclxuICAgICAgICBwb3NzaWJsZVRhcmdldHMgPSBwb3NzaWJsZVRhcmdldHMuZmlsdGVyKGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgICAgICByZXR1cm4gc2hhcGUubmFtZSAhPT0gdGhpcy5zdGF0ZS50YXJnZXQubmFtZTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciB0YXJnZXQgPSBwb3NzaWJsZVRhcmdldHNbVGFza1V0aWxzLnJhbmQocG9zc2libGVUYXJnZXRzLmxlbmd0aCldO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgc2hhcGVzOiB0aGlzLmdldFJhbmRvbVNoYXBlcygpLFxyXG4gICAgICAgIHRhcmdldDogdGFyZ2V0XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVTdGFydEJ0bkNsaWNrOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNSdW5uaW5nOiB0cnVlLCBzY29yZTogMH0pO1xyXG4gICAgICB0aGlzLnJlZnMudGltZXIuc3RhcnRDb3VudGRvd24oKTtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2hlY2sgaWYgY29ycmVjdCBzaGFwZSBhbmQgcHJvY2VlZC4gKi9cclxuICAgIGhhbmRsZVNoYXBlQ2xpY2s6IGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgIHZhciBzY29yZUluY3JlbWVudDtcclxuICAgICAgaWYgKHNoYXBlLm5hbWUgPT09IHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWUpIHtcclxuICAgICAgICBzY29yZUluY3JlbWVudCA9IDE7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2NvcmVJbmNyZW1lbnQgPSAtMTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGVsZW0gPSAkKHRoaXMucmVmcy5zY29yZS5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB2YXIgYW5pbSA9IHNjb3JlSW5jcmVtZW50ID4gMCA/IFwicHVsc2VcIiA6IFwic2hha2VcIjtcclxuICAgICAgdGhpcy5hbmltYXRlKGVsZW0sIGFuaW0sIDEwMDApO1xyXG5cclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3Njb3JlOiBNYXRoLm1heCh0aGlzLnN0YXRlLnNjb3JlICsgc2NvcmVJbmNyZW1lbnQsIDApfSk7XHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFRhc2sgZmluaXNoZXMgKGFmdGVyIGEgc21hbGwgdGltZW91dCBmb3Igc21vb3RobmVzcykgd2hlbiB0aW1lciBleHBpcmVzLiAqL1xyXG4gICAgaGFuZGxlVGltZXJFeHBpcnk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGlzRmluaXNoZWQ6IHRydWUgfSk7XHJcbiAgICAgIH0uYmluZCh0aGlzKSwgNTAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICAgIHNjb3JlOiAwLFxyXG4gICAgICAgIGlzUnVubmluZzogZmFsc2UsXHJcbiAgICAgICAgaXNGaW5pc2hlZDogZmFsc2VcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBUYXNrQ291bnRkb3duVGltZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrQ291bnRkb3duVGltZXI7XHJcblxyXG4gICAgICB2YXIgc2hhcGVzID0gdGhpcy5zdGF0ZS5zaGFwZXM7XHJcbiAgICAgIHZhciBxdWVzdGlvbiwgc2lkZWJhciwgdGltZXI7XHJcblxyXG4gICAgICBpZiAoIXRoaXMuc3RhdGUuaXNGaW5pc2hlZCkge1xyXG4gICAgICAgIHZhciBib3VuZHMgPSB7bWF4WTogMTIsIG1heFg6IDEyLCBtaW5ZOiAwLCBtaW5YOiAwfTtcclxuXHJcbiAgICAgICAgcXVlc3Rpb24gPSBDb29yZHMoIHtkcmF3QXhlczpmYWxzZSwgc2hhcGVzOnNoYXBlcywgYm91bmRzOmJvdW5kcywgYXNwZWN0OjF9ICk7XHJcblxyXG4gICAgICAgIHZhciBzaGFwZVRvRmluZCA9IFwia29sbWlvXCI7XHJcblxyXG4gICAgICAgIHZhciBzdGFydEJ0biA9IHRoaXMuc3RhdGUuaXNSdW5uaW5nID8gbnVsbCA6IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImFuaW1hdGVkIGFuaW1hdGVkLXJlcGVhdCBib3VuY2UgYnRuIGJ0bi1wcmltYXJ5IGJ0bi1ibG9ja1wiLCBvbkNsaWNrOnRoaXMuaGFuZGxlU3RhcnRCdG5DbGlja30sIFxuICAgICAgICAgICAgICBcIkFsb2l0YSBwZWxpXCJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0RGlzcGxheSA9ICF0aGlzLnN0YXRlLnRhcmdldCA/IG51bGwgOiAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiYW5pbWF0ZWQgYm91bmNlLWluXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxuICAgICAgICAgICAgXCJLbGlrYXR0YXZhIGthcHBhbGU6IFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWUpLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtyZWY6XCJzY29yZVwiLCBjbGFzc05hbWU6XCJhbmltYXRlZCB0ZXh0LWNlbnRlclwifSwgXG4gICAgICAgICAgICAgIFwiUGlzdGVldDogXCIsIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwibGFiZWwgbGFiZWwtd2FybmluZ1wifSwgdGhpcy5zdGF0ZS5zY29yZSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHNpZGViYXIgPSAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxuICAgICAgICAgICAgICBcIkV0c2kga29vcmRpbmFhdGlzdG9zdGEgbcOkw6Ryw6R0dHkgdGFzb2t1dmlvIGphIGtsaWtrYWEgc2l0w6QuXCIsUmVhY3QuRE9NLmJyKG51bGwpLFxuICAgICAgICAgICAgICBcIlNpbnVsbGEgb24gXCIsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgdGhpcy5wcm9wcy50aW1lLCBcIiBzZWt1bnRpYVwiKSwgXCIgYWlrYWEuXCIsXG4gICAgICAgICAgICAgIHN0YXJ0QnRuLFxyXG4gICAgICAgICAgICAgIHRhcmdldERpc3BsYXlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcXVlc3Rpb24gPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZTp0aGlzLnN0YXRlLnNjb3JlfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFRhc2tIZWFkZXIoIHtuYW1lOlwiS2FwcGFsZWlkZW4gdHVubmlzdGFtaW5lblwifSwgXHJcbiAgICAgICAgICAgIFRhc2tDb3VudGRvd25UaW1lcigge3JlZjpcInRpbWVyXCIsIHRpbWU6dGhpcy5wcm9wcy50aW1lLCBvbkV4cGlyeTp0aGlzLmhhbmRsZVRpbWVyRXhwaXJ5fSlcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgICBxdWVzdGlvblxyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gYmFzaWNTaGFwZXNUYXNrO1xyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYXNpY1NoYXBlc1Rhc2s7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogUmVhZCBwb3NpdGlvbnMgZnJvbSBhIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gKi9cclxudmFyIFNpbXBsZUNvb3Jkc1Rhc2sgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxuICB2YXIgVGFza0NvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIENvb3JkcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Nvb3Jkc1wiKTtcclxuICB2YXIgRm9ybXMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9mb3Jtc1wiKTtcclxuXHJcblxyXG4gIHZhciBzaW1wbGVDb29yZHNUYXNrID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnc2ltcGxlQ29vcmRzVGFzaycsXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgc3RlcHM6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgb25UYXNrRG9uZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVzZXQgdGhlIHF1ZXN0aW9uLCBpLmUuIGdlbmVyYXRlIGEgbmV3IHJhbmRvbSBwb2ludC4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIG5ld1BvaW50O1xyXG4gICAgICBkbyB7IG5ld1BvaW50ID0gW1Rhc2tVdGlscy5yYW5kUmFuZ2UoMCwgMTApLCBUYXNrVXRpbHMucmFuZFJhbmdlKDAsIDEwKV07IH1cclxuICAgICAgd2hpbGUgKFRhc2tVdGlscy5tYXRjaGVzU29sdXRpb24obmV3UG9pbnQsIHRoaXMuc3RhdGUucG9pbnQpKTtcclxuXHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3BvaW50OiBuZXdQb2ludH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2hlY2sgaWYgY29ycmVjdC4gKi9cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICB2YXIgaXNDb3JyZWN0ID0gVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihbeCwgeV0sIHRoaXMuc3RhdGUucG9pbnQpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KVxyXG4gICAgICAgIHRoaXMuaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG5cclxuICAgICAgcmV0dXJuIGlzQ29ycmVjdDtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzdGVwID0gdGhpcy5zdGF0ZS5zdGVwO1xyXG4gICAgICBpZiAoc3RlcCA9PT0gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcykpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblRhc2tEb25lKCk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c3RlcDogc3RlcCArIDF9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMSxcclxuICAgICAgICBwb2ludDogbnVsbFxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBUYXNrUGFuZWwgPSBUYXNrQ29tcG9uZW50cy5UYXNrUGFuZWw7XHJcbiAgICAgIHZhciBUYXNrSGVhZGVyID0gVGFza0NvbXBvbmVudHMuVGFza0hlYWRlcjtcclxuICAgICAgdmFyIFRhc2tQcm9ncmVzc0JhciA9IFRhc2tDb21wb25lbnRzLlRhc2tQcm9ncmVzc0JhcjtcclxuICAgICAgdmFyIFRhc2tEb25lRGlzcGxheSA9IFRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheTtcclxuICAgICAgdmFyIENvb3Jkc0Fuc3dlckZvcm0gPSBGb3Jtcy5Db29yZHNBbnN3ZXJGb3JtO1xyXG5cclxuICAgICAgdmFyIHBvaW50ID0gdGhpcy5zdGF0ZS5wb2ludDtcclxuICAgICAgdmFyIHRhc2tJc0RvbmUgPSB0aGlzLnN0YXRlLnN0ZXAgPiBwYXJzZUludCh0aGlzLnByb3BzLnN0ZXBzKTtcclxuICAgICAgdmFyIGNvb3Jkcywgc2lkZWJhcjtcclxuXHJcbiAgICAgIGlmIChwb2ludCAmJiAhdGFza0lzRG9uZSkge1xyXG4gICAgICAgIHZhciBib3VuZHMgPSB7bWF4WTogMTAsIG1heFg6IDEwLCBtaW5ZOiAtMiwgbWluWDogLTJ9O1xyXG4gICAgICAgIHZhciBzaGFwZXMgPSBbe3BvaW50czogW3BvaW50XSwgcjowLjIsIHN0cm9rZVdpZHRoOiAzLCBzdHJva2U6IFwiI0ZGNUIyNFwiLCBmaWxsOlwiI0ZEMDAwMFwifV07XHJcblxyXG4gICAgICAgIGNvb3JkcyA9IENvb3Jkcygge3NoYXBlczpzaGFwZXMsIGJvdW5kczpib3VuZHMsIGFzcGVjdDoxfSApO1xyXG5cclxuICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcIk1pdGvDpCBvdmF0IHBpc3RlZW4geC1qYSB5LWtvb3JkaW5hYXRpdD9cIilcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiVmFzdGF1c1wiLCBjbGFzc05hbWU6XCJwYW5lbC1zdWNjZXNzIHBhbmVsLWV4dHJhLXBhZGRpbmdcIn0sIFxyXG4gICAgICAgICAgICAgIENvb3Jkc0Fuc3dlckZvcm0oIHtyZWY6XCJmb3JtXCIsIG9uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKHRhc2tJc0RvbmUpIHtcclxuICAgICAgICBjb29yZHMgPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZToxMH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIktvb3JkaW5hYXRpc3RvbiBsdWtlbWluZW5cIn0sIFxyXG4gICAgICAgICAgICBUYXNrUHJvZ3Jlc3NCYXIoIHtub3c6dGhpcy5zdGF0ZS5zdGVwLCBtYXg6dGhpcy5wcm9wcy5zdGVwc30pXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBxdWVzdGlvblwifSwgXHJcbiAgICAgICAgICAgICAgY29vcmRzXHJcbiAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTUgY29sLXNtLW9mZnNldC0xXCJ9LCBcclxuICAgICAgICAgICAgICBzaWRlYmFyXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBzaW1wbGVDb29yZHNUYXNrO1xyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGVDb29yZHNUYXNrO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuLyogZ2xvYmFsIG1vZHVsZSAqL1xyXG5cclxuLyoqXHJcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIChtYWlubHkgbWF0aHMgcmVsYXRlZCkgZm9yIHRhc2tzLlxyXG4gKi9cclxudmFyIFRhc2tVdGlscyA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgaW4gcmFuZ2UgW21pbiwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1pbiAgIEluY2x1c2l2ZSBsb3dlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7KG51bWJlcnxbbnVtYmVyXSl9IEEgc2luZ2xlIG9yIG11bHRpcGxlIHJhbmRvbSBpbnRzLlxyXG4gICAgICovXHJcbiAgICByYW5kUmFuZ2U6IGZ1bmN0aW9uKG1pbiwgbWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmRSYW5nZShtaW4sIG1heCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByYW5kcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pbjtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBpbiByYW5nZSBbMCwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfFtudW1iZXJdfSBBIHNpbmdsZSBvciBtdWx0aXBsZSByYW5kb20gaW50cy5cclxuICAgICAqL1xyXG4gICAgcmFuZDogZnVuY3Rpb24obWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmQobWF4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJhbmRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKiBSZW9yZGVycyBnaXZlbiBhcnJheSByYW5kb21seSwgZG9lc24ndCBtb2RpZnkgb3JpZ2luYWwgYXJyYXkuICovXHJcbiAgICBzaHVmZmxlOiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgY2xvbmUgPSBhcnIuc2xpY2UoKTtcclxuICAgICAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGNsb25lLmxlbmd0aDsgaSA+IDA7IGktLSkge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnJhbmQoaSk7XHJcbiAgICAgICAgICAgIHNodWZmbGVkLnB1c2goY2xvbmUuc3BsaWNlKGluZGV4LCAxKVswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2h1ZmZsZWQ7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZ2Ugb2YgaW50ZWdlcnMuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gIG1pbiAgSW5jbHVzaXZlIGxvd2VyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9ICBtYXggIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gc3RlcCBPcHRpb25hbCBpbmNyZW1lbnQgdmFsdWUsIGRlZmF1bHRzIHRvIDEuXHJcbiAgICAgKiBAcmV0dXJuIHtbbnVtYmVyXX0gICAgVGhlIHNwZWNpZmllZCByYW5nZSBvZiBudW1iZXJzIGluIGFuIGFycmF5LlxyXG4gICAgICovXHJcbiAgICByYW5nZTogZnVuY3Rpb24obWluLCBtYXgsIHN0ZXApIHtcclxuICAgICAgICBzdGVwID0gc3RlcCB8fCAxO1xyXG4gICAgICAgIHZhciByZXMgPSBbXTtcclxuICAgICAgICBpZiAoc3RlcCA+IDApIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IG1pbjsgaSA8IG1heDsgaSArPSBzdGVwKSB7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaChpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSBtaW47IGogPiBtYXg7IGogKz0gc3RlcCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2goaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIHdoZXRoZXIgYXJyYXlzIGVxdWFsLlxyXG4gICAgICogQHBhcmFtICBhcnIxXHJcbiAgICAgKiBAcGFyYW0gIGFycjJcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGFycmF5c0VxdWFsOiBmdW5jdGlvbihhcnIxLCBhcnIyKSB7XHJcbiAgICAgICAgaWYgKGFycjEubGVuZ3RoICE9PSBhcnIyLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICByZXR1cm4gYXJyMS5ldmVyeShmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkID09PSBhcnIyW2ldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFuc2xhdGUgYW4gYXJyYXkgb2YgcG9pbnRzIGJ5IGdpdmVuIHggYW5kIHkgdmFsdWVzLlxyXG4gICAgICogQHBhcmFtICB7W1tudW1iZXJdXX0gcG9pbnRzXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICB4XHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICB5XHJcbiAgICAgKiBAcmV0dXJuIHtbW251bWJlcl1dfVxyXG4gICAgICovXHJcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHBvaW50cywgeCwgeSkge1xyXG4gICAgICAgIHJldHVybiBwb2ludHMubWFwKGZ1bmN0aW9uKHBvaW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbcG9pbnRbMF0gKyB4LCBwb2ludFsxXSArIHldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb21wYXJlIGdpdmVuIGFuc3dlciB0byB0aGUgY29ycmVjdCBzb2x1dGlvbi4gU3VwcG9ydHMgdmFyaW91cyBkYXRhIHR5cGVzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBhbnN3ZXJcclxuICAgICAqIEBwYXJhbSBzb2x1dGlvbiBBIHN0cmluZywgbnVtYmVyLCBhcnJheSwgb2JqZWN0IG9yIFJlZ0V4cC5cclxuICAgICAqIEBwYXJhbSBlcHNpbG9uICBPcHRpb25hbCBtYXggZXJyb3IgdmFsdWUgZm9yIGZsb2F0IGNvbXBhcmlzb24sIGRlZmF1bHQgaXMgMC4wMDEuXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGNvcnJlY3QsIG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgbWF0Y2hlc1NvbHV0aW9uOiBmdW5jdGlvbihhbnN3ZXIsIHNvbHV0aW9uLCBlcHNpbG9uKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhbnN3ZXIgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLnRyaW0oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc29sdXRpb24gPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgYW5zd2VyID0gcGFyc2VGbG9hdChhbnN3ZXIpO1xyXG4gICAgICAgICAgICBpZiAoaXNOYU4oYW5zd2VyKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBlcHNpbG9uID0gZXBzaWxvbiA9PT0gdW5kZWZpbmVkID8gMC4wMDEgOiBlcHNpbG9uO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguYWJzKGFuc3dlciAtIHNvbHV0aW9uKSA8PSBlcHNpbG9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzb2x1dGlvbi50ZXN0KGFuc3dlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGlmICghYW5zd2VyIGluc3RhbmNlb2YgQXJyYXkgfHwgYW5zd2VyLmxlbmd0aCAhPT0gc29sdXRpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFuc3dlci5ldmVyeShmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5tYXRjaGVzU29sdXRpb24oZCwgc29sdXRpb25baV0sIGVwc2lsb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICBpZiAoIWFuc3dlciBpbnN0YW5jZW9mIE9iamVjdClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBhbnNLZXlzID0gT2JqZWN0LmtleXMoYW5zd2VyKTtcclxuICAgICAgICAgICAgaWYgKGFuc0tleXMubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhzb2x1dGlvbikubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFuc0tleXMuZXZlcnkoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQubWF0Y2hlc1NvbHV0aW9uKGFuc3dlcltkXSwgc29sdXRpb25bZF0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhbnN3ZXIgPT09IHNvbHV0aW9uO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUYXNrVXRpbHM7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIEFwcGxpY2F0aW9uID0gcmVxdWlyZShcIi4vanMvYXBwbGljYXRpb24uanNcIik7XHJcblxyXG4gICAgUmVhY3QucmVuZGVyQ29tcG9uZW50KFxyXG4gICAgICAgIEFwcGxpY2F0aW9uKG51bGwgKSxcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcGxpY2F0aW9uXCIpXHJcbiAgICApO1xyXG59KTtcclxuLyoganNoaW50IGlnbm9yZTplbmQgKi8iXX0=
