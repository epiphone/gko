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
  taskComponents.TaskPanel = React.createClass({

    propTypes: {
      className: React.PropTypes.string
    },

    render: function() {
      /* jshint ignore:start */
      var className = "panel " + (this.props.className || "panel-info" );

      return (
        <div className={className}>
          <div className="panel-heading">
            <h3 className="panel-title">{this.props.header}</h3>
          </div>
          <div className="panel-body">
            {this.props.children}
          </div>
        </div>
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
  taskComponents.TaskProgressBar = React.createClass({
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
        <div className="progress progress-striped active task-progress-bar">
          <div className="progress-bar progress-bar-success" style={leftStyle}/>
          <div className="progress-bar progress-bar-warning" style={rightStyle}/>
        </div>
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
  taskComponents.TaskCountdownTimer = React.createClass({

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
        <div className="progress progress-striped active task-progress-bar">
          <div className={"progress-bar " + barClass} style={barStyle}/>
        </div>
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
  taskComponents.TaskHeader = React.createClass({

    propTypes: {
      name: React.PropTypes.string.isRequired
    },

    render: function() {
      /* jshint ignore:start */
      return (
        <div className="task-header row">
          <div className="col-sm-7">
            <h2>{this.props.name}</h2>
          </div>
          <div className="col-sm-5">
            {this.props.children}
          </div>
        </div>
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
  taskComponents.TaskDoneDisplay = React.createClass({

    propTypes: {
      score: React.PropTypes.number
    },

    render: function() {
      /* jshint ignore:start */
      var score = this.props.score || 0;

      return (
        <div className="task-done-display animate bounce-in">
          <div className="alert alert-success">
            <strong>Tehtävä suoritettu!</strong> Pisteitä: {score}
          </div>
        </div>
      );
      /* jshint ignore:end */
    }
  });

  /**
   * A div with a method for applying CSS animation classes for a set duration.
   * @name TaskTriggerAnimDiv
   * @memberof module:TaskComponents
   * @property {string} [className] - Container div's CSS class.
   */
  taskComponents.TaskTriggerAnimDiv = React.createClass({

    mixins: [Mixins.TriggerAnimationMixin],

    triggerAnim: function(animationClass, duration) {
      var elem = $(this.getDOMNode());
      animationClass = animationClass || "";
      duration = duration || 1000;

      this.animate(elem, animationClass, duration);
    },

    render: function() {
      var className = this.props.className || "";
      return (
        /* jshint ignore:start */
        <div className={"animated " + className}>
          {this.props.children}
        </div>
        /* jshint ignore:end */
      );
    }
  });

  return taskComponents;
})();


module.exports = TaskComponents;
