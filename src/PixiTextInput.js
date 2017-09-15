if (typeof module !== 'undefined') {
	PIXI = require("pixi.js");
}

/**
 * Text input field for pixi.js.
 * A simple example:
 *
 *     // We need a container
 *     var container = new PIXI.Container();
 *
 *     // Same style options as PIXI.Text
 *     var style={ ... };
 *
 *     var inputField = new PixiTextInput("hello",style);
 *     container.addChild(inputField);
 *
 * The style definitions accepted by the constructor are the same as those accepted by
 * [PIXI.Text](http://www.goodboydigital.com/pixijs/docs/classes/Text.html).
 * @class PixiTextInput
 * @constructor
 * @param {String} [text] The initial text.
 * @param {Object} [style] Style definition, same as for PIXI.Text
 * @param {Boolean} [password] Indicate if field should be shown as a password field
 * @param {Boolean} [useNativeTextInput] Indicate if the textfield should create a native fallback for mobile
 */
function PixiTextInput(text, style, password, useNativeTextInput) {
	PIXI.Container.call(this);
	window.pixiTextInputTarget = this;

	if (!text)
		text = "";

	text = text.toString();

	if (style && style.wordWrap)
		throw "wordWrap is not supported for input fields";

	this._text = text;
	this._placeholder = "";

	if (useNativeTextInput) {
		this._nativeTextInput = this.getNativeTextInput(password);
		this.bindNativeTextInput();
	}

	this.localWidth = 100;
	this._backgroundColor = 0xffffff;
	this._caretColor = 0x000000;
	this._borderColor = 0x000000;
	this._borderWidth = 0;
	this._background = true;
	this._password = false;
	this._value = text;

	if ( typeof password !== "undefined" && password !== undefined && password === true ) {
		this._password = true;
		this.syncValue();
	}

	this.style = style;
	this.textField = new PIXI.Text(this._value, style);

	this.localHeight =
		this.textField.style.fontSize +
		this.textField.style.strokeThickness
		+ 4;

	this.textColor = this.textField.style.fill;

	this.backgroundGraphics = new PIXI.Graphics();
	this.textFieldMask = new PIXI.Graphics();
	this.selectionGraphics = new PIXI.Graphics();
	this.caret = new PIXI.Graphics();
	this.drawElements();

	this.addChild(this.backgroundGraphics);
	this.addChild(this.selectionGraphics);
	this.addChild(this.textField);
	this.addChild(this.caret);
	this.addChild(this.textFieldMask);

	this.scrollIndex = 0;
	this._caretIndex = 0;
	this.caretFlashInterval = null;
	this._secondCaretIndex = 0;
	this.blur();
	this.updateCaretPosition();

	this.backgroundGraphics.interactive = true;
	this.backgroundGraphics.buttonMode = true;
	this.backgroundGraphics.defaultCursor = "text";

	this.backgroundGraphics.mousedown = this.onBackgroundMouseDown.bind(this);
	this.keyEventClosure = this.onKeyEvent.bind(this);
	this.windowBlurClosure = this.onWindowBlur.bind(this);
	this.documentMouseDownClosure = this.onDocumentMouseDown.bind(this);
	this.isFocusClick = false;

	this.updateText();

	this.textField.mask = this.textFieldMask;

	this.keypress = null;
	this.keydown = null;
	this.change = null;

	this.ctrlDown = false;
	this.shiftDown = false;
}

PixiTextInput.prototype = Object.create(PIXI.Container.prototype);
PixiTextInput.prototype.constructor = PixiTextInput;

/**
 * Someone clicked.
 * @method onBackgroundMouseDown
 * @private
 */
PixiTextInput.prototype.onBackgroundMouseDown = function(e) {
	if (this._nativeTextInput) {
		this._nativeTextInput.focus();
	}
	var x = this.toLocal(e.data.global).x;
	this._caretIndex = this.getCaretIndexByCoord(x);
	this.updateCaretPosition();

	this.focus();

	this.isFocusClick = true;
	var scope = this;
	setTimeout(function() {
		scope.isFocusClick = false;
	}, 0);
}

