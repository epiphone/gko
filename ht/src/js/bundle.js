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
var FormComponents = {

  /**
   * A form that disables submitting when contents are invalid.
   */
  AnswerForm: React.createClass({displayName: 'AnswerForm',

    propTypes: {
      onAnswer: React.PropTypes.func.isRequired,
      btnCorrectAnimClass: React.PropTypes.string,
      btnIncorrectAnimClass: React.PropTypes.string,
      formClass: React.PropTypes.string,
      btnClass: React.PropTypes.string
    },

    mixins: [Mixins.TriggerAnimationMixin],

    handleSubmit: function(e) {
      e.preventDefault();
      if (this.state.isValid && this.state.isDirty) {
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
  }),


  /**
   * An <input> with validation states.
   */
  ReInput: React.createClass({displayName: 'ReInput',

    propTypes: {
      re: React.PropTypes.object,
      showError: React.PropTypes.bool,
      required: React.PropTypes.bool,
      placeholder: React.PropTypes.string,
      type: React.PropTypes.string,
      className: React.PropTypes.string
    },

    /** Read value, validate, notify parent element. */
    handleChange: function(e) {
      var isValid = this.validator.test(e.target.value);
      this.props.onValidityChange(isValid);
      this.setState({value: e.target.value, isValid: isValid, isDirty: true});
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
        re: /^\s*\d+\s*$/,
        showError: false,
        required: true
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
  })
};


module.exports = FormComponents;
},{"./mixins":5}],4:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, require, module */
"use strict";


var FormComponents = require("./form-components");
var AnswerForm = FormComponents.AnswerForm;
var ReInput = FormComponents.ReInput;


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
      this.refs.x.reset();
      this.refs.y.reset();
      this.refs.x.select();
    },

    render: function() {
      /* jshint ignore:start */
      return (
        AnswerForm( {ref:"form", className:"form-horizontal", onAnswer:this.handleAnswer}, 
          ReInput( {ref:"x", type:"number", placeholder:"x"}),
          ReInput( {ref:"y", type:"number", placeholder:"y"})
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEFsZWtzaVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXHdhdGNoaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvcmVhY3QtdmVyc2lvL3NyYy9qcy9hcHBsaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvcmVhY3QtdmVyc2lvL3NyYy9qcy9jb21wb25lbnRzL2Nvb3Jkcy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvcmVhY3QtdmVyc2lvL3NyYy9qcy9jb21wb25lbnRzL2Zvcm0tY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvcmVhY3QtdmVyc2lvL3NyYy9qcy9jb21wb25lbnRzL2Zvcm1zLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9yZWFjdC12ZXJzaW8vc3JjL2pzL2NvbXBvbmVudHMvbWl4aW5zLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9yZWFjdC12ZXJzaW8vc3JjL2pzL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9yZWFjdC12ZXJzaW8vc3JjL2pzL3Rhc2tzL2Jhc2ljLXNoYXBlcy10YXNrLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9yZWFjdC12ZXJzaW8vc3JjL2pzL3Rhc2tzL3NpbXBsZS1jb29yZHMtdGFzay5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvcmVhY3QtdmVyc2lvL3NyYy9qcy91dGlscy90YXNrLXV0aWxzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9yZWFjdC12ZXJzaW8vc3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuLyogZ2xvYmFscyBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblxyXG5cclxudmFyIFNpbXBsZUNvb3Jkc1Rhc2sgPSByZXF1aXJlKFwiLi90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2tcIik7XHJcbnZhciBCYXNpY1NoYXBlc1Rhc2sgPSByZXF1aXJlKFwiLi90YXNrcy9iYXNpYy1zaGFwZXMtdGFza1wiKTtcclxuXHJcblxyXG4vKipcclxuICogQ29udGFpbmVyIGFuZCBsaW5rcyBmb3IgZXhhbXBsZSB0YXNrcy5cclxuICovXHJcbnZhciBBcHBsaWNhdGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FwcGxpY2F0aW9uJyxcclxuXHJcbiAgaGFuZGxlTGlzdENsaWNrOiBmdW5jdGlvbihlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB2YXIgdGFza05hbWUgPSBlLnRhcmdldC50ZXh0O1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRUYXNrOiB0YXNrTmFtZX0pO1xyXG4gIH0sXHJcblxyXG4gIGhhbmRsZVRhc2tEb25lOiBmdW5jdGlvbigpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiVGFzayBkb25lIC0gaGVyZSdzIHdoZXJlIHRoZSB0YXNrIGNvbm5lY3RzIHRvIGFuIGV4dGVybmFsIGFwcC5cIik7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7c2VsZWN0ZWRUYXNrOiBcIktvb3JkaW5hYXRpc3RvbiBsdWtlbWluZW5cIn07XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciB0YXNrcyA9IHtcclxuICAgICAgXCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCI6IChTaW1wbGVDb29yZHNUYXNrKCB7b25UYXNrRG9uZTp0aGlzLmhhbmRsZVRhc2tEb25lLCBzdGVwczo1fSkpLFxyXG4gICAgICBcIkthcHBhbGVpZGVuIHR1bm5pc3RhbWluZW5cIjogKEJhc2ljU2hhcGVzVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZX0pKVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgdGFza0xpc3RFbGVtcyA9IE9iamVjdC5rZXlzKHRhc2tzKS5tYXAoZnVuY3Rpb24odGFza05hbWUpIHtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00ubGkobnVsbCwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uYSgge2hyZWY6XCJcIiwgb25DbGljazp0aGlzLmhhbmRsZUxpc3RDbGlja30sIHRhc2tOYW1lKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdmFyIHRhc2sgPSB0YXNrc1t0aGlzLnN0YXRlLnNlbGVjdGVkVGFza107XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICBSZWFjdC5ET00udWwoIHtjbGFzc05hbWU6XCJsaXN0LWlubGluZVwifSwgXHJcbiAgICAgICAgICB0YXNrTGlzdEVsZW1zXHJcbiAgICAgICAgKSxcclxuXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhc2stY29udGFpbmVyXCJ9LCBcclxuICAgICAgICAgIHRhc2tcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFwcGxpY2F0aW9uOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIGQzLCBNYXRoVXRpbHMsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKiogQSAyRCBjb29yZGluYXRlIHN5c3RlbS4gKi9cclxudmFyIENvb3JkcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nvb3JkcycsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgZHJhd0F4ZXM6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgc2hhcGVzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXksXHJcbiAgICBib3VuZHM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXHJcbiAgICBhc3BlY3Q6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICB9LFxyXG5cclxuICBoYW5kbGVSZXNpemU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHBhcmVudCA9ICQodGhpcy5nZXRET01Ob2RlKCkucGFyZW50Tm9kZSk7XHJcbiAgICB0aGlzLnNldFN0YXRlKHt3aWR0aDogcGFyZW50LndpZHRoKCl9KTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHt3aWR0aDogMH07XHJcbiAgfSxcclxuXHJcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRyYXdBeGVzOiB0cnVlLFxyXG4gICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICBib3VuZHM6IHttYXhZOjEwLCBtYXhYOjEwLCBtaW5ZOjAsIG1pblg6MH0sXHJcbiAgICAgIGFzcGVjdDogMVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLmhhbmRsZVJlc2l6ZSk7XHJcbiAgICB0aGlzLmhhbmRsZVJlc2l6ZSgpO1xyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMuaGFuZGxlUmVzaXplKTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgdmFyIG1hcmdpbiA9IHtcclxuICAgICAgdG9wOiAxMCxcclxuICAgICAgcmlnaHQ6IDEwLFxyXG4gICAgICBib3R0b206IDEwLFxyXG4gICAgICBsZWZ0OiAxMFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgd2lkdGggPSB0aGlzLnN0YXRlLndpZHRoID8gdGhpcy5zdGF0ZS53aWR0aCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0IDogMDtcclxuICAgIHZhciBoZWlnaHQgPSBNYXRoLnJvdW5kKHdpZHRoICogdGhpcy5wcm9wcy5hc3BlY3QpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcblxyXG4gICAgdmFyIGJvdW5kcyA9IHRoaXMucHJvcHMuYm91bmRzO1xyXG4gICAgdmFyIHNwYWNpbmcgPSBNYXRoLnJvdW5kKE1hdGgubWluKFxyXG4gICAgICB3aWR0aCAvIE1hdGguYWJzKGJvdW5kcy5tYXhYIC0gYm91bmRzLm1pblgpLFxyXG4gICAgICBoZWlnaHQgLyBNYXRoLmFicyhib3VuZHMubWF4WSAtIGJvdW5kcy5taW5ZKVxyXG4gICAgKSk7XHJcblxyXG4gICAgdmFyIHggPSBkMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAuZG9tYWluKFtib3VuZHMubWluWCwgYm91bmRzLm1pblggKyAxXSlcclxuICAgICAgLnJhbmdlKFswLCBzcGFjaW5nXSk7XHJcblxyXG4gICAgdmFyIHkgPSBkMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAuZG9tYWluKFtib3VuZHMubWluWSwgYm91bmRzLm1pblkgKyAxXSlcclxuICAgICAgLnJhbmdlKFtoZWlnaHQsIGhlaWdodCAtIHNwYWNpbmddKTtcclxuXHJcbiAgICB2YXIgZnVsbFdpZHRoID0gd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodDtcclxuICAgIHZhciBmdWxsSGVpZ2h0ID0gaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b207XHJcbiAgICB2YXIgdHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiO1xyXG5cclxuICAgIHZhciBzaGFwZXMsIGdyaWQ7XHJcbiAgICBpZiAodGhpcy5zdGF0ZS53aWR0aCkge1xyXG4gICAgICBzaGFwZXMgPSBTaGFwZXMoIHt4OngsIHk6eSwgc3BhY2luZzpzcGFjaW5nLCBkYXRhOnRoaXMucHJvcHMuc2hhcGVzfSApO1xyXG4gICAgICBncmlkID0gR3JpZCgge2RyYXdBeGVzOnRoaXMucHJvcHMuZHJhd0F4ZXMsIHg6eCwgeTp5LCBib3VuZHM6Ym91bmRzfSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb29yZHMtY29udGFpbmVyXCJ9LCBcclxuICAgICAgICBSZWFjdC5ET00uc3ZnKCB7d2lkdGg6ZnVsbFdpZHRoLCBoZWlnaHQ6ZnVsbEhlaWdodH0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmcoIHt0cmFuc2Zvcm06dHJhbnNmb3JtfSwgXHJcbiAgICAgICAgICAgIGdyaWQsXHJcbiAgICAgICAgICAgIHNoYXBlc1xyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbi8qKiBBIGdyaWQgZm9yIHRoZSBjb29yZGluYXRlIHN5c3RlbS4gKi9cclxudmFyIEdyaWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdHcmlkJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICB4OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgeTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIGJvdW5kczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxyXG4gICAgc3BhY2luZzogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIHRyYW5zaXRpb25EdXJhdGlvbjogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIGRyYXdBeGVzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxyXG4gIH0sXHJcblxyXG4gIC8qKiBSZWRyYXcgZ3JpZC4gICovXHJcbiAgdXBkYXRlOiBmdW5jdGlvbihwcm9wcykge1xyXG4gICAgdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCh0aGlzLmdldERPTU5vZGUoKSk7XHJcbiAgICB2YXIgYm91bmRzID0gcHJvcHMuYm91bmRzO1xyXG4gICAgdmFyIHNwYWNpbmcgPSBwcm9wcy5zcGFjaW5nO1xyXG4gICAgdmFyIHggPSBwcm9wcy54O1xyXG4gICAgdmFyIHkgPSBwcm9wcy55O1xyXG5cclxuICAgIHZhciB4UmFuZ2UgPSBkMy5yYW5nZShNYXRoLmNlaWwoKGJvdW5kcy5taW5YKSAvIHNwYWNpbmcpLCBNYXRoLnJvdW5kKGJvdW5kcy5tYXhYKSArIHNwYWNpbmcsIHNwYWNpbmcpO1xyXG4gICAgdmFyIHlSYW5nZSA9IGQzLnJhbmdlKE1hdGguY2VpbCgoYm91bmRzLm1pblkpIC8gc3BhY2luZyksIE1hdGgucm91bmQoYm91bmRzLm1heFkpICsgc3BhY2luZywgc3BhY2luZyk7XHJcbiAgICB2YXIgZGF0YSA9IHhSYW5nZS5jb25jYXQoeVJhbmdlKTtcclxuICAgIHZhciBpc1ggPSBmdW5jdGlvbihpbmRleCkgeyByZXR1cm4gaW5kZXggPCB4UmFuZ2UubGVuZ3RoOyB9O1xyXG5cclxuICAgIHZhciBheGVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcIi5heGlzXCIpXHJcbiAgICAgIC5kYXRhKGRhdGEpO1xyXG5cclxuICAgIGF4ZXMuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgIHJldHVybiBcImF4aXMgXCIgKyAoKHByb3BzLmRyYXdBeGVzICYmIGQgPT09IDApID8gXCJ0aGlja1wiIDogXCJcIik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBheGVzLnRyYW5zaXRpb24oKS5kdXJhdGlvbihwcm9wcy50cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoYm91bmRzLm1pblgpOyB9KVxyXG4gICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoYm91bmRzLm1pblkpIDogeShkKTsgfSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB4KGQpIDogeChib3VuZHMubWF4WCk7IH0pXHJcbiAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geShib3VuZHMubWF4WSkgOiB5KGQpOyB9KTtcclxuXHJcbiAgICBheGVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICBpZiAocHJvcHMuZHJhd0F4ZXMpIHtcclxuICAgICAgdmFyIGxhYmVscyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCIubGFiZWxcIikuZGF0YShkYXRhKTtcclxuXHJcbiAgICAgIGxhYmVscy5lbnRlcigpLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwibGFiZWwgXCIgKyAoaXNYKGkpID8gXCJ4XCIgOiBcInlcIik7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkgeyBpZiAoIWQpIHJldHVybiBcIm5vbmVcIjsgfSlcclxuICAgICAgICAudGV4dChPYmplY3QpXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyBcIjEuNGVtXCIgOiBcIi4zZW1cIjsgfSlcclxuICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IG51bGwgOiBcIi0uOGVtXCI7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJmb250LXNpemVcIiwgMSArIFwiZW1cIik7XHJcblxyXG4gICAgICBsYWJlbHMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geChkKSA6IHgoMCk7IH0pXHJcbiAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHkoMCkgOiB5KGQpOyB9KTtcclxuXHJcbiAgICAgIGxhYmVscy5leGl0KCkucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRyYXdBeGVzOiB0cnVlLFxyXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDU1MCxcclxuICAgICAgc3BhY2luZzogMVxyXG4gICAgfTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnVwZGF0ZSh0aGlzLnByb3BzKTtcclxuICB9LFxyXG5cclxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xyXG4gICAgdGhpcy51cGRhdGUobmV4dFByb3BzKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICBSZWFjdC5ET00uZygge2NsYXNzTmFtZTpcImF4ZXNcIn0pXHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICApO1xyXG4gIH1cclxufSk7XHJcblxyXG5cclxuLyoqIFZhcmlvdXMgZ2VvbWV0cmljIHNoYXBlcyB0byBiZSBkcmF3biBvbiB0aGUgY29vcmRpbmF0ZSBzeXN0ZW0uICovXHJcbnZhciBTaGFwZXMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTaGFwZXMnLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIGRhdGE6IFJlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxyXG4gICAgeDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIHk6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICBzcGFjaW5nOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICB0cmFuc2l0aW9uRHVyYXRpb246IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICB9LFxyXG5cclxuICAvKiogUmVkcmF3IHNoYXBlcy4gR2V0cyBjYWxsZWQgd2hlbmV2ZXIgc2hhcGVzIGFyZSB1cGRhdGVkIG9yIHNjcmVlbiByZXNpemVzLiAqL1xyXG4gIHVwZGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcclxuICAgIHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QodGhpcy5nZXRET01Ob2RlKCkpO1xyXG4gICAgdmFyIHRyYW5zaXRpb25EdXJhdGlvbiA9IHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbiB8fCA1NTA7XHJcblxyXG4gICAgdmFyIHBvbHlnb25zID0gY29udGFpbmVyLnNlbGVjdEFsbChcInBvbHlnb24uc2hhcGVcIilcclxuICAgICAgLmRhdGEocHJvcHMuZGF0YS5maWx0ZXIoZnVuY3Rpb24ocykgeyByZXR1cm4gcy5wb2ludHMubGVuZ3RoID4gMjsgfSkpO1xyXG5cclxuICAgIHZhciBhZGRlZFBvbHlnb25zID0gcG9seWdvbnMuZW50ZXIoKS5hcHBlbmQoXCJwb2x5Z29uXCIpLmF0dHIoXCJjbGFzc1wiLCBcInNoYXBlXCIpO1xyXG5cclxuICAgIHBvbHlnb25zLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwicG9pbnRzXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gZC5wb2ludHMubWFwKGZ1bmN0aW9uKHBzKSB7XHJcbiAgICAgICAgICByZXR1cm4gW3Byb3BzLngocHNbMF0pLCBwcm9wcy55KHBzWzFdKV07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIHBvbHlnb25zLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcblxyXG4gICAgdmFyIGNpcmNsZXMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwiY2lyY2xlLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA9PSAxOyB9KSk7XHJcblxyXG4gICAgdmFyIGFkZGVkQ2lyY2xlcyA9IGNpcmNsZXMuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgY2lyY2xlcy50cmFuc2l0aW9uKCkuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMF1bMF0pOyB9KVxyXG4gICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMF1bMV0pOyB9KVxyXG4gICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMuc3BhY2luZyAqIChkLnIgfHwgMC4yKTsgfSk7XHJcblxyXG4gICAgY2lyY2xlcy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG5cclxuICAgIHZhciBsaW5lcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJsaW5lLnNoYXBlXCIpXHJcbiAgICAgIC5kYXRhKHByb3BzLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucG9pbnRzLmxlbmd0aCA9PSAyOyB9KSk7XHJcblxyXG4gICAgdmFyIGFkZGVkTGluZXMgPSBsaW5lcy5lbnRlcigpLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgbGluZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzBdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzBdWzFdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy54KGQucG9pbnRzWzFdWzBdKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy55KGQucG9pbnRzWzFdWzFdKTsgfSk7XHJcblxyXG4gICAgbGluZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIEF0dGFjaCBjbGljayBldmVudCBsaXN0ZW5lcnMuXHJcbiAgICBbYWRkZWRQb2x5Z29ucywgYWRkZWRDaXJjbGVzLCBhZGRlZExpbmVzXS5mb3JFYWNoKGZ1bmN0aW9uKGFkZGVkKSB7XHJcbiAgICAgIGFkZGVkLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIGlmICgkLmlzRnVuY3Rpb24oZC5vbkNsaWNrKSlcclxuICAgICAgICAgIGQub25DbGljayhkKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXQgY29tbW9uIGF0dHJpYnV0ZXMuXHJcbiAgICBjb250YWluZXIuc2VsZWN0QWxsKFwiLnNoYXBlXCIpXHJcbiAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmZpbGwgfHwgXCJ0cmFuc3BhcmVudFwiOyB9KVxyXG4gICAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnN0cm9rZSB8fCBcInN0ZWVsYmx1ZVwiOyB9KVxyXG4gICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiAoZC5zdHJva2VXaWR0aCB8fCAyKSArIFwicHhcIjsgfSk7XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy51cGRhdGUodGhpcy5wcm9wcyk7XHJcbiAgfSxcclxuXHJcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcclxuICAgIHRoaXMudXBkYXRlKG5leHRQcm9wcyk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHJldHVybiBSZWFjdC5ET00uZygge2NsYXNzTmFtZTpcInNoYXBlc1wifSk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvb3JkczsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxudmFyIE1peGlucyA9IHJlcXVpcmUoXCIuL21peGluc1wiKTtcclxuXHJcblxyXG4vKipcclxuICogVmFyaW91cyBjb21tb24gZm9ybSBjb21wb25lbnRzLlxyXG4gKi9cclxudmFyIEZvcm1Db21wb25lbnRzID0ge1xyXG5cclxuICAvKipcclxuICAgKiBBIGZvcm0gdGhhdCBkaXNhYmxlcyBzdWJtaXR0aW5nIHdoZW4gY29udGVudHMgYXJlIGludmFsaWQuXHJcbiAgICovXHJcbiAgQW5zd2VyRm9ybTogUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQW5zd2VyRm9ybScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uQW5zd2VyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgICBidG5Db3JyZWN0QW5pbUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5JbmNvcnJlY3RBbmltQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGZvcm1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgYnRuQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcclxuICAgIH0sXHJcblxyXG4gICAgbWl4aW5zOiBbTWl4aW5zLlRyaWdnZXJBbmltYXRpb25NaXhpbl0sXHJcblxyXG4gICAgaGFuZGxlU3VibWl0OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgaWYgKHRoaXMuc3RhdGUuaXNWYWxpZCAmJiB0aGlzLnN0YXRlLmlzRGlydHkpIHtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQW5zd2VyKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd0Vycm9yczogdHJ1ZX0pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYnRuID0gJCh0aGlzLnJlZnMuYnRuLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHRoaXMuYW5pbWF0ZShidG4sIHRoaXMucHJvcHMuYnRuQ29ycmVjdEFuaW1DbGFzcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUluY29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBidG4gPSAkKHRoaXMucmVmcy5idG4uZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdGhpcy5hbmltYXRlKGJ0biwgdGhpcy5wcm9wcy5idG5JbmNvcnJlY3RBbmltQ2xhc3MpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWxpZGl0eTogZnVuY3Rpb24oaXNWYWxpZCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtpc1ZhbGlkOiBpc1ZhbGlkLCBpc0RpcnR5OiB0cnVlfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDbGVhciB2YWx1ZXMgYW5kIHZhbGlkYXRpb24gc3RhdGVzIGZvciBhbGwgY2hpbGQgZWxlbWVudHMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgc2hvd0Vycm9yczogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybUNsYXNzOiBcImZvcm0taG9yaXpvbnRhbFwiLFxyXG4gICAgICAgIGJ0bkNsYXNzOiBcImJ0biBidG4tcHJpbWFyeSBidG4tYmxvY2tcIixcclxuICAgICAgICBidG5Db3JyZWN0QW5pbUNsYXNzOiBcImFuaW1hdGVkIGJvdW5jZVwiLFxyXG4gICAgICAgIGJ0bkluY29ycmVjdEFuaW1DbGFzczogXCJhbmltYXRlZCBzaGFrZVwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICBzaG93RXJyb3JzOiBmYWxzZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMucHJvcHMuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgY2hpbGQucHJvcHMub25WYWxpZGl0eUNoYW5nZSA9IHRoaXMuc2V0VmFsaWRpdHk7XHJcbiAgICAgICAgY2hpbGQucHJvcHMuc2hvd0Vycm9yID0gdGhpcy5zdGF0ZS5zaG93RXJyb3JzO1xyXG4gICAgICAgIHJldHVybiBjaGlsZDtcclxuICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgIHZhciBidG5DbGFzcyA9IHRoaXMucHJvcHMuYnRuQ2xhc3MgKyAodGhpcy5zdGF0ZS5pc1ZhbGlkID8gXCJcIiA6IFwiIGRpc2FibGVkXCIpO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZm9ybSgge3JvbGU6XCJmb3JtXCIsIGNsYXNzTmFtZTp0aGlzLnByb3BzLmZvcm1DbGFzcywgb25TdWJtaXQ6dGhpcy5oYW5kbGVTdWJtaXQsIG5vVmFsaWRhdGU6dHJ1ZX0sIFxyXG4gICAgICAgICAgY2hpbGRyZW4sXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcImJ0blwiLCB0eXBlOlwic3VibWl0XCIsIHZhbHVlOlwiVmFzdGFhXCIsIGNsYXNzTmFtZTpidG5DbGFzc30gKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KSxcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIDxpbnB1dD4gd2l0aCB2YWxpZGF0aW9uIHN0YXRlcy5cclxuICAgKi9cclxuICBSZUlucHV0OiBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdSZUlucHV0JyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgcmU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXHJcbiAgICAgIHNob3dFcnJvcjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIHJlcXVpcmVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgICAgcGxhY2Vob2xkZXI6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIHR5cGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVhZCB2YWx1ZSwgdmFsaWRhdGUsIG5vdGlmeSBwYXJlbnQgZWxlbWVudC4gKi9cclxuICAgIGhhbmRsZUNoYW5nZTogZnVuY3Rpb24oZSkge1xyXG4gICAgICB2YXIgaXNWYWxpZCA9IHRoaXMudmFsaWRhdG9yLnRlc3QoZS50YXJnZXQudmFsdWUpO1xyXG4gICAgICB0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UoaXNWYWxpZCk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiBlLnRhcmdldC52YWx1ZSwgaXNWYWxpZDogaXNWYWxpZCwgaXNEaXJ0eTogdHJ1ZX0pO1xyXG4gICAgfSxcclxuXHJcbiAgICB2YWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dmFsdWU6IHZhbHVlfSk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS52YWx1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZWZzLmlucHV0LmdldERPTU5vZGUoKS5zZWxlY3QoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIENsZWFyIHZhbHVlIGFuZCByZXNldCB2YWxpZGF0aW9uIHN0YXRlcy4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgdmFsdWU6IFwiXCIsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0VmFsaWRhdG9yOiBmdW5jdGlvbihyZSkge1xyXG4gICAgICB0aGlzLnZhbGlkYXRvciA9IG5ldyBSZWdFeHAocmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0VmFsaWRhdG9yKHRoaXMucHJvcHMucmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbihuZXdQcm9wcykge1xyXG4gICAgICB0aGlzLnNldFZhbGlkYXRvcihuZXdQcm9wcy5yZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdmFsdWU6IFwiXCIsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZSxcclxuICAgICAgICBpc0RpcnR5OiBmYWxzZSxcclxuICAgICAgICB0eXBlOiBcInRleHRcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlOiAvXlxccypcXGQrXFxzKiQvLFxyXG4gICAgICAgIHNob3dFcnJvcjogZmFsc2UsXHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWVcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgdmFsaWRhdGlvblN0YXRlID0gUmVhY3QuYWRkb25zLmNsYXNzU2V0KHtcclxuICAgICAgICBcImhhcy1zdWNjZXNzXCI6IHRoaXMuc3RhdGUuaXNWYWxpZCAmJiB0aGlzLnN0YXRlLmlzRGlydHksXHJcbiAgICAgICAgXCJoYXMtd2FybmluZ1wiOiAhdGhpcy5zdGF0ZS5pc0RpcnR5ICYmIHRoaXMucHJvcHMuc2hvd0Vycm9yLFxyXG4gICAgICAgIFwiaGFzLWVycm9yXCI6ICF0aGlzLnN0YXRlLmlzVmFsaWRcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgZXJyb3I7XHJcbiAgICAgIGlmICh0aGlzLnByb3BzLnNob3dFcnJvcikge1xyXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5pc1ZhbGlkKSB7XHJcbiAgICAgICAgICBlcnJvciA9IFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbnRyb2wtbGFiZWxcIn0sIFwiVmlyaGVlbGxpbmVuIHN5w7Z0ZVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5wcm9wcy5yZXF1aXJlZCAmJiB0aGlzLnZhbHVlKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBlcnJvciA9IFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbnRyb2wtbGFiZWxcIn0sIFwiVMOkeXTDpCB0w6Rtw6Qga2VudHTDpFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwIFwiICsgdmFsaWRhdGlvblN0YXRlfSwgXHJcbiAgICAgICAgICBlcnJvcixcclxuICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcImlucHV0XCIsIG9uQ2hhbmdlOnRoaXMuaGFuZGxlQ2hhbmdlLCB2YWx1ZTp0aGlzLnN0YXRlLnZhbHVlLCBwbGFjZWhvbGRlcjp0aGlzLnByb3BzLnBsYWNlaG9sZGVyLFxyXG4gICAgICAgICAgdHlwZTp0aGlzLnByb3BzLnR5cGUsIGNsYXNzTmFtZTpcImZvcm0tY29udHJvbCBcIiArIHRoaXMucHJvcHMuY2xhc3NOYW1lfSApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pXHJcbn07XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtQ29tcG9uZW50czsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxudmFyIEZvcm1Db21wb25lbnRzID0gcmVxdWlyZShcIi4vZm9ybS1jb21wb25lbnRzXCIpO1xyXG52YXIgQW5zd2VyRm9ybSA9IEZvcm1Db21wb25lbnRzLkFuc3dlckZvcm07XHJcbnZhciBSZUlucHV0ID0gRm9ybUNvbXBvbmVudHMuUmVJbnB1dDtcclxuXHJcblxyXG4vKipcclxuICogQ29tcGxldGUgYW5zd2VyIGZvcm1zIGZvciB0YXNrcy5cclxuICovXHJcbnZhciBGb3JtcyA9IHtcclxuICAvKipcclxuICAgKiBBbiBhbnN3ZXIgZm9ybSB3aXRoIGlucHV0cyBmb3IgeCBhbmQgeSBjb29yZGluYXRlcy5cclxuICAgKi9cclxuICBDb29yZHNBbnN3ZXJGb3JtOiBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb29yZHNBbnN3ZXJGb3JtJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGlzQ29ycmVjdCA9IHRoaXMucHJvcHMub25BbnN3ZXIodGhpcy5yZWZzLngudmFsdWUoKSwgdGhpcy5yZWZzLnkudmFsdWUoKSk7XHJcbiAgICAgIGlmIChpc0NvcnJlY3QpIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcbiAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMucmVmcy5mb3JtLmhhbmRsZUluY29ycmVjdEFuc3dlcigpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5yZWZzLmZvcm0ucmVzZXQoKTtcclxuICAgICAgdGhpcy5yZWZzLngucmVzZXQoKTtcclxuICAgICAgdGhpcy5yZWZzLnkucmVzZXQoKTtcclxuICAgICAgdGhpcy5yZWZzLnguc2VsZWN0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBjbGFzc05hbWU6XCJmb3JtLWhvcml6b250YWxcIiwgb25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9LCBcclxuICAgICAgICAgIFJlSW5wdXQoIHtyZWY6XCJ4XCIsIHR5cGU6XCJudW1iZXJcIiwgcGxhY2Vob2xkZXI6XCJ4XCJ9KSxcclxuICAgICAgICAgIFJlSW5wdXQoIHtyZWY6XCJ5XCIsIHR5cGU6XCJudW1iZXJcIiwgcGxhY2Vob2xkZXI6XCJ5XCJ9KVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KVxyXG59O1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRm9ybXM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoqXHJcbiAqIENvbXBvbmVudCBleHRlbnNpb25zIGkuZS4gbWl4aW5zLlxyXG4gKi9cclxuXHJcblxyXG4vKipcclxuICogUmVuZGVyIExhVGV4IG1hdGhzIG5vdGF0aW9uIGludG8gd2ViIGZvbnRzIHVzaW5nIE1hdGhKYXguXHJcbiAqIFRPRE9cclxuICovXHJcbi8vIHZhciBNYXRoSmF4ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4vLyAgIHJlcHJvY2VzczogZnVuY3Rpb24oKSB7XHJcbi8vICAgICB2YXIgZWxlbSA9IHRoaXMucmVmcy5zY3JpcHQuZ2V0RE9NTm9kZSgpO1xyXG4vLyAgICAgY29uc29sZS5sb2coZWxlbSk7XHJcbi8vICAgICBNYXRoSmF4Lkh1Yi5RdWV1ZShbXCJSZXByb2Nlc3NcIiwgTWF0aEpheC5IdWIsIGVsZW1dKTtcclxuLy8gICB9LFxyXG5cclxuLy8gICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbi8vICAgICB0aGlzLnJlcHJvY2VzcygpO1xyXG4vLyAgIH0sXHJcblxyXG4vLyAgIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4vLyAgICAgdGhpcy5yZXByb2Nlc3MoKTtcclxuLy8gICB9LFxyXG5cclxuLy8gICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4vLyAgICAgcmV0dXJuIChcclxuLy8gICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4vLyAgICAgICA8c3Bhbj5cclxuLy8gICAgICAgICA8c2NyaXB0IHJlZj1cInNjcmlwdFwiIHR5cGU9XCJtYXRoL3RleFwiPnt0aGlzLnByb3BzLmNoaWxkcmVufTwvc2NyaXB0PlxyXG4vLyAgICAgICA8L3NwYW4+XHJcbi8vICAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbi8vICAgICApO1xyXG4vLyAgIH1cclxuLy8gfSk7XHJcblxyXG4vKipcclxuICogUHJvdmlkZXMgYSBzZXRJbnRlcnZhbCBmdW5jdGlvbiB3aGljaCB3aWxsIGdldCBjbGVhbmVkIHVwIHdoZW5cclxuICogdGhlIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuXHJcbiAqL1xyXG52YXIgU2V0SW50ZXJ2YWxNaXhpbiA9IHtcclxuICBzZXRJbnRlcnZhbDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmludGVydmFscy5wdXNoKHNldEludGVydmFsLmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xyXG4gIH0sXHJcblxyXG4gIGNsZWFyQWxsSW50ZXJ2YWxzOiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuaW50ZXJ2YWxzLm1hcChjbGVhckludGVydmFsKTtcclxuICAgIHRoaXMuaW50ZXJ2YWxzID0gW107XHJcbiAgfSxcclxuXHJcbiAgLyoqIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgaW5pdGlhbGl6ZWQuICovXHJcbiAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuaW50ZXJ2YWxzID0gW107XHJcbiAgfSxcclxuXHJcbiAgLyoqIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgZGVzdHJveWVkLiAqL1xyXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuY2xlYXJBbGxJbnRlcnZhbHMoKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQXBwbHkgQ1NTIGNsYXNzZXMgZm9yIHNldCBkdXJhdGlvbiwgdXNlZnVsIGZvciBzaW5nbGVzaG90IGFuaW1hdGlvbnMuXHJcbiAqL1xyXG52YXIgVHJpZ2dlckFuaW1hdGlvbk1peGluID0ge1xyXG4gIGFuaW1hdGU6IGZ1bmN0aW9uKGVsZW0sIGNsYXNzTmFtZSwgZHVyYXRpb24pIHtcclxuICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgMTAwMDtcclxuICAgIGlmICghdGhpcy50aW1lb3V0ICYmIHRoaXMudGltZW91dCAhPT0gMCkge1xyXG4gICAgICBlbGVtLmFkZENsYXNzKGNsYXNzTmFtZSk7XHJcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgZWxlbS5yZW1vdmVDbGFzcyhjbGFzc05hbWUpO1xyXG4gICAgICAgIHRoaXMudGltZW91dCA9IG51bGw7XHJcbiAgICAgIH0uYmluZCh0aGlzKSwgZHVyYXRpb24pO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIFNldEludGVydmFsTWl4aW46IFNldEludGVydmFsTWl4aW4sXHJcbiAgVHJpZ2dlckFuaW1hdGlvbk1peGluOiBUcmlnZ2VyQW5pbWF0aW9uTWl4aW5cclxufTtcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBIHdyYXBwZXIgZm9yIEJvb3RzdHJhcCdzIHBhbmVsIGNvbXBvbmVudC5cclxuICovXHJcbnZhciBUYXNrUGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrUGFuZWwnLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgY2xhc3NOYW1lID0gXCJwYW5lbCBcIiArICh0aGlzLnByb3BzLmNsYXNzTmFtZSB8fCBcInBhbmVsLWluZm9cIiApO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NOYW1lfSwgXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWhlYWRpbmdcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmgzKCB7Y2xhc3NOYW1lOlwicGFuZWwtdGl0bGVcIn0sIHRoaXMucHJvcHMuaGVhZGVyKVxyXG4gICAgICAgICksXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWJvZHlcIn0sIFxyXG4gICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBBIHdyYXBwZXIgZm9yIEJvb3RzdHJhcCdzIHByb2dyZXNzIGJhciBlbGVtZW50LlxyXG4gKi9cclxudmFyIFRhc2tQcm9ncmVzc0JhciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tQcm9ncmVzc0JhcicsXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICBtYXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgIG5vdzogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciBzaW5nbGVXaWR0aCA9IE1hdGguY2VpbCgxIC8gdGhpcy5wcm9wcy5tYXggKiAxMDApO1xyXG4gICAgdmFyIGxlZnRTdHlsZSA9IHt3aWR0aDogc2luZ2xlV2lkdGggKiAodGhpcy5wcm9wcy5ub3cgLSAxKSArIFwiJVwifTtcclxuICAgIHZhciByaWdodFN0eWxlID0ge3dpZHRoOiBzaW5nbGVXaWR0aCAqICh0aGlzLnByb3BzLm1heCAtIHRoaXMucHJvcHMubm93ICsgMSkgKyBcIiVcIn07XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIHRhc2stcHJvZ3Jlc3MtYmFyXCJ9LCBcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MtYmFyIHByb2dyZXNzLWJhci1zdWNjZXNzXCIsIHN0eWxlOmxlZnRTdHlsZX0pLFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcy1iYXIgcHJvZ3Jlc3MtYmFyLXdhcm5pbmdcIiwgc3R5bGU6cmlnaHRTdHlsZX0pXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG4vKipcclxuICogVGFzayBoZWFkZXIgd2l0aCB0YXNrIG5hbWUgYW5kIGFuIG9wdGlvbmFsIHN0ZXAgY291bnRlci5cclxuICovXHJcbnZhciBUYXNrSGVhZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFza0hlYWRlcicsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgbmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxyXG4gICAgc3RlcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIHN0ZXBzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciBzdGVwQ291bnRlcjtcclxuICAgIGlmICh0aGlzLnByb3BzLnN0ZXAgJiYgdGhpcy5wcm9wcy5zdGVwcykge1xyXG4gICAgICBzdGVwQ291bnRlciA9IFRhc2tQcm9ncmVzc0Jhcigge21heDp0aGlzLnByb3BzLnN0ZXBzLCBub3c6dGhpcy5wcm9wcy5zdGVwfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhc2staGVhZGVyIHJvd1wifSwgXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS03XCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5oMihudWxsLCB0aGlzLnByb3BzLm5hbWUpXHJcbiAgICAgICAgKSxcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTVcIn0sIFxyXG4gICAgICAgICAgc3RlcENvdW50ZXJcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEFuIGVsZW1lbnQgdGhhdCBpcyBzaG93biBhZnRlciBhIGNvbXBsZXRlZCB0YXNrLlxyXG4gKi9cclxudmFyIFRhc2tEb25lRGlzcGxheSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tEb25lRGlzcGxheScsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgc2NvcmU6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgdmFyIHNjb3JlID0gdGhpcy5wcm9wcy5zY29yZSB8fCAwO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YXNrLWRvbmUtZGlzcGxheSBhbmltYXRlIGJvdW5jZS1pblwifSwgXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBcIlRlaHTDpHbDpCBzdW9yaXRldHR1IVwiKSwgXCIgUGlzdGVpdMOkOiBcIiwgc2NvcmVcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBUYXNrUGFuZWw6IFRhc2tQYW5lbCxcclxuICBUYXNrUHJvZ3Jlc3NCYXI6IFRhc2tQcm9ncmVzc0JhcixcclxuICBUYXNrSGVhZGVyOiBUYXNrSGVhZGVyLFxyXG4gIFRhc2tEb25lRGlzcGxheTogVGFza0RvbmVEaXNwbGF5XHJcbn07IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgZDMsIG1vZHVsZSwgcmVxdWlyZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlscy5qc1wiKTtcclxudmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzLmpzXCIpO1xyXG52YXIgQ29vcmRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvY29vcmRzLmpzXCIpO1xyXG5cclxuLyoqXHJcbiAqIENsaWNrIHRoZSBhcHByb3ByaWF0ZSBzaGFwZSBpbiBhIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gKi9cclxudmFyIEJhc2ljU2hhcGVzVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Jhc2ljU2hhcGVzVGFzaycsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgb25UYXNrRG9uZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gIH0sXHJcblxyXG4gIHN0YXJ0R2FtZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnNldFN0YXRlKHtpc1J1bm5pbmc6IHRydWUsIHNjb3JlOiAwfSk7XHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBzaXggZGlmZmVyZW50IHNoYXBlcyB0aGF0IGZpbGwgdGhlIGNvb3Jkc1xyXG4gICAqIGluIGEgcmFuZG9tIG9yZGVyLlxyXG4gICAqL1xyXG4gIGdldFJhbmRvbVNoYXBlczogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYzEgPSAwLjQ2LCBjMiA9IDEuMjEsIHMxID0gMS40MywgczIgPSAwLjg4NTtcclxuICAgIHZhciBwZW50YWdvblB0cyA9IFtbLXMyLC1jMl0sIFstczEsYzFdLCBbMCwxLjVdLCBbczEsYzFdLCBbczIsLWMyXV07XHJcbiAgICBwZW50YWdvblB0cyA9IFRhc2tVdGlscy50cmFuc2xhdGUocGVudGFnb25QdHMsIDIuNSwgMS41KTtcclxuXHJcbiAgICB2YXIgdHJhbnNsYXRlcyA9IFtbMCwwXSwgWzYsMF0sIFswLDRdLCBbNiw0XSwgWzAsOF0sIFs2LDhdXTtcclxuICAgIHZhciBiYXNlcyA9IFtcclxuICAgICAge25hbWU6XCJrb2xtaW9cIiwgcG9pbnRzOltbMSwwXSwgWzEsM10sIFs0LDBdXX0sXHJcbiAgICAgIHtuYW1lOlwibmVsacO2XCIsIHBvaW50czpbWzEsMF0sIFsxLDNdLCBbNCwzXSwgWzQsMF1dfSxcclxuICAgICAge25hbWU6XCJ5bXB5csOkXCIsIHBvaW50czpbWzIuNSwxLjVdXSwgcjoxLjV9LFxyXG4gICAgICB7bmFtZTpcInN1dW5uaWthc1wiLCBwb2ludHM6W1swLDBdLCBbMC41LDNdLCBbNC41LDNdLCBbNCwwXV19LFxyXG4gICAgICB7bmFtZTpcInB1b2xpc3V1bm5pa2FzXCIsIHBvaW50czpbWzAsMF0sIFswLjUsM10sIFs0LDNdLCBbNC41LDBdXX0sXHJcbiAgICAgIHtuYW1lOlwidmlpc2lrdWxtaW9cIiwgcG9pbnRzOnBlbnRhZ29uUHRzfVxyXG4gICAgXTtcclxuXHJcbiAgICBiYXNlcyA9IFRhc2tVdGlscy5zaHVmZmxlKGJhc2VzKTtcclxuICAgIHZhciBjbHJzID0gZDMuc2NhbGUuY2F0ZWdvcnkxMCgpO1xyXG5cclxuICAgIHZhciBzaGFwZXMgPSBiYXNlcy5tYXAoZnVuY3Rpb24oYmFzZSwgaSkge1xyXG4gICAgICB2YXIgdHJhbnNsYXRlWCA9IHRyYW5zbGF0ZXNbaV1bMF0gKyBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICB2YXIgdHJhbnNsYXRlWSA9IHRyYW5zbGF0ZXNbaV1bMV0gKyBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICBiYXNlLnBvaW50cyA9IFRhc2tVdGlscy50cmFuc2xhdGUoYmFzZS5wb2ludHMsIHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVkpO1xyXG4gICAgICBiYXNlLmtleSA9IGk7XHJcbiAgICAgIGJhc2Uub25DbGljayA9IHRoaXMuaGFuZGxlU2hhcGVDbGljaztcclxuICAgICAgYmFzZS5zdHJva2UgPSBcImJsYWNrXCI7XHJcbiAgICAgIGJhc2UuZmlsbCA9IGNscnMoVGFza1V0aWxzLnJhbmQoOSkpO1xyXG4gICAgICByZXR1cm4gYmFzZTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgcmV0dXJuIHNoYXBlcztcclxuICB9LFxyXG5cclxuICAvKiogUmVzZXQgdGhlIHF1ZXN0aW9uLCBpLmUuIGdlbmVyYXRlIG5ldyBzaGFwZXMuICovXHJcbiAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNoYXBlcyA9IHRoaXMuZ2V0UmFuZG9tU2hhcGVzKCk7XHJcblxyXG4gICAgLy8gUHJldmVudCBhc2tpbmcgZm9yIHRoZSBzYW1lIHNoYXBlIHR3aWNlIGluIGEgcm93LlxyXG4gICAgdmFyIHBvc3NpYmxlVGFyZ2V0cyA9IHNoYXBlcztcclxuICAgIGlmICh0aGlzLnN0YXRlLnRhcmdldCkge1xyXG4gICAgICBwb3NzaWJsZVRhcmdldHMgPSBwb3NzaWJsZVRhcmdldHMuZmlsdGVyKGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIHNoYXBlLm5hbWUgIT09IHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWU7XHJcbiAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICB2YXIgdGFyZ2V0ID0gcG9zc2libGVUYXJnZXRzW1Rhc2tVdGlscy5yYW5kKHBvc3NpYmxlVGFyZ2V0cy5sZW5ndGgpXTtcclxuXHJcbiAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgc2hhcGVzOiB0aGlzLmdldFJhbmRvbVNoYXBlcygpLFxyXG4gICAgICB0YXJnZXQ6IHRhcmdldFxyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLyoqIENoZWNrIGlmIGNvcnJlY3Qgc2hhcGUgYW5kIHByb2NlZWQuICovXHJcbiAgaGFuZGxlU2hhcGVDbGljazogZnVuY3Rpb24oc2hhcGUpIHtcclxuICAgIHZhciBzY29yZUluY3JlbWVudDtcclxuICAgIGlmIChzaGFwZS5uYW1lID09PSB0aGlzLnN0YXRlLnRhcmdldC5uYW1lKSB7XHJcbiAgICAgIHNjb3JlSW5jcmVtZW50ID0gMTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNjb3JlSW5jcmVtZW50ID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2NvcmU6IE1hdGgubWF4KHRoaXMuc3RhdGUuc2NvcmUgKyBzY29yZUluY3JlbWVudCwgMCl9KTtcclxuICAgIHRoaXMucmVzZXQoKTtcclxuICB9LFxyXG5cclxuICBoYW5kbGVUYXNrRG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnByb3BzLm9uVGFza0RvbmUoKTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc2hhcGVzOiBbXSxcclxuICAgICAgc2NvcmU6IDAsXHJcbiAgICAgIGlzUnVubmluZzogZmFsc2UsXHJcbiAgICAgIGlzRmluaXNoZWQ6IGZhbHNlXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgdmFyIFRhc2tIZWFkZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyO1xyXG4gICAgdmFyIFRhc2tEb25lRGlzcGxheSA9IFRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheTtcclxuXHJcbiAgICB2YXIgc2hhcGVzID0gdGhpcy5zdGF0ZS5zaGFwZXM7XHJcbiAgICB2YXIgdGFza0lzRG9uZSA9IHRoaXMuc3RhdGUuc3RlcCA+IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpO1xyXG4gICAgdmFyIGNvb3Jkcywgc2lkZWJhcjtcclxuXHJcbiAgICBpZiAoIXRoaXMuc3RhdGUuaXNGaW5pc2hlZCkge1xyXG4gICAgICB2YXIgYm91bmRzID0ge21heFk6IDEyLCBtYXhYOiAxMiwgbWluWTogMCwgbWluWDogMH07XHJcblxyXG4gICAgICBjb29yZHMgPSBDb29yZHMoIHtkcmF3QXhlczpmYWxzZSwgc2hhcGVzOnNoYXBlcywgYm91bmRzOmJvdW5kcywgYXNwZWN0OjF9ICk7XHJcblxyXG4gICAgICB2YXIgc2hhcGVUb0ZpbmQgPSBcImtvbG1pb1wiO1xyXG5cclxuICAgICAgdmFyIHN0YXJ0QnRuID0gdGhpcy5zdGF0ZS5pc1J1bm5pbmcgPyBudWxsIDogKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXHJcbiAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwiYW5pbWF0ZWQgYW5pbWF0ZWQtcmVwZWF0IGJvdW5jZSBidG4gYnRuLXByaW1hcnkgYnRuLWJsb2NrXCIsIG9uQ2xpY2s6dGhpcy5zdGFydEdhbWV9LCBcbiAgICAgICAgICAgIFwiQWxvaXRhIHBlbGlcIlxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcblxyXG4gICAgICB2YXIgdGFyZ2V0RGlzcGxheSA9ICF0aGlzLnN0YXRlLnRhcmdldCA/IG51bGwgOiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFuaW1hdGVkIGJvdW5jZS1pblwifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXG4gICAgICAgICAgXCJLbGlrYXR0YXZhIGthcHBhbGU6IFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWUpLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmhyKG51bGwpLFxuICAgICAgICAgIFwiUGlzdGVldDogXCIsIHRoaXMuc3RhdGUuc2NvcmVcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxuICAgICAgICAgICAgXCJFdHNpIGtvb3JkaW5hYXRpc3Rvc3RhIFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHNoYXBlVG9GaW5kKSwgXCIgamEga2xpa2thYSBzaXTDpFwiLFxuICAgICAgICAgICAgc3RhcnRCdG4sXHJcbiAgICAgICAgICAgIHRhcmdldERpc3BsYXlcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0YXNrSXNEb25lKSB7XHJcbiAgICAgIGNvb3JkcyA9IFRhc2tEb25lRGlzcGxheSgge3Njb3JlOjEwfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIkthcHBhbGVpZGVuIHR1bm5pc3RhbWluZW5cIiwgc3RlcDp0aGlzLnN0YXRlLnN0ZXAsIHN0ZXBzOnRoaXMucHJvcHMuc3RlcHN9ICksXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICBjb29yZHNcclxuICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgIHNpZGViYXJcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICk7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2ljU2hhcGVzVGFzazsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCByZXF1aXJlLCBtb2R1bGUgKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgVGFza1V0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzL3Rhc2stdXRpbHNcIik7XHJcbnZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50c1wiKTtcclxudmFyIENvb3JkcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Nvb3Jkc1wiKTtcclxudmFyIEZvcm1zID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvZm9ybXNcIik7XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlYWQgcG9zaXRpb25zIGZyb20gYSBjb29yZGluYXRlIHN5c3RlbS5cclxuICovXHJcbnZhciBTaW1wbGVDb29yZHNUYXNrID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU2ltcGxlQ29vcmRzVGFzaycsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgc3RlcHM6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICB9LFxyXG5cclxuICAvKiogUmVzZXQgdGhlIHF1ZXN0aW9uLCBpLmUuIGdlbmVyYXRlIGEgbmV3IHJhbmRvbSBwb2ludC4gKi9cclxuICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgbmV3UG9pbnQ7XHJcbiAgICBkbyB7IG5ld1BvaW50ID0gW1Rhc2tVdGlscy5yYW5kUmFuZ2UoMCwgMTApLCBUYXNrVXRpbHMucmFuZFJhbmdlKDAsIDEwKV07IH1cclxuICAgIHdoaWxlIChUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKG5ld1BvaW50LCB0aGlzLnN0YXRlLnBvaW50KSk7XHJcblxyXG4gICAgdGhpcy5zZXRTdGF0ZSh7cG9pbnQ6IG5ld1BvaW50fSk7XHJcbiAgfSxcclxuXHJcbiAgLyoqIENoZWNrIGlmIGNvcnJlY3QuICovXHJcbiAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2YXIgaXNDb3JyZWN0ID0gVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihbeCwgeV0sIHRoaXMuc3RhdGUucG9pbnQpO1xyXG4gICAgaWYgKGlzQ29ycmVjdClcclxuICAgICAgdGhpcy5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcblxyXG4gICAgcmV0dXJuIGlzQ29ycmVjdDtcclxuICB9LFxyXG5cclxuICBoYW5kbGVDb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzdGVwID0gdGhpcy5zdGF0ZS5zdGVwO1xyXG4gICAgaWYgKHN0ZXAgPT09IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpKVxyXG4gICAgICB0aGlzLmhhbmRsZVRhc2tEb25lKCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7c3RlcDogc3RlcCArIDF9KTtcclxuICB9LFxyXG5cclxuICBoYW5kbGVUYXNrRG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnByb3BzLm9uVGFza0RvbmUoKTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnJlc2V0KCk7XHJcbiAgfSxcclxuXHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN0ZXA6IDEsXHJcbiAgICAgIHBvaW50OiBudWxsXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgdmFyIFRhc2tIZWFkZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyO1xyXG4gICAgdmFyIFRhc2tEb25lRGlzcGxheSA9IFRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheTtcclxuICAgIHZhciBDb29yZHNBbnN3ZXJGb3JtID0gRm9ybXMuQ29vcmRzQW5zd2VyRm9ybTtcclxuXHJcbiAgICB2YXIgcG9pbnQgPSB0aGlzLnN0YXRlLnBvaW50O1xyXG4gICAgdmFyIHRhc2tJc0RvbmUgPSB0aGlzLnN0YXRlLnN0ZXAgPiBwYXJzZUludCh0aGlzLnByb3BzLnN0ZXBzKTtcclxuICAgIHZhciBjb29yZHMsIHNpZGViYXI7XHJcblxyXG4gICAgaWYgKHBvaW50ICYmICF0YXNrSXNEb25lKSB7XHJcbiAgICAgIHZhciBib3VuZHMgPSB7bWF4WTogMTAsIG1heFg6IDEwLCBtaW5ZOiAtMiwgbWluWDogLTJ9O1xyXG4gICAgICB2YXIgc2hhcGVzID0gW3twb2ludHM6IFtwb2ludF0sIHI6MC4yLCBzdHJva2VXaWR0aDogMywgc3Ryb2tlOiBcIiNGRjVCMjRcIiwgZmlsbDpcIiNGRDAwMDBcIn1dO1xyXG5cclxuICAgICAgY29vcmRzID0gQ29vcmRzKCB7c2hhcGVzOnNoYXBlcywgYm91bmRzOmJvdW5kcywgYXNwZWN0OjF9ICk7XHJcblxyXG4gICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcIk1pdGvDpCBvdmF0IHBpc3RlZW4geC1qYSB5LWtvb3JkaW5hYXRpdD9cIilcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJWYXN0YXVzXCIsIGNsYXNzTmFtZTpcInBhbmVsLXN1Y2Nlc3MgcGFuZWwtZXh0cmEtcGFkZGluZ1wifSwgXHJcbiAgICAgICAgICAgIENvb3Jkc0Fuc3dlckZvcm0oIHtyZWY6XCJmb3JtXCIsIG9uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodGFza0lzRG9uZSkge1xyXG4gICAgICBjb29yZHMgPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZToxMH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgVGFza0hlYWRlcigge25hbWU6XCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCIsIHN0ZXA6dGhpcy5zdGF0ZS5zdGVwLCBzdGVwczp0aGlzLnByb3BzLnN0ZXBzfSApLFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgY29vcmRzXHJcbiAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNSBjb2wtc20tb2Zmc2V0LTFcIn0sIFxyXG4gICAgICAgICAgICBzaWRlYmFyXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGVDb29yZHNUYXNrOyIsIlwidXNlIHN0cmljdFwiO1xyXG4vKiBnbG9iYWwgbW9kdWxlICovXHJcblxyXG4vKipcclxuICogVXRpbGl0eSBmdW5jdGlvbnMgKG1haW5seSBtYXRocyByZWxhdGVkKSBmb3IgdGFza3MuXHJcbiAqL1xyXG52YXIgVGFza1V0aWxzID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBpbiByYW5nZSBbbWluLCBtYXhbLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgbWluICAgSW5jbHVzaXZlIGxvd2VyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgbWF4ICAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyPX0gY291bnQgSWYgc2V0LCByZXR1cm4gYSBsaXN0IG9mIHJhbmRvbSB2YWx1ZXMuXHJcbiAgICAgKiBAcmV0dXJuIHsobnVtYmVyfFtudW1iZXJdKX0gQSBzaW5nbGUgb3IgbXVsdGlwbGUgcmFuZG9tIGludHMuXHJcbiAgICAgKi9cclxuICAgIHJhbmRSYW5nZTogZnVuY3Rpb24obWluLCBtYXgsIGNvdW50KSB7XHJcbiAgICAgICAgaWYgKGNvdW50ICYmIGNvdW50ID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgcmFuZHMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICByYW5kcy5wdXNoKHRoaXMucmFuZFJhbmdlKG1pbiwgbWF4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJhbmRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBpbnRlZ2VyIGluIHJhbmdlIFswLCBtYXhbLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgbWF4ICAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyPX0gY291bnQgSWYgc2V0LCByZXR1cm4gYSBsaXN0IG9mIHJhbmRvbSB2YWx1ZXMuXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ8W251bWJlcl19IEEgc2luZ2xlIG9yIG11bHRpcGxlIHJhbmRvbSBpbnRzLlxyXG4gICAgICovXHJcbiAgICByYW5kOiBmdW5jdGlvbihtYXgsIGNvdW50KSB7XHJcbiAgICAgICAgaWYgKGNvdW50ICYmIGNvdW50ID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgcmFuZHMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICByYW5kcy5wdXNoKHRoaXMucmFuZChtYXgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmFuZHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqIFJlb3JkZXJzIGdpdmVuIGFycmF5IHJhbmRvbWx5LCBkb2Vzbid0IG1vZGlmeSBvcmlnaW5hbCBhcnJheS4gKi9cclxuICAgIHNodWZmbGU6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBjbG9uZSA9IGFyci5zbGljZSgpO1xyXG4gICAgICAgIHZhciBzaHVmZmxlZCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gY2xvbmUubGVuZ3RoOyBpID4gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMucmFuZChpKTtcclxuICAgICAgICAgICAgc2h1ZmZsZWQucHVzaChjbG9uZS5zcGxpY2UoaW5kZXgsIDEpWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaHVmZmxlZDtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5nZSBvZiBpbnRlZ2Vycy5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSAgbWluICBJbmNsdXNpdmUgbG93ZXIgYm91bmQuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gIG1heCAgRXhjbHVzaXZlIHVwcGVyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXI9fSBzdGVwIE9wdGlvbmFsIGluY3JlbWVudCB2YWx1ZSwgZGVmYXVsdHMgdG8gMS5cclxuICAgICAqIEByZXR1cm4ge1tudW1iZXJdfSAgICBUaGUgc3BlY2lmaWVkIHJhbmdlIG9mIG51bWJlcnMgaW4gYW4gYXJyYXkuXHJcbiAgICAgKi9cclxuICAgIHJhbmdlOiBmdW5jdGlvbihtaW4sIG1heCwgc3RlcCkge1xyXG4gICAgICAgIHN0ZXAgPSBzdGVwIHx8IDE7XHJcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xyXG4gICAgICAgIGlmIChzdGVwID4gMCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbWluOyBpIDwgbWF4OyBpICs9IHN0ZXApIHtcclxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IG1pbjsgaiA+IG1heDsgaiArPSBzdGVwKSB7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaChqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2sgd2hldGhlciBhcnJheXMgZXF1YWwuXHJcbiAgICAgKiBAcGFyYW0gIGFycjFcclxuICAgICAqIEBwYXJhbSAgYXJyMlxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgYXJyYXlzRXF1YWw6IGZ1bmN0aW9uKGFycjEsIGFycjIpIHtcclxuICAgICAgICBpZiAoYXJyMS5sZW5ndGggIT09IGFycjIubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiBhcnIxLmV2ZXJ5KGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGQgPT09IGFycjJbaV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYW5zbGF0ZSBhbiBhcnJheSBvZiBwb2ludHMgYnkgZ2l2ZW4geCBhbmQgeSB2YWx1ZXMuXHJcbiAgICAgKiBAcGFyYW0gIHtbW251bWJlcl1dfSBwb2ludHNcclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgIHhcclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgIHlcclxuICAgICAqIEByZXR1cm4ge1tbbnVtYmVyXV19XHJcbiAgICAgKi9cclxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24ocG9pbnRzLCB4LCB5KSB7XHJcbiAgICAgICAgcmV0dXJuIHBvaW50cy5tYXAoZnVuY3Rpb24ocG9pbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtwb2ludFswXSArIHgsIHBvaW50WzFdICsgeV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbXBhcmUgZ2l2ZW4gYW5zd2VyIHRvIHRoZSBjb3JyZWN0IHNvbHV0aW9uLiBTdXBwb3J0cyB2YXJpb3VzIGRhdGEgdHlwZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIGFuc3dlclxyXG4gICAgICogQHBhcmFtIHNvbHV0aW9uIEEgc3RyaW5nLCBudW1iZXIsIGFycmF5LCBvYmplY3Qgb3IgUmVnRXhwLlxyXG4gICAgICogQHBhcmFtIGVwc2lsb24gIE9wdGlvbmFsIG1heCBlcnJvciB2YWx1ZSBmb3IgZmxvYXQgY29tcGFyaXNvbiwgZGVmYXVsdCBpcyAwLjAwMS5cclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgY29ycmVjdCwgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBtYXRjaGVzU29sdXRpb246IGZ1bmN0aW9uKGFuc3dlciwgc29sdXRpb24sIGVwc2lsb24pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGFuc3dlciA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIudHJpbSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBzb2x1dGlvbiA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICBhbnN3ZXIgPSBwYXJzZUZsb2F0KGFuc3dlcik7XHJcbiAgICAgICAgICAgIGlmIChpc05hTihhbnN3ZXIpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIGVwc2lsb24gPSBlcHNpbG9uID09PSB1bmRlZmluZWQgPyAwLjAwMSA6IGVwc2lsb247XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5hYnMoYW5zd2VyIC0gc29sdXRpb24pIDw9IGVwc2lsb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc29sdXRpb24gaW5zdGFuY2VvZiBSZWdFeHApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uLnRlc3QoYW5zd2VyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgaWYgKCFhbnN3ZXIgaW5zdGFuY2VvZiBBcnJheSB8fCBhbnN3ZXIubGVuZ3RoICE9PSBzb2x1dGlvbi5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYW5zd2VyLmV2ZXJ5KGZ1bmN0aW9uKGQsIGkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Lm1hdGNoZXNTb2x1dGlvbihkLCBzb2x1dGlvbltpXSwgZXBzaWxvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGlmICghYW5zd2VyIGluc3RhbmNlb2YgT2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGFuc0tleXMgPSBPYmplY3Qua2V5cyhhbnN3ZXIpO1xyXG4gICAgICAgICAgICBpZiAoYW5zS2V5cy5sZW5ndGggIT09IE9iamVjdC5rZXlzKHNvbHV0aW9uKS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYW5zS2V5cy5ldmVyeShmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5tYXRjaGVzU29sdXRpb24oYW5zd2VyW2RdLCBzb2x1dGlvbltkXSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFuc3dlciA9PT0gc29sdXRpb247XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tVdGlsczsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiQoZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgQXBwbGljYXRpb24gPSByZXF1aXJlKFwiLi9qcy9hcHBsaWNhdGlvbi5qc1wiKTtcclxuXHJcbiAgICBSZWFjdC5yZW5kZXJDb21wb25lbnQoXHJcbiAgICAgICAgQXBwbGljYXRpb24obnVsbCApLFxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXBwbGljYXRpb25cIilcclxuICAgICk7XHJcbn0pO1xyXG4vKiBqc2hpbnQgaWdub3JlOmVuZCAqLyJdfQ==
