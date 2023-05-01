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
        root.jsString = factory();
    }
})(this, function() {
    'use strict';

    // https://github.com/godicheol/javascript-type
    var getType = function(a) {
        return Object.prototype.toString.call(a).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    }
    var normalize = function(target, options) {
        if (!options) {
            return target;
        }
        switch(getType(target)) {
            case "string":
                if (
                    options.case === false ||
                    options.caseSensitive === false
                ) {
                    target = target.toLowerCase();
                }
                if (
                    options.width === false ||
                    options.widthSensitive === false
                ) {
                    target = target.replace(/[\uff01-\uff5e]/g, function(ch) {
                        return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
                    });
                }
                return target;
            case "array":
                var i;
                for (i = 0; i < target.length; i++) {
                    target[i] = normalize(target[i], options);
                }
                return target;
            case "regexp":
                var source = target.source,
                    flags = target.flags;
                if (
                    options.case === false ||
                    options.caseSensitive === false
                ) {
                    flags = flags.indexOf("i") > -1 ? flags : flags + "i";
                }
                if (
                    options.width === false ||
                    options.widthSensitive === false
                ) {
                    source = source.replace(/[\uff01-\uff5e]/g, function(ch) {
                        return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
                    });
                }
                return new RegExp(source, flags);
            default:
                throw new Error("Invalid argument type");
        }
    }
    var isRange = function(range) {
        return getType(range) === "array" && 
            getType(range[0]) === "number" &&
            getType(range[1]) === "number" &&
            range[0] <= range[1];
    }
    var isRangeArray = function(rangeArray) {
        if (getType(rangeArray) !== "array") {
            return false;
        }
        var i;
        for (i = 0; i < rangeArray.length; i++) {
            if (!isRange(rangeArray[i])) {
                return false;
            }
        }
        return true;
    }
    var getRangeByString = function(str, target, startIndex) {
        var index = str.indexOf(target, startIndex);
        return index > -1 ? [index, index + target.length] : undefined;
    }
    var getRangeByRegExp = function(str, target, startIndex) {
        var result = target.exec(str.substring(startIndex, str.length));
        return result ? [startIndex + result.index, startIndex + result.index + result[0].length] : undefined;
    }
    var getRangeByArray = function(str, target, startIndex) {
        return getRangeByRegExp(str, new RegExp(target.join("|")), startIndex);
    }
    var getRange = function(str, target, startIndex) {
        if (!startIndex) {
            startIndex = 0;
        }
        switch(getType(target)) {
            case "string": return getRangeByString(str, target, startIndex);
            case "array": return getRangeByArray(str, target, startIndex) ;
            case "regexp": return getRangeByRegExp(str, target, startIndex) ;
            default: throw new Error("Invalid argument type");
        }
    }
    var getRangeArray = function(str, target) {
        var result = [],
            offset = 0,
            range = getRange(str, target, offset);
        while(range && offset < str.length) {
            result.push(range);
            offset = Math.max(range[0] + 1, range[1]);
            range = getRange(str, target, offset);
        }
        return result;
    }
    var replaceString = function(str, rangeArray, replacement) {
        if (!replacement) {
            replacement = "";
        }
        var isFunc = getType(replacement) === "function",
            tmp,
            result = "",
            i,
            left,
            right = 0; // offset
        for (i = 0; i < rangeArray.length; i++) {
            left = rangeArray[i][0];
            if (isFunc) {
                tmp = replacement(str.substring(left, rangeArray[i][1]));
                if (!tmp) {
                    throw new Error("Invalid argument value");
                }
                result += str.substring(right, left) + tmp;
            } else {
                result += str.substring(right, left) + replacement;
            }
            right = rangeArray[i][1];
        }
        return result + str.substring(right, str.length);
    }
    var splitString = function(str, rangeArray) {
        var result = [],
            i,
            left,
            right = 0; // offset
        for (i = 0; i < rangeArray.length; i++) {
            left = rangeArray[i][0];
            result.push(str.substring(right, left));
            right = rangeArray[i][1];
        }
        result.push(str.substring(right, str.length));
        return result;
    }
    var compareString = function(a, b) {
        var isNumber = function(arg) {
            return typeof(arg) === "string" && !Number.isNaN(parseFloat(arg)) && Number.isFinite(parseFloat(arg));
        }
        var toArray = function(arg) {
            switch(getType(arg)) {
                case "string": return arg.split(/([0-9]+)/).filter(Boolean);
                case "array": return arg;
                default: return [arg];
            }
        }
        var getPriority = function(arg) {
            switch(getType(arg)) {
                case "boolean": return 0;
                case "number": return 1;
                case "string": return 2;
                case "null": return 3;
                case "undefined": return 4;
                default: throw new Error("Invalid argument type");
            }
        }
        var composeResult = function(n) {
            if (n > 0) {
                return 1;
            } else if (n < 0) {
                return -1;
            } else {
                return 0;
            }
        }
        var compareCharaters = function(_a, _b) {
            if (isNumber(_a) && isNumber(_b)) {
                return parseFloat(_a) - parseFloat(_b);
            }
            var i,
                len = Math.min(_a.length, _b.length),
                aChar,
                bChar;
            for (i = 0; i < len; i++) {
                aChar = _a.charAt(i);
                bChar = _b.charAt(i);
                if (aChar !== bChar) {
                    return aChar.codePointAt(0) - bChar.codePointAt(0);
                }
            }
            return _a.length - _b.length;
        }
        var compareAB = function(_a, _b, _p) {
            switch(_p) {
                case 0: return _a === _b ? 0 : (_a === true ? 1 : -1); // boolean
                case 1: return _a - _b; // number
                case 2: return compareCharaters(_a, _b); // string
                case 3: return 0; // null
                case 4: return 0; // undefined
                default: throw new Error("Invalid argument type"); // object, array, function
            }
        }
        var exec = function(_a, _b) {
            var aArr = toArray(_a),
                bArr = toArray(_b),
                i,
                len = Math.min(aArr.length, bArr.length),
                aPriority,
                bPriority,
                diff;
            for (i = 0; i < len; i++) {
                aPriority = getPriority(aArr[i]);
                bPriority = getPriority(bArr[i]);
                if (aPriority !== bPriority) {
                    return composeResult(aPriority - bPriority);
                }
                diff = compareAB(aArr[i], bArr[i], aPriority);
                if (diff !== 0) {
                    return composeResult(diff);
                }
            }
            return composeResult(aArr.length - bArr.length);
        }
        return exec(a, b);
    }
    var parseString = function(before, after) {
        var isBlank = function(a, b, c, d) {
            return a === b && c === d;
        }
        var getDupeRange = function(a, b, aOffset, bOffset) {
            var part,
                i,
                j,
                idx,
                minLength = 1, // part of b
                maxLength = Math.min(a.length, b.length - bOffset), // part of b
                minOffset = bOffset, // part of b
                maxOffset; // part of b
            for (i = maxLength; i >= minLength; i--) {
                maxOffset = b.length - i + 1;
                for (j = minOffset; j < maxOffset; j++) {
                    part = b.substring(j, j + i);
                    idx = a.indexOf(part, aOffset);
                    if (idx > -1) {
                        return [
                            [idx, idx + i], // from
                            [j, j + i] // to
                        ];
                    }
                }
            }
            return undefined;
        }
        var exec = function(a, b, aOffset, bOffset) {
            var result = [],
                aLeft = 0,
                aRight,
                bLeft = 0,
                bRight,
                range = getDupeRange(a, b, aLeft, bLeft);
            while(range) {
                aRight = range[0][0];
                bRight = range[1][0];
                if (!isBlank(aLeft, aRight, bLeft, bRight)) {
                    // recursive call
                    result = result.concat(
                        exec(
                            a.substring(aLeft, aRight),
                            b.substring(bLeft, bRight),
                            aLeft,
                            bLeft
                        )
                    );
                }
                aLeft = range[0][0];
                aRight = range[0][1];
                bLeft = range[1][0];
                bRight = range[1][1];
                if (!isBlank(aLeft, aRight, bLeft, bRight)) {
                    result.push({
                        isMatched: true,
                        from: [aOffset + aLeft, aOffset + aRight],
                        to: [bOffset + bLeft, bOffset + bRight],
                    });
                }
                aLeft = Math.max(aLeft + 1, aRight);
                bLeft = Math.max(bLeft + 1, bRight);
                range = getDupeRange(a, b, aLeft, bLeft);
            }
            aRight = a.length;
            bRight = b.length;
            if (!isBlank(aLeft, aRight, bLeft, bRight)) {
                result.push({
                    isMatched: false,
                    from: [aOffset + aLeft, aOffset + aRight],
                    to: [bOffset + bLeft, bOffset + bRight],
                });
            }
            return result;
        }
        return exec(before, after, 0, 0);
    }
    return {
        /**
         * 
         * @param {string} str 
         * @param {array} range [0, 1]
         * @returns 
         */
        get: function(str, range) {
            if (getType(str) !== "string" || !isRange(range)) {
                throw new Error("Invalid argument type");
            }
            return str.substring(range[0], range[1]);
        },
        /**
         * 
         * @param {string} str 
         * @param {string|array|RegExp} target 
         * @param {object|undefined} options {case, width}
         * @returns 
         */
        search: function(str, target, options) {
            if (getType(str) !== "string") {
                throw new Error("Invalid argument type");
            }
            str = normalize(str, options);
            target = normalize(target, options);
            return getRangeArray(str, target);
        },
        /**
         * 
         * @param {string} str 
         * @param {array} rangeArray or range
         * @param {string|function} replacement 
         * @returns 
         */
        replace: function(str, rangeArray, replacement) {
            if (getType(str) !== "string") {
                throw new Error("Invalid argument type");
            }
            if (isRange(rangeArray)) {
                rangeArray = [rangeArray];
            }
            if (!isRangeArray(rangeArray)) {
                throw new Error("Invalid argument type");
            }
            return replaceString(str, rangeArray, replacement);
        },
        /**
         * 
         * @param {string} str 
         * @param {array} rangeArray or range
         * @returns 
         */
        split: function(str, rangeArray) {
            if (getType(str) !== "string") {
                throw new Error("Invalid argument type");
            }
            if (isRange(rangeArray)) {
                rangeArray = [rangeArray];
            }
            if (!isRangeArray(rangeArray)) {
                throw new Error("Invalid argument type");
            }
            return splitString(str, rangeArray);
        },
        /**
         * 
         * @param {string} a 
         * @param {string} b 
         * @param {object|undefined} options {case, width}
         * @returns 
         */
        compare: function(a, b, options) {
            if (getType(a) !== "string" || getType(b) !== "string") {
                throw new Error("Invalid argument type");
            }
            a = normalize(a, options);
            b = normalize(b, options);
            return compareString(a, b);
        },
        /**
         * 
         * @param {string} a before
         * @param {string} b after
         * @param {object|undefined} options {case, width}
         * @returns 
         */
        parse: function(a, b, options) {
            if (getType(a) !== "string" || getType(b) !== "string") {
                throw new Error("Invalid argument type");
            }
            a = normalize(a, options);
            b = normalize(b, options);
            return parseString(a, b);
        }
    }
});