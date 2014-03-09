/** @jsx React.DOM */
"use strict";
/* globals React, require, module */


var SimpleCoordsTask = require("./tasks/simple-coords-task");
var BasicShapesTask = require("./tasks/basic-shapes-task");


/**
 * Container and links for example tasks.
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
    return {selectedTask: "Koordinaatiston lukeminen"};
  },

  render: function() {
    /* jshint ignore:start */
    var tasks = {
      "Koordinaatiston lukeminen": (<SimpleCoordsTask onTaskDone={this.handleTaskDone} steps={5}/>),
      "Kappaleiden tunnistaminen": (<BasicShapesTask onTaskDone={this.handleTaskDone}/>)
    };

    var taskListElems = Object.keys(tasks).map(function(taskName) {
      return (
        <li>
          <a href="" onClick={this.handleListClick}>{taskName}</a>
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