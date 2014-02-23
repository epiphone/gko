"use strict";
/* global describe, beforeEach, module, inject, it, expect */


describe("MathUtils service", function() {
    var mathUtils;

    beforeEach(function() {
        module("app.services");

        inject(function(MathUtils) {
            mathUtils = MathUtils;
        });
    });

    describe("rand", function() {
        it("should return random values smaller than given max value", function() {
            for (var i = 0; i < 100; i++) {
                var max = Math.floor(Math.random() * 10) + 1;
                var val = mathUtils.rand(max);

                expect(val).toBeGreaterThan(-1);
                expect(val).toBeLessThan(max);
            }
        });

        it("should return an array of random values when count is defined", function() {
            for (var i = 0; i < 100; i++) {
                var max = Math.floor(Math.random() * 10) + 1;
                var count = Math.floor(Math.random() * 10) + 1;
                var vals = mathUtils.rand(max, count);

                expect(vals.length).toEqual(count);

                vals.forEach(function(val) {
                    expect(val).toBeLessThan(max);
                });
            }
        });
    });

    describe("randRange", function() {
        it("should return random values in specified range", function() {
            for (var i = 0; i < 100; i++) {
                var min = mathUtils.rand(10) + 1;
                var max = min + mathUtils.rand(10) + 1;
                var val = mathUtils.randRange(min, max);

                expect(val).toBeLessThan(max);
                expect(val).toBeGreaterThan(min - 1);
            }
        });
    });

    describe("range", function() {
        it("should return a specified range", function() {
            var min, max, step, r;
            for (var i = 0; i < 100; i++) {
                min = mathUtils.rand(10);
                step = mathUtils.randRange(-3, 4) || 1;

                if (step > 0) {
                    max = min + 1 + mathUtils.rand(10);
                    r = mathUtils.range(min, max, step);

                    expect(r[r.length - 1]).toBeLessThan(max);
                    expect(r[r.length - 1] + step).toBeGreaterThan(max - 1);
                } else {
                    max = min - 1 - mathUtils.rand(10);
                    r = mathUtils.range(min, max, step);

                    expect(r[r.length - 1]).toBeGreaterThan(max);
                    expect(r[r.length - 1] + step).toBeLessThan(max + 1);
                }

                expect(r[0]).toEqual(min);
            }
        });
    });
});
