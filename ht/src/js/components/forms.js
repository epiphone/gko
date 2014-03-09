/** @jsx React.DOM */
/* global React, require, module */
"use strict";


var FormComponents = require("./form-components");
var AnswerForm = FormComponents.AnswerForm;
var ReInput = FormComponents.ReInput;


/**
 * Complete answer forms for tasks.
 */
var Forms = {
  /**
   * An answer form with inputs for x and y coordinates.
   */
  CoordsAnswerForm: React.createClass({

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
      this.refs.x.reset();
      this.refs.y.reset();
      this.refs.x.select();
    },

    render: function() {
      /* jshint ignore:start */
      return (
        <AnswerForm ref="form" className="form-horizontal" onAnswer={this.handleAnswer}>
          <ReInput ref="x" type="number" placeholder="x"/>
          <ReInput ref="y" type="number" placeholder="y"/>
        </AnswerForm>
      );
      /* jshint ignore:end */
    }
  })
};


module.exports = Forms;
