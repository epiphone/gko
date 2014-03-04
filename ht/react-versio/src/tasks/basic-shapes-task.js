/** @jsx React.DOM */
/* global React, TaskUtils */
"use strict";

/**
 * Click the appropriate shape in a coordinate system.
 */
var BasicShapesTask = React.createClass({

  /** Reset the question, i.e. generate new shapes. */
  reset: function() {
    var newShapes = [{onClick: this.handleShapeClick, key: 1, points:[[1,1], [4,1], [2,2]]}];
    this.setState({shapes: newShapes, correctKey: 1});
  },

  /** Check if correct shape and proceed. */
  handleShapeClick: function(shape) {
    console.log("clicked shape with key", shape.key);
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
    return {step: 1, shapes: null};
  },

  getDefaultProps: function() {
    return {
      steps: 5,
      onTaskDone: function() { throw "onTaskDone attribute not specified"; }
    };
  },

  render: function() {
    /* jshint ignore:start */
    var shapes = this.state.shapes;
    var taskIsDone = this.state.step > parseInt(this.props.steps);
    var coords, sidebar;

    /* jshint ignore:start */
    if (shapes && !taskIsDone) {
      var bounds = {maxY: 10, maxX: 10, minY: 0, minX: 0};

      coords = <Coords drawAxes={false} shapes={shapes} bounds={bounds} aspect="1" />;

      var shapeToFind = "kolmio";

      sidebar = (
        <div>
          <TaskPanel header="Kysymys">
            Etsi koordinaatistosta <strong>{shapeToFind}</strong> ja klikkaa sitä
          </TaskPanel>
        </div>
      );
    }
    else if (taskIsDone) {
      coords = <TaskDoneDisplay score={10}/>;
    }

    return (
      <div className="task-container">
        <TaskHeader name="Kappaleiden tunnistaminen" step={this.state.step} steps={this.props.steps} />
        <div className="row">
          <div className="col-sm-6 question">
            {coords}
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
