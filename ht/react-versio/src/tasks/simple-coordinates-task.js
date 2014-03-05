/** @jsx React.DOM */
/* global React, TaskUtils */
"use strict";

/**
 * An example task where the aim is to read values from a
 * coordinate system.
 */
var SimpleCoordsTask = React.createClass({

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
    return {step: 1, point: null};
  },

  render: function() {
    /* jshint ignore:start */
    var point = this.state.point;
    var taskIsDone = this.state.step > parseInt(this.props.steps);
    var coords, sidebar;

    if (point && !taskIsDone) {
      var bounds = {maxY: 10, maxX: 10, minY: -2, minX: -2};
      var shapes = [{points: [point], r:0.2, strokeWidth: 3, stroke: "#FF5B24", fill:"#FD0000"}];

      coords = <Coords shapes={shapes} bounds={bounds} aspect={1} />;

      sidebar = (
        <div>
          <TaskPanel header="Kysymys">
            <span>Mitkä ovat pisteen x-ja y-koordinaatit?</span>
          </TaskPanel>
          <TaskPanel header="Vastaus" className="panel-success panel-extra-padding">
            <CoordsAnswerForm ref="form" onAnswer={this.handleAnswer} />
          </TaskPanel>
        </div>
      );
    }
    else if (taskIsDone) {
      coords = <TaskDoneDisplay score={10}/>;
    }

    return (
      <div className="task-container">
        <TaskHeader name="Koordinaatiston lukeminen" step={this.state.step} steps={this.props.steps} />
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
