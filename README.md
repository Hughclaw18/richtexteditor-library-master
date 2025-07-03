# richtexteditor-library


Overview & Goals:
-----------------

+ Rendering is based on a data-model / schema, instead of “contenteditable/HTML” as the source of truth.

+ Contenteditable is only used to capture input events and as output device (cursor navigation, selection and RTL font rendering is taken care of by the browser). Everything else is under the library’s control. 

+ Data-model is extensible. We can incrementally add custom document elements by extending the base schema. Comes with a plugin system to add custom behavior.

+ Should work well with common browser extensions like Grammarly.

+ Rendering fidelity. Content shouldn’t lose formatting across editing sessions & copy/paste.


Install & Build
---------------

```
git clone https://git.csez.zohocorpin.com/writer/richtexteditor-library.git

cd richtexteditor-library

sh install.sh

npm run build // will generate dist folder with built js/css/images/etc

```

To view demo
------------

run a static server and open `demo/index.html` in browser