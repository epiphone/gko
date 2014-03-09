/** @jsx React.DOM */
"use strict";

/* jshint ignore:start */
$(function() {
    var Application = require("./js/application.js");

    React.renderComponent(
        <Application />,
        document.getElementById("application")
    );
});
/* jshint ignore:end */