/**
 * Focus this input field.
 * @method focus
 */
PixiTextInput.prototype.focus = function() {
	window.pixiTextInputTarget = this;
	this.blur();

	this.handleCopyReference = this.handleCopy.bind(this);
	document.addEventListener("copy", this.handleCopyReference);
	this.handleCutReference = this.handleCut.bind(this);
	document.addEventListener("cut", this.handleCutReference);
	this.handlePasteReference = this.handlePaste.bind(this);
	document.addEventListener("paste", this.handlePasteReference);

	document.addEventListener("keydown", this.keyEventClosure);
	document.addEventListener("keypress", this.keyEventClosure);
	document.addEventListener("keyup", this.keyEventClosure);
	document.addEventListener("mousedown", this.documentMouseDownClosure);

	window.addEventListener("blur", this.windowBlurClosure);

	if(this._nativeTextInput) {
		this._nativeTextInput.focus();
	}

	this.showCaret();
}

/**
 * Handle key event.
 * @method onKeyEvent
 * @private
 */
PixiTextInput.prototype.onKeyEvent = function(e) {
	//console.log("key event");
	//console.log(e);
	//console.log(this.scrollIndex);

	if (e.type == "keypress") {
		if (e.charCode < 32){
			return;
		}
		if(e.charCode==32){
			e.preventDefault();
		}
		if(this.ctrlDown && (e.charCode==67 ||
			 									 e.charCode==99 ||
											   e.charCode==86 ||
											   e.charCode==118 ||
											   e.charCode==88 ||
											   e.charCode==120) ){
			//console.log("ctrl+c|v|x");
			return;
		}

		if(this._selection){
			this.deleteSelectedText();
			this.moveCarretRight();
		}

		this._text =
			this._text.substring(0, this._caretIndex) +
			String.fromCharCode(e.charCode) +
			this._text.substring(this._caretIndex);

		this._selection = false;
		this.syncValue();

		this._caretIndex++;
		this.ensureCaretInView();
		this.showCaret();
		this.updateText();
		this.drawElements();
		this.trigger(this.keypress, e);
		this.trigger(this.change);
	}

	if (e.type == "keydown") {
		switch (e.keyCode) {
			case 8: //backspace
				if(this._selection){
					this.deleteSelectedText();
				} else if (this._caretIndex > 0) {
					this._text =
						this._text.substring(0, this._caretIndex - 1) +
						this._text.substring(this._caretIndex);

					this.syncValue();

					this._caretIndex--;
					this.ensureCaretInView();
					this.showCaret();
					this.updateText();
				}
				e.preventDefault();
				this.trigger(this.change);
				break;

			case 16://shift
				this.shiftDown = true;
				break;

			case 17:
				this.ctrlDown = true;
				break;

			case 35:
				this._caretIndex = this._text.length;
				e.preventDefault();

				this.ensureCaretInView();
				this.updateCaretPosition();
				this.showCaret();
				this.updateText();
				break;

			case 36:
				this._caretIndex = 0;
				e.preventDefault();

				this.ensureCaretInView();
				this.updateCaretPosition();
				this.showCaret();
				this.updateText();
				break;

			case 46:
				this._text =
					this._text.substring(0, this._caretIndex) +
					this._text.substring(this._caretIndex + 1);

				this.syncValue();

				this.ensureCaretInView();
				this.updateCaretPosition();
				this.showCaret();
				this.updateText();
				e.preventDefault();
				this.trigger(this.change);
				break;

			case 39://right arrow
				if(this.shiftDown && !this._selection){
					this._selection=true;
					this._secondCaretIndex = this._caretIndex;
				}
				/*if(this.shiftDown && this._selection){
					if(this._secondCaretIndex+1<this._text.length){
						this._secondCaretIndex++;
					}
				} else {*/
					if(this.ctrlDown && this._caretIndex+1 < this._text.length){
						var nextPosition = this._text.indexOf(" ", this._caretIndex);
						if(nextPosition!=this._caretIndex){
							this._caretIndex = (nextPosition!=-1)?nextPosition:this._text.length;
						} else this.moveCarretRight();
					} else this.moveCarretRight();
				//}
				if(!this.shiftDown){
					this._selection = false;
				}

				this.ensureCaretInView();
				this.updateCaretPosition();
				this.showCaret();
				this.updateText();
				this.drawElements();
				break;

			case 37://left arrow
				if(this.shiftDown && !this._selection){
					this._selection=true;
					this._secondCaretIndex = this._caretIndex;
				}
				/*if(this.shiftDown && this._selection){
					if(this._secondCaretIndex+1>0){
						this._secondCaretIndex--;
					}
				} else {*/
					if(this.ctrlDown && this._caretIndex+1 > 0){
						var nextPosition = this._text.lastIndexOf(" ", this._caretIndex-1);
						if(nextPosition!=this._caretIndex){
							this._caretIndex = (nextPosition!=-1)?nextPosition:0;
						} else this.moveCarretLeft();
					} else this.moveCarretLeft();
				//}
				if(!this.shiftDown){
					this._selection = false;
				}

				this.ensureCaretInView();
				this.updateCaretPosition();
				this.showCaret();
				this.updateText();
				this.drawElements();
				break;

			case 65://A
				if(this.ctrlDown){
					this._selection = true;
					this._caretIndex = 0;
					this._secondCaretIndex = this._text.length;
					this.drawElements();
					e.preventDefault();
				}
				break;
		}

		this.trigger(this.keydown, e);
	}

	if(e.type == "keyup"){
		switch (e.keyCode) {
			case 16:
				this.shiftDown = false;
				break;
			case 17:
				this.ctrlDown = false;
				break;
			default:

		}
	}
}

