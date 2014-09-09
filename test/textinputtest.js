PIXI = require("pixi.js");
PixiTextInput = require("../src/PixiTextInput");

var view = document.createElement('canvas');
var renderer = new PIXI.autoDetectRenderer(500, 500, view);

document.body.appendChild(renderer.view);

var stage = new PIXI.Stage(0x8080ff);

renderer.render(stage);
setInterval(function() {
	renderer.render(stage);
}, 1000 / 60);

var input = new PixiTextInput();
input.position.x = 100;
input.position.y = 100;
input.text=123;
stage.addChild(input);

var style = {
	fill: "#ff0000"
};

var i = new PixiTextInput("I have a different color", style);
i.width = 200;
i.backgroundColor = 0x0000ff;
i.caretColor = 0xff0000;
i.position.x = 100;
i.position.y = 150;
i.change=function() {
	console.log("text is: "+i.text);
}

stage.addChild(i);

var style = {
	font: "14px Arial",
};

var input = new PixiTextInput("I am smaller", style);
input.width = 200;
input.position.x = 100;
input.position.y = 200;
stage.addChild(input);

var input = new PixiTextInput("I don't have a background");
input.width = 200;
input.background = false;
input.position.x = 100;
input.position.y = 250;
stage.addChild(input);

console.log("W: " + input.width);