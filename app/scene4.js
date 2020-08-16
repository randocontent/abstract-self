function scene04() {
	this.enter = function () {
		dbg('scene04');
		frameRate(par.frameRate);
		// ----- clean-up from previous scenes
		noseAnchor = '';
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
			isPosenetReady = false;
		}
		isFaceapiStandby = true;
		sample.size(668, 500);
		sample.hide();

		// -----load a prerecordeded dataset if there's nothing from step 1
		// dancer.js should be a posenet recording of a person dancing. It
		// also stores skeleton data so we're extracting just the poses first
		if (history1.length === 0) {
			recordedPose.forEach(p => {
				if (p) history1.push(p.pose.keypoints);
			});
		}

		// check results of previous steps
		if (history2) {
			finalShapeType = analyzeExpressionHistory(history2);
		} else {
			finalShapeType = 'softer'
		}
		if (history3) {
			finalScale = analyzeVoiceHistory(history3)
		} else {
			finalScale = .2
		}

		// -----page
		select('body').addClass('light');
		sketchCanvas.parent('#canvas-04');
		resizeCanvas(820, 820);

		// -----ui
		recButton = select('#save-button');
		// recButton.addClass('primary')
		// recButton.hide();
		restartButton = select('#restart-button');
		restartButton.mousePressed(refreshPage);

		// -----scene management
		chooseScene('#scene-04');
	};

	// --4draw
	this.draw = function () {
		// -----prepare the frame
		background(colors.primary);
		// mirror the canvas to match the mirrored video from the camera
		translate(width, 0);
		scale(-1, 1);

		// Replay the final resulting shape
		replayShape3(history1, finalShapeType, finalScale);

		// -----admin
		if (par.frameRate || par.debug) {
			push();
			mirror();
			fps();
			pop();
		}
	};
}

function refreshPage() {
	location.replace('/');
}