PixiTextInput.prototype.handleCopy = function(e){
	e.clipboardData.setData('text/plain', this.getSelectedText());
	e.preventDefault();
}

PixiTextInput.prototype.handleCut = function(e){
	e.clipboardData.setData('text/plain', this.getSelectedText());
	if(this._selection){
		this.deleteSelectedText();
		this.moveCarretRight();
	}
	e.preventDefault();
}

PixiTextInput.prototype.handlePaste = function(e){
	var txtToInsert = e.clipboardData.getData('text/plain');
	if(this._selection){
		this.deleteSelectedText();
		this.moveCarretRight();
	}
	this.insertText(txtToInsert);
	e.preventDefault();
}

PixiTextInput.prototype.deleteSelectedText = function(e){
	var startPosition;
	var endPosition;
	if(this._caretIndex>this._secondCaretIndex){
		startPosition = this._secondCaretIndex;
		endPosition = this._caretIndex;
	} else {
		startPosition = this._caretIndex;
		endPosition = this._secondCaretIndex;
	}
	if(startPosition==0 && endPosition==this._text.length){
		this._text = "";
	} else {
		this._text =
		this._text.substring(0, startPosition) +
		this._text.substring(endPosition);
	}

	this._selection = false;

	this.syncValue();

	this._caretIndex=startPosition;
	if(this._caretIndex<0){
		this._caretIndex=0;
	}
	this.ensureCaretInView();
	this.showCaret();
	this.updateText();
	this.drawElements();
}

PixiTextInput.prototype.insertText = function(txt){
	this._text = this._text.substring(0, this._caretIndex)
						 + txt
						 + this._text.substring(this._caretIndex);

	this._selection = false;
	this._caretIndex += txt.length;
	this.updateCaretPosition();
	this.syncValue();
	this.ensureCaretInView();
	this.showCaret();
	this.updateText();
	this.drawElements();
}

PixiTextInput.prototype.moveCarretRight = function(){
	if(this._selection && !this.shiftDown){
		if(this._caretIndex<this._secondCaretIndex){
			this._caretIndex = this._secondCaretIndex;
		}
	} else {
		this._caretIndex++;
		if (this._caretIndex > this._text.length){
			this._caretIndex = this._text.length;
		}
	}
}

