(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */
"use strict";
/* globals React, require, module */


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
    return {selectedTask: "Koordinaatiston lukeminen"};
  },

  render: function() {
    /* jshint ignore:start */
    var tasks = {
      "Koordinaatiston lukeminen": (SimpleCoordsTask( {onTaskDone:this.handleTaskDone, steps:5})),
      "Kappaleiden tunnistaminen": (BasicShapesTask( {onTaskDone:this.handleTaskDone}))
    };

    var taskListElems = Object.keys(tasks).map(function(taskName) {
      return (
        React.DOM.li(null, 
          React.DOM.a( {href:"", onClick:this.handleListClick}, taskName)
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
},{"./tasks/basic-shapes-task":7,"./tasks/simple-coords-task":8}],2:[function(require,module,exports){
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


var Mixins = require("./mixins");


/**
 * Various common form components.
 */
var FormComponents = (function(){

  var my = {};

  /**
   * A form that disables submitting when contents are invalid.
   */
  my.AnswerForm = React.createClass({displayName: 'AnswerForm',

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
  my.ReInput = React.createClass({displayName: 'ReInput',

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
  my.NumInput = React.createClass({displayName: 'NumInput',

    propTypes: {
      step: React.PropTypes.number,
      placeholder: React.PropTypes.string,
      btnClass: React.PropTypes.string,
      onValidityChange: React.PropTypes.func
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
      var ReInput = my.ReInput;
      var btnClass = this.props.btnClass || "btn btn-lg btn-info";
      var validationState = this.state.isValid ? "has-success" : "has-error";

      return (
        React.DOM.div( {className:"form-group " + validationState}, 
          React.DOM.div( {className:"row"}, 
            React.DOM.div( {className:"col-sm-3 col-xs-3"}, 
              React.DOM.button( {className:btnClass + " pull-right", onClick:this.handleDecrement}, 
                React.DOM.span( {className:"glyphicon glyphicon-chevron-left"})
              )
            ),
            React.DOM.div( {className:"col-sm-6 col-xs-6"}, 
              React.DOM.input( {type:"number", value:this.state.value, onChange:this.handleChange,
              className:"form-control input-lg text-center", placeholder:this.props.placeholder})
            ),
            React.DOM.div( {className:"col-sm-3 col-xs-3"}, 
              React.DOM.button( {className:btnClass + " pull-left", onClick:this.handleIncrement}, 
                React.DOM.span( {className:"glyphicon glyphicon-chevron-right"})
              )
            )
          )
        )
      );
      /* jshint ignore:end */
    }
  });

  return my;
})();


module.exports = FormComponents;
},{"./mixins":5}],4:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";


var FormComponents = require("./form-components");
var AnswerForm = FormComponents.AnswerForm;
var NumInput = FormComponents.NumInput;


/**
 * Complete answer forms for tasks.
 */
var Forms = {
  /**
   * An answer form with inputs for x and y coordinates.
   */
  CoordsAnswerForm: React.createClass({displayName: 'CoordsAnswerForm',

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
  })
};


module.exports = Forms;

},{"./form-components":3}],5:[function(require,module,exports){
/** @jsx React.DOM */
/* global module */
"use strict";

/**
 * Component extensions i.e. mixins.
 */


/**
 * Render LaTex maths notation into web fonts using MathJax.
 * TODO
 */
// var MathJax = React.createClass({
//   reprocess: function() {
//     var elem = this.refs.script.getDOMNode();
//     console.log(elem);
//     MathJax.Hub.Queue(["Reprocess", MathJax.Hub, elem]);
//   },

//   componentDidMount: function() {
//     this.reprocess();
//   },

//   componentWillReceiveProps: function() {
//     this.reprocess();
//   },

//   render: function() {
//     return (
//       /* jshint ignore:start */
//       <span>
//         <script ref="script" type="math/tex">{this.props.children}</script>
//       </span>
//       /* jshint ignore:end */
//     );
//   }
// });

/**
 * Provides a setInterval function which will get cleaned up when
 * the component is destroyed.
 */
var SetIntervalMixin = {
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
 * Apply CSS classes for set duration, useful for singleshot animations.
 */
var TriggerAnimationMixin = {
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

module.exports = {
  SetIntervalMixin: SetIntervalMixin,
  TriggerAnimationMixin: TriggerAnimationMixin
};

},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
},{"../components/coords.js":2,"../components/task-components.js":6,"../utils/task-utils.js":9}],8:[function(require,module,exports){
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
},{"../components/coords":2,"../components/forms":4,"../components/task-components":6,"../utils/task-utils":9}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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
},{"./js/application.js":1}]},{},[10])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEFsZWtzaVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXHdhdGNoaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9jb29yZHMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL2Zvcm0tY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvZm9ybXMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL21peGlucy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvdGFza3MvYmFzaWMtc2hhcGVzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy91dGlscy90YXNrLXV0aWxzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qIGdsb2JhbHMgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cclxuXHJcbnZhciBTaW1wbGVDb29yZHNUYXNrID0gcmVxdWlyZShcIi4vdGFza3Mvc2ltcGxlLWNvb3Jkcy10YXNrXCIpO1xyXG52YXIgQmFzaWNTaGFwZXNUYXNrID0gcmVxdWlyZShcIi4vdGFza3MvYmFzaWMtc2hhcGVzLXRhc2tcIik7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbnRhaW5lciBhbmQgbGlua3MgZm9yIGV4YW1wbGUgdGFza3MuXHJcbiAqL1xyXG52YXIgQXBwbGljYXRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBcHBsaWNhdGlvbicsXHJcblxyXG4gIGhhbmRsZUxpc3RDbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdmFyIHRhc2tOYW1lID0gZS50YXJnZXQudGV4dDtcclxuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkVGFzazogdGFza05hbWV9KTtcclxuICB9LFxyXG5cclxuICBoYW5kbGVUYXNrRG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIlRhc2sgZG9uZSAtIGhlcmUncyB3aGVyZSB0aGUgdGFzayBjb25uZWN0cyB0byBhbiBleHRlcm5hbCBhcHAuXCIpO1xyXG4gIH0sXHJcblxyXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge3NlbGVjdGVkVGFzazogXCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCJ9O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgdGFza3MgPSB7XHJcbiAgICAgIFwiS29vcmRpbmFhdGlzdG9uIGx1a2VtaW5lblwiOiAoU2ltcGxlQ29vcmRzVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZSwgc3RlcHM6NX0pKSxcclxuICAgICAgXCJLYXBwYWxlaWRlbiB0dW5uaXN0YW1pbmVuXCI6IChCYXNpY1NoYXBlc1Rhc2soIHtvblRhc2tEb25lOnRoaXMuaGFuZGxlVGFza0RvbmV9KSlcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHRhc2tMaXN0RWxlbXMgPSBPYmplY3Qua2V5cyh0YXNrcykubWFwKGZ1bmN0aW9uKHRhc2tOYW1lKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmxpKG51bGwsIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmEoIHtocmVmOlwiXCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVMaXN0Q2xpY2t9LCB0YXNrTmFtZSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIHZhciB0YXNrID0gdGFza3NbdGhpcy5zdGF0ZS5zZWxlY3RlZFRhc2tdO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibGlzdC1pbmxpbmVcIn0sIFxyXG4gICAgICAgICAgdGFza0xpc3RFbGVtc1xyXG4gICAgICAgICksXHJcblxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWNvbnRhaW5lclwifSwgXHJcbiAgICAgICAgICB0YXNrXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBsaWNhdGlvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBkMywgTWF0aFV0aWxzLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqIEEgMkQgY29vcmRpbmF0ZSBzeXN0ZW0uICovXHJcbnZhciBDb29yZHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb29yZHMnLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgIHNoYXBlczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LFxyXG4gICAgYm91bmRzOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgYXNwZWN0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlUmVzaXplOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBwYXJlbnQgPSAkKHRoaXMuZ2V0RE9NTm9kZSgpLnBhcmVudE5vZGUpO1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7d2lkdGg6IHBhcmVudC53aWR0aCgpfSk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7d2lkdGg6IDB9O1xyXG4gIH0sXHJcblxyXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBkcmF3QXhlczogdHJ1ZSxcclxuICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgYm91bmRzOiB7bWF4WToxMCwgbWF4WDoxMCwgbWluWTowLCBtaW5YOjB9LFxyXG4gICAgICBhc3BlY3Q6IDFcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdGhpcy5oYW5kbGVSZXNpemUpO1xyXG4gICAgdGhpcy5oYW5kbGVSZXNpemUoKTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLmhhbmRsZVJlc2l6ZSk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciBtYXJnaW4gPSB7XHJcbiAgICAgIHRvcDogMTAsXHJcbiAgICAgIHJpZ2h0OiAxMCxcclxuICAgICAgYm90dG9tOiAxMCxcclxuICAgICAgbGVmdDogMTBcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHdpZHRoID0gdGhpcy5zdGF0ZS53aWR0aCA/IHRoaXMuc3RhdGUud2lkdGggLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCA6IDA7XHJcbiAgICB2YXIgaGVpZ2h0ID0gTWF0aC5yb3VuZCh3aWR0aCAqIHRoaXMucHJvcHMuYXNwZWN0KSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xyXG5cclxuICAgIHZhciBib3VuZHMgPSB0aGlzLnByb3BzLmJvdW5kcztcclxuICAgIHZhciBzcGFjaW5nID0gTWF0aC5yb3VuZChNYXRoLm1pbihcclxuICAgICAgd2lkdGggLyBNYXRoLmFicyhib3VuZHMubWF4WCAtIGJvdW5kcy5taW5YKSxcclxuICAgICAgaGVpZ2h0IC8gTWF0aC5hYnMoYm91bmRzLm1heFkgLSBib3VuZHMubWluWSlcclxuICAgICkpO1xyXG5cclxuICAgIHZhciB4ID0gZDMuc2NhbGUubGluZWFyKClcclxuICAgICAgLmRvbWFpbihbYm91bmRzLm1pblgsIGJvdW5kcy5taW5YICsgMV0pXHJcbiAgICAgIC5yYW5nZShbMCwgc3BhY2luZ10pO1xyXG5cclxuICAgIHZhciB5ID0gZDMuc2NhbGUubGluZWFyKClcclxuICAgICAgLmRvbWFpbihbYm91bmRzLm1pblksIGJvdW5kcy5taW5ZICsgMV0pXHJcbiAgICAgIC5yYW5nZShbaGVpZ2h0LCBoZWlnaHQgLSBzcGFjaW5nXSk7XHJcblxyXG4gICAgdmFyIGZ1bGxXaWR0aCA9IHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQ7XHJcbiAgICB2YXIgZnVsbEhlaWdodCA9IGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tO1xyXG4gICAgdmFyIHRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIjtcclxuXHJcbiAgICB2YXIgc2hhcGVzLCBncmlkO1xyXG4gICAgaWYgKHRoaXMuc3RhdGUud2lkdGgpIHtcclxuICAgICAgc2hhcGVzID0gU2hhcGVzKCB7eDp4LCB5OnksIHNwYWNpbmc6c3BhY2luZywgZGF0YTp0aGlzLnByb3BzLnNoYXBlc30gKTtcclxuICAgICAgZ3JpZCA9IEdyaWQoIHtkcmF3QXhlczp0aGlzLnByb3BzLmRyYXdBeGVzLCB4OngsIHk6eSwgYm91bmRzOmJvdW5kc30gKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29vcmRzLWNvbnRhaW5lclwifSwgXHJcbiAgICAgICAgUmVhY3QuRE9NLnN2Zygge3dpZHRoOmZ1bGxXaWR0aCwgaGVpZ2h0OmZ1bGxIZWlnaHR9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5nKCB7dHJhbnNmb3JtOnRyYW5zZm9ybX0sIFxyXG4gICAgICAgICAgICBncmlkLFxyXG4gICAgICAgICAgICBzaGFwZXNcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG4vKiogQSBncmlkIGZvciB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0uICovXHJcbnZhciBHcmlkID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnR3JpZCcsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgeDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICBib3VuZHM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcclxuICAgIHNwYWNpbmc6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICB0cmFuc2l0aW9uRHVyYXRpb246IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICBkcmF3QXhlczogUmVhY3QuUHJvcFR5cGVzLmJvb2xcclxuICB9LFxyXG5cclxuICAvKiogUmVkcmF3IGdyaWQuICAqL1xyXG4gIHVwZGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgIHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QodGhpcy5nZXRET01Ob2RlKCkpO1xyXG4gICAgdmFyIGJvdW5kcyA9IHByb3BzLmJvdW5kcztcclxuICAgIHZhciBzcGFjaW5nID0gcHJvcHMuc3BhY2luZztcclxuICAgIHZhciB4ID0gcHJvcHMueDtcclxuICAgIHZhciB5ID0gcHJvcHMueTtcclxuXHJcbiAgICB2YXIgeFJhbmdlID0gZDMucmFuZ2UoTWF0aC5jZWlsKChib3VuZHMubWluWCkgLyBzcGFjaW5nKSwgTWF0aC5yb3VuZChib3VuZHMubWF4WCkgKyBzcGFjaW5nLCBzcGFjaW5nKTtcclxuICAgIHZhciB5UmFuZ2UgPSBkMy5yYW5nZShNYXRoLmNlaWwoKGJvdW5kcy5taW5ZKSAvIHNwYWNpbmcpLCBNYXRoLnJvdW5kKGJvdW5kcy5tYXhZKSArIHNwYWNpbmcsIHNwYWNpbmcpO1xyXG4gICAgdmFyIGRhdGEgPSB4UmFuZ2UuY29uY2F0KHlSYW5nZSk7XHJcbiAgICB2YXIgaXNYID0gZnVuY3Rpb24oaW5kZXgpIHsgcmV0dXJuIGluZGV4IDwgeFJhbmdlLmxlbmd0aDsgfTtcclxuXHJcbiAgICB2YXIgYXhlcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCIuYXhpc1wiKVxyXG4gICAgICAuZGF0YShkYXRhKTtcclxuXHJcbiAgICBheGVzLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICByZXR1cm4gXCJheGlzIFwiICsgKChwcm9wcy5kcmF3QXhlcyAmJiBkID09PSAwKSA/IFwidGhpY2tcIiA6IFwiXCIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXhlcy50cmFuc2l0aW9uKCkuZHVyYXRpb24ocHJvcHMudHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHgoZCkgOiB4KGJvdW5kcy5taW5YKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB5KGJvdW5kcy5taW5ZKSA6IHkoZCk7IH0pXHJcbiAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoYm91bmRzLm1heFgpOyB9KVxyXG4gICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1heFkpIDogeShkKTsgfSk7XHJcblxyXG4gICAgYXhlcy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG4gICAgaWYgKHByb3BzLmRyYXdBeGVzKSB7XHJcbiAgICAgIHZhciBsYWJlbHMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwiLmxhYmVsXCIpLmRhdGEoZGF0YSk7XHJcblxyXG4gICAgICBsYWJlbHMuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcImxhYmVsIFwiICsgKGlzWChpKSA/IFwieFwiIDogXCJ5XCIpOyB9KVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHsgaWYgKCFkKSByZXR1cm4gXCJub25lXCI7IH0pXHJcbiAgICAgICAgLnRleHQoT2JqZWN0KVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8gXCIxLjRlbVwiIDogXCIuM2VtXCI7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyBudWxsIDogXCItLjhlbVwiOyB9KVxyXG4gICAgICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIDEgKyBcImVtXCIpO1xyXG5cclxuICAgICAgbGFiZWxzLnRyYW5zaXRpb24oKS5kdXJhdGlvbihwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHgoZCkgOiB4KDApOyB9KVxyXG4gICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB5KDApIDogeShkKTsgfSk7XHJcblxyXG4gICAgICBsYWJlbHMuZXhpdCgpLnJlbW92ZSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBkcmF3QXhlczogdHJ1ZSxcclxuICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uOiA1NTAsXHJcbiAgICAgIHNwYWNpbmc6IDFcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy51cGRhdGUodGhpcy5wcm9wcyk7XHJcbiAgfSxcclxuXHJcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcclxuICAgIHRoaXMudXBkYXRlKG5leHRQcm9wcyk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgUmVhY3QuRE9NLmcoIHtjbGFzc05hbWU6XCJheGVzXCJ9KVxyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgKTtcclxuICB9XHJcbn0pO1xyXG5cclxuXHJcbi8qKiBWYXJpb3VzIGdlb21ldHJpYyBzaGFwZXMgdG8gYmUgZHJhd24gb24gdGhlIGNvb3JkaW5hdGUgc3lzdGVtLiAqL1xyXG52YXIgU2hhcGVzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU2hhcGVzJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICBkYXRhOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZCxcclxuICAgIHg6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICB5OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgc3BhY2luZzogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgdHJhbnNpdGlvbkR1cmF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgfSxcclxuXHJcbiAgLyoqIFJlZHJhdyBzaGFwZXMuIEdldHMgY2FsbGVkIHdoZW5ldmVyIHNoYXBlcyBhcmUgdXBkYXRlZCBvciBzY3JlZW4gcmVzaXplcy4gKi9cclxuICB1cGRhdGU6IGZ1bmN0aW9uKHByb3BzKSB7XHJcbiAgICB2YXIgY29udGFpbmVyID0gZDMuc2VsZWN0KHRoaXMuZ2V0RE9NTm9kZSgpKTtcclxuICAgIHZhciB0cmFuc2l0aW9uRHVyYXRpb24gPSBwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24gfHwgNTUwO1xyXG5cclxuICAgIHZhciBwb2x5Z29ucyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJwb2x5Z29uLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA+IDI7IH0pKTtcclxuXHJcbiAgICB2YXIgYWRkZWRQb2x5Z29ucyA9IHBvbHlnb25zLmVudGVyKCkuYXBwZW5kKFwicG9seWdvblwiKS5hdHRyKFwiY2xhc3NcIiwgXCJzaGFwZVwiKTtcclxuXHJcbiAgICBwb2x5Z29ucy50cmFuc2l0aW9uKCkuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAuYXR0cihcInBvaW50c1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQucG9pbnRzLm1hcChmdW5jdGlvbihwcykge1xyXG4gICAgICAgICAgcmV0dXJuIFtwcm9wcy54KHBzWzBdKSwgcHJvcHMueShwc1sxXSldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICBwb2x5Z29ucy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG5cclxuICAgIHZhciBjaXJjbGVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcImNpcmNsZS5zaGFwZVwiKVxyXG4gICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPT0gMTsgfSkpO1xyXG5cclxuICAgIHZhciBhZGRlZENpcmNsZXMgPSBjaXJjbGVzLmVudGVyKCkuYXBwZW5kKFwiY2lyY2xlXCIpLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpO1xyXG5cclxuICAgIGNpcmNsZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzBdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzBdWzFdKTsgfSlcclxuICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnNwYWNpbmcgKiAoZC5yIHx8IDAuMik7IH0pO1xyXG5cclxuICAgIGNpcmNsZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuXHJcbiAgICB2YXIgbGluZXMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwibGluZS5zaGFwZVwiKVxyXG4gICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPT0gMjsgfSkpO1xyXG5cclxuICAgIHZhciBhZGRlZExpbmVzID0gbGluZXMuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpO1xyXG5cclxuICAgIGxpbmVzLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueChkLnBvaW50c1swXVswXSk7IH0pXHJcbiAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueShkLnBvaW50c1swXVsxXSk7IH0pXHJcbiAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueChkLnBvaW50c1sxXVswXSk7IH0pXHJcbiAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueShkLnBvaW50c1sxXVsxXSk7IH0pO1xyXG5cclxuICAgIGxpbmVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBBdHRhY2ggY2xpY2sgZXZlbnQgbGlzdGVuZXJzLlxyXG4gICAgW2FkZGVkUG9seWdvbnMsIGFkZGVkQ2lyY2xlcywgYWRkZWRMaW5lc10uZm9yRWFjaChmdW5jdGlvbihhZGRlZCkge1xyXG4gICAgICBhZGRlZC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKGQub25DbGljaykpXHJcbiAgICAgICAgICBkLm9uQ2xpY2soZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2V0IGNvbW1vbiBhdHRyaWJ1dGVzLlxyXG4gICAgY29udGFpbmVyLnNlbGVjdEFsbChcIi5zaGFwZVwiKVxyXG4gICAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5maWxsIHx8IFwidHJhbnNwYXJlbnRcIjsgfSlcclxuICAgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zdHJva2UgfHwgXCJzdGVlbGJsdWVcIjsgfSlcclxuICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gKGQuc3Ryb2tlV2lkdGggfHwgMikgKyBcInB4XCI7IH0pO1xyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMudXBkYXRlKHRoaXMucHJvcHMpO1xyXG4gIH0sXHJcblxyXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24obmV4dFByb3BzKSB7XHJcbiAgICB0aGlzLnVwZGF0ZShuZXh0UHJvcHMpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICByZXR1cm4gUmVhY3QuRE9NLmcoIHtjbGFzc05hbWU6XCJzaGFwZXNcIn0pO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb29yZHM7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbnZhciBNaXhpbnMgPSByZXF1aXJlKFwiLi9taXhpbnNcIik7XHJcblxyXG5cclxuLyoqXHJcbiAqIFZhcmlvdXMgY29tbW9uIGZvcm0gY29tcG9uZW50cy5cclxuICovXHJcbnZhciBGb3JtQ29tcG9uZW50cyA9IChmdW5jdGlvbigpe1xyXG5cclxuICB2YXIgbXkgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSBmb3JtIHRoYXQgZGlzYWJsZXMgc3VibWl0dGluZyB3aGVuIGNvbnRlbnRzIGFyZSBpbnZhbGlkLlxyXG4gICAqL1xyXG4gIG15LkFuc3dlckZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBbnN3ZXJGb3JtJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIGJ0bkNvcnJlY3RBbmltQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGJ0bkluY29ycmVjdEFuaW1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgZm9ybUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICBtaXhpbnM6IFtNaXhpbnMuVHJpZ2dlckFuaW1hdGlvbk1peGluXSxcclxuXHJcbiAgICAvKiogU3VibWl0IGFuc3dlciBpZiBmb3JtIGlzIHZhbGlkLiAqL1xyXG4gICAgaGFuZGxlU3VibWl0OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgaWYgKHRoaXMuc3RhdGUuaXNWYWxpZCkge1xyXG4gICAgICAgIHRoaXMucHJvcHMub25BbnN3ZXIoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtzaG93RXJyb3JzOiB0cnVlfSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBidG4gPSAkKHRoaXMucmVmcy5idG4uZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdGhpcy5hbmltYXRlKGJ0biwgdGhpcy5wcm9wcy5idG5Db3JyZWN0QW5pbUNsYXNzKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlSW5jb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGJ0biA9ICQodGhpcy5yZWZzLmJ0bi5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB0aGlzLmFuaW1hdGUoYnRuLCB0aGlzLnByb3BzLmJ0bkluY29ycmVjdEFuaW1DbGFzcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbGlkaXR5OiBmdW5jdGlvbihpc1ZhbGlkKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe2lzVmFsaWQ6IGlzVmFsaWQsIGlzRGlydHk6IHRydWV9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENsZWFyIHZhbHVlcyBhbmQgdmFsaWRhdGlvbiBzdGF0ZXMgZm9yIGFsbCBjaGlsZCBlbGVtZW50cy4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICBzaG93RXJyb3JzOiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBmb3JtQ2xhc3M6IFwiZm9ybS1ob3Jpem9udGFsXCIsXHJcbiAgICAgICAgYnRuQ2xhc3M6IFwiYnRuIGJ0bi1zdWNjZXNzIGJ0bi1sZyBidG4tYmxvY2tcIixcclxuICAgICAgICBidG5Db3JyZWN0QW5pbUNsYXNzOiBcImFuaW1hdGVkIGJvdW5jZVwiLFxyXG4gICAgICAgIGJ0bkluY29ycmVjdEFuaW1DbGFzczogXCJhbmltYXRlZCBzaGFrZVwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICBzaG93RXJyb3JzOiBmYWxzZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMucHJvcHMuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgY2hpbGQucHJvcHMub25WYWxpZGl0eUNoYW5nZSA9IHRoaXMuc2V0VmFsaWRpdHk7XHJcbiAgICAgICAgY2hpbGQucHJvcHMuc2hvd0Vycm9yID0gdGhpcy5zdGF0ZS5zaG93RXJyb3JzO1xyXG4gICAgICAgIHJldHVybiBjaGlsZDtcclxuICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgIHZhciBidG5DbGFzcyA9IHRoaXMucHJvcHMuYnRuQ2xhc3MgKyAodGhpcy5zdGF0ZS5pc1ZhbGlkID8gXCJcIiA6IFwiIGRpc2FibGVkXCIpO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZm9ybSgge3JvbGU6XCJmb3JtXCIsIGNsYXNzTmFtZTp0aGlzLnByb3BzLmZvcm1DbGFzcywgb25TdWJtaXQ6dGhpcy5oYW5kbGVTdWJtaXQsIG5vVmFsaWRhdGU6dHJ1ZX0sIFxyXG4gICAgICAgICAgY2hpbGRyZW4sXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcImJ0blwiLCB0eXBlOlwic3VibWl0XCIsIHZhbHVlOlwiVmFzdGFhXCIsIGNsYXNzTmFtZTpidG5DbGFzc30gKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIDxpbnB1dD4gd2l0aCB2YWxpZGF0aW9uIHN0YXRlcy5cclxuICAgKi9cclxuICBteS5SZUlucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUmVJbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHJlOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgICBzaG93RXJyb3I6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgICByZXF1aXJlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICB0eXBlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIG9uVmFsaWRpdHlDaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZWFkIHZhbHVlLCB2YWxpZGF0ZSwgbm90aWZ5IHBhcmVudCBlbGVtZW50IGlmIGFuIGV2ZW50IGlzIGF0dGFjaGVkLiAqL1xyXG4gICAgaGFuZGxlQ2hhbmdlOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy52YWxpZGF0b3IudGVzdChlLnRhcmdldC52YWx1ZSk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiBlLnRhcmdldC52YWx1ZSwgaXNWYWxpZDogaXNWYWxpZCwgaXNEaXJ0eTogdHJ1ZX0pO1xyXG5cclxuICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZShpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiB2YWx1ZX0pO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUudmFsdWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5pbnB1dC5nZXRET01Ob2RlKCkuc2VsZWN0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDbGVhciB2YWx1ZSBhbmQgcmVzZXQgdmFsaWRhdGlvbiBzdGF0ZXMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbGlkYXRvcjogZnVuY3Rpb24ocmUpIHtcclxuICAgICAgdGhpcy52YWxpZGF0b3IgPSBuZXcgUmVnRXhwKHJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFZhbGlkYXRvcih0aGlzLnByb3BzLnJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24obmV3UHJvcHMpIHtcclxuICAgICAgdGhpcy5zZXRWYWxpZGF0b3IobmV3UHJvcHMucmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZTogL15cXHMqLT9cXGQrXFxzKiQvLFxyXG4gICAgICAgIHNob3dFcnJvcjogZmFsc2UsXHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiBcIlwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHZhbGlkYXRpb25TdGF0ZSA9IFJlYWN0LmFkZG9ucy5jbGFzc1NldCh7XHJcbiAgICAgICAgXCJoYXMtc3VjY2Vzc1wiOiB0aGlzLnN0YXRlLmlzVmFsaWQgJiYgdGhpcy5zdGF0ZS5pc0RpcnR5LFxyXG4gICAgICAgIFwiaGFzLXdhcm5pbmdcIjogIXRoaXMuc3RhdGUuaXNEaXJ0eSAmJiB0aGlzLnByb3BzLnNob3dFcnJvcixcclxuICAgICAgICBcImhhcy1lcnJvclwiOiAhdGhpcy5zdGF0ZS5pc1ZhbGlkXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGVycm9yO1xyXG4gICAgICBpZiAodGhpcy5wcm9wcy5zaG93RXJyb3IpIHtcclxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuaXNWYWxpZCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJjb250cm9sLWxhYmVsXCJ9LCBcIlZpcmhlZWxsaW5lbiBzecO2dGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMucHJvcHMucmVxdWlyZWQgJiYgdGhpcy52YWx1ZSgpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJjb250cm9sLWxhYmVsXCJ9LCBcIlTDpHl0w6QgdMOkbcOkIGtlbnR0w6RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cCBcIiArIHZhbGlkYXRpb25TdGF0ZX0sIFxyXG4gICAgICAgICAgZXJyb3IsXHJcbiAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtyZWY6XCJpbnB1dFwiLCBvbkNoYW5nZTp0aGlzLmhhbmRsZUNoYW5nZSwgdmFsdWU6dGhpcy5zdGF0ZS52YWx1ZSwgcGxhY2Vob2xkZXI6dGhpcy5wcm9wcy5wbGFjZWhvbGRlcixcclxuICAgICAgICAgIHR5cGU6dGhpcy5wcm9wcy50eXBlLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgXCIgKyB0aGlzLnByb3BzLmNsYXNzTmFtZX0gKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSBudW1iZXIgaW5wdXQgd2l0aCB0d28gYnV0dG9ucyBmb3IgaW5jcmVtZW50aW5nIGFuZCBkZWNyZW1lbnRpbmcuXHJcbiAgICovXHJcbiAgbXkuTnVtSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOdW1JbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXA6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgb25WYWxpZGl0eUNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsdWVBbmRWYWxpZGl0eTogZnVuY3Rpb24odmFsdWUsIGlzVmFsaWQpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdmFsdWU6IHZhbHVlLCBpc1ZhbGlkOiBpc1ZhbGlkXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoJC5pc0Z1bmN0aW9uKHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZSkpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSgwLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlRGVjcmVtZW50OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KHRoaXMudmFsdWUoKSAtIHRoaXMucHJvcHMuc3RlcCwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUluY3JlbWVudDogZnVuY3Rpb24oZSkge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh0aGlzLnZhbHVlKCkgKyB0aGlzLnByb3BzLnN0ZXAsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVzZXQgc3RhdGUgdG8gaW5wdXQgdmFsdWUgaWYgaW5wdXQgdmFsdWUgaXMgYSBudW1iZXIuICovXHJcbiAgICBoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyIHZhbCA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICB2YXIgaXNWYWxpZCA9ICFpc05hTihwYXJzZUZsb2F0KHZhbCkpO1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkodmFsLCBpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gcGFyc2VGbG9hdCh0aGlzLnN0YXRlLnZhbHVlKSB8fCAwO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHZhbHVlOiBudWxsLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWVcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdGVwOiAxXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIFJlSW5wdXQgPSBteS5SZUlucHV0O1xyXG4gICAgICB2YXIgYnRuQ2xhc3MgPSB0aGlzLnByb3BzLmJ0bkNsYXNzIHx8IFwiYnRuIGJ0bi1sZyBidG4taW5mb1wiO1xyXG4gICAgICB2YXIgdmFsaWRhdGlvblN0YXRlID0gdGhpcy5zdGF0ZS5pc1ZhbGlkID8gXCJoYXMtc3VjY2Vzc1wiIDogXCJoYXMtZXJyb3JcIjtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXAgXCIgKyB2YWxpZGF0aW9uU3RhdGV9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTMgY29sLXhzLTNcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6YnRuQ2xhc3MgKyBcIiBwdWxsLXJpZ2h0XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVEZWNyZW1lbnR9LCBcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLWxlZnRcIn0pXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgY29sLXhzLTZcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3R5cGU6XCJudW1iZXJcIiwgdmFsdWU6dGhpcy5zdGF0ZS52YWx1ZSwgb25DaGFuZ2U6dGhpcy5oYW5kbGVDaGFuZ2UsXHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LWxnIHRleHQtY2VudGVyXCIsIHBsYWNlaG9sZGVyOnRoaXMucHJvcHMucGxhY2Vob2xkZXJ9KVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTMgY29sLXhzLTNcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6YnRuQ2xhc3MgKyBcIiBwdWxsLWxlZnRcIiwgb25DbGljazp0aGlzLmhhbmRsZUluY3JlbWVudH0sIFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHRcIn0pXHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gbXk7XHJcbn0pKCk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtQ29tcG9uZW50czsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxudmFyIEZvcm1Db21wb25lbnRzID0gcmVxdWlyZShcIi4vZm9ybS1jb21wb25lbnRzXCIpO1xyXG52YXIgQW5zd2VyRm9ybSA9IEZvcm1Db21wb25lbnRzLkFuc3dlckZvcm07XHJcbnZhciBOdW1JbnB1dCA9IEZvcm1Db21wb25lbnRzLk51bUlucHV0O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDb21wbGV0ZSBhbnN3ZXIgZm9ybXMgZm9yIHRhc2tzLlxyXG4gKi9cclxudmFyIEZvcm1zID0ge1xyXG4gIC8qKlxyXG4gICAqIEFuIGFuc3dlciBmb3JtIHdpdGggaW5wdXRzIGZvciB4IGFuZCB5IGNvb3JkaW5hdGVzLlxyXG4gICAqL1xyXG4gIENvb3Jkc0Fuc3dlckZvcm06IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nvb3Jkc0Fuc3dlckZvcm0nLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBvbkFuc3dlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaXNDb3JyZWN0ID0gdGhpcy5wcm9wcy5vbkFuc3dlcih0aGlzLnJlZnMueC52YWx1ZSgpLCB0aGlzLnJlZnMueS52YWx1ZSgpKTtcclxuICAgICAgaWYgKGlzQ29ycmVjdCkge1xyXG4gICAgICAgIHRoaXMucmVmcy5mb3JtLmhhbmRsZUNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlSW5jb3JyZWN0QW5zd2VyKCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlZnMuZm9ybS5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgQW5zd2VyRm9ybSgge3JlZjpcImZvcm1cIiwgY2xhc3NOYW1lOlwiZm9ybS1ob3Jpem9udGFsXCIsIG9uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSwgXHJcbiAgICAgICAgICBOdW1JbnB1dCgge3JlZjpcInhcIiwgcGxhY2Vob2xkZXI6XCJ4XCJ9KSxcclxuICAgICAgICAgIE51bUlucHV0KCB7cmVmOlwieVwiLCBwbGFjZWhvbGRlcjpcInlcIn0pXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pXHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtcztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQ29tcG9uZW50IGV4dGVuc2lvbnMgaS5lLiBtaXhpbnMuXHJcbiAqL1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW5kZXIgTGFUZXggbWF0aHMgbm90YXRpb24gaW50byB3ZWIgZm9udHMgdXNpbmcgTWF0aEpheC5cclxuICogVE9ET1xyXG4gKi9cclxuLy8gdmFyIE1hdGhKYXggPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbi8vICAgcmVwcm9jZXNzOiBmdW5jdGlvbigpIHtcclxuLy8gICAgIHZhciBlbGVtID0gdGhpcy5yZWZzLnNjcmlwdC5nZXRET01Ob2RlKCk7XHJcbi8vICAgICBjb25zb2xlLmxvZyhlbGVtKTtcclxuLy8gICAgIE1hdGhKYXguSHViLlF1ZXVlKFtcIlJlcHJvY2Vzc1wiLCBNYXRoSmF4Lkh1YiwgZWxlbV0pO1xyXG4vLyAgIH0sXHJcblxyXG4vLyAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuLy8gICAgIHRoaXMucmVwcm9jZXNzKCk7XHJcbi8vICAgfSxcclxuXHJcbi8vICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24oKSB7XHJcbi8vICAgICB0aGlzLnJlcHJvY2VzcygpO1xyXG4vLyAgIH0sXHJcblxyXG4vLyAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbi8vICAgICByZXR1cm4gKFxyXG4vLyAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbi8vICAgICAgIDxzcGFuPlxyXG4vLyAgICAgICAgIDxzY3JpcHQgcmVmPVwic2NyaXB0XCIgdHlwZT1cIm1hdGgvdGV4XCI+e3RoaXMucHJvcHMuY2hpbGRyZW59PC9zY3JpcHQ+XHJcbi8vICAgICAgIDwvc3Bhbj5cclxuLy8gICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuLy8gICAgICk7XHJcbi8vICAgfVxyXG4vLyB9KTtcclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhIHNldEludGVydmFsIGZ1bmN0aW9uIHdoaWNoIHdpbGwgZ2V0IGNsZWFuZWQgdXAgd2hlblxyXG4gKiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cclxuICovXHJcbnZhciBTZXRJbnRlcnZhbE1peGluID0ge1xyXG4gIHNldEludGVydmFsOiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuaW50ZXJ2YWxzLnB1c2goc2V0SW50ZXJ2YWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XHJcbiAgfSxcclxuXHJcbiAgY2xlYXJBbGxJbnRlcnZhbHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5pbnRlcnZhbHMubWFwKGNsZWFySW50ZXJ2YWwpO1xyXG4gICAgdGhpcy5pbnRlcnZhbHMgPSBbXTtcclxuICB9LFxyXG5cclxuICAvKiogSW52b2tlZCB3aGVuIGNvbXBvbmVudCBpcyBpbml0aWFsaXplZC4gKi9cclxuICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5pbnRlcnZhbHMgPSBbXTtcclxuICB9LFxyXG5cclxuICAvKiogSW52b2tlZCB3aGVuIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuICovXHJcbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jbGVhckFsbEludGVydmFscygpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBcHBseSBDU1MgY2xhc3NlcyBmb3Igc2V0IGR1cmF0aW9uLCB1c2VmdWwgZm9yIHNpbmdsZXNob3QgYW5pbWF0aW9ucy5cclxuICovXHJcbnZhciBUcmlnZ2VyQW5pbWF0aW9uTWl4aW4gPSB7XHJcbiAgYW5pbWF0ZTogZnVuY3Rpb24oZWxlbSwgY2xhc3NOYW1lLCBkdXJhdGlvbikge1xyXG4gICAgZHVyYXRpb24gPSBkdXJhdGlvbiB8fCAxMDAwO1xyXG4gICAgaWYgKCF0aGlzLnRpbWVvdXQgJiYgdGhpcy50aW1lb3V0ICE9PSAwKSB7XHJcbiAgICAgIGVsZW0uYWRkQ2xhc3MoY2xhc3NOYW1lKTtcclxuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBlbGVtLnJlbW92ZUNsYXNzKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gbnVsbDtcclxuICAgICAgfS5iaW5kKHRoaXMpLCBkdXJhdGlvbik7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgU2V0SW50ZXJ2YWxNaXhpbjogU2V0SW50ZXJ2YWxNaXhpbixcclxuICBUcmlnZ2VyQW5pbWF0aW9uTWl4aW46IFRyaWdnZXJBbmltYXRpb25NaXhpblxyXG59O1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogQ29tbW9uIHRhc2sgY29tcG9uZW50cy5cclxuICovXHJcbnZhciBUYXNrQ29tcG9uZW50cyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIG15ID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBmb3IgQm9vdHN0cmFwJ3MgcGFuZWwgY29tcG9uZW50LlxyXG4gICAqL1xyXG4gIG15LlRhc2tQYW5lbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tQYW5lbCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBjbGFzc05hbWUgPSBcInBhbmVsIFwiICsgKHRoaXMucHJvcHMuY2xhc3NOYW1lIHx8IFwicGFuZWwtaW5mb1wiICk7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NOYW1lfSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtaGVhZGluZ1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMygge2NsYXNzTmFtZTpcInBhbmVsLXRpdGxlXCJ9LCB0aGlzLnByb3BzLmhlYWRlcilcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtYm9keVwifSwgXHJcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgd3JhcHBlciBmb3IgQm9vdHN0cmFwJ3MgcHJvZ3Jlc3MgYmFyIGVsZW1lbnQuXHJcbiAgICovXHJcbiAgbXkuVGFza1Byb2dyZXNzQmFyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza1Byb2dyZXNzQmFyJyxcclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBtYXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgICAgbm93OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgc2luZ2xlV2lkdGggPSBNYXRoLmNlaWwoMSAvIHRoaXMucHJvcHMubWF4ICogMTAwKTtcclxuICAgICAgdmFyIGxlZnRTdHlsZSA9IHt3aWR0aDogc2luZ2xlV2lkdGggKiAodGhpcy5wcm9wcy5ub3cgLSAxKSArIFwiJVwifTtcclxuICAgICAgdmFyIHJpZ2h0U3R5bGUgPSB7d2lkdGg6IHNpbmdsZVdpZHRoICogKHRoaXMucHJvcHMubWF4IC0gdGhpcy5wcm9wcy5ub3cgKyAxKSArIFwiJVwifTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIHRhc2stcHJvZ3Jlc3MtYmFyXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcy1iYXIgcHJvZ3Jlc3MtYmFyLXN1Y2Nlc3NcIiwgc3R5bGU6bGVmdFN0eWxlfSksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MtYmFyIHByb2dyZXNzLWJhci13YXJuaW5nXCIsIHN0eWxlOnJpZ2h0U3R5bGV9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGFzayBoZWFkZXIgd2l0aCB0YXNrIG5hbWUgYW5kIGFuIG9wdGlvbmFsIHN0ZXAgY291bnRlci5cclxuICAgKi9cclxuICBteS5UYXNrSGVhZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza0hlYWRlcicsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG5hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcclxuICAgICAgc3RlcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgICAgc3RlcHM6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgc3RlcENvdW50ZXI7XHJcbiAgICAgIGlmICh0aGlzLnByb3BzLnN0ZXAgJiYgdGhpcy5wcm9wcy5zdGVwcykge1xyXG4gICAgICAgIHZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBteS5UYXNrUHJvZ3Jlc3NCYXI7XHJcbiAgICAgICAgc3RlcENvdW50ZXIgPSBUYXNrUHJvZ3Jlc3NCYXIoIHttYXg6dGhpcy5wcm9wcy5zdGVwcywgbm93OnRoaXMucHJvcHMuc3RlcH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWhlYWRlciByb3dcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS03XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmgyKG51bGwsIHRoaXMucHJvcHMubmFtZSlcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTVcIn0sIFxyXG4gICAgICAgICAgICBzdGVwQ291bnRlclxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIGVsZW1lbnQgdGhhdCBpcyBzaG93biBhZnRlciBhIGNvbXBsZXRlZCB0YXNrLlxyXG4gICAqL1xyXG4gIG15LlRhc2tEb25lRGlzcGxheSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tEb25lRGlzcGxheScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHNjb3JlOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHNjb3JlID0gdGhpcy5wcm9wcy5zY29yZSB8fCAwO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1kb25lLWRpc3BsYXkgYW5pbWF0ZSBib3VuY2UtaW5cIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiVGVodMOkdsOkIHN1b3JpdGV0dHUhXCIpLCBcIiBQaXN0ZWl0w6Q6IFwiLCBzY29yZVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIG15O1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGFza0NvbXBvbmVudHM7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgZDMsIG1vZHVsZSwgcmVxdWlyZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlscy5qc1wiKTtcclxudmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzLmpzXCIpO1xyXG52YXIgQ29vcmRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvY29vcmRzLmpzXCIpO1xyXG5cclxuLyoqXHJcbiAqIENsaWNrIHRoZSBhcHByb3ByaWF0ZSBzaGFwZSBpbiBhIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gKi9cclxudmFyIEJhc2ljU2hhcGVzVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Jhc2ljU2hhcGVzVGFzaycsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgb25UYXNrRG9uZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gIH0sXHJcblxyXG4gIHN0YXJ0R2FtZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnNldFN0YXRlKHtpc1J1bm5pbmc6IHRydWUsIHNjb3JlOiAwfSk7XHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBzaXggZGlmZmVyZW50IHNoYXBlcyB0aGF0IGZpbGwgdGhlIGNvb3Jkc1xyXG4gICAqIGluIGEgcmFuZG9tIG9yZGVyLlxyXG4gICAqL1xyXG4gIGdldFJhbmRvbVNoYXBlczogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYzEgPSAwLjQ2LCBjMiA9IDEuMjEsIHMxID0gMS40MywgczIgPSAwLjg4NTtcclxuICAgIHZhciBwZW50YWdvblB0cyA9IFtbLXMyLC1jMl0sIFstczEsYzFdLCBbMCwxLjVdLCBbczEsYzFdLCBbczIsLWMyXV07XHJcbiAgICBwZW50YWdvblB0cyA9IFRhc2tVdGlscy50cmFuc2xhdGUocGVudGFnb25QdHMsIDIuNSwgMS41KTtcclxuXHJcbiAgICB2YXIgdHJhbnNsYXRlcyA9IFtbMCwwXSwgWzYsMF0sIFswLDRdLCBbNiw0XSwgWzAsOF0sIFs2LDhdXTtcclxuICAgIHZhciBiYXNlcyA9IFtcclxuICAgICAge25hbWU6XCJrb2xtaW9cIiwgcG9pbnRzOltbMSwwXSwgWzEsM10sIFs0LDBdXX0sXHJcbiAgICAgIHtuYW1lOlwibmVsacO2XCIsIHBvaW50czpbWzEsMF0sIFsxLDNdLCBbNCwzXSwgWzQsMF1dfSxcclxuICAgICAge25hbWU6XCJ5bXB5csOkXCIsIHBvaW50czpbWzIuNSwxLjVdXSwgcjoxLjV9LFxyXG4gICAgICB7bmFtZTpcInN1dW5uaWthc1wiLCBwb2ludHM6W1swLDBdLCBbMC41LDNdLCBbNC41LDNdLCBbNCwwXV19LFxyXG4gICAgICB7bmFtZTpcInB1b2xpc3V1bm5pa2FzXCIsIHBvaW50czpbWzAsMF0sIFswLjUsM10sIFs0LDNdLCBbNC41LDBdXX0sXHJcbiAgICAgIHtuYW1lOlwidmlpc2lrdWxtaW9cIiwgcG9pbnRzOnBlbnRhZ29uUHRzfVxyXG4gICAgXTtcclxuXHJcbiAgICBiYXNlcyA9IFRhc2tVdGlscy5zaHVmZmxlKGJhc2VzKTtcclxuICAgIHZhciBjbHJzID0gZDMuc2NhbGUuY2F0ZWdvcnkxMCgpO1xyXG5cclxuICAgIHZhciBzaGFwZXMgPSBiYXNlcy5tYXAoZnVuY3Rpb24oYmFzZSwgaSkge1xyXG4gICAgICB2YXIgdHJhbnNsYXRlWCA9IHRyYW5zbGF0ZXNbaV1bMF0gKyBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICB2YXIgdHJhbnNsYXRlWSA9IHRyYW5zbGF0ZXNbaV1bMV0gKyBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICBiYXNlLnBvaW50cyA9IFRhc2tVdGlscy50cmFuc2xhdGUoYmFzZS5wb2ludHMsIHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVkpO1xyXG4gICAgICBiYXNlLmtleSA9IGk7XHJcbiAgICAgIGJhc2Uub25DbGljayA9IHRoaXMuaGFuZGxlU2hhcGVDbGljaztcclxuICAgICAgYmFzZS5zdHJva2UgPSBcImJsYWNrXCI7XHJcbiAgICAgIGJhc2UuZmlsbCA9IGNscnMoVGFza1V0aWxzLnJhbmQoOSkpO1xyXG4gICAgICByZXR1cm4gYmFzZTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgcmV0dXJuIHNoYXBlcztcclxuICB9LFxyXG5cclxuICAvKiogUmVzZXQgdGhlIHF1ZXN0aW9uLCBpLmUuIGdlbmVyYXRlIG5ldyBzaGFwZXMuICovXHJcbiAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNoYXBlcyA9IHRoaXMuZ2V0UmFuZG9tU2hhcGVzKCk7XHJcblxyXG4gICAgLy8gUHJldmVudCBhc2tpbmcgZm9yIHRoZSBzYW1lIHNoYXBlIHR3aWNlIGluIGEgcm93LlxyXG4gICAgdmFyIHBvc3NpYmxlVGFyZ2V0cyA9IHNoYXBlcztcclxuICAgIGlmICh0aGlzLnN0YXRlLnRhcmdldCkge1xyXG4gICAgICBwb3NzaWJsZVRhcmdldHMgPSBwb3NzaWJsZVRhcmdldHMuZmlsdGVyKGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIHNoYXBlLm5hbWUgIT09IHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWU7XHJcbiAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICB2YXIgdGFyZ2V0ID0gcG9zc2libGVUYXJnZXRzW1Rhc2tVdGlscy5yYW5kKHBvc3NpYmxlVGFyZ2V0cy5sZW5ndGgpXTtcclxuXHJcbiAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgc2hhcGVzOiB0aGlzLmdldFJhbmRvbVNoYXBlcygpLFxyXG4gICAgICB0YXJnZXQ6IHRhcmdldFxyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLyoqIENoZWNrIGlmIGNvcnJlY3Qgc2hhcGUgYW5kIHByb2NlZWQuICovXHJcbiAgaGFuZGxlU2hhcGVDbGljazogZnVuY3Rpb24oc2hhcGUpIHtcclxuICAgIHZhciBzY29yZUluY3JlbWVudDtcclxuICAgIGlmIChzaGFwZS5uYW1lID09PSB0aGlzLnN0YXRlLnRhcmdldC5uYW1lKSB7XHJcbiAgICAgIHNjb3JlSW5jcmVtZW50ID0gMTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNjb3JlSW5jcmVtZW50ID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2NvcmU6IE1hdGgubWF4KHRoaXMuc3RhdGUuc2NvcmUgKyBzY29yZUluY3JlbWVudCwgMCl9KTtcclxuICAgIHRoaXMucmVzZXQoKTtcclxuICB9LFxyXG5cclxuICBoYW5kbGVUYXNrRG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnByb3BzLm9uVGFza0RvbmUoKTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgc2NvcmU6IDAsXHJcbiAgICAgIGlzUnVubmluZzogZmFsc2UsXHJcbiAgICAgIGlzRmluaXNoZWQ6IGZhbHNlXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgdmFyIFRhc2tIZWFkZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyO1xyXG4gICAgdmFyIFRhc2tEb25lRGlzcGxheSA9IFRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheTtcclxuXHJcbiAgICB2YXIgc2hhcGVzID0gdGhpcy5zdGF0ZS5zaGFwZXM7XHJcbiAgICB2YXIgdGFza0lzRG9uZSA9IHRoaXMuc3RhdGUuc3RlcCA+IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpO1xyXG4gICAgdmFyIGNvb3Jkcywgc2lkZWJhcjtcclxuXHJcbiAgICBpZiAoIXRoaXMuc3RhdGUuaXNGaW5pc2hlZCkge1xyXG4gICAgICB2YXIgYm91bmRzID0ge21heFk6IDEyLCBtYXhYOiAxMiwgbWluWTogMCwgbWluWDogMH07XHJcblxyXG4gICAgICBjb29yZHMgPSBDb29yZHMoIHtkcmF3QXhlczpmYWxzZSwgc2hhcGVzOnNoYXBlcywgYm91bmRzOmJvdW5kcywgYXNwZWN0OjF9ICk7XHJcblxyXG4gICAgICB2YXIgc2hhcGVUb0ZpbmQgPSBcImtvbG1pb1wiO1xyXG5cclxuICAgICAgdmFyIHN0YXJ0QnRuID0gdGhpcy5zdGF0ZS5pc1J1bm5pbmcgPyBudWxsIDogKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXHJcbiAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwiYW5pbWF0ZWQgYW5pbWF0ZWQtcmVwZWF0IGJvdW5jZSBidG4gYnRuLXByaW1hcnkgYnRuLWJsb2NrXCIsIG9uQ2xpY2s6dGhpcy5zdGFydEdhbWV9LCBcbiAgICAgICAgICAgIFwiQWxvaXRhIHBlbGlcIlxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcblxyXG4gICAgICB2YXIgdGFyZ2V0RGlzcGxheSA9ICF0aGlzLnN0YXRlLnRhcmdldCA/IG51bGwgOiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFuaW1hdGVkIGJvdW5jZS1pblwifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXG4gICAgICAgICAgXCJLbGlrYXR0YXZhIGthcHBhbGU6IFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWUpLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxuICAgICAgICAgIFwiUGlzdGVldDogXCIsIHRoaXMuc3RhdGUuc2NvcmVcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxuICAgICAgICAgICAgXCJFdHNpIGtvb3JkaW5hYXRpc3Rvc3RhIFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHNoYXBlVG9GaW5kKSwgXCIgamEga2xpa2thYSBzaXTDpFwiLFxuICAgICAgICAgICAgc3RhcnRCdG4sXHJcbiAgICAgICAgICAgIHRhcmdldERpc3BsYXlcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0YXNrSXNEb25lKSB7XHJcbiAgICAgIGNvb3JkcyA9IFRhc2tEb25lRGlzcGxheSgge3Njb3JlOjEwfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIkthcHBhbGVpZGVuIHR1bm5pc3RhbWluZW5cIiwgc3RlcDp0aGlzLnN0YXRlLnN0ZXAsIHN0ZXBzOnRoaXMucHJvcHMuc3RlcHN9ICksXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICBjb29yZHNcclxuICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgIHNpZGViYXJcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2ljU2hhcGVzVGFzazsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgVGFza1V0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzL3Rhc2stdXRpbHNcIik7XHJcbnZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50c1wiKTtcclxudmFyIENvb3JkcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Nvb3Jkc1wiKTtcclxudmFyIEZvcm1zID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvZm9ybXNcIik7XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlYWQgcG9zaXRpb25zIGZyb20gYSBjb29yZGluYXRlIHN5c3RlbS5cclxuICovXHJcbnZhciBTaW1wbGVDb29yZHNUYXNrID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU2ltcGxlQ29vcmRzVGFzaycsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgc3RlcHM6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICB9LFxyXG5cclxuICAvKiogUmVzZXQgdGhlIHF1ZXN0aW9uLCBpLmUuIGdlbmVyYXRlIGEgbmV3IHJhbmRvbSBwb2ludC4gKi9cclxuICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgbmV3UG9pbnQ7XHJcbiAgICBkbyB7IG5ld1BvaW50ID0gW1Rhc2tVdGlscy5yYW5kUmFuZ2UoMCwgMTApLCBUYXNrVXRpbHMucmFuZFJhbmdlKDAsIDEwKV07IH1cclxuICAgIHdoaWxlIChUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKG5ld1BvaW50LCB0aGlzLnN0YXRlLnBvaW50KSk7XHJcblxyXG4gICAgdGhpcy5zZXRTdGF0ZSh7cG9pbnQ6IG5ld1BvaW50fSk7XHJcbiAgfSxcclxuXHJcbiAgLyoqIENoZWNrIGlmIGNvcnJlY3QuICovXHJcbiAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2YXIgaXNDb3JyZWN0ID0gVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihbeCwgeV0sIHRoaXMuc3RhdGUucG9pbnQpO1xyXG4gICAgaWYgKGlzQ29ycmVjdClcclxuICAgICAgdGhpcy5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcblxyXG4gICAgcmV0dXJuIGlzQ29ycmVjdDtcclxuICB9LFxyXG5cclxuICBoYW5kbGVDb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzdGVwID0gdGhpcy5zdGF0ZS5zdGVwO1xyXG4gICAgaWYgKHN0ZXAgPT09IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpKVxyXG4gICAgICB0aGlzLmhhbmRsZVRhc2tEb25lKCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7c3RlcDogc3RlcCArIDF9KTtcclxuICB9LFxyXG5cclxuICBoYW5kbGVUYXNrRG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnByb3BzLm9uVGFza0RvbmUoKTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN0ZXA6IDEsXHJcbiAgICAgIHBvaW50OiBudWxsXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgdmFyIFRhc2tIZWFkZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyO1xyXG4gICAgdmFyIFRhc2tEb25lRGlzcGxheSA9IFRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheTtcclxuICAgIHZhciBDb29yZHNBbnN3ZXJGb3JtID0gRm9ybXMuQ29vcmRzQW5zd2VyRm9ybTtcclxuXHJcbiAgICB2YXIgcG9pbnQgPSB0aGlzLnN0YXRlLnBvaW50O1xyXG4gICAgdmFyIHRhc2tJc0RvbmUgPSB0aGlzLnN0YXRlLnN0ZXAgPiBwYXJzZUludCh0aGlzLnByb3BzLnN0ZXBzKTtcclxuICAgIHZhciBjb29yZHMsIHNpZGViYXI7XHJcblxyXG4gICAgaWYgKHBvaW50ICYmICF0YXNrSXNEb25lKSB7XHJcbiAgICAgIHZhciBib3VuZHMgPSB7bWF4WTogMTAsIG1heFg6IDEwLCBtaW5ZOiAtMiwgbWluWDogLTJ9O1xyXG4gICAgICB2YXIgc2hhcGVzID0gW3twb2ludHM6IFtwb2ludF0sIHI6MC4yLCBzdHJva2VXaWR0aDogMywgc3Ryb2tlOiBcIiNGRjVCMjRcIiwgZmlsbDpcIiNGRDAwMDBcIn1dO1xyXG5cclxuICAgICAgY29vcmRzID0gQ29vcmRzKCB7c2hhcGVzOnNoYXBlcywgYm91bmRzOmJvdW5kcywgYXNwZWN0OjF9ICk7XHJcblxyXG4gICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcIk1pdGvDpCBvdmF0IHBpc3RlZW4geC1qYSB5LWtvb3JkaW5hYXRpdD9cIilcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJWYXN0YXVzXCIsIGNsYXNzTmFtZTpcInBhbmVsLXN1Y2Nlc3MgcGFuZWwtZXh0cmEtcGFkZGluZ1wifSwgXHJcbiAgICAgICAgICAgIENvb3Jkc0Fuc3dlckZvcm0oIHtyZWY6XCJmb3JtXCIsIG9uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodGFza0lzRG9uZSkge1xyXG4gICAgICBjb29yZHMgPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZToxMH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgVGFza0hlYWRlcigge25hbWU6XCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCIsIHN0ZXA6dGhpcy5zdGF0ZS5zdGVwLCBzdGVwczp0aGlzLnByb3BzLnN0ZXBzfSApLFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgY29vcmRzXHJcbiAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNSBjb2wtc20tb2Zmc2V0LTFcIn0sIFxyXG4gICAgICAgICAgICBzaWRlYmFyXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGVDb29yZHNUYXNrOyIsIlwidXNlIHN0cmljdFwiO1xyXG4vKiBnbG9iYWwgbW9kdWxlICovXHJcblxyXG4vKipcclxuICogVXRpbGl0eSBmdW5jdGlvbnMgKG1haW5seSBtYXRocyByZWxhdGVkKSBmb3IgdGFza3MuXHJcbiAqL1xyXG52YXIgVGFza1V0aWxzID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBpbiByYW5nZSBbbWluLCBtYXhbLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgbWluICAgSW5jbHVzaXZlIGxvd2VyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgbWF4ICAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyPX0gY291bnQgSWYgc2V0LCByZXR1cm4gYSBsaXN0IG9mIHJhbmRvbSB2YWx1ZXMuXHJcbiAgICAgKiBAcmV0dXJuIHsobnVtYmVyfFtudW1iZXJdKX0gQSBzaW5nbGUgb3IgbXVsdGlwbGUgcmFuZG9tIGludHMuXHJcbiAgICAgKi9cclxuICAgIHJhbmRSYW5nZTogZnVuY3Rpb24obWluLCBtYXgsIGNvdW50KSB7XHJcbiAgICAgICAgaWYgKGNvdW50ICYmIGNvdW50ID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgcmFuZHMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICByYW5kcy5wdXNoKHRoaXMucmFuZFJhbmdlKG1pbiwgbWF4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJhbmRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBpbnRlZ2VyIGluIHJhbmdlIFswLCBtYXhbLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgbWF4ICAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyPX0gY291bnQgSWYgc2V0LCByZXR1cm4gYSBsaXN0IG9mIHJhbmRvbSB2YWx1ZXMuXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8W251bWJlcl19IEEgc2luZ2xlIG9yIG11bHRpcGxlIHJhbmRvbSBpbnRzLlxyXG4gICAgICovXHJcbiAgICByYW5kOiBmdW5jdGlvbihtYXgsIGNvdW50KSB7XHJcbiAgICAgICAgaWYgKGNvdW50ICYmIGNvdW50ID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgcmFuZHMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICByYW5kcy5wdXNoKHRoaXMucmFuZChtYXgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmFuZHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqIFJlb3JkZXJzIGdpdmVuIGFycmF5IHJhbmRvbWx5LCBkb2Vzbid0IG1vZGlmeSBvcmlnaW5hbCBhcnJheS4gKi9cclxuICAgIHNodWZmbGU6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBjbG9uZSA9IGFyci5zbGljZSgpO1xyXG4gICAgICAgIHZhciBzaHVmZmxlZCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gY2xvbmUubGVuZ3RoOyBpID4gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMucmFuZChpKTtcclxuICAgICAgICAgICAgc2h1ZmZsZWQucHVzaChjbG9uZS5zcGxpY2UoaW5kZXgsIDEpWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaHVmZmxlZDtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5nZSBvZiBpbnRlZ2Vycy5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSAgbWluICBJbmNsdXNpdmUgbG93ZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gIG1heCAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXI9fSBzdGVwIE9wdGlvbmFsIGluY3JlbWVudCB2YWx1ZSwgZGVmYXVsdHMgdG8gMS5cclxuICAgICAqIEByZXR1cm4ge1tudW1iZXJdfSAgICBUaGUgc3BlY2lmaWVkIHJhbmdlIG9mIG51bWJlcnMgaW4gYW4gYXJyYXkuXHJcbiAgICAgKi9cclxuICAgIHJhbmdlOiBmdW5jdGlvbihtaW4sIG1heCwgc3RlcCkge1xyXG4gICAgICAgIHN0ZXAgPSBzdGVwIHx8IDE7XHJcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xyXG4gICAgICAgIGlmIChzdGVwID4gMCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbWluOyBpIDwgbWF4OyBpICs9IHN0ZXApIHtcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IG1pbjsgaiA+IG1heDsgaiArPSBzdGVwKSB7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaChqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgd2hldGhlciBhcnJheXMgZXF1YWwuXHJcbiAgICAgKiBAcGFyYW0gIGFycjFcclxuICAgICAqIEBwYXJhbSAgYXJyMlxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgYXJyYXlzRXF1YWw6IGZ1bmN0aW9uKGFycjEsIGFycjIpIHtcclxuICAgICAgICBpZiAoYXJyMS5sZW5ndGggIT09IGFycjIubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiBhcnIxLmV2ZXJ5KGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGQgPT09IGFycjJbaV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYW5zbGF0ZSBhbiBhcnJheSBvZiBwb2ludHMgYnkgZ2l2ZW4geCBhbmQgeSB2YWx1ZXMuXHJcbiAgICAgKiBAcGFyYW0gIHtbW251bWJlcl1dfSBwb2ludHNcclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgIHhcclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgIHlcclxuICAgICAqIEByZXR1cm4ge1tbbnVtYmVyXV19XHJcbiAgICAgKi9cclxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24ocG9pbnRzLCB4LCB5KSB7XHJcbiAgICAgICAgcmV0dXJuIHBvaW50cy5tYXAoZnVuY3Rpb24ocG9pbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtwb2ludFswXSArIHgsIHBvaW50WzFdICsgeV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbXBhcmUgZ2l2ZW4gYW5zd2VyIHRvIHRoZSBjb3JyZWN0IHNvbHV0aW9uLiBTdXBwb3J0cyB2YXJpb3VzIGRhdGEgdHlwZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGFuc3dlclxyXG4gICAgICogQHBhcmFtIHNvbHV0aW9uIEEgc3RyaW5nLCBudW1iZXIsIGFycmF5LCBvYmplY3Qgb3IgUmVnRXhwLlxyXG4gICAgICogQHBhcmFtIGVwc2lsb24gIE9wdGlvbmFsIG1heCBlcnJvciB2YWx1ZSBmb3IgZmxvYXQgY29tcGFyaXNvbiwgZGVmYXVsdCBpcyAwLjAwMS5cclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgY29ycmVjdCwgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBtYXRjaGVzU29sdXRpb246IGZ1bmN0aW9uKGFuc3dlciwgc29sdXRpb24sIGVwc2lsb24pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGFuc3dlciA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIudHJpbSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBzb2x1dGlvbiA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICBhbnN3ZXIgPSBwYXJzZUZsb2F0KGFuc3dlcik7XHJcbiAgICAgICAgICAgIGlmIChpc05hTihhbnN3ZXIpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIGVwc2lsb24gPSBlcHNpbG9uID09PSB1bmRlZmluZWQgPyAwLjAwMSA6IGVwc2lsb247XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5hYnMoYW5zd2VyIC0gc29sdXRpb24pIDw9IGVwc2lsb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc29sdXRpb24gaW5zdGFuY2VvZiBSZWdFeHApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uLnRlc3QoYW5zd2VyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgaWYgKCFhbnN3ZXIgaW5zdGFuY2VvZiBBcnJheSB8fCBhbnN3ZXIubGVuZ3RoICE9PSBzb2x1dGlvbi5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYW5zd2VyLmV2ZXJ5KGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Lm1hdGNoZXNTb2x1dGlvbihkLCBzb2x1dGlvbltpXSwgZXBzaWxvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGlmICghYW5zd2VyIGluc3RhbmNlb2YgT2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGFuc0tleXMgPSBPYmplY3Qua2V5cyhhbnN3ZXIpO1xyXG4gICAgICAgICAgICBpZiAoYW5zS2V5cy5sZW5ndGggIT09IE9iamVjdC5rZXlzKHNvbHV0aW9uKS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYW5zS2V5cy5ldmVyeShmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5tYXRjaGVzU29sdXRpb24oYW5zd2VyW2RdLCBzb2x1dGlvbltkXSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFuc3dlciA9PT0gc29sdXRpb247XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tVdGlsczsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiQoZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgQXBwbGljYXRpb24gPSByZXF1aXJlKFwiLi9qcy9hcHBsaWNhdGlvbi5qc1wiKTtcclxuXHJcbiAgICBSZWFjdC5yZW5kZXJDb21wb25lbnQoXHJcbiAgICAgICAgQXBwbGljYXRpb24obnVsbCApLFxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXBwbGljYXRpb25cIilcclxuICAgICk7XHJcbn0pO1xyXG4vKiBqc2hpbnQgaWdub3JlOmVuZCAqLyJdfQ==
