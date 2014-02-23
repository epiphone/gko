"use strict";

angular.module("app.services")

/**
 * A service for various maths functions.
 */
.factory("MathUtils", function() {
    var MathUtils = {};

    /**
     * Generate a random integer in range [min, max[.
     * @param  {number}  min   Inclusive lower bound.
     * @param  {number}  max   Exclusive upper bound.
     * @param  {number=} count If set, return a list of random values.
     * @return {(number|[number])} A single or multiple random ints.
     */
    MathUtils.randRange = function(min, max, count) {
        if (count && count > 0) {
            var rands = [];
            for (var i = 0; i < count; i++) {
                rands.push(this.randRange(min, max));
            }
            return rands;
        }
        return Math.floor(Math.random() * (max - min)) + min;
    };


    /**
     * Generate a random integer in range [0, count[.
     * @param  {number}  max   Exclusive upper bound.
     * @param  {number=} count If set, return a list of random values.
     * @return {(number|[number])} A single or multiple random ints.
     */
    MathUtils.rand = function(max, count) {
        if (count && count > 0) {
            var rands = [];
            for (var i = 0; i < count; i++) {
                rands.push(this.rand(max));
            }
            return rands;
        }
        return Math.floor(Math.random() * max);
    };


    /**
     * Generate a range of integers.
     * @param {number}  min  Inclusive lower bound.
     * @param {number}  max  Exclusive upper bound.
     * @param {number=} step Optional increment value, defaults to 1.
     * @return {[number]}    The specified range of numbers in an array.
     */
    MathUtils.range = function(min, max, step) {
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
    };

    return MathUtils;
});
