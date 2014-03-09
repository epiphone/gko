/** @jsx React.DOM */
/* global React, module */
"use strict";


/**
 * A wrapper for Bootstrap's panel component.
 */
var TaskPanel = React.createClass({

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
 */
var TaskProgressBar = React.createClass({
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
 * Task header with task name and an optional step counter.
 */
var TaskHeader = React.createClass({

  propTypes: {
    name: React.PropTypes.string.isRequired,
    step: React.PropTypes.number,
    steps: React.PropTypes.number
  },

  render: function() {
    /* jshint ignore:start */
    var stepCounter;
    if (this.props.step && this.props.steps) {
      stepCounter = <TaskProgressBar max={this.props.steps} now={this.props.step}/>;
    }

    return (
      <div className="task-header row">
        <div className="col-sm-7">
          <h2>{this.props.name}</h2>
        </div>
        <div className="col-sm-5">
          {stepCounter}
        </div>
      </div>
    );
    /* jshint ignore:end */
  }
});


/**
 * An element that is shown after a completed task.
 */
var TaskDoneDisplay = React.createClass({

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

module.exports = {
  TaskPanel: TaskPanel,
  TaskProgressBar: TaskProgressBar,
  TaskHeader: TaskHeader,
  TaskDoneDisplay: TaskDoneDisplay
};