PixiTextInput.prototype.moveCarretLeft = function(){
	if(this._selection && !this.shiftDown){
		if(this._caretIndex>this._secondCaretIndex){
			this._caretIndex = this._secondCaretIndex;
		}
	} else {
		this._caretIndex--;
		if (this._caretIndex < 0){
			this._caretIndex = 0;
		}
	}
}

/**
 * Ensure the caret is not outside the bounds.
 * @method ensureCaretInView
 * @private
 */
PixiTextInput.prototype.ensureCaretInView = function() {
	this.updateCaretPosition();

	while (this.caret.position.x >= this.localWidth - 1) {
		this.scrollIndex++;
		this.updateCaretPosition();
	}

	while (this.caret.position.x < 0) {
		this.scrollIndex -= 2;
		if (this.scrollIndex < 0)
			this.scrollIndex = 0;
		this.updateCaretPosition();
	}
}

/**
 * Blur ourself.
 * @method blur
 */
PixiTextInput.prototype.blur = function() {
	document.removeEventListener("copy", this.handleCopyReference);
	document.removeEventListener("cut", this.handleCutReference);
	document.removeEventListener("paste", this.handlePasteReference);

	document.removeEventListener("keydown", this.keyEventClosure);
	document.removeEventListener("keypress", this.keyEventClosure);
	document.removeEventListener("keyup", this.keyEventClosure);
	document.removeEventListener("mousedown", this.documentMouseDownClosure);
	window.removeEventListener("blur", this.windowBlurClosure);

	this.hideCaret();
}

/**
 * Window blur.
 * @method onDocumentMouseDown
 * @private
 */
PixiTextInput.prototype.onDocumentMouseDown = function() {
	if (this._nativeTextInput) {
		this._nativeTextInput.blur();
	}
	if (!this.isFocusClick)
		this.blur();
}

/**
 * Window blur.
 * @method onWindowBlur
 * @private
 */
PixiTextInput.prototype.onWindowBlur = function() {
	if (this._nativeTextInput) {
		this._nativeTextInput.blur();
	}
	this.blur();
}

/**
 * Update caret Position.
 * @method updateCaretPosition
 * @private
 */
PixiTextInput.prototype.updateCaretPosition = function() {
	if (this._caretIndex < this.scrollIndex) {
		this.caret.position.x = -1;
		return;
	}

	var sub = this._value.substring(0, this._caretIndex).substring(this.scrollIndex);
	this.caret.position.x = this.textField.context.measureText(sub).width;
}

/**
 * Update text.
 * @method updateText
 * @private
 */
PixiTextInput.prototype.updateText = function() {
	this.textField.text = this._value.substring(this.scrollIndex);
}

/**
 * Sync the password field value
 * @method syncValue
 * @private
 */
PixiTextInput.prototype.syncValue = function() {
	if(this.textField && this.textField.style.fill!=this.textColor){
		this.textField.style.fill = this.textColor;
		this.textField.alpha = 1;
	}
	if (this._password) {
		this._value = this._text.replace(/./g,"*");
	} else if(this._text.length==0 && this._placeholder) {
		this._value = this._placeholder;
		if(this.textField){
			this.textField.style.fill = 0xCCCCCC;
			this.textField.alpha = 0.5;
		}
	} else {
		this._value = this._text;
	}
}

/**
 * Draw the background and caret.
 * @method drawElements
 * @private
 */
