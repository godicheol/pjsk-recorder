// Universal module definition
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser
        // window.myModule
        root.myModule = factory();
    }
})(this, function() {
    'use strict';

    var sum = function(a, b) {
        return a + b;
    }

    return {
        sum: sum
    }
});