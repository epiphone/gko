/** @jsx React.DOM */
/* global React, TaskUtils */
"use strict";

/**
 * An example task where the aim is to read values from a
 * coordinate system.
 */
var SimpleCoordsTask = React.createClass({

  reset: function() {
    this.refs.x.getDOMNode().value = "";
    this.refs.y.getDOMNode().value = "";

    var newPoint;
    while (!TaskUtils.matchesSolution(newPoint, this.state.point)) {
      newPoint = {
        x: TaskUtils.randRange(0, 11),
        y: TaskUtils.randRange(0, 11)
      };
    }

    var x = TaskUtils.randRange(0, 11);
    var y = TaskUtils.randRange(0, 11);
    this.setState({point: [x, y]});
  },

  handleAnswer: function(e) {
    e.preventDefault();
    var x = this.refs.x.getDOMNode().value;
    var y = this.refs.y.getDOMNode().value;

    if (TaskUtils.matchesSolution([x, y], this.state.point))
      this.handleCorrectAnswer();
    else
      this.handleIncorrectAnswer();

    this.refs.x.getDOMNode().select();
  },

  handleCorrectAnswer: function() {
    this.refs.form.handleCorrectAnswer();
    this.reset();
    this.setState({step: this.state.step + 1});
  },

  handleIncorrectAnswer: function() {
    this.refs.form.handleIncorrectAnswer();
    console.log("väärin");
  },

  componentDidMount: function() {
    this.reset();
  },

  getInitialState: function() {
    return {step: 1, point: null};
  },

  getDefaultProps: function() {
    return {steps: 5};
  },

  render: function() {
    var p = this.state.point;
    var task;

    /* jshint ignore:start */
    if (p) {
      var bounds = {maxY: 10, maxX: 10, minY: -2, minX: -2};
      var shapes = [{points: [p]}];
      task = <Coords shapes={shapes} bounds={bounds} aspect="1" />;
    }

    var stepDisplay = (!this.props.steps || !this.state.step) ? null : (
      <span className="small">{this.state.step}/{this.props.steps}</span>
    );

    return (
      <div className="task-container">
        <h2>Mitkä ovat pisteen x-ja y-koordinaatit? {stepDisplay}</h2>
        <div className="row">

          <div className="col-sm-6 question">
            {task}
          </div>

          <div className="col-sm-4 col-sm-offset-1 answer">
            <h3>Vastaus</h3>
            <AnswerForm ref="form" className="form-horizontal" onSubmit={this.handleAnswer}>
              <div className="form-group">
                <input ref="x" type="number" placeholder="x" className="form-control col-sm-2" />
              </div>

              <div className="form-group">
                <input ref="y" type="number" placeholder="y" className="form-control col-sm-2" />
              </div>
            </AnswerForm>
          </div>

        </div>
      </div>
    );
    /* jshint ignore:end */
  }
});
