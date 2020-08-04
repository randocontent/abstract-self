function scene04() {
	// --enter
	this.enter = function () {
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
		}
		faceapiStandby = true;

		resetRecVariables()
		chooseScene('#scene-04')
		resizeCanvas(820, 820);
		canvas.parent('#canvas-04');
		button = select('#save-button');
		button.removeClass('primary');
		button.html('Save');
		button.mousePressed(() => {
			saveAbstractYou();
		});
	};

	// --4draw
	this.draw = function () {
		background(255);

		mirror();

		playModifiedShape3(voiceHistory);

		if (par.frameRate) fps()
	};
}

function saveAbstractYou() {

}