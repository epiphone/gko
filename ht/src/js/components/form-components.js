/** @jsx React.DOM */
/* global React, require, module */
"use strict";


var Mixins = require("./mixins");


/**
 * Various common form components.
 */
var FormComponents = (function(){

  var module = {};

  /**
   * A form that disables submitting when contents are invalid.
   */
  module.AnswerForm = React.createClass({

    propTypes: {
      onAnswer: React.PropTypes.func.isRequired,
      btnCorrectAnimClass: React.PropTypes.string,
      btnIncorrectAnimClass: React.PropTypes.string,
      formClass: React.PropTypes.string,
      btnClass: React.PropTypes.string
    },

    mixins: [Mixins.TriggerAnimationMixin],

    /** Submit answer if form is valid. */
    handleSubmit: function(e) {
      e.preventDefault();
      if (this.state.isValid) {
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
      /* jshint ignore:start */
      var children = this.props.children.map(function(child) {
        child.props.onValidityChange = this.setValidity;
        child.props.showError = this.state.showErrors;
        return child;
      }.bind(this));

      var btnClass = this.props.btnClass + (this.state.isValid ? "" : " disabled");

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
   * An <input> with validation states.
   */
  module.ReInput = React.createClass({

    propTypes: {
      re: React.PropTypes.object,
      showError: React.PropTypes.bool,
      required: React.PropTypes.bool,
      placeholder: React.PropTypes.string,
      type: React.PropTypes.string,
      className: React.PropTypes.string,
      onValidityChange: React.PropTypes.func
    },

    /** Read value, validate, notify parent element if an event is attached. */
    handleChange: function(e) {
      var isValid = this.validator.test(e.target.value);
      this.setState({value: e.target.value, isValid: isValid, isDirty: true});

      if ($.isFunction(this.props.onValidityChange))
        this.props.onValidityChange(isValid);
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
        re: /^\s*-?\d+\s*$/,
        showError: false,
        required: true,
        className: ""
      };
    },

    render: function() {
      /* jshint ignore:start */
      var validationState = React.addons.classSet({
        "has-success": this.state.isValid && this.state.isDirty,
        "has-warning": !this.state.isDirty && this.props.showError,
        "has-error": !this.state.isValid
      });

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

  /**
   * A number input with two buttons for incrementing and decrementing.
   */
  module.NumInput = React.createClass({

    propTypes: {
      step: React.PropTypes.number,
      placeholder: React.PropTypes.string,
      btnClass: React.PropTypes.string,
      onValidityChange: React.PropTypes.func
    },

    setValueAndValidity: function(value, isValid) {
      this.setState({
        value: value, isValid: isValid
      });
      if ($.isFunction(this.props.onValidityChange))
        this.props.onValidityChange(isValid);
    },

    reset: function() {
      this.setValueAndValidity(0, true);
    },

    handleDecrement: function(e) {
      e.preventDefault();
      this.setValueAndValidity(this.value() - this.props.step, true);
    },

    handleIncrement: function(e) {
      e.preventDefault();
      this.setValueAndValidity(this.value() + this.props.step, true);
    },

    /** Reset state to input value if input value is a number. */
    handleChange: function(e) {
      var val = e.target.value;
      var isValid = !isNaN(parseFloat(val));
      this.setValueAndValidity(val, isValid);
    },

    value: function() {
      return parseFloat(this.state.value) || 0;
    },

    getInitialState: function() {
      return {
        value: null,
        isValid: true
      };
    },

    getDefaultProps: function() {
      return {
        step: 1
      };
    },

    render: function() {
      /* jshint ignore:start */
      var ReInput = module.ReInput;
      var btnClass = this.props.btnClass || "btn btn-lg btn-primary";
      var validationState = this.state.isValid ? "has-success" : "has-error";

      return (
        <div className={"form-group " + validationState}>
          <div className="row">
            <div className="col-sm-3 col-xs-3">
              <button className={btnClass + " pull-right"} onClick={this.handleDecrement}>
                <span className="glyphicon glyphicon-chevron-left"/>
              </button>
            </div>
            <div className="col-sm-6 col-xs-6">
              <input type="number" value={this.state.value} onChange={this.handleChange}
              className="form-control text-center" placeholder={this.props.placeholder}/>
            </div>
            <div className="col-sm-3 col-xs-3">
              <button className={btnClass + " pull-left"} onClick={this.handleIncrement}>
                <span className="glyphicon glyphicon-chevron-right"/>
              </button>
            </div>
          </div>
        </div>
      );
      /* jshint ignore:end */
    }
  });

  return module;
})();


module.exports = FormComponents;