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
      "Yhteenlasku": AdditionTask( {onTaskDone:this.handleTaskDone, steps:5}),
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
      console.log("reprocessing", $(elem).text());
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
      var TaskDoneDisplay = TaskComponents.TaskDoneDisplay;
      var MathJax = MathComponents.MathJax;

      var taskIsDone = this.state.step > parseInt(this.props.steps);
      var question, sidebar;

      if (!taskIsDone) {
        console.log("rendering", this.state.a, this.state.b);

        var questionContent = this.state.a + " + " + this.state.b + " = ?";
        question = (
          React.DOM.div( {className:"text-center bg-warning"}, 
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

},{"../components/forms":4,"../components/math-components":5,"../components/task-components":7,"../utils/task-utils":11}],9:[function(require,module,exports){
/** @jsx React.DOM */
/* global React, d3, module, require */
"use strict";

var TaskUtils = require("../utils/task-utils");
var TaskComponents = require("../components/task-components");
var Coords = require("../components/coords");

/**
 * Click the appropriate shape in a coordinate system.
 */
var BasicShapesTask = (function() {

  var basicShapesTask = React.createClass({displayName: 'basicShapesTask',

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

    return basicShapesTask;
})();

module.exports = BasicShapesTask;
},{"../components/coords":2,"../components/task-components":7,"../utils/task-utils":11}],10:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXEFsZWtzaVxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXHdhdGNoaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2FwcGxpY2F0aW9uLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy9jb29yZHMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL2Zvcm0tY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvZm9ybXMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy9jb21wb25lbnRzL21hdGgtY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0FsZWtzaS9Eb2N1bWVudHMvS3Vyc3NpdC9na28vaHQvc3JjL2pzL2NvbXBvbmVudHMvbWl4aW5zLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvY29tcG9uZW50cy90YXNrLWNvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9hZGRpdGlvbi10YXNrLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvanMvdGFza3MvYmFzaWMtc2hhcGVzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy90YXNrcy9zaW1wbGUtY29vcmRzLXRhc2suanMiLCJDOi9Vc2Vycy9BbGVrc2kvRG9jdW1lbnRzL0t1cnNzaXQvZ2tvL2h0L3NyYy9qcy91dGlscy90YXNrLXV0aWxzLmpzIiwiQzovVXNlcnMvQWxla3NpL0RvY3VtZW50cy9LdXJzc2l0L2drby9odC9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qIGdsb2JhbHMgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cclxuXHJcbnZhciBBZGRpdGlvblRhc2sgPSByZXF1aXJlKFwiLi90YXNrcy9hZGRpdGlvbi10YXNrXCIpO1xyXG52YXIgU2ltcGxlQ29vcmRzVGFzayA9IHJlcXVpcmUoXCIuL3Rhc2tzL3NpbXBsZS1jb29yZHMtdGFza1wiKTtcclxudmFyIEJhc2ljU2hhcGVzVGFzayA9IHJlcXVpcmUoXCIuL3Rhc2tzL2Jhc2ljLXNoYXBlcy10YXNrXCIpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDb250YWluZXIgYW5kIGxpbmtzIGZvciBleGFtcGxlIHRhc2tzLlxyXG4gKi9cclxudmFyIEFwcGxpY2F0aW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQXBwbGljYXRpb24nLFxyXG5cclxuICBoYW5kbGVMaXN0Q2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHZhciB0YXNrTmFtZSA9IGUudGFyZ2V0LnRleHQ7XHJcbiAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZFRhc2s6IHRhc2tOYW1lfSk7XHJcbiAgfSxcclxuXHJcbiAgaGFuZGxlVGFza0RvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJUYXNrIGRvbmUgLSBoZXJlJ3Mgd2hlcmUgdGhlIHRhc2sgY29ubmVjdHMgdG8gYW4gZXh0ZXJuYWwgYXBwLlwiKTtcclxuICB9LFxyXG5cclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtzZWxlY3RlZFRhc2s6IFwiWWh0ZWVubGFza3VcIn07XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgIHZhciB0YXNrcyA9IHtcclxuICAgICAgXCJZaHRlZW5sYXNrdVwiOiBBZGRpdGlvblRhc2soIHtvblRhc2tEb25lOnRoaXMuaGFuZGxlVGFza0RvbmUsIHN0ZXBzOjV9KSxcclxuICAgICAgXCJLb29yZGluYWF0aXN0b24gbHVrZW1pbmVuXCI6IFNpbXBsZUNvb3Jkc1Rhc2soIHtvblRhc2tEb25lOnRoaXMuaGFuZGxlVGFza0RvbmUsIHN0ZXBzOjV9KSxcclxuICAgICAgXCJLYXBwYWxlaWRlbiB0dW5uaXN0YW1pbmVuXCI6IEJhc2ljU2hhcGVzVGFzaygge29uVGFza0RvbmU6dGhpcy5oYW5kbGVUYXNrRG9uZX0pXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB0YXNrTGlzdEVsZW1zID0gT2JqZWN0LmtleXModGFza3MpLm1hcChmdW5jdGlvbih0YXNrTmFtZSkge1xyXG4gICAgICB2YXIgY2xhc3NOYW1lID0gdGFza05hbWUgPT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRUYXNrID8gXCJ0ZXh0LW11dGVkXCIgOiBcIlwiO1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5saShudWxsLCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOmNsYXNzTmFtZSwgaHJlZjpcIlwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlTGlzdENsaWNrfSwgdGFza05hbWUpXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB2YXIgdGFzayA9IHRhc2tzW3RoaXMuc3RhdGUuc2VsZWN0ZWRUYXNrXTtcclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgIFJlYWN0LkRPTS51bCgge2NsYXNzTmFtZTpcImxpc3QtaW5saW5lXCJ9LCBcclxuICAgICAgICAgIHRhc2tMaXN0RWxlbXNcclxuICAgICAgICApLFxyXG5cclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1jb250YWluZXJcIn0sIFxyXG4gICAgICAgICAgdGFza1xyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gICAgKTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgZDMsIE1hdGhVdGlscywgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKiBBIDJEIGNvb3JkaW5hdGUgc3lzdGVtLiAqL1xyXG52YXIgQ29vcmRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29vcmRzJyxcclxuXHJcbiAgcHJvcFR5cGVzOiB7XHJcbiAgICBkcmF3QXhlczogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICBzaGFwZXM6IFJlYWN0LlByb3BUeXBlcy5hcnJheSxcclxuICAgIGJvdW5kczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCxcclxuICAgIGFzcGVjdDogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxyXG4gIH0sXHJcblxyXG4gIGhhbmRsZVJlc2l6ZTogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcGFyZW50ID0gJCh0aGlzLmdldERPTU5vZGUoKS5wYXJlbnROb2RlKTtcclxuICAgIHRoaXMuc2V0U3RhdGUoe3dpZHRoOiBwYXJlbnQud2lkdGgoKX0pO1xyXG4gIH0sXHJcblxyXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge3dpZHRoOiAwfTtcclxuICB9LFxyXG5cclxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZHJhd0F4ZXM6IHRydWUsXHJcbiAgICAgIHNoYXBlczogW10sXHJcbiAgICAgIGJvdW5kczoge21heFk6MTAsIG1heFg6MTAsIG1pblk6MCwgbWluWDowfSxcclxuICAgICAgYXNwZWN0OiAxXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMuaGFuZGxlUmVzaXplKTtcclxuICAgIHRoaXMuaGFuZGxlUmVzaXplKCk7XHJcbiAgfSxcclxuXHJcbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdGhpcy5oYW5kbGVSZXNpemUpO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICB2YXIgbWFyZ2luID0ge1xyXG4gICAgICB0b3A6IDEwLFxyXG4gICAgICByaWdodDogMTAsXHJcbiAgICAgIGJvdHRvbTogMTAsXHJcbiAgICAgIGxlZnQ6IDEwXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB3aWR0aCA9IHRoaXMuc3RhdGUud2lkdGggPyB0aGlzLnN0YXRlLndpZHRoIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQgOiAwO1xyXG4gICAgdmFyIGhlaWdodCA9IE1hdGgucm91bmQod2lkdGggKiB0aGlzLnByb3BzLmFzcGVjdCkgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcclxuXHJcbiAgICB2YXIgYm91bmRzID0gdGhpcy5wcm9wcy5ib3VuZHM7XHJcbiAgICB2YXIgc3BhY2luZyA9IE1hdGgucm91bmQoTWF0aC5taW4oXHJcbiAgICAgIHdpZHRoIC8gTWF0aC5hYnMoYm91bmRzLm1heFggLSBib3VuZHMubWluWCksXHJcbiAgICAgIGhlaWdodCAvIE1hdGguYWJzKGJvdW5kcy5tYXhZIC0gYm91bmRzLm1pblkpXHJcbiAgICApKTtcclxuXHJcbiAgICB2YXIgeCA9IGQzLnNjYWxlLmxpbmVhcigpXHJcbiAgICAgIC5kb21haW4oW2JvdW5kcy5taW5YLCBib3VuZHMubWluWCArIDFdKVxyXG4gICAgICAucmFuZ2UoWzAsIHNwYWNpbmddKTtcclxuXHJcbiAgICB2YXIgeSA9IGQzLnNjYWxlLmxpbmVhcigpXHJcbiAgICAgIC5kb21haW4oW2JvdW5kcy5taW5ZLCBib3VuZHMubWluWSArIDFdKVxyXG4gICAgICAucmFuZ2UoW2hlaWdodCwgaGVpZ2h0IC0gc3BhY2luZ10pO1xyXG5cclxuICAgIHZhciBmdWxsV2lkdGggPSB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0O1xyXG4gICAgdmFyIGZ1bGxIZWlnaHQgPSBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbTtcclxuICAgIHZhciB0cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCI7XHJcblxyXG4gICAgdmFyIHNoYXBlcywgZ3JpZDtcclxuICAgIGlmICh0aGlzLnN0YXRlLndpZHRoKSB7XHJcbiAgICAgIHNoYXBlcyA9IFNoYXBlcygge3g6eCwgeTp5LCBzcGFjaW5nOnNwYWNpbmcsIGRhdGE6dGhpcy5wcm9wcy5zaGFwZXN9ICk7XHJcbiAgICAgIGdyaWQgPSBHcmlkKCB7ZHJhd0F4ZXM6dGhpcy5wcm9wcy5kcmF3QXhlcywgeDp4LCB5OnksIGJvdW5kczpib3VuZHN9ICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvb3Jkcy1jb250YWluZXJcIn0sIFxyXG4gICAgICAgIFJlYWN0LkRPTS5zdmcoIHt3aWR0aDpmdWxsV2lkdGgsIGhlaWdodDpmdWxsSGVpZ2h0fSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZygge3RyYW5zZm9ybTp0cmFuc2Zvcm19LCBcclxuICAgICAgICAgICAgZ3JpZCxcclxuICAgICAgICAgICAgc2hhcGVzXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICB9XHJcbn0pO1xyXG5cclxuLyoqIEEgZ3JpZCBmb3IgdGhlIGNvb3JkaW5hdGUgc3lzdGVtLiAqL1xyXG52YXIgR3JpZCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0dyaWQnLFxyXG5cclxuICBwcm9wVHlwZXM6IHtcclxuICAgIHg6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICB5OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgYm91bmRzOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXHJcbiAgICBzcGFjaW5nOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxyXG4gICAgdHJhbnNpdGlvbkR1cmF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxyXG4gICAgZHJhd0F4ZXM6IFJlYWN0LlByb3BUeXBlcy5ib29sXHJcbiAgfSxcclxuXHJcbiAgLyoqIFJlZHJhdyBncmlkLiAgKi9cclxuICB1cGRhdGU6IGZ1bmN0aW9uKHByb3BzKSB7XHJcbiAgICB2YXIgY29udGFpbmVyID0gZDMuc2VsZWN0KHRoaXMuZ2V0RE9NTm9kZSgpKTtcclxuICAgIHZhciBib3VuZHMgPSBwcm9wcy5ib3VuZHM7XHJcbiAgICB2YXIgc3BhY2luZyA9IHByb3BzLnNwYWNpbmc7XHJcbiAgICB2YXIgeCA9IHByb3BzLng7XHJcbiAgICB2YXIgeSA9IHByb3BzLnk7XHJcblxyXG4gICAgdmFyIHhSYW5nZSA9IGQzLnJhbmdlKE1hdGguY2VpbCgoYm91bmRzLm1pblgpIC8gc3BhY2luZyksIE1hdGgucm91bmQoYm91bmRzLm1heFgpICsgc3BhY2luZywgc3BhY2luZyk7XHJcbiAgICB2YXIgeVJhbmdlID0gZDMucmFuZ2UoTWF0aC5jZWlsKChib3VuZHMubWluWSkgLyBzcGFjaW5nKSwgTWF0aC5yb3VuZChib3VuZHMubWF4WSkgKyBzcGFjaW5nLCBzcGFjaW5nKTtcclxuICAgIHZhciBkYXRhID0geFJhbmdlLmNvbmNhdCh5UmFuZ2UpO1xyXG4gICAgdmFyIGlzWCA9IGZ1bmN0aW9uKGluZGV4KSB7IHJldHVybiBpbmRleCA8IHhSYW5nZS5sZW5ndGg7IH07XHJcblxyXG4gICAgdmFyIGF4ZXMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwiLmF4aXNcIilcclxuICAgICAgLmRhdGEoZGF0YSk7XHJcblxyXG4gICAgYXhlcy5lbnRlcigpLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgcmV0dXJuIFwiYXhpcyBcIiArICgocHJvcHMuZHJhd0F4ZXMgJiYgZCA9PT0gMCkgPyBcInRoaWNrXCIgOiBcIlwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGF4ZXMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHByb3BzLnRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB4KGQpIDogeChib3VuZHMubWluWCk7IH0pXHJcbiAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geShib3VuZHMubWluWSkgOiB5KGQpOyB9KVxyXG4gICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IHgoZCkgOiB4KGJvdW5kcy5tYXhYKTsgfSlcclxuICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB5KGJvdW5kcy5tYXhZKSA6IHkoZCk7IH0pO1xyXG5cclxuICAgIGF4ZXMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgIGlmIChwcm9wcy5kcmF3QXhlcykge1xyXG4gICAgICB2YXIgbGFiZWxzID0gY29udGFpbmVyLnNlbGVjdEFsbChcIi5sYWJlbFwiKS5kYXRhKGRhdGEpO1xyXG5cclxuICAgICAgbGFiZWxzLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJsYWJlbCBcIiArIChpc1goaSkgPyBcInhcIiA6IFwieVwiKTsgfSlcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXHJcbiAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbihkKSB7IGlmICghZCkgcmV0dXJuIFwibm9uZVwiOyB9KVxyXG4gICAgICAgIC50ZXh0KE9iamVjdClcclxuICAgICAgICAuYXR0cihcImR5XCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGlzWChpKSA/IFwiMS40ZW1cIiA6IFwiLjNlbVwiOyB9KVxyXG4gICAgICAgIC5hdHRyKFwiZHhcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8gbnVsbCA6IFwiLS44ZW1cIjsgfSlcclxuICAgICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCAxICsgXCJlbVwiKTtcclxuXHJcbiAgICAgIGxhYmVscy50cmFuc2l0aW9uKCkuZHVyYXRpb24ocHJvcHMudHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpc1goaSkgPyB4KGQpIDogeCgwKTsgfSlcclxuICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaXNYKGkpID8geSgwKSA6IHkoZCk7IH0pO1xyXG5cclxuICAgICAgbGFiZWxzLmV4aXQoKS5yZW1vdmUoKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZHJhd0F4ZXM6IHRydWUsXHJcbiAgICAgIHRyYW5zaXRpb25EdXJhdGlvbjogNTUwLFxyXG4gICAgICBzcGFjaW5nOiAxXHJcbiAgICB9O1xyXG4gIH0sXHJcblxyXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMudXBkYXRlKHRoaXMucHJvcHMpO1xyXG4gIH0sXHJcblxyXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24obmV4dFByb3BzKSB7XHJcbiAgICB0aGlzLnVwZGF0ZShuZXh0UHJvcHMpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0sXHJcblxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIFJlYWN0LkRPTS5nKCB7Y2xhc3NOYW1lOlwiYXhlc1wifSlcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgICk7XHJcbiAgfVxyXG59KTtcclxuXHJcblxyXG4vKiogVmFyaW91cyBnZW9tZXRyaWMgc2hhcGVzIHRvIGJlIGRyYXduIG9uIHRoZSBjb29yZGluYXRlIHN5c3RlbS4gKi9cclxudmFyIFNoYXBlcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NoYXBlcycsXHJcblxyXG4gIHByb3BUeXBlczoge1xyXG4gICAgZGF0YTogUmVhY3QuUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXHJcbiAgICB4OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxyXG4gICAgeTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcclxuICAgIHNwYWNpbmc6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcclxuICAgIHRyYW5zaXRpb25EdXJhdGlvbjogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxyXG4gIH0sXHJcblxyXG4gIC8qKiBSZWRyYXcgc2hhcGVzLiBHZXRzIGNhbGxlZCB3aGVuZXZlciBzaGFwZXMgYXJlIHVwZGF0ZWQgb3Igc2NyZWVuIHJlc2l6ZXMuICovXHJcbiAgdXBkYXRlOiBmdW5jdGlvbihwcm9wcykge1xyXG4gICAgdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCh0aGlzLmdldERPTU5vZGUoKSk7XHJcbiAgICB2YXIgdHJhbnNpdGlvbkR1cmF0aW9uID0gcHJvcHMudHJhbnNpdGlvbkR1cmF0aW9uIHx8IDU1MDtcclxuXHJcbiAgICB2YXIgcG9seWdvbnMgPSBjb250YWluZXIuc2VsZWN0QWxsKFwicG9seWdvbi5zaGFwZVwiKVxyXG4gICAgICAuZGF0YShwcm9wcy5kYXRhLmZpbHRlcihmdW5jdGlvbihzKSB7IHJldHVybiBzLnBvaW50cy5sZW5ndGggPiAyOyB9KSk7XHJcblxyXG4gICAgdmFyIGFkZGVkUG9seWdvbnMgPSBwb2x5Z29ucy5lbnRlcigpLmFwcGVuZChcInBvbHlnb25cIikuYXR0cihcImNsYXNzXCIsIFwic2hhcGVcIik7XHJcblxyXG4gICAgcG9seWdvbnMudHJhbnNpdGlvbigpLmR1cmF0aW9uKHRyYW5zaXRpb25EdXJhdGlvbilcclxuICAgICAgLmF0dHIoXCJwb2ludHNcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBkLnBvaW50cy5tYXAoZnVuY3Rpb24ocHMpIHtcclxuICAgICAgICAgIHJldHVybiBbcHJvcHMueChwc1swXSksIHByb3BzLnkocHNbMV0pXTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgcG9seWdvbnMuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuXHJcbiAgICB2YXIgY2lyY2xlcyA9IGNvbnRhaW5lci5zZWxlY3RBbGwoXCJjaXJjbGUuc2hhcGVcIilcclxuICAgICAgLmRhdGEocHJvcHMuZGF0YS5maWx0ZXIoZnVuY3Rpb24ocykgeyByZXR1cm4gcy5wb2ludHMubGVuZ3RoID09IDE7IH0pKTtcclxuXHJcbiAgICB2YXIgYWRkZWRDaXJjbGVzID0gY2lyY2xlcy5lbnRlcigpLmFwcGVuZChcImNpcmNsZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJzaGFwZVwiKTtcclxuXHJcbiAgICBjaXJjbGVzLnRyYW5zaXRpb24oKS5kdXJhdGlvbih0cmFuc2l0aW9uRHVyYXRpb24pXHJcbiAgICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueChkLnBvaW50c1swXVswXSk7IH0pXHJcbiAgICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gcHJvcHMueShkLnBvaW50c1swXVsxXSk7IH0pXHJcbiAgICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBwcm9wcy5zcGFjaW5nICogKGQuciB8fCAwLjIpOyB9KTtcclxuXHJcbiAgICBjaXJjbGVzLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcblxyXG4gICAgdmFyIGxpbmVzID0gY29udGFpbmVyLnNlbGVjdEFsbChcImxpbmUuc2hhcGVcIilcclxuICAgICAgLmRhdGEocHJvcHMuZGF0YS5maWx0ZXIoZnVuY3Rpb24ocykgeyByZXR1cm4gcy5wb2ludHMubGVuZ3RoID09IDI7IH0pKTtcclxuXHJcbiAgICB2YXIgYWRkZWRMaW5lcyA9IGxpbmVzLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJzaGFwZVwiKTtcclxuXHJcbiAgICBsaW5lcy50cmFuc2l0aW9uKCkuZHVyYXRpb24odHJhbnNpdGlvbkR1cmF0aW9uKVxyXG4gICAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMF1bMF0pOyB9KVxyXG4gICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMF1bMV0pOyB9KVxyXG4gICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLngoZC5wb2ludHNbMV1bMF0pOyB9KVxyXG4gICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHByb3BzLnkoZC5wb2ludHNbMV1bMV0pOyB9KTtcclxuXHJcbiAgICBsaW5lcy5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gQXR0YWNoIGNsaWNrIGV2ZW50IGxpc3RlbmVycy5cclxuICAgIFthZGRlZFBvbHlnb25zLCBhZGRlZENpcmNsZXMsIGFkZGVkTGluZXNdLmZvckVhY2goZnVuY3Rpb24oYWRkZWQpIHtcclxuICAgICAgYWRkZWQub24oXCJjbGlja1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihkLm9uQ2xpY2spKVxyXG4gICAgICAgICAgZC5vbkNsaWNrKGQpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNldCBjb21tb24gYXR0cmlidXRlcy5cclxuICAgIGNvbnRhaW5lci5zZWxlY3RBbGwoXCIuc2hhcGVcIilcclxuICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZmlsbCB8fCBcInRyYW5zcGFyZW50XCI7IH0pXHJcbiAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc3Ryb2tlIHx8IFwic3RlZWxibHVlXCI7IH0pXHJcbiAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIChkLnN0cm9rZVdpZHRoIHx8IDIpICsgXCJweFwiOyB9KTtcclxuICB9LFxyXG5cclxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnVwZGF0ZSh0aGlzLnByb3BzKTtcclxuICB9LFxyXG5cclxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xyXG4gICAgdGhpcy51cGRhdGUobmV4dFByb3BzKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9LFxyXG5cclxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgcmV0dXJuIFJlYWN0LkRPTS5nKCB7Y2xhc3NOYW1lOlwic2hhcGVzXCJ9KTtcclxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29vcmRzOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogVmFyaW91cyBjb21tb24gZm9ybSBjb21wb25lbnRzLlxyXG4gKi9cclxudmFyIEZvcm1Db21wb25lbnRzID0gKGZ1bmN0aW9uKCl7XHJcblxyXG4gIHZhciBNaXhpbnMgPSByZXF1aXJlKFwiLi9taXhpbnNcIik7XHJcblxyXG4gIHZhciBmb3JtQ29tcG9uZW50cyA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBBIGZvcm0gdGhhdCBkaXNhYmxlcyBzdWJtaXR0aW5nIHdoZW4gaW5wdXRzIGFyZSBpbnZhbGlkLlxyXG4gICAqL1xyXG4gIGZvcm1Db21wb25lbnRzLkFuc3dlckZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBbnN3ZXJGb3JtJyxcclxuXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgb25BbnN3ZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXHJcbiAgICAgIGJ0bkNvcnJlY3RBbmltQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIGJ0bkluY29ycmVjdEFuaW1DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgZm9ybUNsYXNzOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xyXG4gICAgfSxcclxuXHJcbiAgICBtaXhpbnM6IFtNaXhpbnMuVHJpZ2dlckFuaW1hdGlvbk1peGluXSxcclxuXHJcbiAgICAvKiogU3VibWl0IGFuc3dlciBpZiBmb3JtIGlzIHZhbGlkLiAqL1xyXG4gICAgaGFuZGxlU3VibWl0OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGlmIChlKVxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLnN0YXRlLmlzVmFsaWQpIHtcclxuICAgICAgICB0aGlzLnByb3BzLm9uQW5zd2VyKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2hvd0Vycm9yczogdHJ1ZX0pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUNvcnJlY3RBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYnRuID0gJCh0aGlzLnJlZnMuYnRuLmdldERPTU5vZGUoKSk7XHJcbiAgICAgIHRoaXMuYW5pbWF0ZShidG4sIHRoaXMucHJvcHMuYnRuQ29ycmVjdEFuaW1DbGFzcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUluY29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBidG4gPSAkKHRoaXMucmVmcy5idG4uZ2V0RE9NTm9kZSgpKTtcclxuICAgICAgdGhpcy5hbmltYXRlKGJ0biwgdGhpcy5wcm9wcy5idG5JbmNvcnJlY3RBbmltQ2xhc3MpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWxpZGl0eTogZnVuY3Rpb24oaXNWYWxpZCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtpc1ZhbGlkOiBpc1ZhbGlkLCBpc0RpcnR5OiB0cnVlfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDbGVhciB2YWx1ZXMgYW5kIHZhbGlkYXRpb24gc3RhdGVzIGZvciBhbGwgY2hpbGQgZWxlbWVudHMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgc2hvd0Vycm9yczogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZm9ybUNsYXNzOiBcImZvcm0taG9yaXpvbnRhbFwiLFxyXG4gICAgICAgIGJ0bkNsYXNzOiBcImJ0biBidG4tc3VjY2VzcyBidG4tbGcgYnRuLWJsb2NrXCIsXHJcbiAgICAgICAgYnRuQ29ycmVjdEFuaW1DbGFzczogXCJhbmltYXRlZCBib3VuY2VcIixcclxuICAgICAgICBidG5JbmNvcnJlY3RBbmltQ2xhc3M6IFwiYW5pbWF0ZWQgc2hha2VcIlxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgc2hvd0Vycm9yczogZmFsc2VcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgY2hpbGRyZW4gPSBbXS5jb25jYXQodGhpcy5wcm9wcy5jaGlsZHJlbikubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgY2hpbGQucHJvcHMub25WYWxpZGl0eUNoYW5nZSA9IHRoaXMuc2V0VmFsaWRpdHk7XHJcbiAgICAgICAgY2hpbGQucHJvcHMub25TdWJtaXQgPSB0aGlzLmhhbmRsZVN1Ym1pdDtcclxuICAgICAgICBjaGlsZC5wcm9wcy5zaG93RXJyb3IgPSB0aGlzLnN0YXRlLnNob3dFcnJvcnM7XHJcbiAgICAgICAgcmV0dXJuIGNoaWxkO1xyXG4gICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgdmFyIGJ0bkNsYXNzID0gdGhpcy5wcm9wcy5idG5DbGFzcyArICh0aGlzLnN0YXRlLmlzVmFsaWQgPyBcIlwiIDogXCIgZGlzYWJsZWRcIik7XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5mb3JtKCB7cm9sZTpcImZvcm1cIiwgY2xhc3NOYW1lOnRoaXMucHJvcHMuZm9ybUNsYXNzLCBvblN1Ym1pdDp0aGlzLmhhbmRsZVN1Ym1pdCwgbm9WYWxpZGF0ZTp0cnVlfSwgXHJcbiAgICAgICAgICBjaGlsZHJlbixcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7cmVmOlwiYnRuXCIsIHR5cGU6XCJzdWJtaXRcIiwgdmFsdWU6XCJWYXN0YWFcIiwgY2xhc3NOYW1lOmJ0bkNsYXNzfSApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQW4gaW5wdXQgd2l0aCByZWd1bGFyIGV4cHJlc3Npb24gdmFsaWRhdGlvbi5cclxuICAgKi9cclxuICBmb3JtQ29tcG9uZW50cy5SZUlucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUmVJbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHJlOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxyXG4gICAgICBzaG93RXJyb3I6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgICByZXF1aXJlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICB0eXBlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICAgIG9uVmFsaWRpdHlDaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZWFkIHZhbHVlLCB2YWxpZGF0ZSwgbm90aWZ5IHBhcmVudCBlbGVtZW50IGlmIGFuIGV2ZW50IGlzIGF0dGFjaGVkLiAqL1xyXG4gICAgaGFuZGxlQ2hhbmdlOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy52YWxpZGF0b3IudGVzdChlLnRhcmdldC52YWx1ZSk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiBlLnRhcmdldC52YWx1ZSwgaXNWYWxpZDogaXNWYWxpZCwgaXNEaXJ0eTogdHJ1ZX0pO1xyXG5cclxuICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UpKVxyXG4gICAgICAgIHRoaXMucHJvcHMub25WYWxpZGl0eUNoYW5nZShpc1ZhbGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3ZhbHVlOiB2YWx1ZX0pO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUudmFsdWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5pbnB1dC5nZXRET01Ob2RlKCkuc2VsZWN0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDbGVhciB2YWx1ZSBhbmQgcmVzZXQgdmFsaWRhdGlvbiBzdGF0ZXMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFZhbGlkYXRvcjogZnVuY3Rpb24ocmUpIHtcclxuICAgICAgdGhpcy52YWxpZGF0b3IgPSBuZXcgUmVnRXhwKHJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnNldFZhbGlkYXRvcih0aGlzLnByb3BzLnJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24obmV3UHJvcHMpIHtcclxuICAgICAgdGhpcy5zZXRWYWxpZGF0b3IobmV3UHJvcHMucmUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHZhbHVlOiBcIlwiLFxyXG4gICAgICAgIGlzVmFsaWQ6IHRydWUsXHJcbiAgICAgICAgaXNEaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCJcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICByZTogL15cXHMqLT9cXGQrXFxzKiQvLFxyXG4gICAgICAgIHNob3dFcnJvcjogZmFsc2UsXHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgY2xhc3NOYW1lOiBcIlwiXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHZhbGlkYXRpb25TdGF0ZSA9IFJlYWN0LmFkZG9ucy5jbGFzc1NldCh7XHJcbiAgICAgICAgXCJoYXMtc3VjY2Vzc1wiOiB0aGlzLnN0YXRlLmlzVmFsaWQgJiYgdGhpcy5zdGF0ZS5pc0RpcnR5LFxyXG4gICAgICAgIFwiaGFzLXdhcm5pbmdcIjogIXRoaXMuc3RhdGUuaXNEaXJ0eSAmJiB0aGlzLnByb3BzLnNob3dFcnJvcixcclxuICAgICAgICBcImhhcy1lcnJvclwiOiAhdGhpcy5zdGF0ZS5pc1ZhbGlkXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGVycm9yO1xyXG4gICAgICBpZiAodGhpcy5wcm9wcy5zaG93RXJyb3IpIHtcclxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuaXNWYWxpZCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJjb250cm9sLWxhYmVsXCJ9LCBcIlZpcmhlZWxsaW5lbiBzecO2dGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMucHJvcHMucmVxdWlyZWQgJiYgdGhpcy52YWx1ZSgpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJjb250cm9sLWxhYmVsXCJ9LCBcIlTDpHl0w6QgdMOkbcOkIGtlbnR0w6RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cCBcIiArIHZhbGlkYXRpb25TdGF0ZX0sIFxyXG4gICAgICAgICAgZXJyb3IsXHJcbiAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtyZWY6XCJpbnB1dFwiLCBvbkNoYW5nZTp0aGlzLmhhbmRsZUNoYW5nZSwgdmFsdWU6dGhpcy5zdGF0ZS52YWx1ZSwgcGxhY2Vob2xkZXI6dGhpcy5wcm9wcy5wbGFjZWhvbGRlcixcclxuICAgICAgICAgIHR5cGU6dGhpcy5wcm9wcy50eXBlLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wgXCIgKyB0aGlzLnByb3BzLmNsYXNzTmFtZX0gKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSBudW1iZXIgaW5wdXQgd2l0aCB0d28gYnV0dG9ucyBmb3IgaW5jcmVtZW50aW5nIGFuZCBkZWNyZW1lbnRpbmcuXHJcbiAgICovXHJcbiAgZm9ybUNvbXBvbmVudHMuTnVtSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOdW1JbnB1dCcsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXA6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIHBsYWNlaG9sZGVyOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgICBidG5DbGFzczogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuICAgICAgb25WYWxpZGl0eUNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXHJcbiAgICAgIG9uU3VibWl0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRWYWx1ZUFuZFZhbGlkaXR5OiBmdW5jdGlvbih2YWx1ZSwgaXNWYWxpZCkge1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICB2YWx1ZTogdmFsdWUsIGlzVmFsaWQ6IGlzVmFsaWRcclxuICAgICAgfSk7XHJcbiAgICAgIGlmICgkLmlzRnVuY3Rpb24odGhpcy5wcm9wcy5vblZhbGlkaXR5Q2hhbmdlKSlcclxuICAgICAgICB0aGlzLnByb3BzLm9uVmFsaWRpdHlDaGFuZ2UoaXNWYWxpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KFwiXCIsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVEZWNyZW1lbnQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB0aGlzLnNldFZhbHVlQW5kVmFsaWRpdHkodGhpcy52YWx1ZSgpIC0gdGhpcy5wcm9wcy5zdGVwLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlSW5jcmVtZW50OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgdGhpcy5zZXRWYWx1ZUFuZFZhbGlkaXR5KHRoaXMudmFsdWUoKSArIHRoaXMucHJvcHMuc3RlcCwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZXNldCBzdGF0ZSB0byBpbnB1dCB2YWx1ZSBpZiBpbnB1dCB2YWx1ZSBpcyBhIG51bWJlci4gKi9cclxuICAgIGhhbmRsZUNoYW5nZTogZnVuY3Rpb24oZSkge1xyXG4gICAgICB2YXIgdmFsID0gZS50YXJnZXQudmFsdWU7XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gIWlzTmFOKHBhcnNlRmxvYXQodmFsKSk7XHJcbiAgICAgIHRoaXMuc2V0VmFsdWVBbmRWYWxpZGl0eSh2YWwsIGlzVmFsaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogVHJ5IHRvIHN1Ym1pdCBwYXJlbnQgZm9ybSB3aGVuIEVudGVyIGlzIGNsaWNrZWQuICovXHJcbiAgICBoYW5kbGVLZXlQcmVzczogZnVuY3Rpb24oZSkge1xyXG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZiAodGhpcy5wcm9wcy5vblN1Ym1pdClcclxuICAgICAgICAgIHRoaXMucHJvcHMub25TdWJtaXQoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBwYXJzZUZsb2F0KHRoaXMuc3RhdGUudmFsdWUpIHx8IDA7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdmFsdWU6IG51bGwsXHJcbiAgICAgICAgaXNWYWxpZDogdHJ1ZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0ZXA6IDFcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgUmVJbnB1dCA9IGZvcm1Db21wb25lbnRzLlJlSW5wdXQ7XHJcbiAgICAgIHZhciBidG5DbGFzcyA9IHRoaXMucHJvcHMuYnRuQ2xhc3MgfHwgXCJidG4gYnRuLWxnIGJ0bi1pbmZvXCI7XHJcbiAgICAgIHZhciB2YWxpZGF0aW9uU3RhdGUgPSB0aGlzLnN0YXRlLmlzVmFsaWQgPyBcImhhcy1zdWNjZXNzXCIgOiBcImhhcy1lcnJvclwiO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cCBcIiArIHZhbGlkYXRpb25TdGF0ZX0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tMyBjb2wteHMtM1wifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3RhYkluZGV4OlwiLTFcIiwgY2xhc3NOYW1lOmJ0bkNsYXNzICsgXCIgcHVsbC1yaWdodFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlRGVjcmVtZW50fSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1sZWZ0XCJ9KVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IGNvbC14cy02XCJ9LCBcclxuICAgICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwibnVtYmVyXCIsIHZhbHVlOnRoaXMuc3RhdGUudmFsdWUsIG9uQ2hhbmdlOnRoaXMuaGFuZGxlQ2hhbmdlLCBvbktleVByZXNzOnRoaXMuaGFuZGxlS2V5UHJlc3MsXHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sIGlucHV0LWxnIHRleHQtY2VudGVyXCIsIHBsYWNlaG9sZGVyOnRoaXMucHJvcHMucGxhY2Vob2xkZXJ9KVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTMgY29sLXhzLTNcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0YWJJbmRleDpcIi0xXCIsIGNsYXNzTmFtZTpidG5DbGFzcyArIFwiIHB1bGwtbGVmdFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlSW5jcmVtZW50fSwgXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodFwifSlcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBmb3JtQ29tcG9uZW50cztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1Db21wb25lbnRzOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29tcGxldGUgYW5zd2VyIGZvcm1zIGZvciB0YXNrcy5cclxuICovXHJcbnZhciBGb3JtcyA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIEZvcm1Db21wb25lbnRzID0gcmVxdWlyZShcIi4vZm9ybS1jb21wb25lbnRzXCIpO1xyXG4gIHZhciBBbnN3ZXJGb3JtID0gRm9ybUNvbXBvbmVudHMuQW5zd2VyRm9ybTtcclxuICB2YXIgTnVtSW5wdXQgPSBGb3JtQ29tcG9uZW50cy5OdW1JbnB1dDtcclxuXHJcbiAgdmFyIGZvcm1zID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcm0gd2l0aCBhIHNpbmdsZSBudW1iZXIgaW5wdXQuXHJcbiAgICovXHJcbiAgZm9ybXMuU2luZ2xlTnVtYmVyRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NpbmdsZU51bWJlckZvcm0nLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBvbkFuc3dlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVBbnN3ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaXNDb3JyZWN0ID0gdGhpcy5wcm9wcy5vbkFuc3dlcih0aGlzLnJlZnMuYW5zd2VyLnZhbHVlKCkpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVJbmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5mb3JtLnJlc2V0KCk7XHJcbiAgICAgIHRoaXMucmVmcy5hbnN3ZXIucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgICAgQW5zd2VyRm9ybSgge3JlZjpcImZvcm1cIiwgY2xhc3NOYW1lOlwiZm9ybS1ob3Jpem9udGFsXCIsIG9uQW5zd2VyOnRoaXMuaGFuZGxlQW5zd2VyfSwgXHJcbiAgICAgICAgICBOdW1JbnB1dCgge3JlZjpcImFuc3dlclwiLCBwbGFjZWhvbGRlcjpcIlZhc3RhYSB0w6Row6RuXCJ9KVxyXG4gICAgICAgIClcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBGb3JtIHdpdGggdHdvIGlucHV0cyBmb3IgeCBhbmQgeSBjb29yZGluYXRlcy5cclxuICAgKi9cclxuICBmb3Jtcy5Db29yZHNBbnN3ZXJGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29vcmRzQW5zd2VyRm9ybScsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uQW5zd2VyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSB0aGlzLnByb3BzLm9uQW5zd2VyKHRoaXMucmVmcy54LnZhbHVlKCksIHRoaXMucmVmcy55LnZhbHVlKCkpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLmZvcm0uaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnJlZnMuZm9ybS5oYW5kbGVJbmNvcnJlY3RBbnN3ZXIoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVmcy5mb3JtLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBBbnN3ZXJGb3JtKCB7cmVmOlwiZm9ybVwiLCBjbGFzc05hbWU6XCJmb3JtLWhvcml6b250YWxcIiwgb25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9LCBcclxuICAgICAgICAgIE51bUlucHV0KCB7cmVmOlwieFwiLCBwbGFjZWhvbGRlcjpcInhcIn0pLFxyXG4gICAgICAgICAgTnVtSW5wdXQoIHtyZWY6XCJ5XCIsIHBsYWNlaG9sZGVyOlwieVwifSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBmb3JtcztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1zO1xyXG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLyogZ2xvYmFsIFJlYWN0LCBtb2R1bGUsIE1hdGhKYXggKi9cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbXBvbmVudHMgZm9yIG1hdGhzIHRhc2tzLlxyXG4gKi9cclxudmFyIE1hdGhDb21wb25lbnRzID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICB2YXIgbWF0aENvbXBvbmVudHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmVuZGVyIExhVGV4IG1hdGhzIG5vdGF0aW9uIGludG8gd2ViIGZvbnRzIHVzaW5nIE1hdGhKYXguXHJcbiAgICovXHJcbiAgbWF0aENvbXBvbmVudHMuTWF0aEpheCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01hdGhKYXgnLFxyXG4gICAgcmVwcm9jZXNzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGVsZW0gPSB0aGlzLnJlZnMuc2NyaXB0LmdldERPTU5vZGUoKTtcclxuICAgICAgY29uc29sZS5sb2coXCJyZXByb2Nlc3NpbmdcIiwgJChlbGVtKS50ZXh0KCkpO1xyXG4gICAgICBNYXRoSmF4Lkh1Yi5RdWV1ZShbXCJSZXByb2Nlc3NcIiwgTWF0aEpheC5IdWIsIGVsZW1dKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlcHJvY2VzcygpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlcHJvY2VzcygpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5zY3JpcHQoIHtyZWY6XCJzY3JpcHRcIiwgdHlwZTpcIm1hdGgvdGV4XCJ9LCB0aGlzLnByb3BzLmNoaWxkcmVuKVxyXG4gICAgICAgIClcclxuICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIG1hdGhDb21wb25lbnRzO1xyXG59KSgpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWF0aENvbXBvbmVudHM7XHJcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBDb21wb25lbnQgZXh0ZW5zaW9ucyBpLmUuIG1peGlucy5cclxuICovXHJcbnZhciBNaXhpbnMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBtaXhpbnMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogUHJvdmlkZXMgYSBzZXRJbnRlcnZhbCBmdW5jdGlvbiB3aGljaCB3aWxsIGdldCBjbGVhbmVkIHVwIHdoZW5cclxuICAgKiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC5cclxuICAgKi9cclxuICBtaXhpbnMuU2V0SW50ZXJ2YWxNaXhpbiA9IHtcclxuICAgIHNldEludGVydmFsOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMucHVzaChzZXRJbnRlcnZhbC5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJBbGxJbnRlcnZhbHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmludGVydmFscy5tYXAoY2xlYXJJbnRlcnZhbCk7XHJcbiAgICAgIHRoaXMuaW50ZXJ2YWxzID0gW107XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBJbnZva2VkIHdoZW4gY29tcG9uZW50IGlzIGluaXRpYWxpemVkLiAqL1xyXG4gICAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5pbnRlcnZhbHMgPSBbXTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIEludm9rZWQgd2hlbiBjb21wb25lbnQgaXMgZGVzdHJveWVkLiAqL1xyXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNsZWFyQWxsSW50ZXJ2YWxzKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQXBwbHkgQ1NTIGNsYXNzZXMgZm9yIHNldCBkdXJhdGlvbiAtIHVzZWZ1bCBmb3Igc2luZ2xlc2hvdCBhbmltYXRpb25zLlxyXG4gICAqL1xyXG4gIG1peGlucy5UcmlnZ2VyQW5pbWF0aW9uTWl4aW4gPSB7XHJcbiAgICBhbmltYXRlOiBmdW5jdGlvbihlbGVtLCBjbGFzc05hbWUsIGR1cmF0aW9uKSB7XHJcbiAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgMTAwMDtcclxuICAgICAgaWYgKCF0aGlzLnRpbWVvdXQgJiYgdGhpcy50aW1lb3V0ICE9PSAwKSB7XHJcbiAgICAgICAgZWxlbS5hZGRDbGFzcyhjbGFzc05hbWUpO1xyXG4gICAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBlbGVtLnJlbW92ZUNsYXNzKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgICB0aGlzLnRpbWVvdXQgPSBudWxsO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSwgZHVyYXRpb24pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIG1peGlucztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1peGlucztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoqXHJcbiAqIENvbW1vbiB0YXNrIGNvbXBvbmVudHMuXHJcbiAqL1xyXG52YXIgVGFza0NvbXBvbmVudHMgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gIHZhciBteSA9IHt9O1xyXG5cclxuICAvKipcclxuICAgKiBBIHdyYXBwZXIgZm9yIEJvb3RzdHJhcCdzIHBhbmVsIGNvbXBvbmVudC5cclxuICAgKi9cclxuICBteS5UYXNrUGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrUGFuZWwnLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgY2xhc3NOYW1lID0gXCJwYW5lbCBcIiArICh0aGlzLnByb3BzLmNsYXNzTmFtZSB8fCBcInBhbmVsLWluZm9cIiApO1xyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzTmFtZX0sIFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWhlYWRpbmdcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaDMoIHtjbGFzc05hbWU6XCJwYW5lbC10aXRsZVwifSwgdGhpcy5wcm9wcy5oZWFkZXIpXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWJvZHlcIn0sIFxyXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBBIHdyYXBwZXIgZm9yIEJvb3RzdHJhcCdzIHByb2dyZXNzIGJhciBlbGVtZW50LlxyXG4gICAqL1xyXG4gIG15LlRhc2tQcm9ncmVzc0JhciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tQcm9ncmVzc0JhcicsXHJcbiAgICBwcm9wVHlwZXM6IHtcclxuICAgICAgbWF4OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIG5vdzogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHNpbmdsZVdpZHRoID0gTWF0aC5jZWlsKDEgLyB0aGlzLnByb3BzLm1heCAqIDEwMCk7XHJcbiAgICAgIHZhciBsZWZ0U3R5bGUgPSB7d2lkdGg6IHNpbmdsZVdpZHRoICogKHRoaXMucHJvcHMubm93IC0gMSkgKyBcIiVcIn07XHJcbiAgICAgIHZhciByaWdodFN0eWxlID0ge3dpZHRoOiBzaW5nbGVXaWR0aCAqICh0aGlzLnByb3BzLm1heCAtIHRoaXMucHJvcHMubm93ICsgMSkgKyBcIiVcIn07XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSB0YXNrLXByb2dyZXNzLWJhclwifSwgXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicHJvZ3Jlc3MtYmFyIHByb2dyZXNzLWJhci1zdWNjZXNzXCIsIHN0eWxlOmxlZnRTdHlsZX0pLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInByb2dyZXNzLWJhciBwcm9ncmVzcy1iYXItd2FybmluZ1wiLCBzdHlsZTpyaWdodFN0eWxlfSlcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRhc2sgaGVhZGVyIHdpdGggdGFzayBuYW1lIGFuZCBhbiBvcHRpb25hbCBzdGVwIGNvdW50ZXIuXHJcbiAgICovXHJcbiAgbXkuVGFza0hlYWRlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rhc2tIZWFkZXInLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBuYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXHJcbiAgICAgIHN0ZXA6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICAgIHN0ZXBzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIHN0ZXBDb3VudGVyO1xyXG4gICAgICBpZiAodGhpcy5wcm9wcy5zdGVwICYmIHRoaXMucHJvcHMuc3RlcHMpIHtcclxuICAgICAgICB2YXIgVGFza1Byb2dyZXNzQmFyID0gbXkuVGFza1Byb2dyZXNzQmFyO1xyXG4gICAgICAgIHN0ZXBDb3VudGVyID0gVGFza1Byb2dyZXNzQmFyKCB7bWF4OnRoaXMucHJvcHMuc3RlcHMsIG5vdzp0aGlzLnByb3BzLnN0ZXB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFzay1oZWFkZXIgcm93XCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tN1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMihudWxsLCB0aGlzLnByb3BzLm5hbWUpXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01XCJ9LCBcclxuICAgICAgICAgICAgc3RlcENvdW50ZXJcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICAvKipcclxuICAgKiBBbiBlbGVtZW50IHRoYXQgaXMgc2hvd24gYWZ0ZXIgYSBjb21wbGV0ZWQgdGFzay5cclxuICAgKi9cclxuICBteS5UYXNrRG9uZURpc3BsYXkgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYXNrRG9uZURpc3BsYXknLFxyXG5cclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzY29yZTogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBzY29yZSA9IHRoaXMucHJvcHMuc2NvcmUgfHwgMDtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhc2stZG9uZS1kaXNwbGF5IGFuaW1hdGUgYm91bmNlLWluXCJ9LCBcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJhbGVydCBhbGVydC1zdWNjZXNzXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBcIlRlaHTDpHbDpCBzdW9yaXRldHR1IVwiKSwgXCIgUGlzdGVpdMOkOiBcIiwgc2NvcmVcclxuICAgICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBteTtcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tDb21wb25lbnRzOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG4vKiBnbG9iYWwgUmVhY3QsIHJlcXVpcmUsIG1vZHVsZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcblxyXG4vKipcclxuICogQSBzaW1wbGUgaW50ZWdlciBhZGRpdGlvbiB0YXNrLlxyXG4gKi9cclxudmFyIEFkZGl0aW9uVGFzayA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIFRhc2tVdGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy90YXNrLXV0aWxzXCIpO1xyXG4gIHZhciBTaW5nbGVOdW1iZXJGb3JtID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvZm9ybXNcIikuU2luZ2xlTnVtYmVyRm9ybTtcclxuICB2YXIgTWF0aENvbXBvbmVudHMgPSByZXF1aXJlKFwiLi4vY29tcG9uZW50cy9tYXRoLWNvbXBvbmVudHNcIik7XHJcbiAgdmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzXCIpO1xyXG5cclxuXHJcbiAgdmFyIGFkZGl0aW9uVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ2FkZGl0aW9uVGFzaycsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIHN0ZXBzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXHJcbiAgICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgLyoqIFJlc2V0IHRoZSBxdWVzdGlvbi4gKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGEsIGI7XHJcbiAgICAgIGRvIHtcclxuICAgICAgICBhID0gVGFza1V0aWxzLnJhbmRSYW5nZSgxLCAxMSk7XHJcbiAgICAgICAgYiA9IFRhc2tVdGlscy5yYW5kUmFuZ2UoMSwgMTEpO1xyXG4gICAgICB9XHJcbiAgICAgIHdoaWxlIChUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKFthLGJdLCBbdGhpcy5zdGF0ZS5hLCB0aGlzLnN0YXRlLmJdKSk7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgIGE6IGEsXHJcbiAgICAgICAgYjogYixcclxuICAgICAgICBhbnN3ZXI6IGEgKyBiXHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2hlY2sgaWYgY29ycmVjdC4gKi9cclxuICAgIGhhbmRsZUFuc3dlcjogZnVuY3Rpb24oYW5zd2VyKSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSBUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKGFuc3dlciwgdGhpcy5zdGF0ZS5hbnN3ZXIpO1xyXG4gICAgICBpZiAoaXNDb3JyZWN0KVxyXG4gICAgICAgIHRoaXMuaGFuZGxlQ29ycmVjdEFuc3dlcigpO1xyXG5cclxuICAgICAgcmV0dXJuIGlzQ29ycmVjdDtcclxuICAgIH0sXHJcblxyXG4gICAgaGFuZGxlQ29ycmVjdEFuc3dlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzdGVwID0gdGhpcy5zdGF0ZS5zdGVwO1xyXG4gICAgICBpZiAoc3RlcCA9PT0gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcykpXHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblRhc2tEb25lKCk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c3RlcDogc3RlcCArIDF9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RlcDogMSxcclxuICAgICAgICBhbnN3ZXI6IG51bGxcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4gICAgICB2YXIgVGFza1BhbmVsID0gVGFza0NvbXBvbmVudHMuVGFza1BhbmVsO1xyXG4gICAgICB2YXIgVGFza0hlYWRlciA9IFRhc2tDb21wb25lbnRzLlRhc2tIZWFkZXI7XHJcbiAgICAgIHZhciBUYXNrRG9uZURpc3BsYXkgPSBUYXNrQ29tcG9uZW50cy5UYXNrRG9uZURpc3BsYXk7XHJcbiAgICAgIHZhciBNYXRoSmF4ID0gTWF0aENvbXBvbmVudHMuTWF0aEpheDtcclxuXHJcbiAgICAgIHZhciB0YXNrSXNEb25lID0gdGhpcy5zdGF0ZS5zdGVwID4gcGFyc2VJbnQodGhpcy5wcm9wcy5zdGVwcyk7XHJcbiAgICAgIHZhciBxdWVzdGlvbiwgc2lkZWJhcjtcclxuXHJcbiAgICAgIGlmICghdGFza0lzRG9uZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwicmVuZGVyaW5nXCIsIHRoaXMuc3RhdGUuYSwgdGhpcy5zdGF0ZS5iKTtcclxuXHJcbiAgICAgICAgdmFyIHF1ZXN0aW9uQ29udGVudCA9IHRoaXMuc3RhdGUuYSArIFwiICsgXCIgKyB0aGlzLnN0YXRlLmIgKyBcIiA9ID9cIjtcclxuICAgICAgICBxdWVzdGlvbiA9IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0ZXh0LWNlbnRlciBiZy13YXJuaW5nXCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmgxKG51bGwsIFxyXG4gICAgICAgICAgICAgIE1hdGhKYXgobnVsbCwgcXVlc3Rpb25Db250ZW50KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc2lkZWJhciA9IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIk9oamVldFwifSwgXHJcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXCJNaWvDpCBvbiB5aHRlZW5sYXNrdW4gdHVsb3M/XCIpXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFRhc2tQYW5lbCgge2hlYWRlcjpcIlZhc3RhdXNcIiwgY2xhc3NOYW1lOlwicGFuZWwtc3VjY2VzcyBwYW5lbC1leHRyYS1wYWRkaW5nXCJ9LCBcclxuICAgICAgICAgICAgICBTaW5nbGVOdW1iZXJGb3JtKCB7b25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9IClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcXVlc3Rpb24gPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZToxMH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIllodGVlbmxhc2t1XCIsIHN0ZXA6dGhpcy5zdGF0ZS5zdGVwLCBzdGVwczp0aGlzLnByb3BzLnN0ZXBzfSApLFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNiBxdWVzdGlvblwifSwgXHJcbiAgICAgICAgICAgICAgcXVlc3Rpb25cclxuICAgICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNSBjb2wtc20tb2Zmc2V0LTFcIn0sIFxyXG4gICAgICAgICAgICAgIHNpZGViYXJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGFkZGl0aW9uVGFzaztcclxufSkoKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFkZGl0aW9uVGFzaztcclxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgZDMsIG1vZHVsZSwgcmVxdWlyZSAqL1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBUYXNrVXRpbHMgPSByZXF1aXJlKFwiLi4vdXRpbHMvdGFzay11dGlsc1wiKTtcclxudmFyIFRhc2tDb21wb25lbnRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvdGFzay1jb21wb25lbnRzXCIpO1xyXG52YXIgQ29vcmRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvY29vcmRzXCIpO1xyXG5cclxuLyoqXHJcbiAqIENsaWNrIHRoZSBhcHByb3ByaWF0ZSBzaGFwZSBpbiBhIGNvb3JkaW5hdGUgc3lzdGVtLlxyXG4gKi9cclxudmFyIEJhc2ljU2hhcGVzVGFzayA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIGJhc2ljU2hhcGVzVGFzayA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ2Jhc2ljU2hhcGVzVGFzaycsXHJcblxyXG4gICAgcHJvcFR5cGVzOiB7XHJcbiAgICAgIG9uVGFza0RvbmU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcclxuICAgIH0sXHJcblxyXG4gICAgc3RhcnRHYW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7aXNSdW5uaW5nOiB0cnVlLCBzY29yZTogMH0pO1xyXG4gICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiBzaXggZGlmZmVyZW50IHNoYXBlcyB0aGF0IGZpbGwgdGhlIGNvb3Jkc1xyXG4gICAgICogaW4gYSByYW5kb20gb3JkZXIuXHJcbiAgICAgKi9cclxuICAgIGdldFJhbmRvbVNoYXBlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBjMSA9IDAuNDYsIGMyID0gMS4yMSwgczEgPSAxLjQzLCBzMiA9IDAuODg1O1xyXG4gICAgICB2YXIgcGVudGFnb25QdHMgPSBbWy1zMiwtYzJdLCBbLXMxLGMxXSwgWzAsMS41XSwgW3MxLGMxXSwgW3MyLC1jMl1dO1xyXG4gICAgICBwZW50YWdvblB0cyA9IFRhc2tVdGlscy50cmFuc2xhdGUocGVudGFnb25QdHMsIDIuNSwgMS41KTtcclxuXHJcbiAgICAgIHZhciB0cmFuc2xhdGVzID0gW1swLDBdLCBbNiwwXSwgWzAsNF0sIFs2LDRdLCBbMCw4XSwgWzYsOF1dO1xyXG4gICAgICB2YXIgYmFzZXMgPSBbXHJcbiAgICAgICAge25hbWU6XCJrb2xtaW9cIiwgcG9pbnRzOltbMSwwXSwgWzEsM10sIFs0LDBdXX0sXHJcbiAgICAgICAge25hbWU6XCJuZWxpw7ZcIiwgcG9pbnRzOltbMSwwXSwgWzEsM10sIFs0LDNdLCBbNCwwXV19LFxyXG4gICAgICAgIHtuYW1lOlwieW1weXLDpFwiLCBwb2ludHM6W1syLjUsMS41XV0sIHI6MS41fSxcclxuICAgICAgICB7bmFtZTpcInN1dW5uaWthc1wiLCBwb2ludHM6W1swLDBdLCBbMC41LDNdLCBbNC41LDNdLCBbNCwwXV19LFxyXG4gICAgICAgIHtuYW1lOlwicHVvbGlzdXVubmlrYXNcIiwgcG9pbnRzOltbMCwwXSwgWzAuNSwzXSwgWzQsM10sIFs0LjUsMF1dfSxcclxuICAgICAgICB7bmFtZTpcInZpaXNpa3VsbWlvXCIsIHBvaW50czpwZW50YWdvblB0c31cclxuICAgICAgXTtcclxuXHJcbiAgICAgIGJhc2VzID0gVGFza1V0aWxzLnNodWZmbGUoYmFzZXMpO1xyXG4gICAgICB2YXIgY2xycyA9IGQzLnNjYWxlLmNhdGVnb3J5MTAoKTtcclxuXHJcbiAgICAgIHZhciBzaGFwZXMgPSBiYXNlcy5tYXAoZnVuY3Rpb24oYmFzZSwgaSkge1xyXG4gICAgICAgIHZhciB0cmFuc2xhdGVYID0gdHJhbnNsYXRlc1tpXVswXSArIE1hdGgucmFuZG9tKCk7XHJcbiAgICAgICAgdmFyIHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGVzW2ldWzFdICsgTWF0aC5yYW5kb20oKTtcclxuICAgICAgICBiYXNlLnBvaW50cyA9IFRhc2tVdGlscy50cmFuc2xhdGUoYmFzZS5wb2ludHMsIHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVkpO1xyXG4gICAgICAgIGJhc2Uua2V5ID0gaTtcclxuICAgICAgICBiYXNlLm9uQ2xpY2sgPSB0aGlzLmhhbmRsZVNoYXBlQ2xpY2s7XHJcbiAgICAgICAgYmFzZS5zdHJva2UgPSBcImJsYWNrXCI7XHJcbiAgICAgICAgYmFzZS5maWxsID0gY2xycyhUYXNrVXRpbHMucmFuZCg5KSk7XHJcbiAgICAgICAgcmV0dXJuIGJhc2U7XHJcbiAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICByZXR1cm4gc2hhcGVzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogUmVzZXQgdGhlIHF1ZXN0aW9uLCBpLmUuIGdlbmVyYXRlIG5ldyBzaGFwZXMuICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzaGFwZXMgPSB0aGlzLmdldFJhbmRvbVNoYXBlcygpO1xyXG5cclxuICAgICAgLy8gUHJldmVudCBhc2tpbmcgZm9yIHRoZSBzYW1lIHNoYXBlIHR3aWNlIGluIGEgcm93LlxyXG4gICAgICB2YXIgcG9zc2libGVUYXJnZXRzID0gc2hhcGVzO1xyXG4gICAgICBpZiAodGhpcy5zdGF0ZS50YXJnZXQpIHtcclxuICAgICAgICBwb3NzaWJsZVRhcmdldHMgPSBwb3NzaWJsZVRhcmdldHMuZmlsdGVyKGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgICAgICByZXR1cm4gc2hhcGUubmFtZSAhPT0gdGhpcy5zdGF0ZS50YXJnZXQubmFtZTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciB0YXJnZXQgPSBwb3NzaWJsZVRhcmdldHNbVGFza1V0aWxzLnJhbmQocG9zc2libGVUYXJnZXRzLmxlbmd0aCldO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgc2hhcGVzOiB0aGlzLmdldFJhbmRvbVNoYXBlcygpLFxyXG4gICAgICAgIHRhcmdldDogdGFyZ2V0XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKiogQ2hlY2sgaWYgY29ycmVjdCBzaGFwZSBhbmQgcHJvY2VlZC4gKi9cclxuICAgIGhhbmRsZVNoYXBlQ2xpY2s6IGZ1bmN0aW9uKHNoYXBlKSB7XHJcbiAgICAgIHZhciBzY29yZUluY3JlbWVudDtcclxuICAgICAgaWYgKHNoYXBlLm5hbWUgPT09IHRoaXMuc3RhdGUudGFyZ2V0Lm5hbWUpIHtcclxuICAgICAgICBzY29yZUluY3JlbWVudCA9IDE7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2NvcmVJbmNyZW1lbnQgPSAtMTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7c2NvcmU6IE1hdGgubWF4KHRoaXMuc3RhdGUuc2NvcmUgKyBzY29yZUluY3JlbWVudCwgMCl9KTtcclxuICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHNoYXBlczogW10sXHJcbiAgICAgICAgc2NvcmU6IDAsXHJcbiAgICAgICAgaXNSdW5uaW5nOiBmYWxzZSxcclxuICAgICAgICBpc0ZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgIHZhciBUYXNrUGFuZWwgPSBUYXNrQ29tcG9uZW50cy5UYXNrUGFuZWw7XHJcbiAgICAgIHZhciBUYXNrSGVhZGVyID0gVGFza0NvbXBvbmVudHMuVGFza0hlYWRlcjtcclxuICAgICAgdmFyIFRhc2tEb25lRGlzcGxheSA9IFRhc2tDb21wb25lbnRzLlRhc2tEb25lRGlzcGxheTtcclxuXHJcbiAgICAgIHZhciBzaGFwZXMgPSB0aGlzLnN0YXRlLnNoYXBlcztcclxuICAgICAgdmFyIHRhc2tJc0RvbmUgPSB0aGlzLnN0YXRlLnN0ZXAgPiBwYXJzZUludCh0aGlzLnByb3BzLnN0ZXBzKTtcclxuICAgICAgdmFyIGNvb3Jkcywgc2lkZWJhcjtcclxuXHJcbiAgICAgIGlmICghdGhpcy5zdGF0ZS5pc0ZpbmlzaGVkKSB7XHJcbiAgICAgICAgdmFyIGJvdW5kcyA9IHttYXhZOiAxMiwgbWF4WDogMTIsIG1pblk6IDAsIG1pblg6IDB9O1xyXG5cclxuICAgICAgICBjb29yZHMgPSBDb29yZHMoIHtkcmF3QXhlczpmYWxzZSwgc2hhcGVzOnNoYXBlcywgYm91bmRzOmJvdW5kcywgYXNwZWN0OjF9ICk7XHJcblxyXG4gICAgICAgIHZhciBzaGFwZVRvRmluZCA9IFwia29sbWlvXCI7XHJcblxyXG4gICAgICAgIHZhciBzdGFydEJ0biA9IHRoaXMuc3RhdGUuaXNSdW5uaW5nID8gbnVsbCA6IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcImFuaW1hdGVkIGFuaW1hdGVkLXJlcGVhdCBib3VuY2UgYnRuIGJ0bi1wcmltYXJ5IGJ0bi1ibG9ja1wiLCBvbkNsaWNrOnRoaXMuc3RhcnRHYW1lfSwgXG4gICAgICAgICAgICAgIFwiQWxvaXRhIHBlbGlcIlxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHZhciB0YXJnZXREaXNwbGF5ID0gIXRoaXMuc3RhdGUudGFyZ2V0ID8gbnVsbCA6IChcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJhbmltYXRlZCBib3VuY2UtaW5cIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uaHIobnVsbCksXG4gICAgICAgICAgICBcIktsaWthdHRhdmEga2FwcGFsZTogXCIsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgdGhpcy5zdGF0ZS50YXJnZXQubmFtZSksXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5ocihudWxsKSxcbiAgICAgICAgICAgIFwiUGlzdGVldDogXCIsIHRoaXMuc3RhdGUuc2NvcmVcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzaWRlYmFyID0gKFxyXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgICAgVGFza1BhbmVsKCB7aGVhZGVyOlwiT2hqZWV0XCJ9LCBcbiAgICAgICAgICAgICAgXCJFdHNpIGtvb3JkaW5hYXRpc3Rvc3RhIFwiLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIHNoYXBlVG9GaW5kKSwgXCIgamEga2xpa2thYSBzaXTDpFwiLFxuICAgICAgICAgICAgICBzdGFydEJ0bixcclxuICAgICAgICAgICAgICB0YXJnZXREaXNwbGF5XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKHRhc2tJc0RvbmUpIHtcclxuICAgICAgICBjb29yZHMgPSBUYXNrRG9uZURpc3BsYXkoIHtzY29yZToxMH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXHJcbiAgICAgICAgICBUYXNrSGVhZGVyKCB7bmFtZTpcIkthcHBhbGVpZGVuIHR1bm5pc3RhbWluZW5cIiwgc3RlcDp0aGlzLnN0YXRlLnN0ZXAsIHN0ZXBzOnRoaXMucHJvcHMuc3RlcHN9ICksXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02IHF1ZXN0aW9uXCJ9LCBcclxuICAgICAgICAgICAgICBjb29yZHNcclxuICAgICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNSBjb2wtc20tb2Zmc2V0LTFcIn0sIFxyXG4gICAgICAgICAgICAgIHNpZGViYXJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgICByZXR1cm4gYmFzaWNTaGFwZXNUYXNrO1xyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYXNpY1NoYXBlc1Rhc2s7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcbi8qIGdsb2JhbCBSZWFjdCwgcmVxdWlyZSwgbW9kdWxlICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZWFkIHBvc2l0aW9ucyBmcm9tIGEgY29vcmRpbmF0ZSBzeXN0ZW0uXHJcbiAqL1xyXG52YXIgU2ltcGxlQ29vcmRzVGFzayA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIFRhc2tVdGlscyA9IHJlcXVpcmUoXCIuLi91dGlscy90YXNrLXV0aWxzXCIpO1xyXG4gIHZhciBUYXNrQ29tcG9uZW50cyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL3Rhc2stY29tcG9uZW50c1wiKTtcclxuICB2YXIgQ29vcmRzID0gcmVxdWlyZShcIi4uL2NvbXBvbmVudHMvY29vcmRzXCIpO1xyXG4gIHZhciBGb3JtcyA9IHJlcXVpcmUoXCIuLi9jb21wb25lbnRzL2Zvcm1zXCIpO1xyXG5cclxuXHJcbiAgdmFyIHNpbXBsZUNvb3Jkc1Rhc2sgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdzaW1wbGVDb29yZHNUYXNrJyxcclxuICAgIHByb3BUeXBlczoge1xyXG4gICAgICBzdGVwczogUmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxyXG4gICAgICBvblRhc2tEb25lOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBSZXNldCB0aGUgcXVlc3Rpb24sIGkuZS4gZ2VuZXJhdGUgYSBuZXcgcmFuZG9tIHBvaW50LiAqL1xyXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgbmV3UG9pbnQ7XHJcbiAgICAgIGRvIHsgbmV3UG9pbnQgPSBbVGFza1V0aWxzLnJhbmRSYW5nZSgwLCAxMCksIFRhc2tVdGlscy5yYW5kUmFuZ2UoMCwgMTApXTsgfVxyXG4gICAgICB3aGlsZSAoVGFza1V0aWxzLm1hdGNoZXNTb2x1dGlvbihuZXdQb2ludCwgdGhpcy5zdGF0ZS5wb2ludCkpO1xyXG5cclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7cG9pbnQ6IG5ld1BvaW50fSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKiBDaGVjayBpZiBjb3JyZWN0LiAqL1xyXG4gICAgaGFuZGxlQW5zd2VyOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgIHZhciBpc0NvcnJlY3QgPSBUYXNrVXRpbHMubWF0Y2hlc1NvbHV0aW9uKFt4LCB5XSwgdGhpcy5zdGF0ZS5wb2ludCk7XHJcbiAgICAgIGlmIChpc0NvcnJlY3QpXHJcbiAgICAgICAgdGhpcy5oYW5kbGVDb3JyZWN0QW5zd2VyKCk7XHJcblxyXG4gICAgICByZXR1cm4gaXNDb3JyZWN0O1xyXG4gICAgfSxcclxuXHJcbiAgICBoYW5kbGVDb3JyZWN0QW5zd2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHN0ZXAgPSB0aGlzLnN0YXRlLnN0ZXA7XHJcbiAgICAgIGlmIChzdGVwID09PSBwYXJzZUludCh0aGlzLnByb3BzLnN0ZXBzKSlcclxuICAgICAgICB0aGlzLnByb3BzLm9uVGFza0RvbmUoKTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHtzdGVwOiBzdGVwICsgMX0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdGVwOiAxLFxyXG4gICAgICAgIHBvaW50OiBudWxsXHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgdmFyIFRhc2tQYW5lbCA9IFRhc2tDb21wb25lbnRzLlRhc2tQYW5lbDtcclxuICAgICAgdmFyIFRhc2tIZWFkZXIgPSBUYXNrQ29tcG9uZW50cy5UYXNrSGVhZGVyO1xyXG4gICAgICB2YXIgVGFza0RvbmVEaXNwbGF5ID0gVGFza0NvbXBvbmVudHMuVGFza0RvbmVEaXNwbGF5O1xyXG4gICAgICB2YXIgQ29vcmRzQW5zd2VyRm9ybSA9IEZvcm1zLkNvb3Jkc0Fuc3dlckZvcm07XHJcblxyXG4gICAgICB2YXIgcG9pbnQgPSB0aGlzLnN0YXRlLnBvaW50O1xyXG4gICAgICB2YXIgdGFza0lzRG9uZSA9IHRoaXMuc3RhdGUuc3RlcCA+IHBhcnNlSW50KHRoaXMucHJvcHMuc3RlcHMpO1xyXG4gICAgICB2YXIgY29vcmRzLCBzaWRlYmFyO1xyXG5cclxuICAgICAgaWYgKHBvaW50ICYmICF0YXNrSXNEb25lKSB7XHJcbiAgICAgICAgdmFyIGJvdW5kcyA9IHttYXhZOiAxMCwgbWF4WDogMTAsIG1pblk6IC0yLCBtaW5YOiAtMn07XHJcbiAgICAgICAgdmFyIHNoYXBlcyA9IFt7cG9pbnRzOiBbcG9pbnRdLCByOjAuMiwgc3Ryb2tlV2lkdGg6IDMsIHN0cm9rZTogXCIjRkY1QjI0XCIsIGZpbGw6XCIjRkQwMDAwXCJ9XTtcclxuXHJcbiAgICAgICAgY29vcmRzID0gQ29vcmRzKCB7c2hhcGVzOnNoYXBlcywgYm91bmRzOmJvdW5kcywgYXNwZWN0OjF9ICk7XHJcblxyXG4gICAgICAgIHNpZGViYXIgPSAoXHJcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxyXG4gICAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJPaGplZXRcIn0sIFxyXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKG51bGwsIFwiTWl0a8OkIG92YXQgcGlzdGVlbiB4LWphIHkta29vcmRpbmFhdGl0P1wiKVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBUYXNrUGFuZWwoIHtoZWFkZXI6XCJWYXN0YXVzXCIsIGNsYXNzTmFtZTpcInBhbmVsLXN1Y2Nlc3MgcGFuZWwtZXh0cmEtcGFkZGluZ1wifSwgXHJcbiAgICAgICAgICAgICAgQ29vcmRzQW5zd2VyRm9ybSgge3JlZjpcImZvcm1cIiwgb25BbnN3ZXI6dGhpcy5oYW5kbGVBbnN3ZXJ9IClcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAodGFza0lzRG9uZSkge1xyXG4gICAgICAgIGNvb3JkcyA9IFRhc2tEb25lRGlzcGxheSgge3Njb3JlOjEwfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcclxuICAgICAgICAgIFRhc2tIZWFkZXIoIHtuYW1lOlwiS29vcmRpbmFhdGlzdG9uIGx1a2VtaW5lblwiLCBzdGVwOnRoaXMuc3RhdGUuc3RlcCwgc3RlcHM6dGhpcy5wcm9wcy5zdGVwc30gKSxcclxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxyXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTYgcXVlc3Rpb25cIn0sIFxyXG4gICAgICAgICAgICAgIGNvb3Jkc1xyXG4gICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS01IGNvbC1zbS1vZmZzZXQtMVwifSwgXHJcbiAgICAgICAgICAgICAgc2lkZWJhclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gc2ltcGxlQ29vcmRzVGFzaztcclxufSkoKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2ltcGxlQ29vcmRzVGFzazsiLCJcInVzZSBzdHJpY3RcIjtcclxuLyogZ2xvYmFsIG1vZHVsZSAqL1xyXG5cclxuLyoqXHJcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIChtYWlubHkgbWF0aHMgcmVsYXRlZCkgZm9yIHRhc2tzLlxyXG4gKi9cclxudmFyIFRhc2tVdGlscyA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgaW4gcmFuZ2UgW21pbiwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1pbiAgIEluY2x1c2l2ZSBsb3dlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7KG51bWJlcnxbbnVtYmVyXSl9IEEgc2luZ2xlIG9yIG11bHRpcGxlIHJhbmRvbSBpbnRzLlxyXG4gICAgICovXHJcbiAgICByYW5kUmFuZ2U6IGZ1bmN0aW9uKG1pbiwgbWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmRSYW5nZShtaW4sIG1heCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByYW5kcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pbjtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBpbiByYW5nZSBbMCwgbWF4Wy5cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gIG1heCAgIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSAge251bWJlcj19IGNvdW50IElmIHNldCwgcmV0dXJuIGEgbGlzdCBvZiByYW5kb20gdmFsdWVzLlxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfFtudW1iZXJdfSBBIHNpbmdsZSBvciBtdWx0aXBsZSByYW5kb20gaW50cy5cclxuICAgICAqL1xyXG4gICAgcmFuZDogZnVuY3Rpb24obWF4LCBjb3VudCkge1xyXG4gICAgICAgIGlmIChjb3VudCAmJiBjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHJhbmRzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmFuZHMucHVzaCh0aGlzLnJhbmQobWF4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJhbmRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8qKiBSZW9yZGVycyBnaXZlbiBhcnJheSByYW5kb21seSwgZG9lc24ndCBtb2RpZnkgb3JpZ2luYWwgYXJyYXkuICovXHJcbiAgICBzaHVmZmxlOiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgY2xvbmUgPSBhcnIuc2xpY2UoKTtcclxuICAgICAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGNsb25lLmxlbmd0aDsgaSA+IDA7IGktLSkge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnJhbmQoaSk7XHJcbiAgICAgICAgICAgIHNodWZmbGVkLnB1c2goY2xvbmUuc3BsaWNlKGluZGV4LCAxKVswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2h1ZmZsZWQ7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlIGEgcmFuZ2Ugb2YgaW50ZWdlcnMuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gIG1pbiAgSW5jbHVzaXZlIGxvd2VyIGJvdW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9ICBtYXggIEV4Y2x1c2l2ZSB1cHBlciBib3VuZC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gc3RlcCBPcHRpb25hbCBpbmNyZW1lbnQgdmFsdWUsIGRlZmF1bHRzIHRvIDEuXHJcbiAgICAgKiBAcmV0dXJuIHtbbnVtYmVyXX0gICAgVGhlIHNwZWNpZmllZCByYW5nZSBvZiBudW1iZXJzIGluIGFuIGFycmF5LlxyXG4gICAgICovXHJcbiAgICByYW5nZTogZnVuY3Rpb24obWluLCBtYXgsIHN0ZXApIHtcclxuICAgICAgICBzdGVwID0gc3RlcCB8fCAxO1xyXG4gICAgICAgIHZhciByZXMgPSBbXTtcclxuICAgICAgICBpZiAoc3RlcCA+IDApIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IG1pbjsgaSA8IG1heDsgaSArPSBzdGVwKSB7XHJcbiAgICAgICAgICAgICAgICByZXMucHVzaChpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSBtaW47IGogPiBtYXg7IGogKz0gc3RlcCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnB1c2goaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrIHdoZXRoZXIgYXJyYXlzIGVxdWFsLlxyXG4gICAgICogQHBhcmFtICBhcnIxXHJcbiAgICAgKiBAcGFyYW0gIGFycjJcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGFycmF5c0VxdWFsOiBmdW5jdGlvbihhcnIxLCBhcnIyKSB7XHJcbiAgICAgICAgaWYgKGFycjEubGVuZ3RoICE9PSBhcnIyLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICByZXR1cm4gYXJyMS5ldmVyeShmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkID09PSBhcnIyW2ldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFuc2xhdGUgYW4gYXJyYXkgb2YgcG9pbnRzIGJ5IGdpdmVuIHggYW5kIHkgdmFsdWVzLlxyXG4gICAgICogQHBhcmFtICB7W1tudW1iZXJdXX0gcG9pbnRzXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICB4XHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICB5XHJcbiAgICAgKiBAcmV0dXJuIHtbW251bWJlcl1dfVxyXG4gICAgICovXHJcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHBvaW50cywgeCwgeSkge1xyXG4gICAgICAgIHJldHVybiBwb2ludHMubWFwKGZ1bmN0aW9uKHBvaW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbcG9pbnRbMF0gKyB4LCBwb2ludFsxXSArIHldO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb21wYXJlIGdpdmVuIGFuc3dlciB0byB0aGUgY29ycmVjdCBzb2x1dGlvbi4gU3VwcG9ydHMgdmFyaW91cyBkYXRhIHR5cGVzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBhbnN3ZXJcclxuICAgICAqIEBwYXJhbSBzb2x1dGlvbiBBIHN0cmluZywgbnVtYmVyLCBhcnJheSwgb2JqZWN0IG9yIFJlZ0V4cC5cclxuICAgICAqIEBwYXJhbSBlcHNpbG9uICBPcHRpb25hbCBtYXggZXJyb3IgdmFsdWUgZm9yIGZsb2F0IGNvbXBhcmlzb24sIGRlZmF1bHQgaXMgMC4wMDEuXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGNvcnJlY3QsIG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgbWF0Y2hlc1NvbHV0aW9uOiBmdW5jdGlvbihhbnN3ZXIsIHNvbHV0aW9uLCBlcHNpbG9uKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhbnN3ZXIgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLnRyaW0oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc29sdXRpb24gPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgYW5zd2VyID0gcGFyc2VGbG9hdChhbnN3ZXIpO1xyXG4gICAgICAgICAgICBpZiAoaXNOYU4oYW5zd2VyKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBlcHNpbG9uID0gZXBzaWxvbiA9PT0gdW5kZWZpbmVkID8gMC4wMDEgOiBlcHNpbG9uO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguYWJzKGFuc3dlciAtIHNvbHV0aW9uKSA8PSBlcHNpbG9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzb2x1dGlvbi50ZXN0KGFuc3dlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGlmICghYW5zd2VyIGluc3RhbmNlb2YgQXJyYXkgfHwgYW5zd2VyLmxlbmd0aCAhPT0gc29sdXRpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFuc3dlci5ldmVyeShmdW5jdGlvbihkLCBpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5tYXRjaGVzU29sdXRpb24oZCwgc29sdXRpb25baV0sIGVwc2lsb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICBpZiAoIWFuc3dlciBpbnN0YW5jZW9mIE9iamVjdClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBhbnNLZXlzID0gT2JqZWN0LmtleXMoYW5zd2VyKTtcclxuICAgICAgICAgICAgaWYgKGFuc0tleXMubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhzb2x1dGlvbikubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFuc0tleXMuZXZlcnkoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQubWF0Y2hlc1NvbHV0aW9uKGFuc3dlcltkXSwgc29sdXRpb25bZF0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhbnN3ZXIgPT09IHNvbHV0aW9uO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUYXNrVXRpbHM7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIEFwcGxpY2F0aW9uID0gcmVxdWlyZShcIi4vanMvYXBwbGljYXRpb24uanNcIik7XHJcblxyXG4gICAgUmVhY3QucmVuZGVyQ29tcG9uZW50KFxyXG4gICAgICAgIEFwcGxpY2F0aW9uKG51bGwgKSxcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcGxpY2F0aW9uXCIpXHJcbiAgICApO1xyXG59KTtcclxuLyoganNoaW50IGlnbm9yZTplbmQgKi8iXX0=
