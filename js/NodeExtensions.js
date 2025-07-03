import deepCopy from './utils/DeepCopy'

function handleArrayOfDOMOutputSpec(DOMOutputSpec, externalSetAttrs, node, options) {

    /**
     * if DOMOutputSpec.length === 1 then
     *      get attrs from options.serializer[name].getAttrs and set that attrs as 2nd element in DOMOutputSpec array, here while calling options.serializer[name].getAttrs pass the 2nd parameter as an empty object indicating that we have not set any attributes for this element
     * else if DOMOutputSpec.length === 2 then
     *      if DOMOutputSpec[1] === 0(representing a hole) then
     *          get attrs from options.serializer[name].getAttrs and set that attrs as 2nd element in DOMOutputSpec array, here also set the 2nd param as empty object
     *          and set the 3rd element in DOMOutputSpec array as 0
     *      else if Array.isArray(DOMOutputSpec[1]) then (representing nested DOMOutputSpec)
     *          get attrs from options.serializer[name].getAttrs and shift the DOMOutputSpec[1] to DOMOutputSpec[2] and set the returned attrs as 1st element in DOMOutputSpec itself, here set the 2nd param as empyty object.
     *          TODO:
     *          In this case he can't set attributes for the inner DOMOutputSpec, he can only set the attrs at the top level
     *      else if DOMOutputSpec[1] === 'object'(representing attributes set by toDOM in node definition) then
     *          get attrs from options.serializer[name].getAttrs and set that attrs as 2nd element in DOMOutputSpec array, here while calling options.serializer[name].getAttrs pass the 2nd parameter as DOMOutputSpec[1] which contains the attributes set by the toDOM present in the node definition
     * else if DOMOutputSpec.length === 3 then
     *      if DOMOutputSpec[2] === 0 then (representing a hole)
     *          get attrs from options.serializer[name].getAttrs and set that attrs as 2nd element in DOMOutputSpec array, here also set the 2nd param as DOMOutputSpec[1]
     *      else if Array.isArray(DOMOutputSpec[2]) then (representing nested DOMOutputSpec)
     *          get attrs from options.serializer[name].getAttrs and set that value as 2nd element in DOMOutputSpec itself, here set the 2nd param as DOMOutputSpec[1]
     *          TODO:
     *          In this case also he can't set attributes for the inner DOMOutputSpec, he can only set the attrs at the top level
     */

    if(DOMOutputSpec.length === 1) {
        DOMOutputSpec[1] = externalSetAttrs(node, {}, options)
    } else if(DOMOutputSpec.length === 2) {
        
        if(DOMOutputSpec[1] === 0) {
            DOMOutputSpec[1] = externalSetAttrs(node, {}, options)
            DOMOutputSpec[2] = 0// hardcode it to 0, to represent it as a hole
        } else if(Array.isArray(DOMOutputSpec[1])) {
            // DOMOutputSpec[1] can be an array with another set of DOMOutputSpec, check this link https://prosemirror.net/docs/ref/#model.DOMOutputSpec
            let returnedAttrs = externalSetAttrs(node, {}, options)
            DOMOutputSpec[2] = DOMOutputSpec[1]
            DOMOutputSpec[1] = returnedAttrs
        } else if(typeof DOMOutputSpec[1] === 'object') {
            DOMOutputSpec[1] = externalSetAttrs(node, DOMOutputSpec[1], options)
        }
        
    } else if(DOMOutputSpec.length === 3) {

        // here the DOMOutputSpec[2] can be a hole or it can be an array representing another DOMOutputSpec
        if(DOMOutputSpec[2] === 0) {
            DOMOutputSpec[1] = externalSetAttrs(node, DOMOutputSpec[1], options)
        } else if(Array.isArray(DOMOutputSpec[2])) {
            DOMOutputSpec[1] = externalSetAttrs(node, DOMOutputSpec[1], options, DOMOutputSpec[2])
        }

    }
}

