/** @jsx React.DOM */
/* global React, require, module */
"use strict";


/**
 * Complete answer forms for tasks.
 */
var Forms = (function() {

  var FormComponents = require("./form-components");
  var AnswerForm = FormComponents.AnswerForm;
  var NumInput = FormComponents.NumInput;

  var forms = {};

  /**
   * Form with a single number input.
   */
  forms.SingleNumberForm = React.createClass({

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
   * Form with two inputs for x and y coordinates.
   */
  forms.CoordsAnswerForm = React.createClass({

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
