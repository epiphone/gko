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

  var module = {};

  /**
   * A form that disables submitting when contents are invalid.
   */
  module.AnswerForm = React.createClass({displayName: 'AnswerForm',

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
        btnClass: "btn btn-primary btn-block",
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
  module.ReInput = React.createClass({displayName: 'ReInput',

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
  module.NumInput = React.createClass({displayName: 'NumInput',

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
      var ReInput = module.ReInput;
      var btnClass = this.props.btnClass || "btn btn-lg btn-primary";
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
              className:"form-control text-center", placeholder:this.props.placeholder})
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

  return module;
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
 * A wrapper for Bootstrap's panel component.
 */
var TaskPanel = React.createClass({displayName: 'TaskPanel',

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
var TaskProgressBar = React.createClass({displayName: 'TaskProgressBar',
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
var TaskHeader = React.createClass({displayName: 'TaskHeader',

  propTypes: {
    name: React.PropTypes.string.isRequired,
    step: React.PropTypes.number,
    steps: React.PropTypes.number
  },

  render: function() {
    /* jshint ignore:start */
    var stepCounter;
    if (this.props.step && this.props.steps) {
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
var TaskDoneDisplay = React.createClass({displayName: 'TaskDoneDisplay',

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

module.exports = {
  TaskPanel: TaskPanel,
  TaskProgressBar: TaskProgressBar,
  TaskHeader: TaskHeader,
  TaskDoneDisplay: TaskDoneDisplay
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEFsZWtzaVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXHdhdGNoaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9jb29yZHMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL2Zvcm0tY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvZm9ybXMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL21peGlucy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvdGFza3MvYmFzaWMtc2hhcGVzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy91dGlscy90YXNrLXV0aWxzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qIGdsb2JhbHMgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cclxuXHJcbnZhciBTaW1wbGVDb29yZHNUYXNrID0gcmVxdWlyZShcIi4vdGFza3Mvc2ltcGxlLWNvb3Jkcy10YXNrXCIpO1xyXG52YXIgQmFzaWNTaGFwZXNUYXNrID0gcmVxdWlyZShcIi4vdGFza3MvYmFzaWMtc2hhcGVzLXRhc2tcIik7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbnRhaW5lciBhbmQgbGlua3MgZm9yIGV4YW1wbGUgdGFza3MuXHJcbiAqL1xyXG52YXIgQXBwbGljYXRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBcHBsaWNhdGlvbicsXHJcblxyXG4gIGhhbmRsZUxpc3RDbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdmFyIHRhc2tOYW1lID0gZS50YXJnZXQudGV4dDtcclxuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkVGFzazogdGFza05hbWV9KTtcclxuICB9LFxyXG5cclxuICBoYW5kbGVUYXNrRG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIlRhc2sgZG9uZSAtIGhlcmUncyB3aGVyZSB0aGUgdGFzayBjb25uZWN0cyB0byBhbiBleHRlcm5hbCBhcHAuXCIpO1xyXG4gIH0sXHJcblxyXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge3NlbGVjdGVkVGFzazogXCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCJ9O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgdGFza3MgPSB7XHJcbiAgICAgIFwiS29vcmRpbmFhdGlzdG9uIGx1a2VtaW5lblwiOiAoU2ltcGxlQ29vcmRzVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZSwgc3RlcHM6NX0pKSxcclxuICAgICAgXCJLYXBwYWxlaWRlbiB0dW5uaXN0YW1pbmVuXCI6IChCYXNpY1NoYXBlc1Rhc2soIHtvblRhc2tEb25lOnRoaXMuaGFuZGxlVGFza0RvbmV9KSlcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHRhc2tMaXN0RWxlbXMgPSBPYmplY3Qua2V5cyh0YXNrcykubWFwKGZ1bmN0aW9uKHRhc2tOYW1lKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmxpKG51bGwsIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmEoIHtocmVmOlwiXCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVMaXN0Q2xpY2t9LCB0YXNrTmFtZSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIHZhciB0YXNrID0gdGFza3NbdGhpcy5zdGF0ZS5zZWxlY3RlZFRhc2tdO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibGlzdC1pbmxpbmVcIn0sIFxyXG4gICAgICAgICAgdGFza0xpc3RFbGVtc1xyXG4gICAgICAgICksXHJcblxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWNvbnRhaW5lclwifSwgXHJcbiAgICAgICAgICB0YXNrXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBsaWNhdGlvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBkMywgTWF0aFV0aWxzLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqIEEgMkQgY29vcmRpbmF0ZSBzeXN0ZW0uICovXHJcbnZhciBDb29yZHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb29yZHMnLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgIHNoYXBlczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LFxyXG4gICAgYm91bmRzOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgYXNwZWN0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlUmVzaXplOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBwYXJlbnQgPSAkKHRoaXMuZ2V0RE9NTm9kZSgpLnBhcmVudE5vZGUpO1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7d2lkdGg6IHBhcmVudC53aWR0aCgpfSk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7d2lkdGg6IDB9O1xyXG4gIH0sXHJcblxyXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBkcmF3QXhlczogdHJ1ZSxcclxuICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgYm91bmRzOiB7bWF4WToxMCwgbWF4WDoxMCwgbWluWTowLCBtaW5YOjB9LFxyXG4gICAgICBhc3BlY3Q6IDFcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdGhpcy5oYW5kbGVSZXNpemUpO1xyXG4gICAgdGhpcy5oYW5kbGVSZXNpemUoKTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLmhhbmRsZVJlc2l6ZSk7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciBtYXJnaW4gPSB7XHJcbiAgICAgIHRvcDogMTAsXHJcbiAgICAgIHJpZ2h0OiAxMCxcclxuICAgICAgYm90dG9tOiAxMCxcclxuICAgICAgbGVmdDogMTBcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHdpZHRoID0gdGhpcy5zdGF0ZS53aWR0aCA/IHRoaXMuc3RhdGUud2lkdGggLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCA6IDA7XHJcbiAgICB2YXIgaGVpZ2h0ID0gTWF0aC5yb3VuZCh3aWR0aCAqIHRoaXMucHJvcHMuYXNwZWN0KSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xyXG5cclxuICAgIHZhciBib3VuZHMgPSB0aGlzLnByb3BzLmJvdW5kcztcclxuICAgIHZhciBzcGFjaW5nID0gTWF0aC5yb3VuZChNYXRoLm1pbihcclxuICAgICAgd2lkdGggLyBNYXRoLmFicyhib3VuZHMubWF4WCAtIGJvdW5kcy5taW5YKSxcclxuICAgICAgaGVpZ2h0IC8gTWF0aC5hYnMoYm91bmRzLm1heFkgLSBib3VuZHMubWluWSlcclxuICAgICkpO1xyXG5cclxuICAgIHZhciB4ID0gZDMuc2NhbGUubGluZWFyKClcclxuICAgICAgLmRvbWFpbihbYm91bmRzLm1pblgsIGJvdW5kcy5taW5YICsgMV0pXHJcbiAgICAgIC5yYW5nZShbMCwgc3BhY2luZ10pO1xyXG5cclxuICAgIHZhciB5ID0gZDMuc2NhbGUubGluZWFyKClcclxuICAgICAgLmRvbWFpbihbYm91bmRzLm1pblksIGJvdW5kcy5taW5ZICsgMV0pXHJcbiAgICAgIC5yYW5nZShbaGVpZ2h0LCBoZWlnaHQgLSBzcGFjaW5nXSk7XHJcblxyXG4gICAgdmFyIGZ1bGxXaWR0aCA9IHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQ7XHJcbiAgICB2YXIgZnVsbEhlaWdodCA9IGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tO1xyXG4gICAgdmFyIHRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIjtcclxuXHJcbiAgICB2YXIgc2hhcGVzLCBncmlkO1xyXG4gICAgaWYgKHRoaXMuc3RhdGUud2lkdGgpIHtcclxuICAgICAgc2hhcGVzID0gU2hhcGVzKCB7eDp4LCB5OnksIHNwYWNpbmc6c3BhY2luZywgZGF0YTp0aGlzLnByb3BzLnNoYXBlc30gKTtcclxuICAgICAgZ3JpZCA9IEdyaWQoIHtkcmF3QXhlczp0aGlzLnByb3BzLmRyYXdBeGVzLCB4OngsIHk6eSwgYm91bmRzOmJvdW5kc30gKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29vcmRzLWNvbnRhaW5lclwifSwgXHJcbiAgICAgICAgUmVhY3QuRE9NLnN2Zygge3dpZHRoOmZ1bGxXaWR0aCwgaGVpZ2h0OmZ1bGxIZWlnaHR9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5nKCB7dHJhbnNmb3JtOnRyYW5zZm9ybX0sIFxyXG4gICAgICAgICAgICBncmlkLFxyXG4gICAgICAgICAgICBzaGFwZXNcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG4vKiogQSBncmlkIGZvciB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0uICovXHJcbnZhciBHcmlkID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnR3JpZCcsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgeDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICBib3VuZHM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcclxuICAgIHNwYWNpbmc6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICB0cmFuc2l0aW9uRHVyYXRpb246IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICBkcmF3QXhlczogUmVhY3QuUHJvcFR5cGVzLmJvb2xcclxuICB9LFxyXG5cclxuICAvKiogUmVkcmF3IGdyaWQuICAqL1xyXG4gIHVwZGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgIHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QodGhpcy5nZXRET01Ob2RlKCkpO1xyXG4gICAgdmFyIGJvdW5kcyA9IHByb3BzLmJvdW5kcztcclxuICAgIHZhciBzcGFjaW5nID0gcHJvcHMuc3BhY2luZztcclxuICAgIHZhciB4ID0gcHJvcHMueDtcclxuICAgIHZhciB5ID0gcHJvcHMueTtcclxuXHJcbiAgICB2YXIgeFJhbmdlID0gZDMucmFuZ2UoTWF0aC5jZWlsKChib3VuZHMubWluWCkgLyBzcGFjaW5nKSwgTWF0aC5yb3VuZChib3VuZHMubWF4WCkgKyBzcGFjaW5nLCBzcGFjaW5nKTtcclxuICAgIHZhciB5UmFuZ2UgPSBkMy5yYW5nZShNYXRoLmNlaWwoKGJvdW5kcy5taW5ZKSAvIHNwYWNpbmcpLCBNYXRoLnJvdW5kKGJvdW5kcy5tYXhZKSArIHNwYWNpbmcsIHNwYWNpbmcpO1xyXG4gICAgdmFyIGRhdGEgPSB4UmFuZ2UuY29uY2F0KHlSYW5nZSk7XHJcbiAgICB2YXIgaXNYID0gZnVuY3Rpb24oaW5kZXgpIHsgcmV0dXJuIGluZGV4IDwgeFJhbmdlLmxlbmd0aDsgfTtcclxuXHJcbiAgICB2YXIgYXhlcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCIuYXhpc1wiKVxyXG4gICAgICAuZGF0YShkYXRhKTtcclxuXHJcbiAgICBheGVzLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICByZXR1cm4gXCJheGlzIFwiICsgKChwcm9wcy5kcmF3QXhlcyAmJiBkID09PSAwKSA/IFwidGhpY2tcIiA6IFwiXCIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXhlcy50cmFuc2l0aW9uKCkuZHVyYXRpb24ocHJvcHMudHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHgoZCkgOiB4KGJvdW5kcy5taW5YKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB5KGJvdW5kcy5taW5ZKSA6IHkoZCk7IH0pXHJcbiAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoYm91bmRzLm1heFgpOyB9KVxyXG4gICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1heFkpIDogeShkKTsgfSk7XHJcblxyXG4gICAgYXhlcy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG4gICAgaWYgKHByb3BzLmRyYXdBeGVzKSB7XHJcbiAgICAgIHZhciBsYWJlbHMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwiLmxhYmVsXCIpLmRhdGEoZGF0YSk7XHJcblxyXG4gICAgICBsYWJlbHMuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcImxhYmVsIFwiICsgKGlzWChpKSA/IFwieFwiIDogXCJ5XCIpOyB9KVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHsgaWYgKCFkKSByZXR1cm4gXCJub25lXCI7IH0pXHJcbiAgICAgICAgLnRleHQoT2JqZWN0KVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8gXCIxLjRlbVwiIDogXCIuM2VtXCI7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyBudWxsIDogXCItLjhlbVwiOyB9KVxyXG4gICAgICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIDEgKyBcImVtXCIpO1xyXG5cclxuICAgICAgbGFiZWxzLnRyYW5zaXRpb24oKS5kdXJhdGlvbihwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHgoZCkgOiB4KDApOyB9KVxyXG4gICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB5KDApIDogeShkKTsgfSk7XHJcblxyXG4gICAgICBsYWJlbHMuZXhpdCgpLnJlbW92ZSgpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBkcmF3QXhlczogdHJ1ZSxcclxuICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uOiA1NTAsXHJcbiAgICAgIHNwYWNpbmc6IDFcclxuICAgIH07XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy51cGRhdGUodGhpcy5wcm9wcyk7XHJcbiAgfSxcclxuXHJcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcclxuICAgIHRoaXMudXBkYXRlKG5leHRQcm9wcyk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgUmVhY3QuRE9NLmcoIHtjbGFzc05hbWU6XCJheGVzXCJ9KVxyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgKTtcclxuICB9XHJcbn0pO1xyXG5cclxuXHJcbi8qKiBWYXJpb3VzIGdlb21ldHJpYyBzaGFwZXMgdG8gYmUgZHJhd24gb24gdGhlIGNvb3JkaW5hdGUgc3lzdGVtLiAqL1xyXG52YXIgU2hhcGVzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU2hhcGVzJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICBkYXRhOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZCxcclxuICAgIHg6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICB5OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgc3BhY2luZzogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgdHJhbnNpdGlvbkR1cmF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgfSxcclxuXHJcbiAgLyoqIFJlZHJhdyBzaGFwZXMuIEdldHMgY2FsbGVkIHdoZW5ldmVyIHNoYXBlcyBhcmUgdXBkYXRlZCBvciBzY3JlZW4gcmVzaXplcy4gKi9cclxuICB1cGRhdGU6IGZ1bmN0aW9uKHByb3BzKSB7XHJcbiAgICB2YXIgY29udGFpbmVyID0gZDMuc2VsZWN0KHRoaXMuZ2V0RE9NTm9kZSgpKTtcclxuICAgIHZhciB0cmFuc2l0aW9uRHVyYXRpb24gPSBwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24gfHwgNTUwO1xyXG5cclxuICAgIHZhciBwb2x5Z29ucyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJwb2x5Z29uLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA+IDI7IH0pKTtcclxuXHJcbiAgICB2YXIgYWRkZWRQb2x5Z29ucyA9IHBvbHlnb25zLmVudGVyKCkuYXBwZW5kKFwicG9seWdvblwiKS5hdHRyKFwiY2xhc3NcIiwgXCJzaGFwZVwiKTtcclxuXHJcbiAgICBwb2x5Z29ucy50cmFuc2l0aW9uKCkuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAuYXR0cihcInBvaW50c1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQucG9pbnRzLm1hcChmdW5jdGlvbihwcykge1xyXG4gICAgICAgICAgcmV0dXJuIFtwcm9wcy54KHBzWzBdKSwgcHJvcHMueShwc1sxXSldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICBwb2x5Z29ucy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG5cclxuICAgIHZhciBjaXJjbGVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcImNpcmNsZS5zaGFwZVwiKVxyXG4gICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPT0gMTsgfSkpO1xyXG5cclxuICAgIHZhciBhZGRlZENpcmNsZXMgPSBjaXJjbGVzLmVudGVyKCkuYXBwZW5kKFwiY2lyY2xlXCIpLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpO1xyXG5cclxuICAgIGNpcmNsZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzBdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzBdWzFdKTsgfSlcclxuICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnNwYWNpbmcgKiAoZC5yIHx8IDAuMik7IH0pO1xyXG5cclxuICAgIGNpcmNsZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuXHJcbiAgICB2YXIgbGluZXMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwibGluZS5zaGFwZVwiKVxyXG4gICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPT0gMjsgfSkpO1xyXG5cclxuICAgIHZhciBhZGRlZExpbmVzID0gbGluZXMuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpO1xyXG5cclxuICAgIGxpbmVzLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueChkLnBvaW50c1swXVswXSk7IH0pXHJcbiAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueShkLnBvaW50c1swXVsxXSk7IH0pXHJcbiAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueChkLnBvaW50c1sxXVswXSk7IH0pXHJcbiAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueShkLnBvaW50c1sxXVsxXSk7IH0pO1xyXG5cclxuICAgIGxpbmVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBBdHRhY2ggY2xpY2sgZXZlbnQgbGlzdGVuZXJzLlxyXG4gICAgW2FkZGVkUG9seWdvbnMsIGFkZGVkQ2lyY2xlcywgYWRkZWRMaW5lc10uZm9yRWFjaChmdW5jdGlvbihhZGRlZCkge1xyXG4gICAgICBhZGRlZC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKGQub25DbGljaykpXHJcbiAgICAgICAgICBkLm9uQ2xpY2soZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2V0IGNvbW1vbiBhdHRyaWJ1dGVzLlxyXG4gICAgY29udGFpbmVyLnNlbGVjdEFsbChcIi5zaGFwZVwiKVxyXG4gICAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5maWxsIHx8IFwidHJhbnNwYXJlbnRcIjsgfSlcclxuICAgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zdHJva2UgfHwgXCJzdGVlbGJsdWVcIjsgfSlcclxuICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gKGQuc3Ryb2tlV2lkdGggfHwgMikgKyBcInB4XCI7IH0pO1xyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMudXBkYXRlKHRoaXMucHJvcHMpO1xyXG4gIH0sXHJcblxyXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24obmV4dFByb3BzKSB7XHJcbiAgICB0aGlzLnVwZGF0ZShuZXh0UHJvcHMpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICByZXR1cm4gUmVhY3QuRE9NLmcoIHtjbGFzc05hbWU6XCJzaGFwZXNcIn0pO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb29yZHM7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbnZhciBNaXhpbnMgPSByZXF1aXJlKFwiLi9taXhpbnNcIik7XHJcblxyXG5cclxuLyoqXHJcbiAqIFZhcmlvdXMgY29tbW9uIGZvcm0gY29tcG9uZW50cy5cclxuICovXHJcbnZhciBGb3JtQ29tcG9uZW50cyA9IChmdW5jdGlvbigpe1xyXG5cclxuICB2YXIgbW9kdWxlID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgZm9ybSB0aGF0IGRpc2FibGVzIHN1Ym1pdHRpbmcgd2hlbiBjb250ZW50cyBhcmUgaW52YWxpZC5cclxuICAgKi9cclxuICBtb2R1bGUuQW5zd2VyRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Fuc3dlckZvcm0nLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBvbkFuc3dlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgICAgYnRuQ29ycmVjdEFuaW1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgYnRuSW5jb3JyZWN0QW5pbUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBmb3JtQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGJ0bkNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXHJcbiAgICB9LFxyXG5cclxuICAgIG1peGluczogW01peGlucy5UcmlnZ2VyQW5pbWF0aW9uTWl4aW5dLFxyXG5cclxuICAgIC8qKiBTdWJtaXQgYW5zd2VyIGlmIGZvcm0gaXMgdmFsaWQuICovXHJcbiAgICBoYW5kbGVTdWJtaXQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICBpZiAodGhpcy5zdGF0ZS5pc1ZhbGlkKSB7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vbkFuc3dlcigpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3Nob3dFcnJvcnM6IHRydWV9KTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVDb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGJ0biA9ICQodGhpcy5yZWZzLmJ0bi5nZXRET01Ob2RlKCkpO1xyXG4gICAgICB0aGlzLmFuaW1hdGUoYnRuLCB0aGlzLnByb3BzLmJ0bkNvcnJlY3RBbmltQ2xhc3MpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVJbmNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYnRuID0gJCh0aGlzLnJlZnMuYnRuLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHRoaXMuYW5pbWF0ZShidG4sIHRoaXMucHJvcHMuYnRuSW5jb3JyZWN0QW5pbUNsYXNzKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsaWRpdHk6IGZ1bmN0aW9uKGlzVmFsaWQpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNWYWxpZDogaXNWYWxpZCwgaXNEaXJ0eTogdHJ1ZX0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2xlYXIgdmFsdWVzIGFuZCB2YWxpZGF0aW9uIHN0YXRlcyBmb3IgYWxsIGNoaWxkIGVsZW1lbnRzLiAqL1xyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICBpc1ZhbGlkOiB0cnVlLFxyXG4gICAgICAgIGlzRGlydHk6IGZhbHNlLFxyXG4gICAgICAgIHNob3dFcnJvcnM6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGZvcm1DbGFzczogXCJmb3JtLWhvcml6b250YWxcIixcclxuICAgICAgICBidG5DbGFzczogXCJidG4gYnRuLXByaW1hcnkgYnRuLWJsb2NrXCIsXHJcbiAgICAgICAgYnRuQ29ycmVjdEFuaW1DbGFzczogXCJhbmltYXRlZCBib3VuY2VcIixcclxuICAgICAgICBidG5JbmNvcnJlY3RBbmltQ2xhc3M6IFwiYW5pbWF0ZWQgc2hha2VcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgc2hvd0Vycm9yczogZmFsc2VcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLnByb3BzLmNoaWxkcmVuLm1hcChmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGNoaWxkLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UgPSB0aGlzLnNldFZhbGlkaXR5O1xyXG4gICAgICAgIGNoaWxkLnByb3BzLnNob3dFcnJvciA9IHRoaXMuc3RhdGUuc2hvd0Vycm9ycztcclxuICAgICAgICByZXR1cm4gY2hpbGQ7XHJcbiAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICB2YXIgYnRuQ2xhc3MgPSB0aGlzLnByb3BzLmJ0bkNsYXNzICsgKHRoaXMuc3RhdGUuaXNWYWxpZCA/IFwiXCIgOiBcIiBkaXNhYmxlZFwiKTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmZvcm0oIHtyb2xlOlwiZm9ybVwiLCBjbGFzc05hbWU6dGhpcy5wcm9wcy5mb3JtQ2xhc3MsIG9uU3VibWl0OnRoaXMuaGFuZGxlU3VibWl0LCBub1ZhbGlkYXRlOnRydWV9LCBcclxuICAgICAgICAgIGNoaWxkcmVuLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtyZWY6XCJidG5cIiwgdHlwZTpcInN1Ym1pdFwiLCB2YWx1ZTpcIlZhc3RhYVwiLCBjbGFzc05hbWU6YnRuQ2xhc3N9IClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICAvKipcclxuICAgKiBBbiA8aW5wdXQ+IHdpdGggdmFsaWRhdGlvbiBzdGF0ZXMuXHJcbiAgICovXHJcbiAgbW9kdWxlLlJlSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdSZUlucHV0JyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgcmU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXHJcbiAgICAgIHNob3dFcnJvcjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIHJlcXVpcmVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgICAgcGxhY2Vob2xkZXI6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIHR5cGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgb25WYWxpZGl0eUNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlYWQgdmFsdWUsIHZhbGlkYXRlLCBub3RpZnkgcGFyZW50IGVsZW1lbnQgaWYgYW4gZXZlbnQgaXMgYXR0YWNoZWQuICovXHJcbiAgICBoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyIGlzVmFsaWQgPSB0aGlzLnZhbGlkYXRvci50ZXN0KGUudGFyZ2V0LnZhbHVlKTtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IGUudGFyZ2V0LnZhbHVlLCBpc1ZhbGlkOiBpc1ZhbGlkLCBpc0RpcnR5OiB0cnVlfSk7XHJcblxyXG4gICAgICBpZiAoJC5pc0Z1bmN0aW9uKHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZSkpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICB2YWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IHZhbHVlfSk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS52YWx1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZWZzLmlucHV0LmdldERPTU5vZGUoKS5zZWxlY3QoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENsZWFyIHZhbHVlIGFuZCByZXNldCB2YWxpZGF0aW9uIHN0YXRlcy4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdmFsdWU6IFwiXCIsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsaWRhdG9yOiBmdW5jdGlvbihyZSkge1xyXG4gICAgICB0aGlzLnZhbGlkYXRvciA9IG5ldyBSZWdFeHAocmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsaWRhdG9yKHRoaXMucHJvcHMucmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXdQcm9wcykge1xyXG4gICAgICB0aGlzLnNldFZhbGlkYXRvcihuZXdQcm9wcy5yZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdmFsdWU6IFwiXCIsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICB0eXBlOiBcInRleHRcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlOiAvXlxccyotP1xcZCtcXHMqJC8sXHJcbiAgICAgICAgc2hvd0Vycm9yOiBmYWxzZSxcclxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICBjbGFzc05hbWU6IFwiXCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgdmFsaWRhdGlvblN0YXRlID0gUmVhY3QuYWRkb25zLmNsYXNzU2V0KHtcclxuICAgICAgICBcImhhcy1zdWNjZXNzXCI6IHRoaXMuc3RhdGUuaXNWYWxpZCAmJiB0aGlzLnN0YXRlLmlzRGlydHksXHJcbiAgICAgICAgXCJoYXMtd2FybmluZ1wiOiAhdGhpcy5zdGF0ZS5pc0RpcnR5ICYmIHRoaXMucHJvcHMuc2hvd0Vycm9yLFxyXG4gICAgICAgIFwiaGFzLWVycm9yXCI6ICF0aGlzLnN0YXRlLmlzVmFsaWRcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgZXJyb3I7XHJcbiAgICAgIGlmICh0aGlzLnByb3BzLnNob3dFcnJvcikge1xyXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5pc1ZhbGlkKSB7XHJcbiAgICAgICAgICBlcnJvciA9IFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbnRyb2wtbGFiZWxcIn0sIFwiVmlyaGVlbGxpbmVuIHN5w7Z0ZVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5wcm9wcy5yZXF1aXJlZCAmJiB0aGlzLnZhbHVlKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBlcnJvciA9IFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbnRyb2wtbGFiZWxcIn0sIFwiVMOkeXTDpCB0w6Rtw6Qga2VudHTDpFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwIFwiICsgdmFsaWRhdGlvblN0YXRlfSwgXHJcbiAgICAgICAgICBlcnJvcixcclxuICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcImlucHV0XCIsIG9uQ2hhbmdlOnRoaXMuaGFuZGxlQ2hhbmdlLCB2YWx1ZTp0aGlzLnN0YXRlLnZhbHVlLCBwbGFjZWhvbGRlcjp0aGlzLnByb3BzLnBsYWNlaG9sZGVyLFxyXG4gICAgICAgICAgdHlwZTp0aGlzLnByb3BzLnR5cGUsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBcIiArIHRoaXMucHJvcHMuY2xhc3NOYW1lfSApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBIG51bWJlciBpbnB1dCB3aXRoIHR3byBidXR0b25zIGZvciBpbmNyZW1lbnRpbmcgYW5kIGRlY3JlbWVudGluZy5cclxuICAgKi9cclxuICBtb2R1bGUuTnVtSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOdW1JbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXA6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgb25WYWxpZGl0eUNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsdWVBbmRWYWxpZGl0eTogZnVuY3Rpb24odmFsdWUsIGlzVmFsaWQpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdmFsdWU6IHZhbHVlLCBpc1ZhbGlkOiBpc1ZhbGlkXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoJC5pc0Z1bmN0aW9uKHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZSkpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSgwLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlRGVjcmVtZW50OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KHRoaXMudmFsdWUoKSAtIHRoaXMucHJvcHMuc3RlcCwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUluY3JlbWVudDogZnVuY3Rpb24oZSkge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh0aGlzLnZhbHVlKCkgKyB0aGlzLnByb3BzLnN0ZXAsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVzZXQgc3RhdGUgdG8gaW5wdXQgdmFsdWUgaWYgaW5wdXQgdmFsdWUgaXMgYSBudW1iZXIuICovXHJcbiAgICBoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyIHZhbCA9IGUudGFyZ2V0LnZhbHVlO1xyXG4gICAgICB2YXIgaXNWYWxpZCA9ICFpc05hTihwYXJzZUZsb2F0KHZhbCkpO1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkodmFsLCBpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gcGFyc2VGbG9hdCh0aGlzLnN0YXRlLnZhbHVlKSB8fCAwO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHZhbHVlOiBudWxsLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWVcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdGVwOiAxXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIFJlSW5wdXQgPSBtb2R1bGUuUmVJbnB1dDtcclxuICAgICAgdmFyIGJ0bkNsYXNzID0gdGhpcy5wcm9wcy5idG5DbGFzcyB8fCBcImJ0biBidG4tbGcgYnRuLXByaW1hcnlcIjtcclxuICAgICAgdmFyIHZhbGlkYXRpb25TdGF0ZSA9IHRoaXMuc3RhdGUuaXNWYWxpZCA/IFwiaGFzLXN1Y2Nlc3NcIiA6IFwiaGFzLWVycm9yXCI7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwIFwiICsgdmFsaWRhdGlvblN0YXRlfSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS0zIGNvbC14cy0zXCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOmJ0bkNsYXNzICsgXCIgcHVsbC1yaWdodFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlRGVjcmVtZW50fSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1sZWZ0XCJ9KVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IGNvbC14cy02XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwibnVtYmVyXCIsIHZhbHVlOnRoaXMuc3RhdGUudmFsdWUsIG9uQ2hhbmdlOnRoaXMuaGFuZGxlQ2hhbmdlLFxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCB0ZXh0LWNlbnRlclwiLCBwbGFjZWhvbGRlcjp0aGlzLnByb3BzLnBsYWNlaG9sZGVyfSlcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS0zIGNvbC14cy0zXCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOmJ0bkNsYXNzICsgXCIgcHVsbC1sZWZ0XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVJbmNyZW1lbnR9LCBcclxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0XCJ9KVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIG1vZHVsZTtcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1Db21wb25lbnRzOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG52YXIgRm9ybUNvbXBvbmVudHMgPSByZXF1aXJlKFwiLi9mb3JtLWNvbXBvbmVudHNcIik7XHJcbnZhciBBbnN3ZXJGb3JtID0gRm9ybUNvbXBvbmVudHMuQW5zd2VyRm9ybTtcclxudmFyIE51bUlucHV0ID0gRm9ybUNvbXBvbmVudHMuTnVtSW5wdXQ7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbXBsZXRlIGFuc3dlciBmb3JtcyBmb3IgdGFza3MuXHJcbiAqL1xyXG52YXIgRm9ybXMgPSB7XHJcbiAgLyoqXHJcbiAgICogQW4gYW5zd2VyIGZvcm0gd2l0aCBpbnB1dHMgZm9yIHggYW5kIHkgY29vcmRpbmF0ZXMuXHJcbiAgICovXHJcbiAgQ29vcmRzQW5zd2VyRm9ybTogUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29vcmRzQW5zd2VyRm9ybScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uQW5zd2VyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSB0aGlzLnByb3BzLm9uQW5zd2VyKHRoaXMucmVmcy54LnZhbHVlKCksIHRoaXMucmVmcy55LnZhbHVlKCkpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVJbmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5mb3JtLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBjbGFzc05hbWU6XCJmb3JtLWhvcml6b250YWxcIiwgb25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9LCBcclxuICAgICAgICAgIE51bUlucHV0KCB7cmVmOlwieFwiLCBwbGFjZWhvbGRlcjpcInhcIn0pLFxyXG4gICAgICAgICAgTnVtSW5wdXQoIHtyZWY6XCJ5XCIsIHBsYWNlaG9sZGVyOlwieVwifSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSlcclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1zO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKlxyXG4gKiBDb21wb25lbnQgZXh0ZW5zaW9ucyBpLmUuIG1peGlucy5cclxuICovXHJcblxyXG5cclxuLyoqXHJcbiAqIFJlbmRlciBMYVRleCBtYXRocyBub3RhdGlvbiBpbnRvIHdlYiBmb250cyB1c2luZyBNYXRoSmF4LlxyXG4gKiBUT0RPXHJcbiAqL1xyXG4vLyB2YXIgTWF0aEpheCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuLy8gICByZXByb2Nlc3M6IGZ1bmN0aW9uKCkge1xyXG4vLyAgICAgdmFyIGVsZW0gPSB0aGlzLnJlZnMuc2NyaXB0LmdldERPTU5vZGUoKTtcclxuLy8gICAgIGNvbnNvbGUubG9nKGVsZW0pO1xyXG4vLyAgICAgTWF0aEpheC5IdWIuUXVldWUoW1wiUmVwcm9jZXNzXCIsIE1hdGhKYXguSHViLCBlbGVtXSk7XHJcbi8vICAgfSxcclxuXHJcbi8vICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4vLyAgICAgdGhpcy5yZXByb2Nlc3MoKTtcclxuLy8gICB9LFxyXG5cclxuLy8gICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbigpIHtcclxuLy8gICAgIHRoaXMucmVwcm9jZXNzKCk7XHJcbi8vICAgfSxcclxuXHJcbi8vICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuLy8gICAgIHJldHVybiAoXHJcbi8vICAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuLy8gICAgICAgPHNwYW4+XHJcbi8vICAgICAgICAgPHNjcmlwdCByZWY9XCJzY3JpcHRcIiB0eXBlPVwibWF0aC90ZXhcIj57dGhpcy5wcm9wcy5jaGlsZHJlbn08L3NjcmlwdD5cclxuLy8gICAgICAgPC9zcGFuPlxyXG4vLyAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4vLyAgICAgKTtcclxuLy8gICB9XHJcbi8vIH0pO1xyXG5cclxuLyoqXHJcbiAqIFByb3ZpZGVzIGEgc2V0SW50ZXJ2YWwgZnVuY3Rpb24gd2hpY2ggd2lsbCBnZXQgY2xlYW5lZCB1cCB3aGVuXHJcbiAqIHRoZSBjb21wb25lbnQgaXMgZGVzdHJveWVkLlxyXG4gKi9cclxudmFyIFNldEludGVydmFsTWl4aW4gPSB7XHJcbiAgc2V0SW50ZXJ2YWw6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5pbnRlcnZhbHMucHVzaChzZXRJbnRlcnZhbC5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcclxuICB9LFxyXG5cclxuICBjbGVhckFsbEludGVydmFsczogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmludGVydmFscy5tYXAoY2xlYXJJbnRlcnZhbCk7XHJcbiAgICB0aGlzLmludGVydmFscyA9IFtdO1xyXG4gIH0sXHJcblxyXG4gIC8qKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGluaXRpYWxpemVkLiAqL1xyXG4gIGNvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmludGVydmFscyA9IFtdO1xyXG4gIH0sXHJcblxyXG4gIC8qKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGRlc3Ryb3llZC4gKi9cclxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmNsZWFyQWxsSW50ZXJ2YWxzKCk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFwcGx5IENTUyBjbGFzc2VzIGZvciBzZXQgZHVyYXRpb24sIHVzZWZ1bCBmb3Igc2luZ2xlc2hvdCBhbmltYXRpb25zLlxyXG4gKi9cclxudmFyIFRyaWdnZXJBbmltYXRpb25NaXhpbiA9IHtcclxuICBhbmltYXRlOiBmdW5jdGlvbihlbGVtLCBjbGFzc05hbWUsIGR1cmF0aW9uKSB7XHJcbiAgICBkdXJhdGlvbiA9IGR1cmF0aW9uIHx8IDEwMDA7XHJcbiAgICBpZiAoIXRoaXMudGltZW91dCAmJiB0aGlzLnRpbWVvdXQgIT09IDApIHtcclxuICAgICAgZWxlbS5hZGRDbGFzcyhjbGFzc05hbWUpO1xyXG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGVsZW0ucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKTtcclxuICAgICAgICB0aGlzLnRpbWVvdXQgPSBudWxsO1xyXG4gICAgICB9LmJpbmQodGhpcyksIGR1cmF0aW9uKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBTZXRJbnRlcnZhbE1peGluOiBTZXRJbnRlcnZhbE1peGluLFxyXG4gIFRyaWdnZXJBbmltYXRpb25NaXhpbjogVHJpZ2dlckFuaW1hdGlvbk1peGluXHJcbn07XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQSB3cmFwcGVyIGZvciBCb290c3RyYXAncyBwYW5lbCBjb21wb25lbnQuXHJcbiAqL1xyXG52YXIgVGFza1BhbmVsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza1BhbmVsJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgdmFyIGNsYXNzTmFtZSA9IFwicGFuZWwgXCIgKyAodGhpcy5wcm9wcy5jbGFzc05hbWUgfHwgXCJwYW5lbC1pbmZvXCIgKTtcclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzTmFtZX0sIFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1oZWFkaW5nXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5oMygge2NsYXNzTmFtZTpcInBhbmVsLXRpdGxlXCJ9LCB0aGlzLnByb3BzLmhlYWRlcilcclxuICAgICAgICApLFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1ib2R5XCJ9LCBcclxuICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG4vKipcclxuICogQSB3cmFwcGVyIGZvciBCb290c3RyYXAncyBwcm9ncmVzcyBiYXIgZWxlbWVudC5cclxuICovXHJcbnZhciBUYXNrUHJvZ3Jlc3NCYXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrUHJvZ3Jlc3NCYXInLFxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgbWF4OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICBub3c6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZFxyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgc2luZ2xlV2lkdGggPSBNYXRoLmNlaWwoMSAvIHRoaXMucHJvcHMubWF4ICogMTAwKTtcclxuICAgIHZhciBsZWZ0U3R5bGUgPSB7d2lkdGg6IHNpbmdsZVdpZHRoICogKHRoaXMucHJvcHMubm93IC0gMSkgKyBcIiVcIn07XHJcbiAgICB2YXIgcmlnaHRTdHlsZSA9IHt3aWR0aDogc2luZ2xlV2lkdGggKiAodGhpcy5wcm9wcy5tYXggLSB0aGlzLnByb3BzLm5vdyArIDEpICsgXCIlXCJ9O1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSB0YXNrLXByb2dyZXNzLWJhclwifSwgXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzLWJhciBwcm9ncmVzcy1iYXItc3VjY2Vzc1wiLCBzdHlsZTpsZWZ0U3R5bGV9KSxcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MtYmFyIHByb2dyZXNzLWJhci13YXJuaW5nXCIsIHN0eWxlOnJpZ2h0U3R5bGV9KVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIFRhc2sgaGVhZGVyIHdpdGggdGFzayBuYW1lIGFuZCBhbiBvcHRpb25hbCBzdGVwIGNvdW50ZXIuXHJcbiAqL1xyXG52YXIgVGFza0hlYWRlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tIZWFkZXInLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIG5hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcclxuICAgIHN0ZXA6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICBzdGVwczogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgc3RlcENvdW50ZXI7XHJcbiAgICBpZiAodGhpcy5wcm9wcy5zdGVwICYmIHRoaXMucHJvcHMuc3RlcHMpIHtcclxuICAgICAgc3RlcENvdW50ZXIgPSBUYXNrUHJvZ3Jlc3NCYXIoIHttYXg6dGhpcy5wcm9wcy5zdGVwcywgbm93OnRoaXMucHJvcHMuc3RlcH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWhlYWRlciByb3dcIn0sIFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tN1wifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uaDIobnVsbCwgdGhpcy5wcm9wcy5uYW1lKVxyXG4gICAgICAgICksXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01XCJ9LCBcclxuICAgICAgICAgIHN0ZXBDb3VudGVyXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBbiBlbGVtZW50IHRoYXQgaXMgc2hvd24gYWZ0ZXIgYSBjb21wbGV0ZWQgdGFzay5cclxuICovXHJcbnZhciBUYXNrRG9uZURpc3BsYXkgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrRG9uZURpc3BsYXknLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIHNjb3JlOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciBzY29yZSA9IHRoaXMucHJvcHMuc2NvcmUgfHwgMDtcclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1kb25lLWRpc3BsYXkgYW5pbWF0ZSBib3VuY2UtaW5cIn0sIFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJhbGVydCBhbGVydC1zdWNjZXNzXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJUZWh0w6R2w6Qgc3Vvcml0ZXR0dSFcIiksIFwiIFBpc3RlaXTDpDogXCIsIHNjb3JlXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgVGFza1BhbmVsOiBUYXNrUGFuZWwsXHJcbiAgVGFza1Byb2dyZXNzQmFyOiBUYXNrUHJvZ3Jlc3NCYXIsXHJcbiAgVGFza0hlYWRlcjogVGFza0hlYWRlcixcclxuICBUYXNrRG9uZURpc3BsYXk6IFRhc2tEb25lRGlzcGxheVxyXG59OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIGQzLCBtb2R1bGUsIHJlcXVpcmUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgVGFza1V0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzL3Rhc2stdXRpbHMuanNcIik7XHJcbnZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50cy5qc1wiKTtcclxudmFyIENvb3JkcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Nvb3Jkcy5qc1wiKTtcclxuXHJcbi8qKlxyXG4gKiBDbGljayB0aGUgYXBwcm9wcmlhdGUgc2hhcGUgaW4gYSBjb29yZGluYXRlIHN5c3RlbS5cclxuICovXHJcbnZhciBCYXNpY1NoYXBlc1Rhc2sgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdCYXNpY1NoYXBlc1Rhc2snLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICB9LFxyXG5cclxuICBzdGFydEdhbWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7aXNSdW5uaW5nOiB0cnVlLCBzY29yZTogMH0pO1xyXG4gICAgdGhpcy5yZXNldCgpO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2Ygc2l4IGRpZmZlcmVudCBzaGFwZXMgdGhhdCBmaWxsIHRoZSBjb29yZHNcclxuICAgKiBpbiBhIHJhbmRvbSBvcmRlci5cclxuICAgKi9cclxuICBnZXRSYW5kb21TaGFwZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGMxID0gMC40NiwgYzIgPSAxLjIxLCBzMSA9IDEuNDMsIHMyID0gMC44ODU7XHJcbiAgICB2YXIgcGVudGFnb25QdHMgPSBbWy1zMiwtYzJdLCBbLXMxLGMxXSwgWzAsMS41XSwgW3MxLGMxXSwgW3MyLC1jMl1dO1xyXG4gICAgcGVudGFnb25QdHMgPSBUYXNrVXRpbHMudHJhbnNsYXRlKHBlbnRhZ29uUHRzLCAyLjUsIDEuNSk7XHJcblxyXG4gICAgdmFyIHRyYW5zbGF0ZXMgPSBbWzAsMF0sIFs2LDBdLCBbMCw0XSwgWzYsNF0sIFswLDhdLCBbNiw4XV07XHJcbiAgICB2YXIgYmFzZXMgPSBbXHJcbiAgICAgIHtuYW1lOlwia29sbWlvXCIsIHBvaW50czpbWzEsMF0sIFsxLDNdLCBbNCwwXV19LFxyXG4gICAgICB7bmFtZTpcIm5lbGnDtlwiLCBwb2ludHM6W1sxLDBdLCBbMSwzXSwgWzQsM10sIFs0LDBdXX0sXHJcbiAgICAgIHtuYW1lOlwieW1weXLDpFwiLCBwb2ludHM6W1syLjUsMS41XV0sIHI6MS41fSxcclxuICAgICAge25hbWU6XCJzdXVubmlrYXNcIiwgcG9pbnRzOltbMCwwXSwgWzAuNSwzXSwgWzQuNSwzXSwgWzQsMF1dfSxcclxuICAgICAge25hbWU6XCJwdW9saXN1dW5uaWthc1wiLCBwb2ludHM6W1swLDBdLCBbMC41LDNdLCBbNCwzXSwgWzQuNSwwXV19LFxyXG4gICAgICB7bmFtZTpcInZpaXNpa3VsbWlvXCIsIHBvaW50czpwZW50YWdvblB0c31cclxuICAgIF07XHJcblxyXG4gICAgYmFzZXMgPSBUYXNrVXRpbHMuc2h1ZmZsZShiYXNlcyk7XHJcbiAgICB2YXIgY2xycyA9IGQzLnNjYWxlLmNhdGVnb3J5MTAoKTtcclxuXHJcbiAgICB2YXIgc2hhcGVzID0gYmFzZXMubWFwKGZ1bmN0aW9uKGJhc2UsIGkpIHtcclxuICAgICAgdmFyIHRyYW5zbGF0ZVggPSB0cmFuc2xhdGVzW2ldWzBdICsgTWF0aC5yYW5kb20oKTtcclxuICAgICAgdmFyIHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGVzW2ldWzFdICsgTWF0aC5yYW5kb20oKTtcclxuICAgICAgYmFzZS5wb2ludHMgPSBUYXNrVXRpbHMudHJhbnNsYXRlKGJhc2UucG9pbnRzLCB0cmFuc2xhdGVYLCB0cmFuc2xhdGVZKTtcclxuICAgICAgYmFzZS5rZXkgPSBpO1xyXG4gICAgICBiYXNlLm9uQ2xpY2sgPSB0aGlzLmhhbmRsZVNoYXBlQ2xpY2s7XHJcbiAgICAgIGJhc2Uuc3Ryb2tlID0gXCJibGFja1wiO1xyXG4gICAgICBiYXNlLmZpbGwgPSBjbHJzKFRhc2tVdGlscy5yYW5kKDkpKTtcclxuICAgICAgcmV0dXJuIGJhc2U7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIHJldHVybiBzaGFwZXM7XHJcbiAgfSxcclxuXHJcbiAgLyoqIFJlc2V0IHRoZSBxdWVzdGlvbiwgaS5lLiBnZW5lcmF0ZSBuZXcgc2hhcGVzLiAqL1xyXG4gIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzaGFwZXMgPSB0aGlzLmdldFJhbmRvbVNoYXBlcygpO1xyXG5cclxuICAgIC8vIFByZXZlbnQgYXNraW5nIGZvciB0aGUgc2FtZSBzaGFwZSB0d2ljZSBpbiBhIHJvdy5cclxuICAgIHZhciBwb3NzaWJsZVRhcmdldHMgPSBzaGFwZXM7XHJcbiAgICBpZiAodGhpcy5zdGF0ZS50YXJnZXQpIHtcclxuICAgICAgcG9zc2libGVUYXJnZXRzID0gcG9zc2libGVUYXJnZXRzLmZpbHRlcihmdW5jdGlvbihzaGFwZSkge1xyXG4gICAgICAgIHJldHVybiBzaGFwZS5uYW1lICE9PSB0aGlzLnN0YXRlLnRhcmdldC5uYW1lO1xyXG4gICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG4gICAgdmFyIHRhcmdldCA9IHBvc3NpYmxlVGFyZ2V0c1tUYXNrVXRpbHMucmFuZChwb3NzaWJsZVRhcmdldHMubGVuZ3RoKV07XHJcblxyXG4gICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgIHNoYXBlczogdGhpcy5nZXRSYW5kb21TaGFwZXMoKSxcclxuICAgICAgdGFyZ2V0OiB0YXJnZXRcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8qKiBDaGVjayBpZiBjb3JyZWN0IHNoYXBlIGFuZCBwcm9jZWVkLiAqL1xyXG4gIGhhbmRsZVNoYXBlQ2xpY2s6IGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICB2YXIgc2NvcmVJbmNyZW1lbnQ7XHJcbiAgICBpZiAoc2hhcGUubmFtZSA9PT0gdGhpcy5zdGF0ZS50YXJnZXQubmFtZSkge1xyXG4gICAgICBzY29yZUluY3JlbWVudCA9IDE7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzY29yZUluY3JlbWVudCA9IC0xO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2V0U3RhdGUoe3Njb3JlOiBNYXRoLm1heCh0aGlzLnN0YXRlLnNjb3JlICsgc2NvcmVJbmNyZW1lbnQsIDApfSk7XHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlVGFza0RvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5wcm9wcy5vblRhc2tEb25lKCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHNoYXBlczogW10sXHJcbiAgICAgIHNjb3JlOiAwLFxyXG4gICAgICBpc1J1bm5pbmc6IGZhbHNlLFxyXG4gICAgICBpc0ZpbmlzaGVkOiBmYWxzZVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgdmFyIFRhc2tQYW5lbCA9IFRhc2tDb21wb25lbnRzLlRhc2tQYW5lbDtcclxuICAgIHZhciBUYXNrSGVhZGVyID0gVGFza0NvbXBvbmVudHMuVGFza0hlYWRlcjtcclxuICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcblxyXG4gICAgdmFyIHNoYXBlcyA9IHRoaXMuc3RhdGUuc2hhcGVzO1xyXG4gICAgdmFyIHRhc2tJc0RvbmUgPSB0aGlzLnN0YXRlLnN0ZXAgPiBwYXJzZUludCh0aGlzLnByb3BzLnN0ZXBzKTtcclxuICAgIHZhciBjb29yZHMsIHNpZGViYXI7XHJcblxyXG4gICAgaWYgKCF0aGlzLnN0YXRlLmlzRmluaXNoZWQpIHtcclxuICAgICAgdmFyIGJvdW5kcyA9IHttYXhZOiAxMiwgbWF4WDogMTIsIG1pblk6IDAsIG1pblg6IDB9O1xyXG5cclxuICAgICAgY29vcmRzID0gQ29vcmRzKCB7ZHJhd0F4ZXM6ZmFsc2UsIHNoYXBlczpzaGFwZXMsIGJvdW5kczpib3VuZHMsIGFzcGVjdDoxfSApO1xyXG5cclxuICAgICAgdmFyIHNoYXBlVG9GaW5kID0gXCJrb2xtaW9cIjtcclxuXHJcbiAgICAgIHZhciBzdGFydEJ0biA9IHRoaXMuc3RhdGUuaXNSdW5uaW5nID8gbnVsbCA6IChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImFuaW1hdGVkIGFuaW1hdGVkLXJlcGVhdCBib3VuY2UgYnRuIGJ0bi1wcmltYXJ5IGJ0bi1ibG9ja1wiLCBvbkNsaWNrOnRoaXMuc3RhcnRHYW1lfSwgXG4gICAgICAgICAgICBcIkFsb2l0YSBwZWxpXCJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgdmFyIHRhcmdldERpc3BsYXkgPSAhdGhpcy5zdGF0ZS50YXJnZXQgPyBudWxsIDogKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJhbmltYXRlZCBib3VuY2UtaW5cIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxuICAgICAgICAgIFwiS2xpa2F0dGF2YSBrYXBwYWxlOiBcIiwgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCB0aGlzLnN0YXRlLnRhcmdldC5uYW1lKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcbiAgICAgICAgICBcIlBpc3RlZXQ6IFwiLCB0aGlzLnN0YXRlLnNjb3JlXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcbiAgICAgICAgICAgIFwiRXRzaSBrb29yZGluYWF0aXN0b3N0YSBcIiwgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBzaGFwZVRvRmluZCksIFwiIGphIGtsaWtrYWEgc2l0w6RcIixcbiAgICAgICAgICAgIHN0YXJ0QnRuLFxyXG4gICAgICAgICAgICB0YXJnZXREaXNwbGF5XHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodGFza0lzRG9uZSkge1xyXG4gICAgICBjb29yZHMgPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZToxMH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgVGFza0hlYWRlcigge25hbWU6XCJLYXBwYWxlaWRlbiB0dW5uaXN0YW1pbmVuXCIsIHN0ZXA6dGhpcy5zdGF0ZS5zdGVwLCBzdGVwczp0aGlzLnByb3BzLnN0ZXBzfSApLFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgY29vcmRzXHJcbiAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNSBjb2wtc20tb2Zmc2V0LTFcIn0sIFxyXG4gICAgICAgICAgICBzaWRlYmFyXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYXNpY1NoYXBlc1Rhc2s7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIFRhc2tVdGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy90YXNrLXV0aWxzXCIpO1xyXG52YXIgVGFza0NvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHNcIik7XHJcbnZhciBDb29yZHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9jb29yZHNcIik7XHJcbnZhciBGb3JtcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Zvcm1zXCIpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZWFkIHBvc2l0aW9ucyBmcm9tIGEgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAqL1xyXG52YXIgU2ltcGxlQ29vcmRzVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NpbXBsZUNvb3Jkc1Rhc2snLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIHN0ZXBzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICBvblRhc2tEb25lOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgfSxcclxuXHJcbiAgLyoqIFJlc2V0IHRoZSBxdWVzdGlvbiwgaS5lLiBnZW5lcmF0ZSBhIG5ldyByYW5kb20gcG9pbnQuICovXHJcbiAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIG5ld1BvaW50O1xyXG4gICAgZG8geyBuZXdQb2ludCA9IFtUYXNrVXRpbHMucmFuZFJhbmdlKDAsIDEwKSwgVGFza1V0aWxzLnJhbmRSYW5nZSgwLCAxMCldOyB9XHJcbiAgICB3aGlsZSAoVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihuZXdQb2ludCwgdGhpcy5zdGF0ZS5wb2ludCkpO1xyXG5cclxuICAgIHRoaXMuc2V0U3RhdGUoe3BvaW50OiBuZXdQb2ludH0pO1xyXG4gIH0sXHJcblxyXG4gIC8qKiBDaGVjayBpZiBjb3JyZWN0LiAqL1xyXG4gIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmFyIGlzQ29ycmVjdCA9IFRhc2tVdGlscy5tYXRjaGVzU29sdXRpb24oW3gsIHldLCB0aGlzLnN0YXRlLnBvaW50KTtcclxuICAgIGlmIChpc0NvcnJlY3QpXHJcbiAgICAgIHRoaXMuaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG5cclxuICAgIHJldHVybiBpc0NvcnJlY3Q7XHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc3RlcCA9IHRoaXMuc3RhdGUuc3RlcDtcclxuICAgIGlmIChzdGVwID09PSBwYXJzZUludCh0aGlzLnByb3BzLnN0ZXBzKSlcclxuICAgICAgdGhpcy5oYW5kbGVUYXNrRG9uZSgpO1xyXG4gICAgZWxzZVxyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3N0ZXA6IHN0ZXAgKyAxfSk7XHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlVGFza0RvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5wcm9wcy5vblRhc2tEb25lKCk7XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5yZXNldCgpO1xyXG4gIH0sXHJcblxyXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdGVwOiAxLFxyXG4gICAgICBwb2ludDogbnVsbFxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgdmFyIFRhc2tQYW5lbCA9IFRhc2tDb21wb25lbnRzLlRhc2tQYW5lbDtcclxuICAgIHZhciBUYXNrSGVhZGVyID0gVGFza0NvbXBvbmVudHMuVGFza0hlYWRlcjtcclxuICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICB2YXIgQ29vcmRzQW5zd2VyRm9ybSA9IEZvcm1zLkNvb3Jkc0Fuc3dlckZvcm07XHJcblxyXG4gICAgdmFyIHBvaW50ID0gdGhpcy5zdGF0ZS5wb2ludDtcclxuICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcyk7XHJcbiAgICB2YXIgY29vcmRzLCBzaWRlYmFyO1xyXG5cclxuICAgIGlmIChwb2ludCAmJiAhdGFza0lzRG9uZSkge1xyXG4gICAgICB2YXIgYm91bmRzID0ge21heFk6IDEwLCBtYXhYOiAxMCwgbWluWTogLTIsIG1pblg6IC0yfTtcclxuICAgICAgdmFyIHNoYXBlcyA9IFt7cG9pbnRzOiBbcG9pbnRdLCByOjAuMiwgc3Ryb2tlV2lkdGg6IDMsIHN0cm9rZTogXCIjRkY1QjI0XCIsIGZpbGw6XCIjRkQwMDAwXCJ9XTtcclxuXHJcbiAgICAgIGNvb3JkcyA9IENvb3Jkcygge3NoYXBlczpzaGFwZXMsIGJvdW5kczpib3VuZHMsIGFzcGVjdDoxfSApO1xyXG5cclxuICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXCJNaXRrw6Qgb3ZhdCBwaXN0ZWVuIHgtamEgeS1rb29yZGluYWF0aXQ/XCIpXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiVmFzdGF1c1wiLCBjbGFzc05hbWU6XCJwYW5lbC1zdWNjZXNzIHBhbmVsLWV4dHJhLXBhZGRpbmdcIn0sIFxyXG4gICAgICAgICAgICBDb29yZHNBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBvbkFuc3dlcjp0aGlzLmhhbmRsZUFuc3dlcn0gKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRhc2tJc0RvbmUpIHtcclxuICAgICAgY29vcmRzID0gVGFza0RvbmVEaXNwbGF5KCB7c2NvcmU6MTB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgIFRhc2tIZWFkZXIoIHtuYW1lOlwiS29vcmRpbmFhdGlzdG9uIGx1a2VtaW5lblwiLCBzdGVwOnRoaXMuc3RhdGUuc3RlcCwgc3RlcHM6dGhpcy5wcm9wcy5zdGVwc30gKSxcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBxdWVzdGlvblwifSwgXHJcbiAgICAgICAgICAgIGNvb3Jkc1xyXG4gICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTUgY29sLXNtLW9mZnNldC0xXCJ9LCBcclxuICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2ltcGxlQ29vcmRzVGFzazsiLCJcInVzZSBzdHJpY3RcIjtcclxuLyogZ2xvYmFsIG1vZHVsZSAqL1xyXG5cclxuLyoqXHJcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIChtYWlubHkgbWF0aHMgcmVsYXRlZCkgZm9yIHRhc2tzLlxyXG4gKi9cclxudmFyIFRhc2tVdGlscyA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgaW4gcmFuZ2UgW21pbiwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1pbiAgIEluY2x1c2l2ZSBsb3dlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7KG51bWJlcnxbbnVtYmVyXSl9IEEgc2luZ2xlIG9yIG11bHRpcGxlIHJhbmRvbSBpbnRzLlxyXG4gICAgICovXHJcbiAgICByYW5kUmFuZ2U6IGZ1bmN0aW9uKG1pbiwgbWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmRSYW5nZShtaW4sIG1heCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByYW5kcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pbjtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBpbiByYW5nZSBbMCwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfFtudW1iZXJdfSBBIHNpbmdsZSBvciBtdWx0aXBsZSByYW5kb20gaW50cy5cclxuICAgICAqL1xyXG4gICAgcmFuZDogZnVuY3Rpb24obWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmQobWF4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJhbmRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKiBSZW9yZGVycyBnaXZlbiBhcnJheSByYW5kb21seSwgZG9lc24ndCBtb2RpZnkgb3JpZ2luYWwgYXJyYXkuICovXHJcbiAgICBzaHVmZmxlOiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgY2xvbmUgPSBhcnIuc2xpY2UoKTtcclxuICAgICAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGNsb25lLmxlbmd0aDsgaSA+IDA7IGktLSkge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnJhbmQoaSk7XHJcbiAgICAgICAgICAgIHNodWZmbGVkLnB1c2goY2xvbmUuc3BsaWNlKGluZGV4LCAxKVswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2h1ZmZsZWQ7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZ2Ugb2YgaW50ZWdlcnMuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gIG1pbiAgSW5jbHVzaXZlIGxvd2VyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9ICBtYXggIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gc3RlcCBPcHRpb25hbCBpbmNyZW1lbnQgdmFsdWUsIGRlZmF1bHRzIHRvIDEuXHJcbiAgICAgKiBAcmV0dXJuIHtbbnVtYmVyXX0gICAgVGhlIHNwZWNpZmllZCByYW5nZSBvZiBudW1iZXJzIGluIGFuIGFycmF5LlxyXG4gICAgICovXHJcbiAgICByYW5nZTogZnVuY3Rpb24obWluLCBtYXgsIHN0ZXApIHtcclxuICAgICAgICBzdGVwID0gc3RlcCB8fCAxO1xyXG4gICAgICAgIHZhciByZXMgPSBbXTtcclxuICAgICAgICBpZiAoc3RlcCA+IDApIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IG1pbjsgaSA8IG1heDsgaSArPSBzdGVwKSB7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaChpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSBtaW47IGogPiBtYXg7IGogKz0gc3RlcCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2goaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIHdoZXRoZXIgYXJyYXlzIGVxdWFsLlxyXG4gICAgICogQHBhcmFtICBhcnIxXHJcbiAgICAgKiBAcGFyYW0gIGFycjJcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGFycmF5c0VxdWFsOiBmdW5jdGlvbihhcnIxLCBhcnIyKSB7XHJcbiAgICAgICAgaWYgKGFycjEubGVuZ3RoICE9PSBhcnIyLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICByZXR1cm4gYXJyMS5ldmVyeShmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkID09PSBhcnIyW2ldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFuc2xhdGUgYW4gYXJyYXkgb2YgcG9pbnRzIGJ5IGdpdmVuIHggYW5kIHkgdmFsdWVzLlxyXG4gICAgICogQHBhcmFtICB7W1tudW1iZXJdXX0gcG9pbnRzXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICB4XHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICB5XHJcbiAgICAgKiBAcmV0dXJuIHtbW251bWJlcl1dfVxyXG4gICAgICovXHJcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHBvaW50cywgeCwgeSkge1xyXG4gICAgICAgIHJldHVybiBwb2ludHMubWFwKGZ1bmN0aW9uKHBvaW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbcG9pbnRbMF0gKyB4LCBwb2ludFsxXSArIHldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb21wYXJlIGdpdmVuIGFuc3dlciB0byB0aGUgY29ycmVjdCBzb2x1dGlvbi4gU3VwcG9ydHMgdmFyaW91cyBkYXRhIHR5cGVzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBhbnN3ZXJcclxuICAgICAqIEBwYXJhbSBzb2x1dGlvbiBBIHN0cmluZywgbnVtYmVyLCBhcnJheSwgb2JqZWN0IG9yIFJlZ0V4cC5cclxuICAgICAqIEBwYXJhbSBlcHNpbG9uICBPcHRpb25hbCBtYXggZXJyb3IgdmFsdWUgZm9yIGZsb2F0IGNvbXBhcmlzb24sIGRlZmF1bHQgaXMgMC4wMDEuXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGNvcnJlY3QsIG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgbWF0Y2hlc1NvbHV0aW9uOiBmdW5jdGlvbihhbnN3ZXIsIHNvbHV0aW9uLCBlcHNpbG9uKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhbnN3ZXIgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLnRyaW0oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc29sdXRpb24gPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgYW5zd2VyID0gcGFyc2VGbG9hdChhbnN3ZXIpO1xyXG4gICAgICAgICAgICBpZiAoaXNOYU4oYW5zd2VyKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBlcHNpbG9uID0gZXBzaWxvbiA9PT0gdW5kZWZpbmVkID8gMC4wMDEgOiBlcHNpbG9uO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguYWJzKGFuc3dlciAtIHNvbHV0aW9uKSA8PSBlcHNpbG9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzb2x1dGlvbi50ZXN0KGFuc3dlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGlmICghYW5zd2VyIGluc3RhbmNlb2YgQXJyYXkgfHwgYW5zd2VyLmxlbmd0aCAhPT0gc29sdXRpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFuc3dlci5ldmVyeShmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5tYXRjaGVzU29sdXRpb24oZCwgc29sdXRpb25baV0sIGVwc2lsb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICBpZiAoIWFuc3dlciBpbnN0YW5jZW9mIE9iamVjdClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBhbnNLZXlzID0gT2JqZWN0LmtleXMoYW5zd2VyKTtcclxuICAgICAgICAgICAgaWYgKGFuc0tleXMubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhzb2x1dGlvbikubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFuc0tleXMuZXZlcnkoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQubWF0Y2hlc1NvbHV0aW9uKGFuc3dlcltkXSwgc29sdXRpb25bZF0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhbnN3ZXIgPT09IHNvbHV0aW9uO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUYXNrVXRpbHM7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIEFwcGxpY2F0aW9uID0gcmVxdWlyZShcIi4vanMvYXBwbGljYXRpb24uanNcIik7XHJcblxyXG4gICAgUmVhY3QucmVuZGVyQ29tcG9uZW50KFxyXG4gICAgICAgIEFwcGxpY2F0aW9uKG51bGwgKSxcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcGxpY2F0aW9uXCIpXHJcbiAgICApO1xyXG59KTtcclxuLyoganNoaW50IGlnbm9yZTplbmQgKi8iXX0=
