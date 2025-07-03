var isPlainObject = function(obj) {
    var proto = Object.getPrototypeOf( Object(obj) );
    return proto === null || proto === Object.prototype; //todo tc 4.0
};


var deepCopy = function(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) { return obj; }

    // Handle Array
    if (Array.isArray(obj)) {
        copy = [];
        for(var i = 0, len = obj.length; i < len; i++){
            //copy[i] = clone(obj[i]);
            copy[i] = deepCopy(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (isPlainObject(obj)) {
        copy = {};
        for(var attr in obj){
            //if (obj.hasOwnProperty(attr)) { copy[attr] = clone(obj[attr]); }
            if (obj.hasOwnProperty(attr)) { copy[attr] = deepCopy(obj[attr]); }
        }
        return copy;
    }
    return copy;
};

export default deepCopy;