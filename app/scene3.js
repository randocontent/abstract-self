function scene03() {
	// --enter
	this.enter = function () {
		if (posenet) {
			posenet.removeAllListeners();
			poses = null;
		}
		faceapiStandby = true;
		fft = new p5.FFT();
		startMic();
		vf.hide();

		resetRecVariables()
		chooseScene('#scene-03')
		resizeCanvas(820, 820);
		canvas.parent('#canvas-03');
		button = select('#record-button-03');
		button.removeClass('primary');
		button.html('Record');
		button.mousePressed(() => {
			noPreroll();
		});
	};

	// --3draw
	this.draw = function () {
		if (mic) fft.setInput(mic);
		// Number of bins can only be a power of 2
		let bins = pow(2, ceil(log(par.audioResolution) / log(2)));
		let spectrum = fft.analyze(bins);

		background(255);
		mirror(); // Mirror canvas to match mirrored video

		if (!full) playShape3(expressionHistory, spectrum);
		if (full) playModifiedShape3(voiceHistory);
		if (par.frameRate) fps()
	};

}

function voiceNet(points, level) {
	let newArr = [];
	let phase = 0.0;
	points.forEach((p, i) => {
		let x, y;
		let offset = 0;
		if (level) {
			if (level[0]) {
				offset = map(level[0], 0, 255, -50, 50);
			}
		}
		x = p[0] + phase + offset * sin(i);
		y = p[1] + phase + offset * cos(i);
		newArr.push([x, y]);
	});
	phase += par.phaseMaxOffset;
	return newArr;
}

function recordVoice(history) {
	voiceHistory.push(history);
	setCounter(voiceHistory.length);
	if (voiceHistory.length === par.framesToRecord) finishRecording();
}


function playShape3(history, spectrum) {
	let cp = frameCount % history.length;
	drawShape3(history[cp], spectrum);
}

// `history` will have an array of expanded points from the previous scene
// (expression data will already be factored into it)
function drawShape3(history, spectrum) {
	// let concave = map(level, 0, 255, 50, 500);
	// let expanded = faceBodyNet(history, spectrum);
	let expanded = voiceNet(history, spectrum);

	hullSet = hull(expanded, par.roundness);
	if (rec) recordVoice(hullSet);

	push();
	stroke(255);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	hullSet.forEach(p => {
		if (par.showCurves) {
			curveVertex(p[0], p[1]);
		} else {
			vertex(p[0], p[1]);
		}
	});

	endShape(CLOSE);
	pop();
}

function expand3(points, levels) {
	let newArr = [];

	points.forEach(p => {
		let iterator = frameCount % par.audioResolution;
		let level = levels[iterator];
		let offset = map(level, 0, 255, -15, 15);
		let newP = [p[0] + offset, p[1]];
		newArr.push(newP);
	});

	return newArr;
}

function playModifiedShape3(history) {
	let cp = frameCount % history.length;
	drawModifiedShape3(history[cp]);
}

function drawModifiedShape3(history) {
	push();
	stroke(255);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	hullSet.forEach(p => {
		if (par.showCurves) {
			curveVertex(p[0], p[1]);
		} else {
			vertex(p[0], p[1]);
		}
	});

	endShape(CLOSE);
	pop();
}
