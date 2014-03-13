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
    return {selectedTask: "Yhteenlasku"};
  },

  render: function() {
    /* jshint ignore:start */
    var tasks = {
      "Yhteenlasku": AdditionTask( {onTaskDone:this.handleTaskDone}),
      "Koordinaatiston lukeminen": SimpleCoordsTask( {onTaskDone:this.handleTaskDone, steps:5}),
      "Kappaleiden tunnistaminen": BasicShapesTask( {onTaskDone:this.handleTaskDone})
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
   * A form that disables submitting when contents are invalid.
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
      var children = this.props.children.map(function(child) {
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
   * An <input> with validation states.
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
      this.setValueAndValidity(0, true);
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

  var my = {};

  /**
   * An answer form with inputs for x and y coordinates.
   */
  my.CoordsAnswerForm = React.createClass({displayName: 'CoordsAnswerForm',

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

  return my;
})();


module.exports = Forms;

},{"./form-components":3}],5:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module, MathJax */
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
      console.log(elem);
      MathJax.Hub.Queue(["Reprocess", MathJax.Hub, elem]);
    },

    componentDidMount: function() {
      this.reprocess();
    },

    componentWillReceiveProps: function() {
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

  var my = {};

  /**
   * A wrapper for Bootstrap's panel component.
   */
  my.TaskPanel = React.createClass({displayName: 'TaskPanel',

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
  my.TaskProgressBar = React.createClass({displayName: 'TaskProgressBar',
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
   * Task header with task name and an optional step counter.
   */
  my.TaskHeader = React.createClass({displayName: 'TaskHeader',

    propTypes: {
      name: React.PropTypes.string.isRequired,
      step: React.PropTypes.number,
      steps: React.PropTypes.number
    },

    render: function() {
      /* jshint ignore:start */
      var stepCounter;
      if (this.props.step && this.props.steps) {
        var TaskProgressBar = my.TaskProgressBar;
        stepCounter = TaskProgressBar( {max:this.props.steps, now:this.props.step});
      }

      return (
        React.DOM.div( {className:"task-header row"}, 
          React.DOM.div( {className:"col-sm-7"}, 
            React.DOM.h2(null, this.props.name)
          ),
          React.DOM.div( {className:"col-sm-5"}, 
            stepCounter
          )
        )
      );
      /* jshint ignore:end */
    }
  });


  /**
   * An element that is shown after a completed task.
   */
  my.TaskDoneDisplay = React.createClass({displayName: 'TaskDoneDisplay',

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

  return my;
})();


module.exports = TaskComponents;
},{}],8:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * A simple integer addition task.
 */
var AdditionTask = (function() {

  var MathComponents = require("../components/math-components.js");
  var TaskComponents = require("../components/task-components.js");


  var additionTask = React.createClass({displayName: 'additionTask',

    handleInputChange: function(e) {
      this.setState({
        formula: e.target.value
      });
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
      var TaskDoneDisplay = TaskComponents.TaskDoneDisplay;

      var taskIsDone = this.state.step > parseInt(this.props.steps);
      var question, sidebar;

      if (!taskIsDone) {
        question = React.DOM.div(null, "Kysymys");

        sidebar = (
          React.DOM.div(null, 
            TaskPanel( {header:"Ohjeet"}, 
              React.DOM.span(null, "Mikä on yhteenlaskun tulos?")
            ),
            TaskPanel( {header:"Vastaus", className:"panel-success panel-extra-padding"}, 
              "vastauslomake tähän"
            )
          )
        );
      }
      else {
        question = TaskDoneDisplay( {score:10});
      }

      return (
        React.DOM.div(null, 
          TaskHeader( {name:"Yhteenlasku", step:this.state.step, steps:this.props.steps} ),
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

},{"../components/math-components.js":5,"../components/task-components.js":7}],9:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, d3, module, require */
"use strict";

var TaskUtils = require("../utils/task-utils.js");
var TaskComponents = require("../components/task-components.js");
var Coords = require("../components/coords.js");

/**
 * Click the appropriate shape in a coordinate system.
 */
var BasicShapesTask = React.createClass({displayName: 'BasicShapesTask',

  propTypes: {
    onTaskDone: React.PropTypes.func.isRequired
  },

  startGame: function() {
    this.setState({isRunning: true, score: 0});
    this.reset();
  },

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

  /** Check if correct shape and proceed. */
  handleShapeClick: function(shape) {
    var scoreIncrement;
    if (shape.name === this.state.target.name) {
      scoreIncrement = 1;
    } else {
      scoreIncrement = -1;
    }

    this.setState({score: Math.max(this.state.score + scoreIncrement, 0)});
    this.reset();
  },

  handleTaskDone: function() {
    this.props.onTaskDone();
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

    var shapes = this.state.shapes;
    var taskIsDone = this.state.step > parseInt(this.props.steps);
    var coords, sidebar;

    if (!this.state.isFinished) {
      var bounds = {maxY: 12, maxX: 12, minY: 0, minX: 0};

      coords = Coords( {drawAxes:false, shapes:shapes, bounds:bounds, aspect:1} );

      var shapeToFind = "kolmio";

      var startBtn = this.state.isRunning ? null : (
        React.DOM.div(null, 
          React.DOM.hr(null),
          React.DOM.button( {className:"animated animated-repeat bounce btn btn-primary btn-block", onClick:this.startGame}, 
            "Aloita peli"
          )
        )
      );

      var targetDisplay = !this.state.target ? null : (
        React.DOM.div( {className:"animated bounce-in"}, 
          React.DOM.hr(null),
          "Klikattava kappale: ", React.DOM.strong(null, this.state.target.name),
          React.DOM.hr(null),
          "Pisteet: ", this.state.score
        )
      );

      sidebar = (
        React.DOM.div(null, 
          TaskPanel( {header:"Ohjeet"}, 
            "Etsi koordinaatistosta ", React.DOM.strong(null, shapeToFind), " ja klikkaa sitä",
            startBtn,
            targetDisplay
          )
        )
      );
    }
    else if (taskIsDone) {
      coords = TaskDoneDisplay( {score:10});
    }

    return (
      React.DOM.div(null, 
        TaskHeader( {name:"Kappaleiden tunnistaminen", step:this.state.step, steps:this.props.steps} ),
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

module.exports = BasicShapesTask;
},{"../components/coords.js":2,"../components/task-components.js":7,"../utils/task-utils.js":11}],10:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";

var TaskUtils = require("../utils/task-utils");
var TaskComponents = require("../components/task-components");
var Coords = require("../components/coords");
var Forms = require("../components/forms");


/**
 * Read positions from a coordinate system.
 */
var SimpleCoordsTask = React.createClass({displayName: 'SimpleCoordsTask',

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
      this.handleTaskDone();
    else
      this.reset();
      this.setState({step: step + 1});
  },

  handleTaskDone: function() {
    this.props.onTaskDone();
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
        TaskHeader( {name:"Koordinaatiston lukeminen", step:this.state.step, steps:this.props.steps} ),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEFsZWtzaVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXHdhdGNoaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9jb29yZHMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL2Zvcm0tY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvZm9ybXMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL21hdGgtY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvbWl4aW5zLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9hZGRpdGlvbi10YXNrLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvdGFza3MvYmFzaWMtc2hhcGVzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy91dGlscy90YXNrLXV0aWxzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblwidXNlIHN0cmljdFwiO1xyXG4vKiBnbG9iYWxzIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXHJcblxyXG52YXIgQWRkaXRpb25UYXNrID0gcmVxdWlyZShcIi4vdGFza3MvYWRkaXRpb24tdGFza1wiKTtcclxudmFyIFNpbXBsZUNvb3Jkc1Rhc2sgPSByZXF1aXJlKFwiLi90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2tcIik7XHJcbnZhciBCYXNpY1NoYXBlc1Rhc2sgPSByZXF1aXJlKFwiLi90YXNrcy9iYXNpYy1zaGFwZXMtdGFza1wiKTtcclxuXHJcblxyXG4vKipcclxuICogQ29udGFpbmVyIGFuZCBsaW5rcyBmb3IgZXhhbXBsZSB0YXNrcy5cclxuICovXHJcbnZhciBBcHBsaWNhdGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FwcGxpY2F0aW9uJyxcclxuXHJcbiAgaGFuZGxlTGlzdENsaWNrOiBmdW5jdGlvbihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB2YXIgdGFza05hbWUgPSBlLnRhcmdldC50ZXh0O1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRUYXNrOiB0YXNrTmFtZX0pO1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZVRhc2tEb25lOiBmdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiVGFzayBkb25lIC0gaGVyZSdzIHdoZXJlIHRoZSB0YXNrIGNvbm5lY3RzIHRvIGFuIGV4dGVybmFsIGFwcC5cIik7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7c2VsZWN0ZWRUYXNrOiBcIllodGVlbmxhc2t1XCJ9O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgdGFza3MgPSB7XHJcbiAgICAgIFwiWWh0ZWVubGFza3VcIjogQWRkaXRpb25UYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lfSksXHJcbiAgICAgIFwiS29vcmRpbmFhdGlzdG9uIGx1a2VtaW5lblwiOiBTaW1wbGVDb29yZHNUYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lLCBzdGVwczo1fSksXHJcbiAgICAgIFwiS2FwcGFsZWlkZW4gdHVubmlzdGFtaW5lblwiOiBCYXNpY1NoYXBlc1Rhc2soIHtvblRhc2tEb25lOnRoaXMuaGFuZGxlVGFza0RvbmV9KVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgdGFza0xpc3RFbGVtcyA9IE9iamVjdC5rZXlzKHRhc2tzKS5tYXAoZnVuY3Rpb24odGFza05hbWUpIHtcclxuICAgICAgdmFyIGNsYXNzTmFtZSA9IHRhc2tOYW1lID09PSB0aGlzLnN0YXRlLnNlbGVjdGVkVGFzayA/IFwidGV4dC1tdXRlZFwiIDogXCJcIjtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00ubGkobnVsbCwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uYSgge2NsYXNzTmFtZTpjbGFzc05hbWUsIGhyZWY6XCJcIiwgb25DbGljazp0aGlzLmhhbmRsZUxpc3RDbGlja30sIHRhc2tOYW1lKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdmFyIHRhc2sgPSB0YXNrc1t0aGlzLnN0YXRlLnNlbGVjdGVkVGFza107XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICBSZWFjdC5ET00udWwoIHtjbGFzc05hbWU6XCJsaXN0LWlubGluZVwifSwgXHJcbiAgICAgICAgICB0YXNrTGlzdEVsZW1zXHJcbiAgICAgICAgKSxcclxuXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhc2stY29udGFpbmVyXCJ9LCBcclxuICAgICAgICAgIHRhc2tcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFwcGxpY2F0aW9uOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIGQzLCBNYXRoVXRpbHMsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKiogQSAyRCBjb29yZGluYXRlIHN5c3RlbS4gKi9cclxudmFyIENvb3JkcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nvb3JkcycsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgZHJhd0F4ZXM6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgc2hhcGVzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXksXHJcbiAgICBib3VuZHM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXHJcbiAgICBhc3BlY3Q6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICB9LFxyXG5cclxuICBoYW5kbGVSZXNpemU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHBhcmVudCA9ICQodGhpcy5nZXRET01Ob2RlKCkucGFyZW50Tm9kZSk7XHJcbiAgICB0aGlzLnNldFN0YXRlKHt3aWR0aDogcGFyZW50LndpZHRoKCl9KTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHt3aWR0aDogMH07XHJcbiAgfSxcclxuXHJcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRyYXdBeGVzOiB0cnVlLFxyXG4gICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICBib3VuZHM6IHttYXhZOjEwLCBtYXhYOjEwLCBtaW5ZOjAsIG1pblg6MH0sXHJcbiAgICAgIGFzcGVjdDogMVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLmhhbmRsZVJlc2l6ZSk7XHJcbiAgICB0aGlzLmhhbmRsZVJlc2l6ZSgpO1xyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMuaGFuZGxlUmVzaXplKTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgdmFyIG1hcmdpbiA9IHtcclxuICAgICAgdG9wOiAxMCxcclxuICAgICAgcmlnaHQ6IDEwLFxyXG4gICAgICBib3R0b206IDEwLFxyXG4gICAgICBsZWZ0OiAxMFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgd2lkdGggPSB0aGlzLnN0YXRlLndpZHRoID8gdGhpcy5zdGF0ZS53aWR0aCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0IDogMDtcclxuICAgIHZhciBoZWlnaHQgPSBNYXRoLnJvdW5kKHdpZHRoICogdGhpcy5wcm9wcy5hc3BlY3QpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcblxyXG4gICAgdmFyIGJvdW5kcyA9IHRoaXMucHJvcHMuYm91bmRzO1xyXG4gICAgdmFyIHNwYWNpbmcgPSBNYXRoLnJvdW5kKE1hdGgubWluKFxyXG4gICAgICB3aWR0aCAvIE1hdGguYWJzKGJvdW5kcy5tYXhYIC0gYm91bmRzLm1pblgpLFxyXG4gICAgICBoZWlnaHQgLyBNYXRoLmFicyhib3VuZHMubWF4WSAtIGJvdW5kcy5taW5ZKVxyXG4gICAgKSk7XHJcblxyXG4gICAgdmFyIHggPSBkMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAuZG9tYWluKFtib3VuZHMubWluWCwgYm91bmRzLm1pblggKyAxXSlcclxuICAgICAgLnJhbmdlKFswLCBzcGFjaW5nXSk7XHJcblxyXG4gICAgdmFyIHkgPSBkMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAuZG9tYWluKFtib3VuZHMubWluWSwgYm91bmRzLm1pblkgKyAxXSlcclxuICAgICAgLnJhbmdlKFtoZWlnaHQsIGhlaWdodCAtIHNwYWNpbmddKTtcclxuXHJcbiAgICB2YXIgZnVsbFdpZHRoID0gd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodDtcclxuICAgIHZhciBmdWxsSGVpZ2h0ID0gaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b207XHJcbiAgICB2YXIgdHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiO1xyXG5cclxuICAgIHZhciBzaGFwZXMsIGdyaWQ7XHJcbiAgICBpZiAodGhpcy5zdGF0ZS53aWR0aCkge1xyXG4gICAgICBzaGFwZXMgPSBTaGFwZXMoIHt4OngsIHk6eSwgc3BhY2luZzpzcGFjaW5nLCBkYXRhOnRoaXMucHJvcHMuc2hhcGVzfSApO1xyXG4gICAgICBncmlkID0gR3JpZCgge2RyYXdBeGVzOnRoaXMucHJvcHMuZHJhd0F4ZXMsIHg6eCwgeTp5LCBib3VuZHM6Ym91bmRzfSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb29yZHMtY29udGFpbmVyXCJ9LCBcclxuICAgICAgICBSZWFjdC5ET00uc3ZnKCB7d2lkdGg6ZnVsbFdpZHRoLCBoZWlnaHQ6ZnVsbEhlaWdodH0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmcoIHt0cmFuc2Zvcm06dHJhbnNmb3JtfSwgXHJcbiAgICAgICAgICAgIGdyaWQsXHJcbiAgICAgICAgICAgIHNoYXBlc1xyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbi8qKiBBIGdyaWQgZm9yIHRoZSBjb29yZGluYXRlIHN5c3RlbS4gKi9cclxudmFyIEdyaWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdHcmlkJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICB4OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgeTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIGJvdW5kczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxyXG4gICAgc3BhY2luZzogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIHRyYW5zaXRpb25EdXJhdGlvbjogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxyXG4gIH0sXHJcblxyXG4gIC8qKiBSZWRyYXcgZ3JpZC4gICovXHJcbiAgdXBkYXRlOiBmdW5jdGlvbihwcm9wcykge1xyXG4gICAgdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCh0aGlzLmdldERPTU5vZGUoKSk7XHJcbiAgICB2YXIgYm91bmRzID0gcHJvcHMuYm91bmRzO1xyXG4gICAgdmFyIHNwYWNpbmcgPSBwcm9wcy5zcGFjaW5nO1xyXG4gICAgdmFyIHggPSBwcm9wcy54O1xyXG4gICAgdmFyIHkgPSBwcm9wcy55O1xyXG5cclxuICAgIHZhciB4UmFuZ2UgPSBkMy5yYW5nZShNYXRoLmNlaWwoKGJvdW5kcy5taW5YKSAvIHNwYWNpbmcpLCBNYXRoLnJvdW5kKGJvdW5kcy5tYXhYKSArIHNwYWNpbmcsIHNwYWNpbmcpO1xyXG4gICAgdmFyIHlSYW5nZSA9IGQzLnJhbmdlKE1hdGguY2VpbCgoYm91bmRzLm1pblkpIC8gc3BhY2luZyksIE1hdGgucm91bmQoYm91bmRzLm1heFkpICsgc3BhY2luZywgc3BhY2luZyk7XHJcbiAgICB2YXIgZGF0YSA9IHhSYW5nZS5jb25jYXQoeVJhbmdlKTtcclxuICAgIHZhciBpc1ggPSBmdW5jdGlvbihpbmRleCkgeyByZXR1cm4gaW5kZXggPCB4UmFuZ2UubGVuZ3RoOyB9O1xyXG5cclxuICAgIHZhciBheGVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcIi5heGlzXCIpXHJcbiAgICAgIC5kYXRhKGRhdGEpO1xyXG5cclxuICAgIGF4ZXMuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgIHJldHVybiBcImF4aXMgXCIgKyAoKHByb3BzLmRyYXdBeGVzICYmIGQgPT09IDApID8gXCJ0aGlja1wiIDogXCJcIik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBheGVzLnRyYW5zaXRpb24oKS5kdXJhdGlvbihwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoYm91bmRzLm1pblgpOyB9KVxyXG4gICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1pblkpIDogeShkKTsgfSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB4KGQpIDogeChib3VuZHMubWF4WCk7IH0pXHJcbiAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geShib3VuZHMubWF4WSkgOiB5KGQpOyB9KTtcclxuXHJcbiAgICBheGVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICBpZiAocHJvcHMuZHJhd0F4ZXMpIHtcclxuICAgICAgdmFyIGxhYmVscyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCIubGFiZWxcIikuZGF0YShkYXRhKTtcclxuXHJcbiAgICAgIGxhYmVscy5lbnRlcigpLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwibGFiZWwgXCIgKyAoaXNYKGkpID8gXCJ4XCIgOiBcInlcIik7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkgeyBpZiAoIWQpIHJldHVybiBcIm5vbmVcIjsgfSlcclxuICAgICAgICAudGV4dChPYmplY3QpXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyBcIjEuNGVtXCIgOiBcIi4zZW1cIjsgfSlcclxuICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IG51bGwgOiBcIi0uOGVtXCI7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMSArIFwiZW1cIik7XHJcblxyXG4gICAgICBsYWJlbHMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoMCk7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoMCkgOiB5KGQpOyB9KTtcclxuXHJcbiAgICAgIGxhYmVscy5leGl0KCkucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRyYXdBeGVzOiB0cnVlLFxyXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDU1MCxcclxuICAgICAgc3BhY2luZzogMVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnVwZGF0ZSh0aGlzLnByb3BzKTtcclxuICB9LFxyXG5cclxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xyXG4gICAgdGhpcy51cGRhdGUobmV4dFByb3BzKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICBSZWFjdC5ET00uZygge2NsYXNzTmFtZTpcImF4ZXNcIn0pXHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICApO1xyXG4gIH1cclxufSk7XHJcblxyXG5cclxuLyoqIFZhcmlvdXMgZ2VvbWV0cmljIHNoYXBlcyB0byBiZSBkcmF3biBvbiB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0uICovXHJcbnZhciBTaGFwZXMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTaGFwZXMnLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIGRhdGE6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxyXG4gICAgeDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICBzcGFjaW5nOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICB0cmFuc2l0aW9uRHVyYXRpb246IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICB9LFxyXG5cclxuICAvKiogUmVkcmF3IHNoYXBlcy4gR2V0cyBjYWxsZWQgd2hlbmV2ZXIgc2hhcGVzIGFyZSB1cGRhdGVkIG9yIHNjcmVlbiByZXNpemVzLiAqL1xyXG4gIHVwZGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgIHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QodGhpcy5nZXRET01Ob2RlKCkpO1xyXG4gICAgdmFyIHRyYW5zaXRpb25EdXJhdGlvbiA9IHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbiB8fCA1NTA7XHJcblxyXG4gICAgdmFyIHBvbHlnb25zID0gY29udGFpbmVyLnNlbGVjdEFsbChcInBvbHlnb24uc2hhcGVcIilcclxuICAgICAgLmRhdGEocHJvcHMuZGF0YS5maWx0ZXIoZnVuY3Rpb24ocykgeyByZXR1cm4gcy5wb2ludHMubGVuZ3RoID4gMjsgfSkpO1xyXG5cclxuICAgIHZhciBhZGRlZFBvbHlnb25zID0gcG9seWdvbnMuZW50ZXIoKS5hcHBlbmQoXCJwb2x5Z29uXCIpLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpO1xyXG5cclxuICAgIHBvbHlnb25zLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwicG9pbnRzXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gZC5wb2ludHMubWFwKGZ1bmN0aW9uKHBzKSB7XHJcbiAgICAgICAgICByZXR1cm4gW3Byb3BzLngocHNbMF0pLCBwcm9wcy55KHBzWzFdKV07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIHBvbHlnb25zLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcblxyXG4gICAgdmFyIGNpcmNsZXMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwiY2lyY2xlLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA9PSAxOyB9KSk7XHJcblxyXG4gICAgdmFyIGFkZGVkQ2lyY2xlcyA9IGNpcmNsZXMuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgY2lyY2xlcy50cmFuc2l0aW9uKCkuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMF1bMF0pOyB9KVxyXG4gICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMF1bMV0pOyB9KVxyXG4gICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMuc3BhY2luZyAqIChkLnIgfHwgMC4yKTsgfSk7XHJcblxyXG4gICAgY2lyY2xlcy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG5cclxuICAgIHZhciBsaW5lcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJsaW5lLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA9PSAyOyB9KSk7XHJcblxyXG4gICAgdmFyIGFkZGVkTGluZXMgPSBsaW5lcy5lbnRlcigpLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgbGluZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzBdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzBdWzFdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzFdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzFdWzFdKTsgfSk7XHJcblxyXG4gICAgbGluZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIEF0dGFjaCBjbGljayBldmVudCBsaXN0ZW5lcnMuXHJcbiAgICBbYWRkZWRQb2x5Z29ucywgYWRkZWRDaXJjbGVzLCBhZGRlZExpbmVzXS5mb3JFYWNoKGZ1bmN0aW9uKGFkZGVkKSB7XHJcbiAgICAgIGFkZGVkLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIGlmICgkLmlzRnVuY3Rpb24oZC5vbkNsaWNrKSlcclxuICAgICAgICAgIGQub25DbGljayhkKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXQgY29tbW9uIGF0dHJpYnV0ZXMuXHJcbiAgICBjb250YWluZXIuc2VsZWN0QWxsKFwiLnNoYXBlXCIpXHJcbiAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KVxyXG4gICAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnN0cm9rZSB8fCBcInN0ZWVsYmx1ZVwiOyB9KVxyXG4gICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiAoZC5zdHJva2VXaWR0aCB8fCAyKSArIFwicHhcIjsgfSk7XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy51cGRhdGUodGhpcy5wcm9wcyk7XHJcbiAgfSxcclxuXHJcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcclxuICAgIHRoaXMudXBkYXRlKG5leHRQcm9wcyk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHJldHVybiBSZWFjdC5ET00uZygge2NsYXNzTmFtZTpcInNoYXBlc1wifSk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvb3JkczsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFZhcmlvdXMgY29tbW9uIGZvcm0gY29tcG9uZW50cy5cclxuICovXHJcbnZhciBGb3JtQ29tcG9uZW50cyA9IChmdW5jdGlvbigpe1xyXG5cclxuICB2YXIgTWl4aW5zID0gcmVxdWlyZShcIi4vbWl4aW5zXCIpO1xyXG5cclxuICB2YXIgZm9ybUNvbXBvbmVudHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSBmb3JtIHRoYXQgZGlzYWJsZXMgc3VibWl0dGluZyB3aGVuIGNvbnRlbnRzIGFyZSBpbnZhbGlkLlxyXG4gICAqL1xyXG4gIGZvcm1Db21wb25lbnRzLkFuc3dlckZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBbnN3ZXJGb3JtJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIGJ0bkNvcnJlY3RBbmltQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGJ0bkluY29ycmVjdEFuaW1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgZm9ybUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICBtaXhpbnM6IFtNaXhpbnMuVHJpZ2dlckFuaW1hdGlvbk1peGluXSxcclxuXHJcbiAgICAvKiogU3VibWl0IGFuc3dlciBpZiBmb3JtIGlzIHZhbGlkLiAqL1xyXG4gICAgaGFuZGxlU3VibWl0OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGlmIChlKVxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLnN0YXRlLmlzVmFsaWQpIHtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQW5zd2VyKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd0Vycm9yczogdHJ1ZX0pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYnRuID0gJCh0aGlzLnJlZnMuYnRuLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHRoaXMuYW5pbWF0ZShidG4sIHRoaXMucHJvcHMuYnRuQ29ycmVjdEFuaW1DbGFzcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUluY29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBidG4gPSAkKHRoaXMucmVmcy5idG4uZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdGhpcy5hbmltYXRlKGJ0biwgdGhpcy5wcm9wcy5idG5JbmNvcnJlY3RBbmltQ2xhc3MpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWxpZGl0eTogZnVuY3Rpb24oaXNWYWxpZCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtpc1ZhbGlkOiBpc1ZhbGlkLCBpc0RpcnR5OiB0cnVlfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDbGVhciB2YWx1ZXMgYW5kIHZhbGlkYXRpb24gc3RhdGVzIGZvciBhbGwgY2hpbGQgZWxlbWVudHMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgc2hvd0Vycm9yczogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybUNsYXNzOiBcImZvcm0taG9yaXpvbnRhbFwiLFxyXG4gICAgICAgIGJ0bkNsYXNzOiBcImJ0biBidG4tc3VjY2VzcyBidG4tbGcgYnRuLWJsb2NrXCIsXHJcbiAgICAgICAgYnRuQ29ycmVjdEFuaW1DbGFzczogXCJhbmltYXRlZCBib3VuY2VcIixcclxuICAgICAgICBidG5JbmNvcnJlY3RBbmltQ2xhc3M6IFwiYW5pbWF0ZWQgc2hha2VcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgc2hvd0Vycm9yczogZmFsc2VcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLnByb3BzLmNoaWxkcmVuLm1hcChmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGNoaWxkLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UgPSB0aGlzLnNldFZhbGlkaXR5O1xyXG4gICAgICAgIGNoaWxkLnByb3BzLm9uU3VibWl0ID0gdGhpcy5oYW5kbGVTdWJtaXQ7XHJcbiAgICAgICAgY2hpbGQucHJvcHMuc2hvd0Vycm9yID0gdGhpcy5zdGF0ZS5zaG93RXJyb3JzO1xyXG4gICAgICAgIHJldHVybiBjaGlsZDtcclxuICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgIHZhciBidG5DbGFzcyA9IHRoaXMucHJvcHMuYnRuQ2xhc3MgKyAodGhpcy5zdGF0ZS5pc1ZhbGlkID8gXCJcIiA6IFwiIGRpc2FibGVkXCIpO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZm9ybSgge3JvbGU6XCJmb3JtXCIsIGNsYXNzTmFtZTp0aGlzLnByb3BzLmZvcm1DbGFzcywgb25TdWJtaXQ6dGhpcy5oYW5kbGVTdWJtaXQsIG5vVmFsaWRhdGU6dHJ1ZX0sIFxyXG4gICAgICAgICAgY2hpbGRyZW4sXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcImJ0blwiLCB0eXBlOlwic3VibWl0XCIsIHZhbHVlOlwiVmFzdGFhXCIsIGNsYXNzTmFtZTpidG5DbGFzc30gKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIDxpbnB1dD4gd2l0aCB2YWxpZGF0aW9uIHN0YXRlcy5cclxuICAgKi9cclxuICBmb3JtQ29tcG9uZW50cy5SZUlucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUmVJbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHJlOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgICBzaG93RXJyb3I6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgICByZXF1aXJlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICB0eXBlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIG9uVmFsaWRpdHlDaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZWFkIHZhbHVlLCB2YWxpZGF0ZSwgbm90aWZ5IHBhcmVudCBlbGVtZW50IGlmIGFuIGV2ZW50IGlzIGF0dGFjaGVkLiAqL1xyXG4gICAgaGFuZGxlQ2hhbmdlOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy52YWxpZGF0b3IudGVzdChlLnRhcmdldC52YWx1ZSk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiBlLnRhcmdldC52YWx1ZSwgaXNWYWxpZDogaXNWYWxpZCwgaXNEaXJ0eTogdHJ1ZX0pO1xyXG5cclxuICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZShpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiB2YWx1ZX0pO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUudmFsdWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5pbnB1dC5nZXRET01Ob2RlKCkuc2VsZWN0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDbGVhciB2YWx1ZSBhbmQgcmVzZXQgdmFsaWRhdGlvbiBzdGF0ZXMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbGlkYXRvcjogZnVuY3Rpb24ocmUpIHtcclxuICAgICAgdGhpcy52YWxpZGF0b3IgPSBuZXcgUmVnRXhwKHJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFZhbGlkYXRvcih0aGlzLnByb3BzLnJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24obmV3UHJvcHMpIHtcclxuICAgICAgdGhpcy5zZXRWYWxpZGF0b3IobmV3UHJvcHMucmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZTogL15cXHMqLT9cXGQrXFxzKiQvLFxyXG4gICAgICAgIHNob3dFcnJvcjogZmFsc2UsXHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiBcIlwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHZhbGlkYXRpb25TdGF0ZSA9IFJlYWN0LmFkZG9ucy5jbGFzc1NldCh7XHJcbiAgICAgICAgXCJoYXMtc3VjY2Vzc1wiOiB0aGlzLnN0YXRlLmlzVmFsaWQgJiYgdGhpcy5zdGF0ZS5pc0RpcnR5LFxyXG4gICAgICAgIFwiaGFzLXdhcm5pbmdcIjogIXRoaXMuc3RhdGUuaXNEaXJ0eSAmJiB0aGlzLnByb3BzLnNob3dFcnJvcixcclxuICAgICAgICBcImhhcy1lcnJvclwiOiAhdGhpcy5zdGF0ZS5pc1ZhbGlkXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGVycm9yO1xyXG4gICAgICBpZiAodGhpcy5wcm9wcy5zaG93RXJyb3IpIHtcclxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuaXNWYWxpZCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJjb250cm9sLWxhYmVsXCJ9LCBcIlZpcmhlZWxsaW5lbiBzecO2dGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMucHJvcHMucmVxdWlyZWQgJiYgdGhpcy52YWx1ZSgpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJjb250cm9sLWxhYmVsXCJ9LCBcIlTDpHl0w6QgdMOkbcOkIGtlbnR0w6RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cCBcIiArIHZhbGlkYXRpb25TdGF0ZX0sIFxyXG4gICAgICAgICAgZXJyb3IsXHJcbiAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtyZWY6XCJpbnB1dFwiLCBvbkNoYW5nZTp0aGlzLmhhbmRsZUNoYW5nZSwgdmFsdWU6dGhpcy5zdGF0ZS52YWx1ZSwgcGxhY2Vob2xkZXI6dGhpcy5wcm9wcy5wbGFjZWhvbGRlcixcclxuICAgICAgICAgIHR5cGU6dGhpcy5wcm9wcy50eXBlLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgXCIgKyB0aGlzLnByb3BzLmNsYXNzTmFtZX0gKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSBudW1iZXIgaW5wdXQgd2l0aCB0d28gYnV0dG9ucyBmb3IgaW5jcmVtZW50aW5nIGFuZCBkZWNyZW1lbnRpbmcuXHJcbiAgICovXHJcbiAgZm9ybUNvbXBvbmVudHMuTnVtSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOdW1JbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXA6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgb25WYWxpZGl0eUNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXHJcbiAgICAgIG9uU3VibWl0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWx1ZUFuZFZhbGlkaXR5OiBmdW5jdGlvbih2YWx1ZSwgaXNWYWxpZCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB2YWx1ZTogdmFsdWUsIGlzVmFsaWQ6IGlzVmFsaWRcclxuICAgICAgfSk7XHJcbiAgICAgIGlmICgkLmlzRnVuY3Rpb24odGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKSlcclxuICAgICAgICB0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UoaXNWYWxpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KDAsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVEZWNyZW1lbnQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkodGhpcy52YWx1ZSgpIC0gdGhpcy5wcm9wcy5zdGVwLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlSW5jcmVtZW50OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KHRoaXMudmFsdWUoKSArIHRoaXMucHJvcHMuc3RlcCwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZXNldCBzdGF0ZSB0byBpbnB1dCB2YWx1ZSBpZiBpbnB1dCB2YWx1ZSBpcyBhIG51bWJlci4gKi9cclxuICAgIGhhbmRsZUNoYW5nZTogZnVuY3Rpb24oZSkge1xyXG4gICAgICB2YXIgdmFsID0gZS50YXJnZXQudmFsdWU7XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gIWlzTmFOKHBhcnNlRmxvYXQodmFsKSk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh2YWwsIGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogVHJ5IHRvIHN1Ym1pdCBwYXJlbnQgZm9ybSB3aGVuIEVudGVyIGlzIGNsaWNrZWQuICovXHJcbiAgICBoYW5kbGVLZXlQcmVzczogZnVuY3Rpb24oZSkge1xyXG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZiAodGhpcy5wcm9wcy5vblN1Ym1pdClcclxuICAgICAgICAgIHRoaXMucHJvcHMub25TdWJtaXQoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHRoaXMuc3RhdGUudmFsdWUpIHx8IDA7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdmFsdWU6IG51bGwsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDFcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgUmVJbnB1dCA9IGZvcm1Db21wb25lbnRzLlJlSW5wdXQ7XHJcbiAgICAgIHZhciBidG5DbGFzcyA9IHRoaXMucHJvcHMuYnRuQ2xhc3MgfHwgXCJidG4gYnRuLWxnIGJ0bi1pbmZvXCI7XHJcbiAgICAgIHZhciB2YWxpZGF0aW9uU3RhdGUgPSB0aGlzLnN0YXRlLmlzVmFsaWQgPyBcImhhcy1zdWNjZXNzXCIgOiBcImhhcy1lcnJvclwiO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cCBcIiArIHZhbGlkYXRpb25TdGF0ZX0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tMyBjb2wteHMtM1wifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3RhYkluZGV4OlwiLTFcIiwgY2xhc3NOYW1lOmJ0bkNsYXNzICsgXCIgcHVsbC1yaWdodFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlRGVjcmVtZW50fSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1sZWZ0XCJ9KVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IGNvbC14cy02XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwibnVtYmVyXCIsIHZhbHVlOnRoaXMuc3RhdGUudmFsdWUsIG9uQ2hhbmdlOnRoaXMuaGFuZGxlQ2hhbmdlLCBvbktleVByZXNzOnRoaXMuaGFuZGxlS2V5UHJlc3MsXHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LWxnIHRleHQtY2VudGVyXCIsIHBsYWNlaG9sZGVyOnRoaXMucHJvcHMucGxhY2Vob2xkZXJ9KVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTMgY29sLXhzLTNcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0YWJJbmRleDpcIi0xXCIsIGNsYXNzTmFtZTpidG5DbGFzcyArIFwiIHB1bGwtbGVmdFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlSW5jcmVtZW50fSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodFwifSlcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBmb3JtQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1Db21wb25lbnRzOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29tcGxldGUgYW5zd2VyIGZvcm1zIGZvciB0YXNrcy5cclxuICovXHJcbnZhciBGb3JtcyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIEZvcm1Db21wb25lbnRzID0gcmVxdWlyZShcIi4vZm9ybS1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBBbnN3ZXJGb3JtID0gRm9ybUNvbXBvbmVudHMuQW5zd2VyRm9ybTtcclxuICB2YXIgTnVtSW5wdXQgPSBGb3JtQ29tcG9uZW50cy5OdW1JbnB1dDtcclxuXHJcbiAgdmFyIG15ID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGFuc3dlciBmb3JtIHdpdGggaW5wdXRzIGZvciB4IGFuZCB5IGNvb3JkaW5hdGVzLlxyXG4gICAqL1xyXG4gIG15LkNvb3Jkc0Fuc3dlckZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb29yZHNBbnN3ZXJGb3JtJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGlzQ29ycmVjdCA9IHRoaXMucHJvcHMub25BbnN3ZXIodGhpcy5yZWZzLngudmFsdWUoKSwgdGhpcy5yZWZzLnkudmFsdWUoKSk7XHJcbiAgICAgIGlmIChpc0NvcnJlY3QpIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMucmVmcy5mb3JtLmhhbmRsZUluY29ycmVjdEFuc3dlcigpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZWZzLmZvcm0ucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIEFuc3dlckZvcm0oIHtyZWY6XCJmb3JtXCIsIGNsYXNzTmFtZTpcImZvcm0taG9yaXpvbnRhbFwiLCBvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0sIFxyXG4gICAgICAgICAgTnVtSW5wdXQoIHtyZWY6XCJ4XCIsIHBsYWNlaG9sZGVyOlwieFwifSksXHJcbiAgICAgICAgICBOdW1JbnB1dCgge3JlZjpcInlcIiwgcGxhY2Vob2xkZXI6XCJ5XCJ9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIG15O1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRm9ybXM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSwgTWF0aEpheCAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29tcG9uZW50cyBmb3IgbWF0aHMgdGFza3MuXHJcbiAqL1xyXG52YXIgTWF0aENvbXBvbmVudHMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBtYXRoQ29tcG9uZW50cyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBSZW5kZXIgTGFUZXggbWF0aHMgbm90YXRpb24gaW50byB3ZWIgZm9udHMgdXNpbmcgTWF0aEpheC5cclxuICAgKi9cclxuICBtYXRoQ29tcG9uZW50cy5NYXRoSmF4ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTWF0aEpheCcsXHJcbiAgICByZXByb2Nlc3M6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgZWxlbSA9IHRoaXMucmVmcy5zY3JpcHQuZ2V0RE9NTm9kZSgpO1xyXG4gICAgICBjb25zb2xlLmxvZyhlbGVtKTtcclxuICAgICAgTWF0aEpheC5IdWIuUXVldWUoW1wiUmVwcm9jZXNzXCIsIE1hdGhKYXguSHViLCBlbGVtXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZXByb2Nlc3MoKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVwcm9jZXNzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKG51bGwsIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLnNjcmlwdCgge3JlZjpcInNjcmlwdFwiLCB0eXBlOlwibWF0aC90ZXhcIn0sIHRoaXMucHJvcHMuY2hpbGRyZW4pXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbWF0aENvbXBvbmVudHM7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXRoQ29tcG9uZW50cztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbXBvbmVudCBleHRlbnNpb25zIGkuZS4gbWl4aW5zLlxyXG4gKi9cclxudmFyIE1peGlucyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIG1peGlucyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBQcm92aWRlcyBhIHNldEludGVydmFsIGZ1bmN0aW9uIHdoaWNoIHdpbGwgZ2V0IGNsZWFuZWQgdXAgd2hlblxyXG4gICAqIHRoZSBjb21wb25lbnQgaXMgZGVzdHJveWVkLlxyXG4gICAqL1xyXG4gIG1peGlucy5TZXRJbnRlcnZhbE1peGluID0ge1xyXG4gICAgc2V0SW50ZXJ2YWw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmludGVydmFscy5wdXNoKHNldEludGVydmFsLmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhckFsbEludGVydmFsczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuaW50ZXJ2YWxzLm1hcChjbGVhckludGVydmFsKTtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMgPSBbXTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgaW5pdGlhbGl6ZWQuICovXHJcbiAgICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmludGVydmFscyA9IFtdO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogSW52b2tlZCB3aGVuIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuICovXHJcbiAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2xlYXJBbGxJbnRlcnZhbHMoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBcHBseSBDU1MgY2xhc3NlcyBmb3Igc2V0IGR1cmF0aW9uIC0gdXNlZnVsIGZvciBzaW5nbGVzaG90IGFuaW1hdGlvbnMuXHJcbiAgICovXHJcbiAgbWl4aW5zLlRyaWdnZXJBbmltYXRpb25NaXhpbiA9IHtcclxuICAgIGFuaW1hdGU6IGZ1bmN0aW9uKGVsZW0sIGNsYXNzTmFtZSwgZHVyYXRpb24pIHtcclxuICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbiB8fCAxMDAwO1xyXG4gICAgICBpZiAoIXRoaXMudGltZW91dCAmJiB0aGlzLnRpbWVvdXQgIT09IDApIHtcclxuICAgICAgICBlbGVtLmFkZENsYXNzKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGVsZW0ucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKTtcclxuICAgICAgICAgIHRoaXMudGltZW91dCA9IG51bGw7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpLCBkdXJhdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4gbWl4aW5zO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWl4aW5zO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQ29tbW9uIHRhc2sgY29tcG9uZW50cy5cclxuICovXHJcbnZhciBUYXNrQ29tcG9uZW50cyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIG15ID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBmb3IgQm9vdHN0cmFwJ3MgcGFuZWwgY29tcG9uZW50LlxyXG4gICAqL1xyXG4gIG15LlRhc2tQYW5lbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tQYW5lbCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBjbGFzc05hbWUgPSBcInBhbmVsIFwiICsgKHRoaXMucHJvcHMuY2xhc3NOYW1lIHx8IFwicGFuZWwtaW5mb1wiICk7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NOYW1lfSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtaGVhZGluZ1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMygge2NsYXNzTmFtZTpcInBhbmVsLXRpdGxlXCJ9LCB0aGlzLnByb3BzLmhlYWRlcilcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtYm9keVwifSwgXHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBmb3IgQm9vdHN0cmFwJ3MgcHJvZ3Jlc3MgYmFyIGVsZW1lbnQuXHJcbiAgICovXHJcbiAgbXkuVGFza1Byb2dyZXNzQmFyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza1Byb2dyZXNzQmFyJyxcclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBtYXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgbm93OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgc2luZ2xlV2lkdGggPSBNYXRoLmNlaWwoMSAvIHRoaXMucHJvcHMubWF4ICogMTAwKTtcclxuICAgICAgdmFyIGxlZnRTdHlsZSA9IHt3aWR0aDogc2luZ2xlV2lkdGggKiAodGhpcy5wcm9wcy5ub3cgLSAxKSArIFwiJVwifTtcclxuICAgICAgdmFyIHJpZ2h0U3R5bGUgPSB7d2lkdGg6IHNpbmdsZVdpZHRoICogKHRoaXMucHJvcHMubWF4IC0gdGhpcy5wcm9wcy5ub3cgKyAxKSArIFwiJVwifTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIHRhc2stcHJvZ3Jlc3MtYmFyXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcy1iYXIgcHJvZ3Jlc3MtYmFyLXN1Y2Nlc3NcIiwgc3R5bGU6bGVmdFN0eWxlfSksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MtYmFyIHByb2dyZXNzLWJhci13YXJuaW5nXCIsIHN0eWxlOnJpZ2h0U3R5bGV9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGFzayBoZWFkZXIgd2l0aCB0YXNrIG5hbWUgYW5kIGFuIG9wdGlvbmFsIHN0ZXAgY291bnRlci5cclxuICAgKi9cclxuICBteS5UYXNrSGVhZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza0hlYWRlcicsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG5hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcclxuICAgICAgc3RlcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgICAgc3RlcHM6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgc3RlcENvdW50ZXI7XHJcbiAgICAgIGlmICh0aGlzLnByb3BzLnN0ZXAgJiYgdGhpcy5wcm9wcy5zdGVwcykge1xyXG4gICAgICAgIHZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBteS5UYXNrUHJvZ3Jlc3NCYXI7XHJcbiAgICAgICAgc3RlcENvdW50ZXIgPSBUYXNrUHJvZ3Jlc3NCYXIoIHttYXg6dGhpcy5wcm9wcy5zdGVwcywgbm93OnRoaXMucHJvcHMuc3RlcH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWhlYWRlciByb3dcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS03XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmgyKG51bGwsIHRoaXMucHJvcHMubmFtZSlcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTVcIn0sIFxyXG4gICAgICAgICAgICBzdGVwQ291bnRlclxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGVsZW1lbnQgdGhhdCBpcyBzaG93biBhZnRlciBhIGNvbXBsZXRlZCB0YXNrLlxyXG4gICAqL1xyXG4gIG15LlRhc2tEb25lRGlzcGxheSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tEb25lRGlzcGxheScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHNjb3JlOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHNjb3JlID0gdGhpcy5wcm9wcy5zY29yZSB8fCAwO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1kb25lLWRpc3BsYXkgYW5pbWF0ZSBib3VuY2UtaW5cIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiVGVodMOkdsOkIHN1b3JpdGV0dHUhXCIpLCBcIiBQaXN0ZWl0w6Q6IFwiLCBzY29yZVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIG15O1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGFza0NvbXBvbmVudHM7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBIHNpbXBsZSBpbnRlZ2VyIGFkZGl0aW9uIHRhc2suXHJcbiAqL1xyXG52YXIgQWRkaXRpb25UYXNrID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgTWF0aENvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9tYXRoLWNvbXBvbmVudHMuanNcIik7XHJcbiAgdmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzLmpzXCIpO1xyXG5cclxuXHJcbiAgdmFyIGFkZGl0aW9uVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ2FkZGl0aW9uVGFzaycsXHJcblxyXG4gICAgaGFuZGxlSW5wdXRDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgZm9ybXVsYTogZS50YXJnZXQudmFsdWVcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMSxcclxuICAgICAgICBhbnN3ZXI6IG51bGxcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcblxyXG4gICAgICB2YXIgdGFza0lzRG9uZSA9IHRoaXMuc3RhdGUuc3RlcCA+IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpO1xyXG4gICAgICB2YXIgcXVlc3Rpb24sIHNpZGViYXI7XHJcblxyXG4gICAgICBpZiAoIXRhc2tJc0RvbmUpIHtcclxuICAgICAgICBxdWVzdGlvbiA9IFJlYWN0LkRPTS5kaXYobnVsbCwgXCJLeXN5bXlzXCIpO1xyXG5cclxuICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcIk1pa8OkIG9uIHlodGVlbmxhc2t1biB0dWxvcz9cIilcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiVmFzdGF1c1wiLCBjbGFzc05hbWU6XCJwYW5lbC1zdWNjZXNzIHBhbmVsLWV4dHJhLXBhZGRpbmdcIn0sIFxuICAgICAgICAgICAgICBcInZhc3RhdXNsb21ha2UgdMOkaMOkblwiXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBxdWVzdGlvbiA9IFRhc2tEb25lRGlzcGxheSgge3Njb3JlOjEwfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFRhc2tIZWFkZXIoIHtuYW1lOlwiWWh0ZWVubGFza3VcIiwgc3RlcDp0aGlzLnN0YXRlLnN0ZXAsIHN0ZXBzOnRoaXMucHJvcHMuc3RlcHN9ICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgICBxdWVzdGlvblxyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gYWRkaXRpb25UYXNrO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWRkaXRpb25UYXNrO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBkMywgbW9kdWxlLCByZXF1aXJlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFRhc2tVdGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy90YXNrLXV0aWxzLmpzXCIpO1xyXG52YXIgVGFza0NvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHMuanNcIik7XHJcbnZhciBDb29yZHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9jb29yZHMuanNcIik7XHJcblxyXG4vKipcclxuICogQ2xpY2sgdGhlIGFwcHJvcHJpYXRlIHNoYXBlIGluIGEgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAqL1xyXG52YXIgQmFzaWNTaGFwZXNUYXNrID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQmFzaWNTaGFwZXNUYXNrJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICBvblRhc2tEb25lOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgfSxcclxuXHJcbiAgc3RhcnRHYW1lOiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuc2V0U3RhdGUoe2lzUnVubmluZzogdHJ1ZSwgc2NvcmU6IDB9KTtcclxuICAgIHRoaXMucmVzZXQoKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHNpeCBkaWZmZXJlbnQgc2hhcGVzIHRoYXQgZmlsbCB0aGUgY29vcmRzXHJcbiAgICogaW4gYSByYW5kb20gb3JkZXIuXHJcbiAgICovXHJcbiAgZ2V0UmFuZG9tU2hhcGVzOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBjMSA9IDAuNDYsIGMyID0gMS4yMSwgczEgPSAxLjQzLCBzMiA9IDAuODg1O1xyXG4gICAgdmFyIHBlbnRhZ29uUHRzID0gW1stczIsLWMyXSwgWy1zMSxjMV0sIFswLDEuNV0sIFtzMSxjMV0sIFtzMiwtYzJdXTtcclxuICAgIHBlbnRhZ29uUHRzID0gVGFza1V0aWxzLnRyYW5zbGF0ZShwZW50YWdvblB0cywgMi41LCAxLjUpO1xyXG5cclxuICAgIHZhciB0cmFuc2xhdGVzID0gW1swLDBdLCBbNiwwXSwgWzAsNF0sIFs2LDRdLCBbMCw4XSwgWzYsOF1dO1xyXG4gICAgdmFyIGJhc2VzID0gW1xyXG4gICAgICB7bmFtZTpcImtvbG1pb1wiLCBwb2ludHM6W1sxLDBdLCBbMSwzXSwgWzQsMF1dfSxcclxuICAgICAge25hbWU6XCJuZWxpw7ZcIiwgcG9pbnRzOltbMSwwXSwgWzEsM10sIFs0LDNdLCBbNCwwXV19LFxyXG4gICAgICB7bmFtZTpcInltcHlyw6RcIiwgcG9pbnRzOltbMi41LDEuNV1dLCByOjEuNX0sXHJcbiAgICAgIHtuYW1lOlwic3V1bm5pa2FzXCIsIHBvaW50czpbWzAsMF0sIFswLjUsM10sIFs0LjUsM10sIFs0LDBdXX0sXHJcbiAgICAgIHtuYW1lOlwicHVvbGlzdXVubmlrYXNcIiwgcG9pbnRzOltbMCwwXSwgWzAuNSwzXSwgWzQsM10sIFs0LjUsMF1dfSxcclxuICAgICAge25hbWU6XCJ2aWlzaWt1bG1pb1wiLCBwb2ludHM6cGVudGFnb25QdHN9XHJcbiAgICBdO1xyXG5cclxuICAgIGJhc2VzID0gVGFza1V0aWxzLnNodWZmbGUoYmFzZXMpO1xyXG4gICAgdmFyIGNscnMgPSBkMy5zY2FsZS5jYXRlZ29yeTEwKCk7XHJcblxyXG4gICAgdmFyIHNoYXBlcyA9IGJhc2VzLm1hcChmdW5jdGlvbihiYXNlLCBpKSB7XHJcbiAgICAgIHZhciB0cmFuc2xhdGVYID0gdHJhbnNsYXRlc1tpXVswXSArIE1hdGgucmFuZG9tKCk7XHJcbiAgICAgIHZhciB0cmFuc2xhdGVZID0gdHJhbnNsYXRlc1tpXVsxXSArIE1hdGgucmFuZG9tKCk7XHJcbiAgICAgIGJhc2UucG9pbnRzID0gVGFza1V0aWxzLnRyYW5zbGF0ZShiYXNlLnBvaW50cywgdHJhbnNsYXRlWCwgdHJhbnNsYXRlWSk7XHJcbiAgICAgIGJhc2Uua2V5ID0gaTtcclxuICAgICAgYmFzZS5vbkNsaWNrID0gdGhpcy5oYW5kbGVTaGFwZUNsaWNrO1xyXG4gICAgICBiYXNlLnN0cm9rZSA9IFwiYmxhY2tcIjtcclxuICAgICAgYmFzZS5maWxsID0gY2xycyhUYXNrVXRpbHMucmFuZCg5KSk7XHJcbiAgICAgIHJldHVybiBiYXNlO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICByZXR1cm4gc2hhcGVzO1xyXG4gIH0sXHJcblxyXG4gIC8qKiBSZXNldCB0aGUgcXVlc3Rpb24sIGkuZS4gZ2VuZXJhdGUgbmV3IHNoYXBlcy4gKi9cclxuICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc2hhcGVzID0gdGhpcy5nZXRSYW5kb21TaGFwZXMoKTtcclxuXHJcbiAgICAvLyBQcmV2ZW50IGFza2luZyBmb3IgdGhlIHNhbWUgc2hhcGUgdHdpY2UgaW4gYSByb3cuXHJcbiAgICB2YXIgcG9zc2libGVUYXJnZXRzID0gc2hhcGVzO1xyXG4gICAgaWYgKHRoaXMuc3RhdGUudGFyZ2V0KSB7XHJcbiAgICAgIHBvc3NpYmxlVGFyZ2V0cyA9IHBvc3NpYmxlVGFyZ2V0cy5maWx0ZXIoZnVuY3Rpb24oc2hhcGUpIHtcclxuICAgICAgICByZXR1cm4gc2hhcGUubmFtZSAhPT0gdGhpcy5zdGF0ZS50YXJnZXQubmFtZTtcclxuICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuICAgIHZhciB0YXJnZXQgPSBwb3NzaWJsZVRhcmdldHNbVGFza1V0aWxzLnJhbmQocG9zc2libGVUYXJnZXRzLmxlbmd0aCldO1xyXG5cclxuICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICBzaGFwZXM6IHRoaXMuZ2V0UmFuZG9tU2hhcGVzKCksXHJcbiAgICAgIHRhcmdldDogdGFyZ2V0XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvKiogQ2hlY2sgaWYgY29ycmVjdCBzaGFwZSBhbmQgcHJvY2VlZC4gKi9cclxuICBoYW5kbGVTaGFwZUNsaWNrOiBmdW5jdGlvbihzaGFwZSkge1xyXG4gICAgdmFyIHNjb3JlSW5jcmVtZW50O1xyXG4gICAgaWYgKHNoYXBlLm5hbWUgPT09IHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWUpIHtcclxuICAgICAgc2NvcmVJbmNyZW1lbnQgPSAxO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2NvcmVJbmNyZW1lbnQgPSAtMTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNldFN0YXRlKHtzY29yZTogTWF0aC5tYXgodGhpcy5zdGF0ZS5zY29yZSArIHNjb3JlSW5jcmVtZW50LCAwKX0pO1xyXG4gICAgdGhpcy5yZXNldCgpO1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZVRhc2tEb25lOiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucHJvcHMub25UYXNrRG9uZSgpO1xyXG4gIH0sXHJcblxyXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICBzY29yZTogMCxcclxuICAgICAgaXNSdW5uaW5nOiBmYWxzZSxcclxuICAgICAgaXNGaW5pc2hlZDogZmFsc2VcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciBUYXNrUGFuZWwgPSBUYXNrQ29tcG9uZW50cy5UYXNrUGFuZWw7XHJcbiAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICB2YXIgVGFza0RvbmVEaXNwbGF5ID0gVGFza0NvbXBvbmVudHMuVGFza0RvbmVEaXNwbGF5O1xyXG5cclxuICAgIHZhciBzaGFwZXMgPSB0aGlzLnN0YXRlLnNoYXBlcztcclxuICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcyk7XHJcbiAgICB2YXIgY29vcmRzLCBzaWRlYmFyO1xyXG5cclxuICAgIGlmICghdGhpcy5zdGF0ZS5pc0ZpbmlzaGVkKSB7XHJcbiAgICAgIHZhciBib3VuZHMgPSB7bWF4WTogMTIsIG1heFg6IDEyLCBtaW5ZOiAwLCBtaW5YOiAwfTtcclxuXHJcbiAgICAgIGNvb3JkcyA9IENvb3Jkcygge2RyYXdBeGVzOmZhbHNlLCBzaGFwZXM6c2hhcGVzLCBib3VuZHM6Ym91bmRzLCBhc3BlY3Q6MX0gKTtcclxuXHJcbiAgICAgIHZhciBzaGFwZVRvRmluZCA9IFwia29sbWlvXCI7XHJcblxyXG4gICAgICB2YXIgc3RhcnRCdG4gPSB0aGlzLnN0YXRlLmlzUnVubmluZyA/IG51bGwgOiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJhbmltYXRlZCBhbmltYXRlZC1yZXBlYXQgYm91bmNlIGJ0biBidG4tcHJpbWFyeSBidG4tYmxvY2tcIiwgb25DbGljazp0aGlzLnN0YXJ0R2FtZX0sIFxuICAgICAgICAgICAgXCJBbG9pdGEgcGVsaVwiXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHZhciB0YXJnZXREaXNwbGF5ID0gIXRoaXMuc3RhdGUudGFyZ2V0ID8gbnVsbCA6IChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiYW5pbWF0ZWQgYm91bmNlLWluXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcbiAgICAgICAgICBcIktsaWthdHRhdmEga2FwcGFsZTogXCIsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgdGhpcy5zdGF0ZS50YXJnZXQubmFtZSksXHJcbiAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXG4gICAgICAgICAgXCJQaXN0ZWV0OiBcIiwgdGhpcy5zdGF0ZS5zY29yZVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHNpZGViYXIgPSAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXG4gICAgICAgICAgICBcIkV0c2kga29vcmRpbmFhdGlzdG9zdGEgXCIsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgc2hhcGVUb0ZpbmQpLCBcIiBqYSBrbGlra2FhIHNpdMOkXCIsXG4gICAgICAgICAgICBzdGFydEJ0bixcclxuICAgICAgICAgICAgdGFyZ2V0RGlzcGxheVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRhc2tJc0RvbmUpIHtcclxuICAgICAgY29vcmRzID0gVGFza0RvbmVEaXNwbGF5KCB7c2NvcmU6MTB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgIFRhc2tIZWFkZXIoIHtuYW1lOlwiS2FwcGFsZWlkZW4gdHVubmlzdGFtaW5lblwiLCBzdGVwOnRoaXMuc3RhdGUuc3RlcCwgc3RlcHM6dGhpcy5wcm9wcy5zdGVwc30gKSxcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBxdWVzdGlvblwifSwgXHJcbiAgICAgICAgICAgIGNvb3Jkc1xyXG4gICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTUgY29sLXNtLW9mZnNldC0xXCJ9LCBcclxuICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQmFzaWNTaGFwZXNUYXNrOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxudmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzXCIpO1xyXG52YXIgQ29vcmRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvY29vcmRzXCIpO1xyXG52YXIgRm9ybXMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9mb3Jtc1wiKTtcclxuXHJcblxyXG4vKipcclxuICogUmVhZCBwb3NpdGlvbnMgZnJvbSBhIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gKi9cclxudmFyIFNpbXBsZUNvb3Jkc1Rhc2sgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTaW1wbGVDb29yZHNUYXNrJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICBzdGVwczogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgb25UYXNrRG9uZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gIH0sXHJcblxyXG4gIC8qKiBSZXNldCB0aGUgcXVlc3Rpb24sIGkuZS4gZ2VuZXJhdGUgYSBuZXcgcmFuZG9tIHBvaW50LiAqL1xyXG4gIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBuZXdQb2ludDtcclxuICAgIGRvIHsgbmV3UG9pbnQgPSBbVGFza1V0aWxzLnJhbmRSYW5nZSgwLCAxMCksIFRhc2tVdGlscy5yYW5kUmFuZ2UoMCwgMTApXTsgfVxyXG4gICAgd2hpbGUgKFRhc2tVdGlscy5tYXRjaGVzU29sdXRpb24obmV3UG9pbnQsIHRoaXMuc3RhdGUucG9pbnQpKTtcclxuXHJcbiAgICB0aGlzLnNldFN0YXRlKHtwb2ludDogbmV3UG9pbnR9KTtcclxuICB9LFxyXG5cclxuICAvKiogQ2hlY2sgaWYgY29ycmVjdC4gKi9cclxuICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciBpc0NvcnJlY3QgPSBUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKFt4LCB5XSwgdGhpcy5zdGF0ZS5wb2ludCk7XHJcbiAgICBpZiAoaXNDb3JyZWN0KVxyXG4gICAgICB0aGlzLmhhbmRsZUNvcnJlY3RBbnN3ZXIoKTtcclxuXHJcbiAgICByZXR1cm4gaXNDb3JyZWN0O1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHN0ZXAgPSB0aGlzLnN0YXRlLnN0ZXA7XHJcbiAgICBpZiAoc3RlcCA9PT0gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcykpXHJcbiAgICAgIHRoaXMuaGFuZGxlVGFza0RvbmUoKTtcclxuICAgIGVsc2VcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtzdGVwOiBzdGVwICsgMX0pO1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZVRhc2tEb25lOiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucHJvcHMub25UYXNrRG9uZSgpO1xyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucmVzZXQoKTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RlcDogMSxcclxuICAgICAgcG9pbnQ6IG51bGxcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciBUYXNrUGFuZWwgPSBUYXNrQ29tcG9uZW50cy5UYXNrUGFuZWw7XHJcbiAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICB2YXIgVGFza0RvbmVEaXNwbGF5ID0gVGFza0NvbXBvbmVudHMuVGFza0RvbmVEaXNwbGF5O1xyXG4gICAgdmFyIENvb3Jkc0Fuc3dlckZvcm0gPSBGb3Jtcy5Db29yZHNBbnN3ZXJGb3JtO1xyXG5cclxuICAgIHZhciBwb2ludCA9IHRoaXMuc3RhdGUucG9pbnQ7XHJcbiAgICB2YXIgdGFza0lzRG9uZSA9IHRoaXMuc3RhdGUuc3RlcCA+IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpO1xyXG4gICAgdmFyIGNvb3Jkcywgc2lkZWJhcjtcclxuXHJcbiAgICBpZiAocG9pbnQgJiYgIXRhc2tJc0RvbmUpIHtcclxuICAgICAgdmFyIGJvdW5kcyA9IHttYXhZOiAxMCwgbWF4WDogMTAsIG1pblk6IC0yLCBtaW5YOiAtMn07XHJcbiAgICAgIHZhciBzaGFwZXMgPSBbe3BvaW50czogW3BvaW50XSwgcjowLjIsIHN0cm9rZVdpZHRoOiAzLCBzdHJva2U6IFwiI0ZGNUIyNFwiLCBmaWxsOlwiI0ZEMDAwMFwifV07XHJcblxyXG4gICAgICBjb29yZHMgPSBDb29yZHMoIHtzaGFwZXM6c2hhcGVzLCBib3VuZHM6Ym91bmRzLCBhc3BlY3Q6MX0gKTtcclxuXHJcbiAgICAgIHNpZGViYXIgPSAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKG51bGwsIFwiTWl0a8OkIG92YXQgcGlzdGVlbiB4LWphIHkta29vcmRpbmFhdGl0P1wiKVxyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIlZhc3RhdXNcIiwgY2xhc3NOYW1lOlwicGFuZWwtc3VjY2VzcyBwYW5lbC1leHRyYS1wYWRkaW5nXCJ9LCBcclxuICAgICAgICAgICAgQ29vcmRzQW5zd2VyRm9ybSgge3JlZjpcImZvcm1cIiwgb25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9IClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0YXNrSXNEb25lKSB7XHJcbiAgICAgIGNvb3JkcyA9IFRhc2tEb25lRGlzcGxheSgge3Njb3JlOjEwfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIktvb3JkaW5hYXRpc3RvbiBsdWtlbWluZW5cIiwgc3RlcDp0aGlzLnN0YXRlLnN0ZXAsIHN0ZXBzOnRoaXMucHJvcHMuc3RlcHN9ICksXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICBjb29yZHNcclxuICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgIHNpZGViYXJcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXBsZUNvb3Jkc1Rhc2s7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qIGdsb2JhbCBtb2R1bGUgKi9cclxuXHJcbi8qKlxyXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyAobWFpbmx5IG1hdGhzIHJlbGF0ZWQpIGZvciB0YXNrcy5cclxuICovXHJcbnZhciBUYXNrVXRpbHMgPSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBpbnRlZ2VyIGluIHJhbmdlIFttaW4sIG1heFsuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtaW4gICBJbmNsdXNpdmUgbG93ZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtYXggICBFeGNsdXNpdmUgdXBwZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXI9fSBjb3VudCBJZiBzZXQsIHJldHVybiBhIGxpc3Qgb2YgcmFuZG9tIHZhbHVlcy5cclxuICAgICAqIEByZXR1cm4geyhudW1iZXJ8W251bWJlcl0pfSBBIHNpbmdsZSBvciBtdWx0aXBsZSByYW5kb20gaW50cy5cclxuICAgICAqL1xyXG4gICAgcmFuZFJhbmdlOiBmdW5jdGlvbihtaW4sIG1heCwgY291bnQpIHtcclxuICAgICAgICBpZiAoY291bnQgJiYgY291bnQgPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciByYW5kcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHJhbmRzLnB1c2godGhpcy5yYW5kUmFuZ2UobWluLCBtYXgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmFuZHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSkgKyBtaW47XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgaW4gcmFuZ2UgWzAsIG1heFsuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICBtYXggICBFeGNsdXNpdmUgdXBwZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXI9fSBjb3VudCBJZiBzZXQsIHJldHVybiBhIGxpc3Qgb2YgcmFuZG9tIHZhbHVlcy5cclxuICAgICAqIEByZXR1cm4ge251bWJlcnxbbnVtYmVyXX0gQSBzaW5nbGUgb3IgbXVsdGlwbGUgcmFuZG9tIGludHMuXHJcbiAgICAgKi9cclxuICAgIHJhbmQ6IGZ1bmN0aW9uKG1heCwgY291bnQpIHtcclxuICAgICAgICBpZiAoY291bnQgJiYgY291bnQgPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciByYW5kcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHJhbmRzLnB1c2godGhpcy5yYW5kKG1heCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByYW5kcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKiogUmVvcmRlcnMgZ2l2ZW4gYXJyYXkgcmFuZG9tbHksIGRvZXNuJ3QgbW9kaWZ5IG9yaWdpbmFsIGFycmF5LiAqL1xyXG4gICAgc2h1ZmZsZTogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGNsb25lID0gYXJyLnNsaWNlKCk7XHJcbiAgICAgICAgdmFyIHNodWZmbGVkID0gW107XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSBjbG9uZS5sZW5ndGg7IGkgPiAwOyBpLS0pIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5yYW5kKGkpO1xyXG4gICAgICAgICAgICBzaHVmZmxlZC5wdXNoKGNsb25lLnNwbGljZShpbmRleCwgMSlbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNodWZmbGVkO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmdlIG9mIGludGVnZXJzLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9ICBtaW4gIEluY2x1c2l2ZSBsb3dlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSAgbWF4ICBFeGNsdXNpdmUgdXBwZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcj19IHN0ZXAgT3B0aW9uYWwgaW5jcmVtZW50IHZhbHVlLCBkZWZhdWx0cyB0byAxLlxyXG4gICAgICogQHJldHVybiB7W251bWJlcl19ICAgIFRoZSBzcGVjaWZpZWQgcmFuZ2Ugb2YgbnVtYmVycyBpbiBhbiBhcnJheS5cclxuICAgICAqL1xyXG4gICAgcmFuZ2U6IGZ1bmN0aW9uKG1pbiwgbWF4LCBzdGVwKSB7XHJcbiAgICAgICAgc3RlcCA9IHN0ZXAgfHwgMTtcclxuICAgICAgICB2YXIgcmVzID0gW107XHJcbiAgICAgICAgaWYgKHN0ZXAgPiAwKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBtaW47IGkgPCBtYXg7IGkgKz0gc3RlcCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2goaSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gbWluOyBqID4gbWF4OyBqICs9IHN0ZXApIHtcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayB3aGV0aGVyIGFycmF5cyBlcXVhbC5cclxuICAgICAqIEBwYXJhbSAgYXJyMVxyXG4gICAgICogQHBhcmFtICBhcnIyXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBhcnJheXNFcXVhbDogZnVuY3Rpb24oYXJyMSwgYXJyMikge1xyXG4gICAgICAgIGlmIChhcnIxLmxlbmd0aCAhPT0gYXJyMi5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFycjEuZXZlcnkoZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZCA9PT0gYXJyMltpXTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhbnNsYXRlIGFuIGFycmF5IG9mIHBvaW50cyBieSBnaXZlbiB4IGFuZCB5IHZhbHVlcy5cclxuICAgICAqIEBwYXJhbSAge1tbbnVtYmVyXV19IHBvaW50c1xyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgeFxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgeVxyXG4gICAgICogQHJldHVybiB7W1tudW1iZXJdXX1cclxuICAgICAqL1xyXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbihwb2ludHMsIHgsIHkpIHtcclxuICAgICAgICByZXR1cm4gcG9pbnRzLm1hcChmdW5jdGlvbihwb2ludCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW3BvaW50WzBdICsgeCwgcG9pbnRbMV0gKyB5XTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29tcGFyZSBnaXZlbiBhbnN3ZXIgdG8gdGhlIGNvcnJlY3Qgc29sdXRpb24uIFN1cHBvcnRzIHZhcmlvdXMgZGF0YSB0eXBlcy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gYW5zd2VyXHJcbiAgICAgKiBAcGFyYW0gc29sdXRpb24gQSBzdHJpbmcsIG51bWJlciwgYXJyYXksIG9iamVjdCBvciBSZWdFeHAuXHJcbiAgICAgKiBAcGFyYW0gZXBzaWxvbiAgT3B0aW9uYWwgbWF4IGVycm9yIHZhbHVlIGZvciBmbG9hdCBjb21wYXJpc29uLCBkZWZhdWx0IGlzIDAuMDAxLlxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiBjb3JyZWN0LCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIG1hdGNoZXNTb2x1dGlvbjogZnVuY3Rpb24oYW5zd2VyLCBzb2x1dGlvbiwgZXBzaWxvbikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgYW5zd2VyID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci50cmltKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHNvbHV0aW9uID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgIGFuc3dlciA9IHBhcnNlRmxvYXQoYW5zd2VyKTtcclxuICAgICAgICAgICAgaWYgKGlzTmFOKGFuc3dlcikpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgZXBzaWxvbiA9IGVwc2lsb24gPT09IHVuZGVmaW5lZCA/IDAuMDAxIDogZXBzaWxvbjtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmFicyhhbnN3ZXIgLSBzb2x1dGlvbikgPD0gZXBzaWxvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIFJlZ0V4cCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc29sdXRpb24udGVzdChhbnN3ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoc29sdXRpb24gaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICBpZiAoIWFuc3dlciBpbnN0YW5jZW9mIEFycmF5IHx8IGFuc3dlci5sZW5ndGggIT09IHNvbHV0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhbnN3ZXIuZXZlcnkoZnVuY3Rpb24oZCwgaSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQubWF0Y2hlc1NvbHV0aW9uKGQsIHNvbHV0aW9uW2ldLCBlcHNpbG9uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc29sdXRpb24gaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgaWYgKCFhbnN3ZXIgaW5zdGFuY2VvZiBPYmplY3QpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgYW5zS2V5cyA9IE9iamVjdC5rZXlzKGFuc3dlcik7XHJcbiAgICAgICAgICAgIGlmIChhbnNLZXlzLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoc29sdXRpb24pLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhbnNLZXlzLmV2ZXJ5KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Lm1hdGNoZXNTb2x1dGlvbihhbnN3ZXJbZF0sIHNvbHV0aW9uW2RdKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYW5zd2VyID09PSBzb2x1dGlvbjtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGFza1V0aWxzOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuJChmdW5jdGlvbigpIHtcclxuICAgIHZhciBBcHBsaWNhdGlvbiA9IHJlcXVpcmUoXCIuL2pzL2FwcGxpY2F0aW9uLmpzXCIpO1xyXG5cclxuICAgIFJlYWN0LnJlbmRlckNvbXBvbmVudChcclxuICAgICAgICBBcHBsaWNhdGlvbihudWxsICksXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHBsaWNhdGlvblwiKVxyXG4gICAgKTtcclxufSk7XHJcbi8qIGpzaGludCBpZ25vcmU6ZW5kICovIl19
