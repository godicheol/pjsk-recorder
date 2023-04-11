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
        root.munjayeol = factory();
    }
})(this, function() {
    'use strict';

    var isBoolean = function(bool) {
        return typeof(bool) === "boolean";
    }
    var isNumber = function(num) {
        return typeof(num) === "number" && !isNaN(num);
    }
    var isString = function(str) {
        return typeof(str) === "string";
    }
    var isNumberString = function(str) {
        return typeof(str) === "string" && !isNaN(parseFloat(str)) && isFinite(str);
    }
    // var isObject = function(obj) {
    //     return typeof(obj) === "object" && obj !== null;
    // }
    var isNull = function(arg) {
        return typeof(arg) === "object" && arg === null;
    }
    var isArray = function(arr) {
        return typeof(arr) === "object" && Object.prototype.toString.call(arr) === '[object Array]';
    }
    var isRegExp = function(reg) {
        return reg instanceof RegExp;
    }
    // var isFunction = function(func) {
    //     return typeof(func) === "function";
    // }
    var isUndefined = function(arg) {
        return typeof(arg) === "undefined";
    }
    var isRange = function(range) {
        return typeof(range) === "object" && 
            Object.prototype.toString.call(range) === '[object Array]' &&
            range.length === 2 &&
            typeof(range[0]) === "number" &&
            !isNaN(range[0]) &&
            typeof(range[1]) === "number" &&
            !isNaN(range[1]) &&
            range[0] <= range[1];
    }
    var isRangeArray = function(rangeArray) {
        var i, left = 0, middle, right;
        if (!isArray(rangeArray)) {
            return false;
        }
        for (i = 0; i < rangeArray.length; i++) {
            if (!isRange(rangeArray[i])) {
                return false;
            }
            middle = rangeArray[i][0];
            right = rangeArray[i][1];
            if (middle > right) {
                return false;
            }
            if (middle < left) {
                return false;
            }
            left = right;
        }
        return true;
    }
    var normalizeSource = function(str, options) {
        if (!isString(str)) {
            throw new Error("Invalid argument type");
        }
        if (!options) {
            return str;
        }
        if (options.case) {
            str = str.toLowerCase();
        }
        if (options.width) {
            str = str.replace(/[\uff01-\uff5e]/g, function(ch) {
                return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
            });
        }
        return str;
    }
    var normalizeTarget = function(target, options) {
        if (!options) {
            return target;
        }
        if (isString(target)) {
            if (options.case) {
                target = target.toLowerCase();
            }
            if (options.width) {
                target = target.replace(/[\uff01-\uff5e]/g, function(ch) {
                    return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
                });
            }
        } else if (isArray(target)) {
            target = target.map(function(item) {
                if (!isString(item)) {
                    throw new Error("Invalid argument type");
                }
                return normalizeTarget(item, options);
            });
        } else if (isRegExp(target)) {
            var source = target.source,
                flags = target.flags;
            if (options.case) {
                flags = flags.indexOf("i") > -1 ? flags : flags + "i";
            }
            if (options.width) {
                source = source.replace(/[\uff01-\uff5e]/g, function(ch) {
                    return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
                });
            }
            target = new RegExp(source, flags);
        } else {
            throw new Error("Invalid argument type");
        }
        return target;
    }
    var sortRangeArray = function(rangeArray) {
        return rangeArray.sort(function(a, b) {
            return a[0] - b[0];
        });
    }
    var getRangeOfTarget = function(str, target, startIndex) {
        var res, idx;
        if (isString(target)) {
            idx = str.indexOf(target, startIndex);
            return idx > -1 ? [idx, idx + target.length] : undefined;
        } else if (isRegExp(target)) {
            res = target.exec(str.substring(startIndex, str.length));
            return res ? [startIndex + res.index, startIndex + res.index + res[0].length] : undefined;
        } else if (isArray(target)) {
            res = new RegExp(target.join("|")).exec(str.substring(startIndex, str.length));
            return res ? [startIndex + res.index, startIndex + res.index + res[0].length] : undefined;
        } else {
            throw new Error("Invalid argument type");
        }
    }
    var getRangeArrayOfTarget = function(str, target) {
        var result = [],
            offset = 0,
            range;
        range = getRangeOfTarget(str, target, offset);
        while(range && offset < str.length) {
            result.push(range);
            offset = Math.max(range[0] + 1, range[1]);
            range = getRangeOfTarget(str, target, offset);
        }
        return result;
    }
    var replaceByRangeArray = function(str, rangeArray, replacement) {
        if (!replacement) {
            replacement = "";
        }
        var result = "",
            i,
            left,
            right = 0; // offset
        for (i = 0; i < rangeArray.length; i++) {
            left = rangeArray[i][0];
            result += str.substring(right, left) + replacement;
            right = rangeArray[i][1];
        }
        return result + str.substring(right, str.length);
    }
    var splitByRangeArray = function(str, rangeArray) {
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
        var toArray = function(arg) {
            if (isBoolean(arg) || isNumber(arg) || isNull(arg) || isUndefined(arg)) {
                return [arg];
            }
            if (isString(arg)) {
                return arg.split(/([0-9]+)/).filter(Boolean);
            }
            throw new Error("Invalid argument type");
        }
        var getPriority = function(arg) {
            if (isBoolean(arg)) {
                return 0;
            }
            if (isNumber(arg)) {
                return 1;
            }
            if (isString(arg)) {
                return 2;
            }
            if (isNull(arg)) {
                return 3;
            }
            if (isUndefined(arg)) {
                return 4;
            }
            throw new Error("Invalid argument type");
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
            if (isNumberString(_a) && isNumberString(_b)) {
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
        var compareAB = function(_p, _a, _b) {
            switch(_p) {
                case 0: return _a === _b ? 0 : (_a === true ? 1 : -1); // boolean
                case 1: return _a - _b; // number
                case 2: return compareCharaters(_a, _b); // string
                case 3: return 0; // null
                case 4: return 0; // undefined
                default: throw new Error("Invalid argument type");
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
                diff = compareAB(aPriority, aArr[i], bArr[i]);
                if (diff !== 0) {
                    return composeResult(diff);
                }
            }
            return composeResult(aArr.length - bArr.length);
        }
        return exec(a, b);
    }
    var getDupeRangeOfTarget = function(a, b, aOffset, bOffset) {
        var part,
            i,
            j,
            idx,
            minLen = 1,
            maxLen = Math.min(a.length, b.length - bOffset),
            minOff = bOffset,
            maxOff;
        for (i = maxLen; i >= minLen; i--) {
            maxOff = b.length - i + 1;
            for (j = minOff; j < maxOff; j++) {
                part = b.substring(j, j + i);
                idx = a.indexOf(part, aOffset);
                if (idx > -1) {
                    return [
                        [idx, idx + i], // a
                        [j, j + i] // b
                    ];
                }
            }
        }
        return undefined;
    }
    var getDupeRangeArrayOfTarget = function(a, b) {
        var result = [],
            aOffset = 0,
            bOffset = 0,
            range = getDupeRangeOfTarget(a, b, aOffset, bOffset);
        while(range) {
            result.push(range);
            aOffset = Math.max(range[0][0] + 1, range[0][1]);
            bOffset = Math.max(range[1][0] + 1, range[1][1]);
            range = getDupeRangeOfTarget(a, b, aOffset, bOffset);
        }
        return result;
    }
    var parseString = function(a, b, aOffset, bOffset) {
        if (!aOffset) {
            aOffset = 0;
        }
        if (!bOffset) {
            bOffset = 0;
        }
        var arr = getDupeRangeArrayOfTarget(a, b),
            result = [],
            i,
            aRange,
            bRange,
            aLeft = 0,
            aRight,
            bLeft = 0,
            bRight,
            aStr,
            bStr,
            tmp;
        for (i = 0; i < arr.length; i++) {
            aRange = arr[i][0];
            bRange = arr[i][1];
            aRight = aRange[0];
            bRight = bRange[0];
            // unmatched
            if (aRight - aLeft !== 0 || bRight - bLeft !== 0) {
                aStr = a.substring(aLeft, aRight);
                bStr = b.substring(bLeft, bRight);
                tmp = parseString(aStr, bStr, aLeft, bLeft);
                result = result.concat(tmp);
            }
            aLeft = aRange[0];
            aRight = aRange[1];
            bLeft = bRange[0];
            bRight = bRange[1];
            // matched
            result.push([
                true,
                [aOffset + aLeft, aOffset + aRight, a.substring(aLeft, aRight)],
                [bOffset + bLeft, bOffset + bRight, b.substring(bLeft, bRight)],
            ]);
            aLeft = aRight;
            bLeft = bRight;
        }
        aRight = a.length;
        bRight = b.length;
        // unmatched
        if (aRight - aLeft !== 0 || bRight - bLeft !== 0) {
            result.push([
                false,
                [aOffset + aLeft, aOffset + aRight, a.substring(aLeft, aRight)],
                [bOffset + bLeft, bOffset + bRight, b.substring(bLeft, bRight)],
            ]);
        }
        return result;
    }
    return {
        /**
         * 
         * @param {string} str 
         * @param {string|array|RegExp} target 
         * @param {object|undefined} options {case, width, space}
         * @returns 
         */
        search: function(str, target, options) {
            str = normalizeSource(str, options);
            target = normalizeTarget(target, options);
            return getRangeArrayOfTarget(str, target);
        },
        /**
         * 
         * @param {string} str 
         * @param {array} rangeArray [[0,1],[1,2]...]
         * @param {string} replacement 
         * @returns 
         */
        replace: function(str, rangeArray, replacement) {
            rangeArray = sortRangeArray(rangeArray);
            if (!isRangeArray(rangeArray)) {
                throw new Error("Invalid argument");
            }
            return replaceByRangeArray(str, rangeArray, replacement);
        },
        /**
         * 
         * @param {string} str 
         * @param {array} rangeArray [[0,1],[1,2]...]
         * @returns 
         */
        split: function(str, rangeArray) {
            rangeArray = sortRangeArray(rangeArray);
            if (!isRangeArray(rangeArray)) {
                throw new Error("Invalid argument");
            }
            return splitByRangeArray(str, rangeArray);
        },
        /**
         * 
         * @param {string|boolean|number|null|undefined} a 
         * @param {string|boolean|number|null|undefined} b 
         * @returns 
         */
        compare: function(a, b) {
            return compareString(a, b);
        },
        /**
         * 
         * @param {string} a 
         * @param {string} b 
         * @returns
         */
        parse: function(a, b) {
            return parseString(a, b);
        },
    };
});