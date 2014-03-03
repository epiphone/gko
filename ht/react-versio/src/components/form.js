/** @jsx React.DOM */
/* global React, TaskUtils */
"use strict";

/**
 * Various form components for tasks.
 */

/**
 * A form that disables submitting when contents are invalid.
 */
var AnswerForm = React.createClass({

  handleChange: function(e) {
    console.log("change in", e);
  },

  handleCorrectAnswer: function() {
    this.refs.btn.addClass("animated bounce");
  },

  handleIncorrectAnswer: function() {
    console.log("incorrect @ answerForm");
  },

  render: function() {
    var formClass = this.props.formClass || "form-horizontal";
    var btnClass = this.props.btnClass || "btn btn-primary btn-block";

    /* jshint ignore:start */
    return (
      <form role="form" className={formClass}>
        {this.props.children}
        <div className="form-group">
          <input ref="btn" type="submit" value="Vastaa" className={btnClass} />
        </div>
      </form>
    );
    /* jshint ignore:end */
  }
});
