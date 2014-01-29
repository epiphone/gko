"use strict";

var Utils = {};

/**
 * Tries to parse an integer value from input string.
 * @param  {string}  input String to parse.
 * @param  {number=} def   An optional default value.
 * @return {?number}       An integer value or null, if input string is empty.
 */
Utils.parseInt = function(input, def) {
    def = def || 0;
    if (input.length === 0) {
        return null;
    }
    return parseInt(input.trim(), 10) || def;
};