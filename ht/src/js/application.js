/** @jsx React.DOM */
"use strict";
/* globals React, require, module */


var AdditionTask = require("./tasks/addition-task");
var SimpleCoordsTask = require("./tasks/simple-coords-task");
var BasicShapesTask = require("./tasks/basic-shapes-task");


/**
 * A small application with a few example tasks.
 * @module Application
 */
var Application = React.createClass({

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
      "Yhteenlasku": <AdditionTask onTaskDone={this.handleTaskDone} steps={5}/>,
      "Koordinaatiston lukeminen": <SimpleCoordsTask onTaskDone={this.handleTaskDone} steps={5}/>,
      "Kappaleiden tunnistaminen": <BasicShapesTask onTaskDone={this.handleTaskDone} time={20}/>
    };

    var taskListElems = Object.keys(tasks).map(function(taskName) {
      var className = taskName === this.state.selectedTask ? "text-muted" : "";
      return (
        <li>
          <a className={className} href="" onClick={this.handleListClick}>{taskName}</a>
        </li>
      );
    }.bind(this));

    var task = tasks[this.state.selectedTask];

    return (
      <div>
        <ul className="list-inline">
          {taskListElems}
        </ul>

        <div className="task-container">
          {task}
        </div>
      </div>
    );
    /* jshint ignore:end */
  }
});

module.exports = Application;