PixiTextInput.prototype.drawElements = function() {
	this.backgroundGraphics.clear();
	this.backgroundGraphics.beginFill(this._backgroundColor);

	if (this._borderWidth > 0) {
		this.backgroundGraphics.lineStyle( this._borderWidth, this._borderColor );
	}

	if (this._background) {
		this.backgroundGraphics.drawRect(0, 0, this.localWidth, this.localHeight);
	}

	this.selectionGraphics.clear();
	if(this._selection && this._caretIndex!=this._secondCaretIndex){
		var selectionStart;
		var selectionEnd;
		var offset = 0;
		if(this._caretIndex>this._secondCaretIndex){
			selectionStart = this._secondCaretIndex;
			selectionEnd = this._caretIndex;
		} else {
			selectionStart = this._caretIndex;
			selectionEnd = this._secondCaretIndex;
		}
		if(selectionStart>0){
			offset = this.textField.context.measureText(this._text.substring(0, selectionStart)).width;
			if(this.scrollIndex){
				offset -= this.textField.context.measureText(this._text.substring(0, this.scrollIndex)).width;
			}
		}
		var sub = this._text.substring(selectionStart, selectionEnd);
		var selectedWidth = this.textField.context.measureText(sub).width;
		if(offset+selectedWidth>this.localWidth){
			selectedWidth = this.localWidth-offset;
		}

		/*
		var sub = this._value.substring(0, this._caretIndex).substring(this.scrollIndex);
		this.caret.position.x = this.textField.context.measureText(sub).width;
		*/
		this.selectionGraphics.beginFill(0xDDDDDD, 0.3);
		this.selectionGraphics.drawRect(offset, 0, selectedWidth, this.localHeight)
	}

	this.backgroundGraphics.endFill();
	this.backgroundGraphics.hitArea = new PIXI.Rectangle(0, 0, this.localWidth, this.localHeight);

	this.textFieldMask.clear();
	this.textFieldMask.beginFill(this._backgroundColor);
	this.textFieldMask.drawRect(0, 0, this.localWidth, this.localHeight);
	this.textFieldMask.endFill();

	this.caret.clear();
	this.caret.beginFill(this._caretColor);
	this.caret.drawRect(1, 1, 1, this.localHeight - 2);
	this.caret.endFill();
}

/**
 * Show caret.
 * @method showCaret
 * @private
 */
PixiTextInput.prototype.showCaret = function() {
	if (this.caretFlashInterval) {
		clearInterval(this.caretFlashInterval);
		this.caretFlashInterval = null;
	}

	this.caret.visible = true;
	this.caretFlashInterval = setInterval(this.onCaretFlashInterval.bind(this), 500);
}

/**
 * Hide caret.
 * @method hideCaret
 * @private
 */
PixiTextInput.prototype.hideCaret = function() {
	if (this.caretFlashInterval) {
		clearInterval(this.caretFlashInterval);
		this.caretFlashInterval = null;
	}

	this.caret.visible = false;
}

/**
 * Caret flash interval.
 * @method onCaretFlashInterval
 * @private
 */
PixiTextInput.prototype.onCaretFlashInterval = function() {
	this.caret.visible = !this.caret.visible;
}

/**
 * Map position to caret index.
 * @method getCaretIndexByCoord
 * @private
 */
PixiTextInput.prototype.getCaretIndexByCoord = function(x) {
	var smallest = 10000;
	var cand = 0;
	var visible = this._text.substring(this.scrollIndex);

	for (i = 0; i < visible.length + 1; i++) {
		var sub = visible.substring(0, i);
		var w = this.textField.context.measureText(sub).width;

		if (Math.abs(w - x) < smallest) {
			smallest = Math.abs(w - x);
			cand = i;
		}
	}

	return this.scrollIndex + cand;
}

PixiTextInput.prototype.getSelectedText = function(){
	if(this._selection){
		if(this._caretIndex<this._secondCaretIndex){
			return this._text.substring(this._caretIndex, this._secondCaretIndex);
		} else if(this._caretIndex>this._secondCaretIndex){
			return this._text.substring(this._secondCaretIndex, this._caretIndex);
		}
	}
	return "";
}

/**
 * The width of the PixiTextInput. This is overridden to have a slightly
 * different behaivour than the other DisplayObjects. Setting the
 * width of the PixiTextInput does not change the scale, but it rather
 * makes the field larger. If you actually want to scale it,
 * use the scale property.
 * @property width
 * @type Number
 */
Object.defineProperty(PixiTextInput.prototype, "width", {
	get: function() {
		return this.scale.x * this.getLocalBounds().width;
	},

	set: function(v) {
		this.localWidth = v;
		this.drawElements();
		this.ensureCaretInView();
		this.updateText();
	}
});

