/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * A simple integer addition task.
 */
var AdditionTask = (function() {

  var TaskUtils = require("../utils/task-utils");
  var SingleNumberForm = require("../components/forms").SingleNumberForm;
  var MathComponents = require("../components/math-components");
  var TaskComponents = require("../components/task-components");


  var additionTask = React.createClass({

    propTypes: {
      steps: React.PropTypes.number.isRequired,
      onTaskDone: React.PropTypes.func.isRequired
    },

    /** Reset the question. */
    reset: function() {
      var a, b;
      do {
        a = TaskUtils.randRange(1, 11);
        b = TaskUtils.randRange(1, 11);
      }
      while (TaskUtils.matchesSolution([a,b], [this.state.a, this.state.b]));

      this.setState({
        a: a,
        b: b,
        answer: a + b
      });
    },

    /** Check if correct. */
    handleAnswer: function(answer) {
      var isCorrect = TaskUtils.matchesSolution(answer, this.state.answer);
      if (isCorrect)
        this.handleCorrectAnswer();

      return isCorrect;
    },

    handleCorrectAnswer: function() {
      var step = this.state.step;
      if (step === this.props.steps)
        this.props.onTaskDone();
      else
        this.reset();

      this.setState({step: step + 1});
    },

    componentDidMount: function() {
      this.reset();
    },

    getInitialState: function() {
      return {
        step: 1,
        answer: null
      };
    },

    render: function() {
      /* jshint ignore:start */
      var TaskPanel = TaskComponents.TaskPanel;
      var TaskHeader = TaskComponents.TaskHeader;
      var TaskProgressBar = TaskComponents.TaskProgressBar;
      var TaskDoneDisplay = TaskComponents.TaskDoneDisplay;
      var MathJax = MathComponents.MathJax;

      var taskIsDone = this.state.step > this.props.steps;
      var question, sidebar;

      if (!taskIsDone) {
        var questionContent = this.state.a + " + " + this.state.b + " = ?";
        question = (
          <div className="text-center">
            <h1>
              <MathJax>{questionContent}</MathJax>
            </h1>
          </div>
        );

        sidebar = (
          <div>
            <TaskPanel header="Ohjeet">
              <span>Mikä on yhteenlaskun tulos?</span>
            </TaskPanel>
            <TaskPanel header="Vastaus" className="panel-success panel-extra-padding">
              <SingleNumberForm onAnswer={this.handleAnswer} />
            </TaskPanel>
          </div>
        );
      }
      else {
        question = <TaskDoneDisplay score={10}/>;
      }

      return (
        <div>
          <TaskHeader name="Yhteenlasku">
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

  return additionTask;
})();


module.exports = AdditionTask;
