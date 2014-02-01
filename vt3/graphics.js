/** @jsx React.DOM */
"use strict";

/**
 * TIEA212 GKO Viikkotehtävä 3 - Grafiikkaa
 * Aleksi Pekkala (aleksi.v.a.pekkala@student.jyu.fi)
 * 1.2.2014
 */



/* jshint ignore:start */


var BoxSpinner = React.createClass({
  updateDimensions: function() {
    this.setState({
      width: this.getDOMNode().offsetWidth,
      height: this.getDOMNode().offsetHeight
    });
  },

  componentDidMount: function() {
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions);
  },

  componentWillUnmount: function() {
    window.removeEventListener("resize", this.updateDimensions);
  },

  getInitialState: function() {
    return {width: 0, height: 0};
  },

  render: function() {
    var style = {};
    style = {fontSize: this.state.height};

    return (
      <div className="box-spinner" style={style}>{this.props.content}</div>
    );
  }
});

React.renderComponent(
  <BoxSpinner content="TIEA212" />,
  document.getElementById('container')
);

/** jshint ignore:end */