/**
 * The text in the input field. Setting will have the implicit function of resetting the scroll
 * of the input field and removing focus.
 * @property text
 * @type String
 */
Object.defineProperty(PixiTextInput.prototype, "text", {
	get: function() {
		return this._text;
	},

	set: function(v) {
		this._text = v.toString();
		this.syncValue();
		this.scrollIndex = 0;
		this.caretIndex = 0;
		this.blur();
		this.updateText();
	}
});

/**
 * The color of the background for the input field.
 * This needs to be specified as an integer, not using HTML
 * notation, e.g. for red background:
 *
 *     myInputText.backgroundColor = 0xff0000;
 *
 * In order for the background to be drawn, the `background`
 * property needs to be true. If not, this property will have
 * no effect.
 * @property backgroundColor
 * @type Integer
 */
Object.defineProperty(PixiTextInput.prototype, "backgroundColor", {
	get: function() {
		return this._backgroundColor;
	},

	set: function(v) {
		this._backgroundColor = v;
		this.drawElements();
	}
});

Object.defineProperty(PixiTextInput.prototype, "borderColor", {
	get: function() {
		return this._borderColor;
	},

	set: function(v) {
		this._borderColor = v;
		this.drawElements();
	}
});

Object.defineProperty(PixiTextInput.prototype, "borderWidth", {
	get: function() {
		return this._borderWidth;
	},

	set: function(v) {
		this._borderWidth = v;
		this.drawElements();
	}
});


/**
 * The color of the caret.
 * @property caretColor
 * @type Integer
 */
Object.defineProperty(PixiTextInput.prototype, "caretColor", {
	get: function() {
		return this._caretColor;
	},

	set: function(v) {
		this._caretColor = v;
		this.drawElements();
	}
});

/**
 * Determines if the background should be drawn behind the text.
 * The color of the background is specified using the backgroundColor
 * property.
 * @property background
 * @type Boolean
 */
Object.defineProperty(PixiTextInput.prototype, "background", {
	get: function() {
		return this._background;
	},

	set: function(v) {
		this._background = v;
		this.drawElements();
	}
});

/**
 * Determines if the background should be drawn behind the text.
 * The color of the background is specified using the backgroundColor
 * property.
 * @property background
 * @type Boolean
 */
Object.defineProperty(PixiTextInput.prototype, "placeholder", {
	get: function() {
		return this._placeholder;
	},

	set: function(v) {
		this._placeholder = v;
		this.syncValue();
	}
});

/**
 * Set text.
 * @method setText
 * @param {String} text The new text.
 */
PixiTextInput.prototype.setText = function(v) {
	if(this._nativeTextInput) {
		this._nativeTextInput.value = v;
	}

	this.text = v;
}

/**
 * Trigger an event function if it exists.
 * @method trigger
 * @private
 */
PixiTextInput.prototype.trigger = function(fn, e) {
	if (fn)
		fn(e);
}

/**
 * Get or create a native text input for mobile support
 * @method getNativeTextInput
 * @private
 */
PixiTextInput.prototype.getNativeTextInput = function(pw) {
	var elmName = "PixiTextInput";
	var elm = document.getElementById( elmName );

	if ( !elm ) {
		var elm = document.createElement( "input" );
		document.body.appendChild( elm );
		elm.style.position = "fixed";
		elm.style.top = "-100px";
		elm.style.left = "-100px";

		if ( pw ) {
			elm.type = "password";
		}
	}

	return elm;
}

/**
 * Bind events for the native text input
 * @method bindNativeTextInput
 * @private
 */
PixiTextInput.prototype.bindNativeTextInput = function() {

	if(this._nativeTextInput) {
		this._nativeTextInput.addEventListener("keyup", function(e) {
			window.pixiTextInputTarget.text = this.value;
		});
	}

}

if (typeof module !== 'undefined') {
	module.exports = PixiTextInput;
}
