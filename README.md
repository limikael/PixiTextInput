[![Build Status](https://travis-ci.org/limikael/PixiTextInput.svg?branch=master)](https://travis-ci.org/limikael/PixiTextInput)

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

Stuff on the to do list, i.e. this does not work yet:

* Implement selection and clipboard.
* Make it work on touch screens.
* Make sure it works with CocoonJS.
* Focusin and focusout callbacks.
* Don't lose focus when setting text.
* Implement scrollIndex and caretIndex so they are readable and writable and behave in a sane way, also if the text is changed.
* Add a border.
