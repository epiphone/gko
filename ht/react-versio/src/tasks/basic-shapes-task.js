/** @jsx React.DOM */
/* global React, TaskUtils */
"use strict";

/**
 * Click the appropriate shape in a coordinate system.
 */
var BasicShapesTask = React.createClass({

  propTypes: {
    steps: React.PropTypes.number.isRequired,
    onTaskDone: React.PropTypes.func.isRequired
  },

  startGame: function() {
    this.setState({isRunning: true});
    this.reset();
  },

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

  getInitialState: function() {
    return {
      shapes: [],
      step: 1,
      isRunning: false
    };
  },

  render: function() {
    /* jshint ignore:start */
    var shapes = this.state.shapes;
    var taskIsDone = this.state.step > parseInt(this.props.steps);
    var coords, sidebar;

    /* jshint ignore:start */
    if (!taskIsDone) {
      var bounds = {maxY: 10, maxX: 10, minY: 0, minX: 0};

      coords = <Coords drawAxes={false} shapes={shapes} bounds={bounds} aspect={1} />;

      var shapeToFind = "kolmio";

      var startBtn = this.state.isRunning ? null : (
        <div>
          <hr/>
          <button className="animated animated-repeat bounce btn btn-primary btn-block" onClick={this.startGame}>
            Aloita peli
          </button>
        </div>
      );

      sidebar = (
        <div>
          <TaskPanel header="Ohjeet">
            Etsi koordinaatistosta <strong>{shapeToFind}</strong> ja klikkaa sitä
            {startBtn}
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
