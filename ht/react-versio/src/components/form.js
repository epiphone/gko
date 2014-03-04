/** @jsx React.DOM */
/* global React, TaskUtils, TriggerAnimationMixin */
"use strict";

/**
 * Various form components for tasks.
 */


/**
 * An answer form with inputs for x and y coordinates.
 */
var CoordsAnswerForm = React.createClass({

  handleAnswer: function() {
    if (this.props.onAnswer(this.refs.x.value(), this.refs.y.value())) {
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
        <ReInput ref="x" placeholder="x"/>
        <ReInput ref="y" placeholder="y"/>
      </AnswerForm>
    );
    /* jshint ignore:end */
  }
});


/**
 * A form that disables submitting when contents are invalid.
 */
var AnswerForm = React.createClass({

  mixins: [TriggerAnimationMixin],

  handleSubmit: function(e) {
    e.preventDefault();
    if (this.state.isValid && this.state.isDirty) {
      this.props.onAnswer();
    } else {
      this.setState({showErrors: true});
    }
  },

  handleCorrectAnswer: function() {
    var btn = $(this.refs.btn.getDOMNode());
    this.animate(btn, this.props.btnCorrectAnimClass);
  },

  handleIncorrectAnswer: function() {
    var btn = $(this.refs.btn.getDOMNode());
    this.animate(btn, this.props.btnIncorrectAnimClass);
  },

  setValidity: function(isValid) {
    this.setState({isValid: isValid, isDirty: true});
  },

  /** Clear values and validation states for all child elements. */
  reset: function() {
    this.setState({
      isValid: true,
      isDirty: false,
      showErrors: false
    });
  },

  getDefaultProps: function() {
    return {
      formClass: "form-horizontal",
      btnClass: "btn btn-primary btn-block",
      btnCorrectAnimClass: "animated bounce",
      btnIncorrectAnimClass: "animated shake"
    };
  },

  getInitialState: function() {
    return {
      isValid: true,
      isDirty: false,
      showErrors: false
    };
  },

  render: function() {
    var children = this.props.children.map(function(child) {
      child.props.onValidityChange = this.setValidity;
      child.props.showError = this.state.showErrors;
      return child;
    }.bind(this));

    var btnClass = this.props.btnClass + (this.state.isValid ? "" : " disabled");

    /* jshint ignore:start */
    return (
      <form role="form" className={this.props.formClass} onSubmit={this.handleSubmit} noValidate>
        {children}
        <div className="form-group">
          <input ref="btn" type="submit" value="Vastaa" className={btnClass} />
        </div>
      </form>
    );
    /* jshint ignore:end */
  }
});


/**
 * Input with validation states.
 */
var ReInput = React.createClass({

  /** Read value, validate, notify parent element. */
  handleChange: function(e) {
    var isValid = this.validator.test(e.target.value);
    this.props.onValidityChange(isValid);
    this.setState({value: e.target.value, isValid: isValid, isDirty: true});
  },

  value: function(value) {
    if (value !== undefined)
      this.setState({value: value});
    else
      return this.state.value;
  },

  select: function() {
    this.refs.input.getDOMNode().select();
  },

  /** Clear value and reset validation states. */
  reset: function() {
    this.setState({
      value: "",
      isValid: true,
      isDirty: false
    });
  },

  setValidator: function(re) {
    this.validator = new RegExp(re);
  },

  componentDidMount: function() {
    this.setValidator(this.props.re);
  },

  componentWillReceiveProps: function(newProps) {
    this.setValidator(newProps.re);
  },

  getInitialState: function() {
    return {
      value: "",
      isValid: true,
      isDirty: false,
      type: "text"
    };
  },

  getDefaultProps: function() {
    return {
      re: /^\s*\d+\s*$/,
      showError: false,
      required: true
    };
  },

  render: function() {
    var validationState = React.addons.classSet({
      "has-success": this.state.isValid && this.state.isDirty,
      "has-warning": !this.state.isDirty && this.props.showError,
      "has-error": !this.state.isValid
    });

    /* jshint ignore:start */
    var error;
    if (this.props.showError) {
      if (!this.state.isValid) {
        error = <label className="control-label">Virheellinen syöte</label>;
      }
      else if (this.props.required && this.value().length === 0) {
        error = <label className="control-label">Täytä tämä kenttä</label>;
      }
    };

    return (
      <div className={"form-group " + validationState}>
        {error}
        <input ref="input" onChange={this.handleChange} value={this.state.value} placeholder={this.props.placeholder}
        type={this.props.type} className={"form-control " + this.props.className} />
      </div>
    );
    /* jshint ignore:end */
  }
});