function handleDOMElementDOMOutputSpec(DOMElement, externalSetAttrs, node, options) {
    //here DOMElement is itself returned in toDOM of node definition so call options.serializer[name].setAttrs() and pass the 4th param as DOMElement itself, because in this case he can also set the attributes for the child nodes present inside the DOMElement.
    
    // the return value of options.serializer[name].setAttrs() can be either an empty object(indicating that the options.serializer[name].setAttrs() itself modified the DOMElement directly) or it can also be an object of length > 0 (indicating that he need to set attributes for the DOMElement using the returned object, here the options.serializer[name].setAttrs() can wish to modify the DOMElement or not)
    var attrs = externalSetAttrs(node, {}, options, DOMElement)
    for(var key in attrs) {
        DOMElement.setAttribute(key, attrs[key])
    }
}

function modifyDOMOutputSpec(DOMOutputSpec, externalSetAttrs, node, options) {
    if(Array.isArray(DOMOutputSpec)) {
        DOMOutputSpec = handleArrayOfDOMOutputSpec(DOMOutputSpec, externalSetAttrs, node, options)
    } else if(typeof DOMOutputSpec === 'object') {
        DOMOutputSpec = handleDOMElementDOMOutputSpec(DOMOutputSpec, externalSetAttrs, node, options)
    }
}

function wrappingToDOM(builtInToDOM, externalSetAttrs, options) {
    return function(node) {
        var DOMOutputSpec = builtInToDOM(node, options)
        modifyDOMOutputSpec(DOMOutputSpec, externalSetAttrs, node, options)
        return DOMOutputSpec
    }
}

function wrappingGetAttrs(builtInGetAttrs, externalGetAttrs, options) {
    return function(el) {
        var attrs = builtInGetAttrs(el, options) // the value returned from builtInGetAttrs can be an object or boolean or undefined
        // proceed with calling externalGetAttrs if the return type is object or undefined or if the return value is true, only if the return value is false , don't call externalGetAttrs because by returning false we are saying that the given tag or style does'nt qualify to be the give mark type
        if(attrs !== false) {
            if(typeof attrs === 'undefined' || typeof attrs === 'null' || typeof attrs === 'boolean') {// if the return type from builtInGetAttrs is undefined or boolean or null then simply consider that the returned object is an empty object
                attrs = {}
            }
            attrs.extraAttrs = externalGetAttrs(el, attrs, options)
        }
        if (attrs.extraAttrs === false) { // if getAttrs returns false, then it means the given element does'nt qualify to be that node
            return false
        }
        return attrs
    }
}
function boundedExternalGetAttrs(externalGetAttrs, options) {
    return function(el) {
        return { extraAttrs : externalGetAttrs(el, {}, options) }
    }
}
function constructParseDOM(properties, customParser, options) {

    /**
     *      if there is options.serializer[name].getAttrs & parseDOM in node definition then
     *          iterate each object in parseDOM
     *              if there is getAttrs for that object then
     *                  call wrappingGetAttrs()
     *              else if there is no getAttrs for that object then
     *                  call boundedExternalGetAttrs()
     *      else if there is parseDOM in node definition alone then do nothing
     *      else if there is options.serializer[name].getAttrs alone then also do nothing(refer the below note)
     *      Note: if there is no options.serializer[name].parseDOM & no parseDOM(Eg: text node) in node definition, but if options.serializer[name].getAttrs is alone present then it is of no use, so in these cases the user needs to provide options.serializer[name].parseDOM itself instead of providing options.serializer[name].getAttrs
     */

    if(properties.parseDOM && customParser.getAttrs) {
        properties.parseDOM.forEach(function(parser) {
            let externalGetAttrs = customParser.getAttrs
            if(parser.getAttrs) {
                let builtInGetAttrs = parser.getAttrs
                parser.getAttrs = wrappingGetAttrs(builtInGetAttrs, externalGetAttrs, options)
            } else {
                parser.getAttrs = boundedExternalGetAttrs(externalGetAttrs, options)
            }
        })
    }

}

