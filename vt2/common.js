/** @jsx React.DOM */
"use strict";

/**
 * Shared components.
 */


/* jshint ignore:start */

/**
 * A input field with validation.
 *
 * Properties:
 * - validator: A function (string -> bool), which checks input validity.
 * - errorMsg: An optional error message that is displayed when invalid.
 * - invalidClass: An optional CSS class that is toggled when invalid.
 *
 * Usage:
 * <ValidatorInput validator={someFunction} errorMsg="Virheellinen syöte!" invalidClass="invalid" />
 */
var ValidatorInput = React.createClass({

  getValue: function() {
    return this.state.value;
  },

  handleChange: function(event) {
    var value = this.refs.input.getDOMNode().value;
    var validationResult = this.props.validator(value);
    var isValid = !validationResult ? validationResult === 0 : true;

    this.setState({value: value, isValid: isValid});
  },

  getInitialState: function() {
    return {value: "", isValid: true};
  },

  reset: function() {
    this.setState({value: "", isValid: true});
  },

  render: function() {
    var errorMsg = null;
    var className = null;
    if (!this.state.isValid) {
      if (this.props.errorMsg) {
        errorMsg = <span className="error-message">{this.props.errorMsg}</span>
      }
      if (this.props.invalidClass) {
        className = this.props.invalidClass;
      }
    }

    var input = this.transferPropsTo(
      <input type="text" ref="input" value={this.state.value}
      onChange={this.handleChange} className={className}/>
    );

    return (
      <span>
        {input}
        <br/>
        {errorMsg}
      </span>
    );
  }
});

/* jshint ignore:end */


/**
 * A mixin that provides a setInterval function which will get
 * cleaned up when the component is destroyed.
 *
 * Adapted from http://facebook.github.io/react/docs/reusable-components
 */
var SetIntervalMixin = {
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },

  clearAllIntervals: function() {
    this.intervals.map(clearInterval);
    this.intervals = [];
  },

  /** Invoked when component is initialized. */
  componentWillMount: function() {
    this.intervals = [];
  },

  /** Invoked when component is destroyed. */
  componentWillUnmount: function() {
    this.clearAllIntervals();
  }
};