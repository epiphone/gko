/** @jsx React.DOM */
/* global module */
"use strict";


/**
 * Component extensions i.e. {@link http://facebook.github.io/react/docs/reusable-components.html#mixins|mixins}.
 * @module Mixins
 */
var Mixins = (function() {

  var mixins = {};

  /**
   * Provides a setInterval function which will get cleaned up when
   * the component is destroyed.
   * @name SetIntervalMixin
   * @memberof module:Mixins
   */
  mixins.SetIntervalMixin = {
    setInterval: function() {
      this.intervals.push(setInterval.apply(null, arguments));
    },

    clearAllIntervals: function() {
      this.intervals.map(clearInterval);
      this.intervals = [];
    },

    /* Invoked when component is initialized. */
    componentWillMount: function() {
      this.intervals = [];
    },

    /* Invoked when component is destroyed. */
    componentWillUnmount: function() {
      this.clearAllIntervals();
    }
  };

  /**
   * Provides a setTimeout function which will get cleaned up when
   * the component is destroyed.
   * @name SetTimeoutMixin
   * @memberof module:Mixins
   */
  mixins.SetTimeoutMixin = {
    setTimeout: function() {
      this.timeouts.push(setTimeout.apply(null, arguments));
    },

    clearAllTimeouts: function() {
      this.timeouts.map(clearTimeout);
      this.timeouts = [];
    },

    /* Invoked when component is initialized. */
    componentWillMount: function() {
      this.timeouts = [];
    },

    /* Invoked when component is destroyed. */
    componentWillUnmount: function() {
      this.clearAllTimeouts();
    }
  };

  /**
   * Apply CSS classes for set duration - useful for singleshot animations.
   * @name TriggerAnimationMixin
   * @memberof module:Mixins
   */
  mixins.TriggerAnimationMixin = {

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

  return mixins;
})();


module.exports = Mixins;
