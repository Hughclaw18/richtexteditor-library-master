import fs from "fs"
import path from "path"
// import { version } from './package.json';
import copy from 'rollup-plugin-copy'
import babel from '@rollup/plugin-babel';  // no i18n
// import terser from '@rollup/plugin-terser';
import { terser } from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve'; // no i18n
import commonJS from 'rollup-plugin-commonjs';  // no i18n
import builtins from 'rollup-plugin-node-builtins';
import json from '@rollup/plugin-json';
import handlebars from "rollup-plugin-handlebars-plus"
import handlebars2 from "handlebars"

var files = {};

files[`./dist/1.4.16/css/rte.css`] = {
    concatFiles: [
        "./css/editor.css",
        "./css/menubar.css",
        "./css/zmetoolbar.min.css",
        "./node_modules/zohocomponents/css/components.css",
        "./css/components.custom.css",
        "./css/atmention.css",
        "./css/emoji.css"
    ]
}

let configuration = [
    {
        input: './js/RichTextEditor.js',  // no i18n
        output: {
            format: 'iife', // no i18n
            file: `./dist/1.4.16/js/rte.js`, // './dist/RTE1.js',  // no i18n
            name: 'RichTextEditor' // no i18n
        },
        plugins: [
            builtins(),
            json(),
            resolve(),
            commonJS({
                include: ['node_modules/**', 'prosemirror-mentions/**']  // no i18n
            }),
            handlebars({
                handlebars: {
                    id: 'handlebars/runtime',
                    module: handlebars2
                },
                helpers: ['handlebars/lib/handlebars/helpers/each.js']
                // helpersPureInitialize: true
            }),
            concatFiles({
                files: files
            }),
            copy({
                targets: [
                { src: 'images/*', dest: `dist/1.4.16/images` },
                { src: 'dist-meta.json', dest: `dist/` }
                ]
            })
        ]
    },
    {
        input: './js/RichTextEditor.js',  // no i18n
        output: {
            format: 'iife', // no i18n
            file: `./dist/1.4.16/js/rte.min.js`, // './dist/RTE1.js',  // no i18n
            name: 'RichTextEditor' // no i18n
        },
        plugins: [
            builtins(),
            json(),
            resolve(),
            commonJS({
                include: ['node_modules/**', 'prosemirror-mentions/**']  // no i18n
            }),
            handlebars({
                handlebars: {
                    id: 'handlebars/runtime',
                    module: handlebars2
                },
                helpers: ['handlebars/lib/handlebars/helpers/each.js']
                // helpersPureInitialize: true
            }),
            terser()
        ]
    },
    {
        input: './js/RichTextEditor.js',  // no i18n
        output: {
            format: 'iife', // no i18n
            file: `./dist/1.4.16/js/rte.es5.js`, // './dist/RTE1.js',  // no i18n
            name: 'RichTextEditor' // no i18n
        },
        plugins: [
            builtins(),
            json(),
            resolve(),
            commonJS({
                include: ['node_modules/**', 'prosemirror-mentions/**']  // no i18n
            }),
            handlebars({
                handlebars: {
                    id: 'handlebars/runtime',
                    module: handlebars2
                },
                helpers: ['handlebars/lib/handlebars/helpers/each.js']
                // helpersPureInitialize: true
            }),
            babel({
                presets: [["@babel/preset-env", {
                    targets : [
                    "> 1%",
                    "last 5 version",
                    "ie > 10",
                    "not dead"
                    ]
                }]]
            })
        ]
    },
    {
        input: './js/RichTextEditor.js',  // no i18n
        output: {
            format: 'iife', // no i18n
            file: `./dist/1.4.16/js/rte.es5.min.js`, // './dist/RTE1.js',  // no i18n
            name: 'RichTextEditor' // no i18n
        },
        plugins: [
            builtins(),
            json(),
            resolve(),
            commonJS({
                include: ['node_modules/**', 'prosemirror-mentions/**']  // no i18n
            }),
            handlebars({
                handlebars: {
                    id: 'handlebars/runtime',
                    module: handlebars2
                },
                helpers: ['handlebars/lib/handlebars/helpers/each.js']
                // helpersPureInitialize: true
            }),
            babel({
                presets: [["@babel/preset-env", {
                    targets : [
                    "> 1%",
                    "last 5 version",
                    "ie > 10",
                    "not dead"
                    ]
                }]]
            }),
            terser()
        ]
    },
    {
        input: './js/RichTextEditor.js',  // no i18n
        output: {
            format: 'es', // no i18n
            file: `./dist/1.4.16/js/rte.es.js`, // './dist/RTE1.js',  // no i18n
            name: 'RichTextEditor' // no i18n
        },
        plugins: [
            builtins(),
            json(),
            resolve(),
            commonJS({
                include: ['node_modules/**', 'prosemirror-mentions/**']  // no i18n
            }),
            handlebars({
                handlebars: {
                    id: 'handlebars/runtime',
                    module: handlebars2
                },
                helpers: ['handlebars/lib/handlebars/helpers/each.js']
                // helpersPureInitialize: true
            }),
            babel({
                presets: [["@babel/preset-env", {
                    targets : [
                    "> 1%",
                    "last 5 version",
                    "ie > 10",
                    "not dead"
                    ]
                }]]
            })
        ]
    }
]

/**
 * 
 * @param {Object} obj contains the list of files to be concatinated
 * returns  string
 */
function concatdata(obj) {
    let data = '';
    for(let prop in obj)
    {
        const objlength = obj[prop] && obj[prop].length;
        if(objlength) {
            for(let fileName of obj[prop]) {
                /**
                 * checking if file is a javascript files
                 * if file is not a javascript file it is assumed that is is a string 
                 * to be appended directly
                 */
                if(path.extname(fileName) === ".js" || path.extname(fileName) === ".css" || path.extname(fileName) === ".txt") {
                    data+= fs.readFileSync(fileName,'utf8') + "\n";
                } else {
                    data+= fileName + "\n";
                }

            }
        }
    }

    return data;
}


function concatFiles(useroptions) {
    return {
        name: 'rollup-plugin-concatfiles',
        writeBundle: function () {
            if(useroptions.files) {
                for(let concatinatedFile in useroptions.files) {
                    let content = concatdata(useroptions.files[concatinatedFile]);  
                    /**
                     * concatination works only for js files
                     * If the path provided by user does not exist
                     * then it would be created recursively
                     *  */ 
                    if(path.extname(concatinatedFile) == ".js" || path.extname(concatinatedFile) == ".css") {
                        let directorpath = concatinatedFile.substring(0, concatinatedFile.lastIndexOf("/"));
                        if(directorpath !== "" && !fs.existsSync(directorpath) ) {
                            fs.mkdirSync(directorpath, { recursive: true });
                        } 
                        fs.writeFileSync(concatinatedFile,content);
                    }
                }
            } else {
                var logger = console; // dummy code to bypass codecheck
                logger.log("options.files key is not defined."); 
            }
        }
    };
}

export default (cmdLineArgs) => {
    if(cmdLineArgs.dev) {
        return configuration[0]
    } else {
        return configuration
    }
}