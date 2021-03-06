/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * Complete answer forms for tasks. Forms consist of {@link module:FormComponents|form components}.
 * @module Forms
 */
var Forms = (function() {

  var FormComponents = require("./form-components");
  var AnswerForm = FormComponents.AnswerForm;
  var NumInput = FormComponents.NumInput;

  var forms = {};

  /**
   * Form with a single {@link module:FormComponents.NumInput|NumInput}.
   * @name SingleNumberForm
   * @memberof module:Forms
   * @property {module:Forms.singleNumberFormOnAnswer} onAnswer - Form answer event handler.
   */
  forms.SingleNumberForm = React.createClass({

    /**
     * {@link module:Forms.SingleNumberForm|SingleNumberForm}'s answer event handler.
     * @callback singleNumberFormOnAnswer
     * @param {number} value - The answer value.
     * @returns {boolean} Was the answer correct.
     * @memberof module:Forms
     */

    propTypes: {
      onAnswer: React.PropTypes.func.isRequired
    },

    handleAnswer: function() {
      var isCorrect = this.props.onAnswer(this.refs.answer.value());
      if (isCorrect) {
        this.refs.form.handleCorrectAnswer();
        this.reset();
      } else {
        this.refs.form.handleIncorrectAnswer();
      }
    },

    reset: function() {
      this.refs.form.reset();
      this.refs.answer.reset();
    },

    render: function() {
      return (
        /* jshint ignore:start */
        <AnswerForm ref="form" className="form-horizontal" onAnswer={this.handleAnswer}>
          <NumInput ref="answer" placeholder="Vastaa tähän"/>
        </AnswerForm>
        /* jshint ignore:end */
      );
    }
  });

  /**
   * Form with two {@link module:FormComponents.NumInput|NumInputs} for x and y coordinates.
   * @name CoordsAnswerForm
   * @memberof module:Forms
   * @property {module:Forms.coordsAnswerFormOnAnswer} onAnswer - Answer event handler.
   */
  forms.CoordsAnswerForm = React.createClass({

    /**
     * {@link module:Forms.CoordsAnswerForm|CoordsAnswerForm}'s answer event handler.
     * @callback coordsAnswerFormOnAnswer
     * @param {number} x
     * @param {number} y
     * @returns {boolean} Was the answer correct.
     * @memberof module:Forms
     */

    propTypes: {
      onAnswer: React.PropTypes.func.isRequired
    },

    handleAnswer: function() {
      var isCorrect = this.props.onAnswer(this.refs.x.value(), this.refs.y.value());
      if (isCorrect) {
        this.refs.form.handleCorrectAnswer();
        this.reset();
      } else {
        this.refs.form.handleIncorrectAnswer();
      }
    },

    reset: function() {
      this.refs.form.reset();
    },

    render: function() {
      /* jshint ignore:start */
      return (
        <AnswerForm ref="form" className="form-horizontal" onAnswer={this.handleAnswer}>
          <NumInput ref="x" placeholder="x"/>
          <NumInput ref="y" placeholder="y"/>
        </AnswerForm>
      );
      /* jshint ignore:end */
    }
  });

  return forms;
})();


module.exports = Forms;
