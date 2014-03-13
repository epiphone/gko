/** @jsx React.DOM */
/* global React, require, module, MathJax */
"use strict";


/**
 * Components for maths tasks.
 */
var MathComponents = (function() {

  var mathComponents = {};

  /**
   * Render LaTex maths notation into web fonts using MathJax.
   */
  mathComponents.MathJax = React.createClass({
    reprocess: function() {
      var elem = this.refs.script.getDOMNode();
      console.log(elem);
      MathJax.Hub.Queue(["Reprocess", MathJax.Hub, elem]);
    },

    componentDidMount: function() {
      this.reprocess();
    },

    componentWillReceiveProps: function() {
      this.reprocess();
    },

    render: function() {
      return (
        /* jshint ignore:start */
        <span>
          <script ref="script" type="math/tex">{this.props.children}</script>
        </span>
        /* jshint ignore:end */
      );
    }
    });

    return mathComponents;
})();


module.exports = MathComponents;
