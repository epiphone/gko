/** @jsx React.DOM */
/* global module */
"use strict";

/**
 * Component extensions i.e. mixins.
 */


/**
 * Render LaTex maths notation into web fonts using MathJax.
 * TODO
 */
// var MathJax = React.createClass({
//   reprocess: function() {
//     var elem = this.refs.script.getDOMNode();
//     console.log(elem);
//     MathJax.Hub.Queue(["Reprocess", MathJax.Hub, elem]);
//   },

//   componentDidMount: function() {
//     this.reprocess();
//   },

//   componentWillReceiveProps: function() {
//     this.reprocess();
//   },

//   render: function() {
//     return (
//       /* jshint ignore:start */
//       <span>
//         <script ref="script" type="math/tex">{this.props.children}</script>
//       </span>
//       /* jshint ignore:end */
//     );
//   }
// });

/**
 * Provides a setInterval function which will get cleaned up when
 * the component is destroyed.
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

/**
 * Apply CSS classes for set duration, useful for singleshot animations.
 */
var TriggerAnimationMixin = {
  animate: function(elem, className, duration) {
    duration = duration || 1000;
    if (!this.timeout && this.timeout !== 0) {
      elem.addClass(className);
      this.timeout = setTimeout(function() {
        elem.removeClass(className);
        this.timeout = null;
      }.bind(this), duration);
    }
  },

  componentWillUnmount: function() {
    clearTimeout(this.timeout);
  }
};

module.exports = {
  SetIntervalMixin: SetIntervalMixin,
  TriggerAnimationMixin: TriggerAnimationMixin
};
