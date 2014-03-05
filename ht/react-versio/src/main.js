/** @jsx React.DOM */
"use strict";
/* global React, SimpleCoordsTask */

function taskDone() {
    console.log("task is done");
}

function renderTask(taskName) {
    var component;
    /* jshint ignore:start */
    if (taskName === "coords") {
        component = <SimpleCoordsTask onTaskDone={taskDone} steps={5} />;
    } else if (taskName === "shapes") {
        component = <BasicShapesTask onTaskDone={taskDone} steps={3} />;
    }
    /* jshint ignore:end */

    React.renderComponent(
        component,
        document.getElementById("content")
    );
}

renderTask("shapes");
