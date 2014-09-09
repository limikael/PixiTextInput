PixiTextInput
=============

Text input field for pixi.js 

There is a demo here:

https://rawgit.com/limikael/pixitextinput/master/test/index.html

About
-----

This is a very early implementation of a text input field for pixi.js.

Use it like this:

    var PIXI = require("pixi.js");
    var PixiTextInput = require("pixitextinput");

    // We need a container
    var container = new PIXI.DisplayObjectContainer();

    // Same style options as PIXI.Text;
    var style={/*...*/};

    var inputField = new PixiTextInput("hello",style);
    container.addChild(inputField);

Some functions:

    // Set width of the input field. Note, it will _not_ scale
    inputField.width = 200;

    // Register a listener on content change
    inputField.change = function() {};

    // Read current text.
    var text = inputField.text;

Check the source code for more docs!

Notes
-----

It is a very early test! Stuff that doesn't work:

* There is no clipboard functionality at all.
* Doesn't work on touch screens at all.
* Setting the text works, but the caret will jump to the beginning in a funny way.

Questions:

* Should there be a border?
