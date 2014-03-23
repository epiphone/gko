/** @jsx React.DOM */
"use strict";
/* globals React, require, module */


var AdditionTask = require("./tasks/addition-task");
var SimpleCoordsTask = require("./tasks/simple-coords-task");
var BasicShapesTask = require("./tasks/basic-shapes-task");
var DrawShapesTask = require("./tasks/draw-shapes-task");

/**
 * A small application with a description of the component and a few example tasks.
 * @module Application
 */
var Application = React.createClass({

  handleListClick: function(e) {
    e.preventDefault();
    var elemName = e.target.text;
    this.setState({selectedElem: elemName});
  },

  handleTaskDone: function() {
    console.log("Task done - here's where the task connects to an external app.");
  },

  getInitialState: function() {
    return {selectedElem: "Yhteenlasku"};
  },

  render: function() {
    /* jshint ignore:start */
    var elems = {
      "Yhteenlasku": <AdditionTask onTaskDone={this.handleTaskDone} steps={5}/>,
      "Koordinaatiston lukeminen": <SimpleCoordsTask onTaskDone={this.handleTaskDone} steps={5}/>,
      "Kappaleiden tunnistaminen": <BasicShapesTask onTaskDone={this.handleTaskDone} time={20}/>,
      "Kolmioiden piirtäminen": <DrawShapesTask onTaskDone={this.handleTaskDone} steps={5}/>
    };

    var linkListElems = Object.keys(elems).map(function(elemName) {
      var className = elemName === this.state.selectedElem ? "text-muted" : "";
      return (
        <li>
          <a className={className} href="" onClick={this.handleListClick}>{elemName}</a>
        </li>
      );
    }.bind(this));

    var content = elems[this.state.selectedElem];

    return (
      <div>
        <ul className="list-inline">
          {linkListElems}
        </ul>
        <div className="task-container">
          {content}
        </div>
      </div>
    );
    /* jshint ignore:end */
  }
});


module.exports = Application;
