/** @jsx React.DOM */
"use strict";

/**
 * Testing the addition example task.
 *
 * Uses Jasmine (http://jasmine.github.io/2.0/introduction.html) and
 * React's test utilities (http://facebook.github.io/react/docs/test-utils.html).
 */


/* jshint ignore:start */
var AdditionTask = require("../src/js/tasks/addition-task");
var TestUtils = React.addons.TestUtils;

describe("Addition task test", function() {

    var task, form;

    function taskDone() { console.log("task done"); };

    beforeEach(function() {
        task = <AdditionTask steps={3} onTaskDone={taskDone} />
        TestUtils.renderIntoDocument(task);
    });

    it("Should initialize variables upon render", function() {
        expect(task.state.step).toEqual(1);
        expect(task.state.a + task.state.b).toEqual(task.state.answer);
    });

    it("Should not increment step when submitting an empty answer", function() {
        $(".btn-success").click()
        expect(task.state.step).toEqual(1);
    });

    it("Should increment step when submitting corrent answer", function() {
        task.handleAnswer(task.state.answer);
        expect(task.state.step).toEqual(2);
    });

    it("Should not increment step when submitting incorrect answer", function() {
       var currentStep = task.state.step;
       task.handleAnswer(1000);
       expect(task.state.step).toEqual(currentStep);
    });

    it("Should complete task and display a message after enough correct answers", function() {
       for (var i = 0; i < task.props.steps; i++) {
           task.handleAnswer(task.state.answer);
       };

       var taskDoneDisplay = TestUtils.findRenderedDOMComponentWithClass(task, "task-done-display");
       expect(taskDoneDisplay).toBeDefined();
    });
});
/* jshint ignore:end */