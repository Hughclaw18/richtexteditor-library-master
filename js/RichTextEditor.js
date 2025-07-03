/* $Id$ */
import RTEConstants from "./RTEConstants"
import RichTextEditorView from "./RichTextEditorView"

import { doc2md, md2doc } from "./markdown/utils";
import { version } from '../package.json';
import PMExports from './ProsemirrorExports'
import MarkdownView from "./markdown/MarkdownView";
import getHTML, { processHTMLByRemovingInlineStyles, sanitize } from './HTMLExport'


var featureConf = {};

var loadCSS = function (url, onSuccess, onError) {
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;

    link.addEventListener('load', onSuccess, false);
    link.addEventListener('error', onError, false);

    head.appendChild(link);
}

var loadJS = (function() {

    var createNode = function (url) {
        var node = document.createElement('script');
        node.type = 'text/javascript';
        node.charset = 'utf-8'; //no i18n
        node.defer = true;
        node.src = url;
        return node;
    };

    return function(url, onSuccess, onError) {

        var node = createNode(url);
        node.addEventListener('load', onSuccess, false);
        node.addEventListener('error', onError, false);

        // Insert into the DOM. The callbacks will be called when the module is downloaded & executed.
        var headTag = document.getElementsByTagName('head')[0];
        headTag.appendChild(node);
    }
})();

var isSupportedLang = function(lang) {
    var supportedLangs = ['ar', 'as', 'bg', 'bn', 'brx', 'ca', 'cs', 'da', 'de', 'doi', 'el', 'en_US', 'es', 'et', 'fi', 'fr', 'ga', 'gu', 'hi', 'hr', 'hu', 'id', 'in', 'it', 'iw', 'ja', 'kn', 'ko', 'kok', 'ks','lt', 'mai', 'ml', 'mni', 'mr', 'ms', 'my', 'ne', 'nl', 'no', 'or', 'pa', 'pl', 'pt_BR', 'pt', 'ro', 'ru', 'sa', 'sat', 'sd', 'si', 'sk', 'sv', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'vi', 'zh_CN', 'zh_HK', 'zh_TW', 'zh']
    return supportedLangs.includes(lang)
}

var getPromiseWithResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
  
    return { promise, resolve, reject };
  }

let RichTextEditor = {

    onload : new Promise(function(resolve, reject) {
        let csspromise = getPromiseWithResolvers();
        let i18npromise = getPromiseWithResolvers();

        if(window._RTE_ && window._RTE_.CSS === false) {
            // if window._RTE_.CSS is set to false then no need to load css, it's the responsibility of the product team to include the css file in the
            // head of the html page, this is useful when window._RTE_.CSS is not set and if rte is used as package then an error throws stating
            // no css file will be present at document.currentScript.src, but any how the generated url will be put inside link tag in head which has no use

            // say if the domain name is www.crm.com, then in head tag we would have
            // <link rel="stylesheet", href="www.crm.com/undefined/undefined/css/rte.css">
            // here version and path[0] are undefined as a result while doing editor.getHTML({inlineStyles: true}), we would not be able to use
            // the correct css file
            // along with this the product team would have manually put the css file in the head tag
            // so there would be 2 css files that ends with the name "rte.css", among that only the one that is manually put by the product team is valid
            // so, when we try to find a css file in getHTML() function with the name that contains "rte.css",
            // we would get 2 files we would not be able to know which is the correct file
            // so ionorder to avoid this the product team can set window._RTE_.CSS as false, as a result we would not load the non working css file
            // that is we would not put the below link tag in the head tag itself
            // <link rel="stylesheet", href="www.crm.com/undefined/undefined/css/rte.css">
            csspromise.resolve()
        } else if(window._RTE_ && window._RTE_.CSS) {
            // when the integrating team wants to use RTE as package or else if they want to bundle it in their product, in those cases we can't construct
            // the url from where to fetch the css file because document.currentscript.src will not be present at all,
            // as a result the integrating teams need to explicitly put the css file in the head tag, so inorder to avoid this
            // if the integrating teams have a global variable named _RTE_ and in that if they have a CSS key which contains the link from where the css
            // file needs to be fetched, then we automatically will use this url to construct the link tag and put it in the head tag of the current page.
            loadCSS(window._RTE_.CSS, csspromise.resolve, csspromise.reject)
        } else {
            var src = new URL(document.currentScript.src);
            var path = src.pathname.split(version);
            loadCSS(src.origin + path[0] + version + '/css/rte.css', csspromise.resolve, csspromise.reject)
            // loadCSS("http://localhost:5501/dist/1.2.0/css/rte.css", resolve, reject)
        }

        // no _RTE_ obj = en
        // window._RTE_ = {} = en
        // window._RTE_.lang -  en = en
        // window._RTE_.lang - ar = ar
        // window._RTE_.lang - zz = unsupported error
        // window._RTE_.lang - false, if false then loading custom js

        
        // load i18n parallely
        var src = new URL(document.currentScript.src);
        var path = src.pathname.split(version);
        var lang = window._RTE_ && window._RTE_.lang

        if(window._RTE_  && window._RTE_.lang === false){
            i18npromise.resolve();
        } else if (!window._RTE_ || !window._RTE_.lang || window._RTE_.lang === 'en') { // no language is set, just initialize with default i18n strings included (english)
            loadJS(src.origin + path[0] + version + `/js/i18n/messageResources.js`, i18npromise.resolve, i18npromise.reject)
        } else if(window._RTE_ && window._RTE_.lang && !isSupportedLang(lang)){
            throw new Error("Unsupported language found")
        } else {
            lang = '_' + lang.split('-').join('_')
            loadJS(src.origin + path[0] + version + `/js/i18n/messageResources${lang}.js`, i18npromise.resolve, i18npromise.reject)
        }

        Promise.all([csspromise.promise, i18npromise.promise]).then(resolve).catch(reject)
    }),

    getHTML : function (json, options, domSerializer, inlineStyleOptions) {
        return getHTML(json, options, domSerializer, inlineStyleOptions)
    },

    init : function (initDiv, options) {
        var classMap = {
            markdown: MarkdownView
            // email: MailEditorView
        }
        if (classMap[options.mode]) {
            return new classMap[options.mode](initDiv, options)
        } else {
            return new RichTextEditorView(initDiv, options);
        }

    },

    registerElement : function(elements) {
        Object.keys(elements).forEach(key => {
            featureConf[key] = elements[key]
        })
    },

    getConf : function() {
        return featureConf
    },

    doc2md: doc2md,
    md2doc: md2doc,

    processHTMLByRemovingInlineStyles: function(htmlString) {
        return processHTMLByRemovingInlineStyles(htmlString)
    },

    sanitize: function(htmlString) {
        return sanitize(htmlString)
    },


    i18n: function(key) {
        var keys = key.split('.')
        var label = '';
        var subObject = rte_I18n;
        keys.forEach(k => {
            subObject = subObject[k]
        })
        return subObject || `[noi18n] ${key}`
    },

    noConflict: function() {
        if(oldRichTextEditor) {
            window.RichTextEditor = oldRichTextEditor
        }
        return RichTextEditor
    },

    loadJS: loadJS,

    CONST : RTEConstants,
    version: version
}

RichTextEditor.PMExports = PMExports

var oldRichTextEditor = window.RichTextEditor

export default RichTextEditor