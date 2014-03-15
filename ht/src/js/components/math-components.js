/** @jsx React.DOM */
/* global React, module, MathJax */
"use strict";


/**
 * Components for maths tasks.
 * @module MathComponents
 */
var MathComponents = (function() {

  var mathComponents = {};

  /**
   * Render LaTex maths notation into web fonts using MathJax.
   * @name MathJax
   * @memberof module:MathComponents
   *
   * @example
   * // Render a simple formula:
   *
   * var contents = "a_1 + b_2 = c_3";
   * var formula = (
   *   <MathJax>
   *     {contents}
   *   </MathJax>
   * );
   *
   * React.renderComponent(
   *   formula,
   *   document.getElementById("target")
   * );
   */
  mathComponents.MathJax = React.createClass({
    reprocess: function() {
      var elem = this.refs.script.getDOMNode();
      MathJax.Hub.Queue(["Reprocess", MathJax.Hub, elem]);
    },

    componentDidMount: function() {
      this.reprocess();
    },

    componentDidUpdate: function() {
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
