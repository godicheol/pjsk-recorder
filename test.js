// Universal module definition
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser window.moduleName
        root.run = factory();
    }
})(this, function() {
    'use strict';
    /**
     * 
     * @param {function} func 
     * @returns 
     */
    function run(func) {
        var t = function(arg) {
            if (typeof(arg) === "object") {
                if (Object.prototype.toString.call(arg) === '[object Array]') {
                    return "array";
                } else if (arg === null) {
                    return "null";
                } else {
                    return "object";
                }
            } else if (typeof(arg) === "number") {
                if (isNaN(arg)) {
                    return "NaN";
                } else {
                    return "number";
                }
            } else {
                return typeof(arg);
            }
        }
        var result;
        var args = Array.prototype.slice.call(arguments, [1]);
        var name = func.name+"("+args.map(t).join(",")+")";
        console.time(name);
        result = func(...args);
        console.timeEnd(name);
        return result;
    }
    return run;
});