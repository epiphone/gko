/** @jsx React.DOM */
/* global module */
"use strict";


/**
 * Component extensions i.e. mixins.
 */
var Mixins = (function() {

  var mixins = {};

  /**
   * Provides a setInterval function which will get cleaned up when
   * the component is destroyed.
   */
  mixins.SetIntervalMixin = {
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
   * Apply CSS classes for set duration - useful for singleshot animations.
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
