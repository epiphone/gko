/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * Draw a given shape on the coordinate system.
 */
var DrawShapesTask = (function() {

  var TaskUtils = require("../utils/task-utils");
  var TaskComponents = require("../components/task-components");
  var Coords = require("../components/coords-components").Coords;


  var drawShapesTask = React.createClass({

    propTypes: {
      steps: React.PropTypes.number.isRequired,
      onTaskDone: React.PropTypes.func.isRequired
    },

    reset: function() {
      var target = {name: "kolmio", area: 4, vertices: 3};

      this.setState({
        shapes: [],
        target: target,
        coordsDisabled: false
      });
    },

    checkAnswer: function() {
      this.setState({
        coordsDisabled: true
      });

      var shapes = this.state.shapes;

      var polygonPts = shapes.map(function(shape) {
        return shape.points[0];
      });

      shapes = [{points: polygonPts, fill: "steelblue"}];
      this.setState({shapes: shapes});

      var isCorrect = [true, false][Math.floor(Math.random() * 2)];

      setTimeout(function() {
        var polygon = this.state.shapes[0];
        polygon.fill = isCorrect ? "#1AC834" : "#8B0000";

        this.setState({
          shapes: [polygon],
        });

        setTimeout(this.reset, 1000);

      }.bind(this), 500);
    },

    handleStartBtnClick: function() {
      this.setState({isRunning: true});
      this.reset();
    },

    handleCoordsClick: function(x, y) {
      if (this.state.coordsDisabled || !this.state.isRunning)
        return;

      var target = this.state.target;
      var shapes = this.state.shapes;

      var complement = shapes.filter(function(shape) {
        var point = shape.points[0];
        return !(point[0] === x && point[1] === y);
      });

      if (complement.length < shapes.length) {
        // Remove a point
        shapes = complement;
      } else {
        // Add a point
        var newShape = {points: [[x, y]]};
        shapes.push(newShape);
      }

      this.setState({shapes: shapes});

      if (shapes.length === target.vertices) {
        this.checkAnswer();
      }
    },

    handleCorrectAnswer: function() {
      var step = this.state.step;
      if (step === this.props.steps)
        this.props.onTaskDone();
      else
        this.reset();
        this.setState({step: step + 1});
    },

    getInitialState: function() {
      return {
        step: 1,
        answer: null,
        shapes: [],
        isRunning: false
      };
    },

    render: function() {
      /* jshint ignore:start */
      var TaskPanel = TaskComponents.TaskPanel;
      var TaskHeader = TaskComponents.TaskHeader;
      var TaskProgressBar = TaskComponents.TaskProgressBar;
      var TaskDoneDisplay = TaskComponents.TaskDoneDisplay;
      var TaskTriggerAnimDiv = TaskComponents.TaskTriggerAnimDiv;

      var taskIsDone = this.state.step > this.props.steps;
      var question, sidebar;

      if (!taskIsDone) {
        var bounds = {minX: 0, minY: 0, maxX: 7, maxY: 7};
        question = (
          <Coords shapes={this.state.shapes} bounds={bounds} onClick={this.handleCoordsClick} />
        );

        if (this.state.isRunning) {
          sidebar = (
            <div>
              <TaskPanel header="Ohjeet">
                <TaskTriggerAnimDiv ref="animDiv">
                  Piirrä <strong>{this.state.target.name}</strong>, jonka pinta-ala on <strong>{this.state.target.area}</strong>
                </TaskTriggerAnimDiv>
              </TaskPanel>
            </div>
          );
        } else {
          sidebar = (
            <div>
              <TaskPanel header="Ohjeet">
                Piirrä ohjeiden mukainen tasokuvio klikkailemalla koordinaatistoa.
                <hr/>
                <button className="animated animated-repeat bounce btn btn-primary btn-block"
                onClick={this.handleStartBtnClick}>
                  Aloita tehtävä
                </button>
              </TaskPanel>
            </div>
          );
        }

      }
      else {
        question = <TaskDoneDisplay score={this.props.steps}/>;
      }

      return (
        <div>
          <TaskHeader name="Tasokuvioiden piirtäminen">
            <TaskProgressBar now={this.state.step} max={this.props.steps}/>
          </TaskHeader>
          <div className="row">
            <div className="col-sm-6 question">
              {question}
            </div>

            <div className="col-sm-5 col-sm-offset-1">
              {sidebar}
            </div>
          </div>
        </div>
      );
      /* jshint ignore:end */
    }
  });

  return drawShapesTask;
})();


module.exports = DrawShapesTask;
