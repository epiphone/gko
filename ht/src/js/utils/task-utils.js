"use strict";
/* global module */

/**
 * Utility functions (mainly maths related) for tasks.
 * @namespace
 */
var TaskUtils = {

    /**
     * Generate a random integer in range [min, max[.
     * @param  {number}  min       Inclusive lower bound.
     * @param  {number}  max       Exclusive upper bound.
     * @param  {number=} count     If set, return a list of random values.
     * @return {(number|number[])} A single or multiple random ints.
     */
    randRange: function(min, max, count) {
        if (count && count > 0) {
            var rands = [];
            for (var i = 0; i < count; i++) {
                rands.push(this.randRange(min, max));
            }
            return rands;
        }
        return Math.floor(Math.random() * (max - min)) + min;
    },


    /**
     * Generate a random integer in range [0, max[.
     * @param  {number}  max   Exclusive upper bound.
     * @param  {number=} count If set, return a list of random values.
     * @return {number|number[]} A single or multiple random ints.
     */
    rand: function(max, count) {
        if (count && count > 0) {
            var rands = [];
            for (var i = 0; i < count; i++) {
                rands.push(this.rand(max));
            }
            return rands;
        }
        return Math.floor(Math.random() * max);
    },


    /**
     * Reorders given array randomly, doesn't modify original array.
     * @param  {Array} arr
     * @return {Array}
     */
    shuffle: function(arr) {
        var clone = arr.slice();
        var shuffled = [];

        for (var i = clone.length; i > 0; i--) {
            var index = this.rand(i);
            shuffled.push(clone.splice(index, 1)[0]);
        }

        return shuffled;
    },


    /**
     * Generate a range of integers.
     * @param {number}  min  Inclusive lower bound.
     * @param {number}  max  Exclusive upper bound.
     * @param {number} [step=1] Increment value.
     * @return {number[]}    The specified range of numbers in an array.
     */
    range: function(min, max, step) {
        step = step || 1;
        var res = [];
        if (step > 0) {
            for (var i = min; i < max; i += step) {
                res.push(i);
            }
        } else {
            for (var j = min; j > max; j += step) {
                res.push(j);
            }
        }

        return res;
    },


    /**
     * Check whether arrays equal.
     * @param {Array} arr1
     * @param {Array} arr2
     * @return {boolean}
     */
    arraysEqual: function(arr1, arr2) {
        if (arr1.length !== arr2.length)
            return false;

        return arr1.every(function(d, i) {
            return d === arr2[i];
        });
    },


    /**
     * Translate an array of points by given x and y values.
     * @param  {Array.<module:CoordsComponents.Point>} points
     * @param  {number}     x
     * @param  {number}     y
     * @return {Array.<module:CoordsComponents.Point>}
     */
    translate: function(points, x, y) {
        return points.map(function(point) {
            return [point[0] + x, point[1] + y];
        });
    },

    /**
     * Calculate the area of a triangle.
     * @param  {Array.<module:CoordsComponents.Point>} points
     * @return {number}
     */
    triangleArea: function(points) {
        if (points.length !== 3)
            throw "invalid number of points";

        var x1 = points[1][0] - points[0][0];
        var y1 = points[1][1] - points[0][1];
        var x2 = points[2][0] - points[0][0];
        var y2 = points[2][1] - points[0][1];
        return 0.5 * Math.abs(x1*y2 - x2*y1);
    },

    /**
     * Compare given answer to the correct solution. Supports various data types.
     * @param answer   The answer value.
     * @param solution The correct solution.
     * @param {number} [epsilon=0.001]  Max error value for float comparison.
     * @return {boolean} True if correct, otherwise false.
     */
    matchesSolution: function(answer, solution, epsilon) {
        if (typeof answer === "string") {
            answer = answer.trim();
        }

        if (typeof solution === "number") {
            answer = parseFloat(answer);
            if (isNaN(answer)) return false;
            epsilon = epsilon === undefined ? 0.001 : epsilon;

            return Math.abs(answer - solution) <= epsilon;
        }

        if (solution instanceof RegExp) {
            return solution.test(answer);
        }

        var that = this;

        if (solution instanceof Array) {
            if (!answer instanceof Array || answer.length !== solution.length)
                return false;

            return answer.every(function(d, i) {
                return that.matchesSolution(d, solution[i], epsilon);
            });
        }

        if (solution instanceof Object) {
            if (!answer instanceof Object)
                return false;

            var ansKeys = Object.keys(answer);
            if (ansKeys.length !== Object.keys(solution).length)
                return false;

            return ansKeys.every(function(d) {
                return that.matchesSolution(answer[d], solution[d]);
            });
        }

        return answer === solution;
    }
};

module.exports = TaskUtils;
