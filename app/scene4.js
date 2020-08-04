
function scene04() {
	this.enter = function () {
		// Entering this scene, cleanup the last one
		full = false;
		rec = false;
		preroll = false;
		play = false;
		// Stop faceapi
		// hide the other scenes
		select('#scene-03').addClass('hidden');
		// show this scene
		select('#scene-04').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-04');
		resizeCanvas(820, 820);
		// move the webcam monitor over
		sample.hide();
		// resize video for a larger preview this time
		// sample.size(666, 500);
		button = select('#save-button');
		button.removeClass('primary');
		button.html('Save');
		button.mousePressed(() => {
			startPreroll();
		});
		fft = new p5.FFT();
	};

	// --4draw
	this.draw = function () {
		background(255);

		mirror();

		playModifiedShape3(voiceHistory);
	};
}
