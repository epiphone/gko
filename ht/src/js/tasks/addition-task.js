/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * A simple integer addition task.
 */
var AdditionTask = (function() {

  var MathComponents = require("../components/math-components.js");
  var TaskComponents = require("../components/task-components.js");


  var additionTask = React.createClass({

    handleInputChange: function(e) {
      this.setState({
        formula: e.target.value
      });
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
      var TaskDoneDisplay = TaskComponents.TaskDoneDisplay;

      var taskIsDone = this.state.step > parseInt(this.props.steps);
      var question, sidebar;

      if (!taskIsDone) {
        question = <div>Kysymys</div>;

        sidebar = (
          <div>
            <TaskPanel header="Ohjeet">
              <span>Mikä on yhteenlaskun tulos?</span>
            </TaskPanel>
            <TaskPanel header="Vastaus" className="panel-success panel-extra-padding">
              vastauslomake tähän
            </TaskPanel>
          </div>
        );
      }
      else {
        question = <TaskDoneDisplay score={10}/>;
      }

      return (
        <div>
          <TaskHeader name="Yhteenlasku" step={this.state.step} steps={this.props.steps} />
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
