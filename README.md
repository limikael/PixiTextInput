PixiTextInput
=============

Text input field for pixi.js 

There is a demo here:

https://rawgit.com/limikael/pixitextinput/master/test/index.html

About
-----

This is an early implementation of a text input field for pixi.js.

Use it like this:

    var PIXI = require("pixi.js");
    var PixiTextInput = require("pixitextinput");

    // We need a container
    var container = new PIXI.DisplayObjectContainer();

    // Same style options as PIXI.Text
    var style={/*...*/};

    var inputField = new PixiTextInput("hello",style);
    container.addChild(inputField);

See the docs for more info:

http://limikael.altervista.org/pixitextinput/

Todo
----

Stuff on the to do list. I.e. this does not exists yet:

* Implement clipboard.
* Make it work on touch screens.
* Make sure it works with CocoonJS.
* Focusin and Focusout callbacks.
* Setting the text works, but the caret will jump to the beginning in a funny way.

Questions:

* Should there be a border?