function constructToDOM(properties, customParser, options) {

    /** 
     *      if there is options.serializer[name].setAttrs and toDOM in node definition then
     *          call wrappingToDOM()
     *      else if there is toDOM in node definition alone then don't do anything
     *      else if there is options.serializer[name].setAttrs alone then also don't do anything(refer the below note)
     *      Note:  if there is no options.serializer[name].toDOM & no toDOM(Eg: text node) in node definition, but if options.serializer[name].setAttrs is alone present then it is of no use, so in these cases the user needs to provide options.serializer[name].toDOM itself instead of providing options.serializer[name].setAttrs
     */

    if(properties.toDOM && customParser.setAttrs) {
        let builtInToDOM = properties.toDOM
        let externalSetAttrs = customParser.setAttrs
        properties.toDOM = wrappingToDOM(builtInToDOM, externalSetAttrs, options)
    }

}

function extendSpec(name, properties, options) {

    // Note: We are assuming that either the user will provide getAttrs, setAttrs, getParserRules(either one of these, or two of these or all 3)
    // or else he would be providing custom node definition alone

    var isCustomParserPresent = ( options.serializer && options.serializer[name] ) ? true : false
    var customParser = null, isCustomAttrsPresent = false, isCustomNodeDefinitionPresent = false, isCustomParserRulesPresent = false;

    // Issue: Since in addnodes function we are directly sending the reference of node definition object,
    // as a result of which any modifications made to the node definition object in NodeExtensions.js will directly be reflected to all nodes in that page.
    // For eg: in connect for post editor they are using serializer for highlight mark, they have extra attrs and get attrs and set attrs,
    // but in connect forum editor they want highlight mark to behave normally, and in single page both the editors can be present.
    // Therefore modifying highlight mark in one editor, will reflect the highlight mark in other editor also.
    
    // Proper Solution: In every addNodes function we need to return a new object with node defintion 
    // instead of returning the reference of the object containing node definition.

    // Temporary Solution: Since changing in every addNodes function will be a huge task, 
    // for now we are using deepCopy function to create a new object with node definition
    properties = deepCopy(properties)

    if(isCustomParserPresent) {
        customParser = options.serializer[name]
        isCustomAttrsPresent = ( customParser.getAttrs || customParser.setAttrs ) ? true : false
        isCustomParserRulesPresent = customParser.getParserRules
        // TODO: there maybe cases where along with custom node definition there may also be getAttrs, setAttrs or getParserRules
        // need to handle those cases also, the below check won't handle them
        isCustomNodeDefinitionPresent = !isCustomAttrsPresent && !isCustomParserRulesPresent
    }

    if(isCustomParserPresent && isCustomAttrsPresent) {
        if(!properties.attrs) { //if there is no properties.attrs itself then simply assign empty object inorder to create properties.attrs.extraAttrs
            properties.attrs = {}
        }
        properties.attrs.extraAttrs = { default: null }

        // construct parseDOM and toDOM including the getAttrs and setAttrs
        constructParseDOM(properties, customParser, options)
        constructToDOM(properties, customParser, options)
    } else if (isCustomParserPresent && isCustomNodeDefinitionPresent) { // if node definition is itself provided merge the two objects
        properties = Object.assign( properties, customParser )
        // properties.toDOM = customParser.toDOM
        // properties.parseDOM = customParser.parseDOM
    }

    if(isCustomParserRulesPresent) {// get certain custom parseDOM rules and merge those rules with the already existing parseDOM rules in node definition
        // Note: the rules that are obtained from the customParser will be prepended (added at the begining) of the parseDOM array in the node definition
        let customParserRules = customParser.getParserRules()// customParser.getParseRules will return an array containing of objects similar to parseDOM in node definition
        properties.parseDOM = customParserRules.concat(properties.parseDOM)
    }

    return properties
}

export default extendSpec