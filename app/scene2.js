// --2 face

function scene02() {
	this.enter = function () {
		// Entering this scene, cleanup the last one
		full = false;
		rec = false;
		preroll = false;
		play = false;
		phase = 0.0;
		// Should stop posenet?
		posenet.removeAllListeners();
		poses[0] = null;
		// hide the other scenes
		select('#scene-01').addClass('hidden');
		// show this scene
		select('#scene-02').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-02');
		vf.parent('#webcam-monitor-02');
		button = select('#record-button-02');
		button.removeClass('primary');
		button.html('Record');
		faceapi = ml5.faceApi(sample, faceOptions, faceReady);
		button.mousePressed(() => {
			noPreroll();
		});
	};

	// --2draw
	this.draw = function () {
		background(255);
		// Mirror canvas, to match the mirrored video
		mirror();

		if (sample) {
			// vs is 500x470 but feed is 627x470
			vf.image(sample, -50, 0);
		}
		// noPreroll();

		if (full) playShape3(expressionHistory2);

		if (detections && !full) {
			graphExpressions();
			playShape2(poseHistory);
		}

		// TODO: starte getting faceapi ready when we finish recording in scene01
		if (faceapiLoading) {
			push();
			// Unmirror so we can write in the right direction
			mirror();
			textAlign(CENTER);
			text('waiting for faceapi', width / 2, height / 2);
			pop();
		}
	};
	// this.counter = function () {};
}

// Gets array of posenet poses
function playShape2(history) {
	// Use the current frame counter as an iterator for looping through the recorded array
	let cp = frameCount % history.length;
	drawShape2(history[cp]);
	if (rec && detections) recordExpression2(detections, history[cp]);
	// Reset recorded state after finishing playback
	if (cp === history.length - 1) loopPlayback();
}

function drawShape2(points) {
	retargetAnchorsFromPose(points);
	let happy,
		surprised = 0.5;
	if (detections) {
		if (detections[0]) {
			happy = detections[0].expressions.happy;
			surprised = detections[0].expressions.surprised;
		}
	}
	expanded = faceBodyNet(anchors, happy + surprised);
	if (par.showExpanded) {
		push();
		stroke('paleturquoise');
		strokeWeight(5);
		expanded.forEach(p => {
			point(p[0], p[1]);
		});
		pop();
	}

	if (rec && detections) recordExpression2(expanded);
	hullSet = hull(expanded, par.roundness);

	push();
	stroke(255);
	if (!par.showPreview) stroke(0);
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

function star(x, y, radius1, radius2, npoints) {
	let newArr = [];
	let xoff = x
	let yoff = y
	let offStep = 0.01
	push()
	angleMode(RADIANS)
	let angle = TWO_PI / npoints;
	let halfAngle = angle / 2.0;
	for (let a = 0; a < TWO_PI; a += angle) {
		let sx = map(noise(xoff,yoff),0,1,-10,10) + x + cos(a) * radius2;
		xoff+=offStep
		let sy = map(noise(xoff,yoff),0,1,-10,10) + y + sin(a) * radius2;
		yoff+=offStep
		newArr.push([sx, sy]);
		sx = x + cos(a + halfAngle) * radius1;
		sy = y + sin(a + halfAngle) * radius1;
		newArr.push([sx, sy]);
	}
	pop()
	return newArr
}

function starBodyNet(pose, fExp) {
	// console.log('faceBodyNet')
	// [{pos,part}...]
	// Needs an array of objects that have pos.x,pos.y,part
	// Will add points around the skeleton to increase the surface area
	let newArr = [];

	// We'll use these later for the torso
	let l1, l2, r1, r2;

	pose.forEach((p, i) => {
		// console.log(p)
		switch (p.part) {
			case 'nose':
				// function expandBlob(point, angles, minr, maxr, maxx,maxy, maxoff, texp) {
				newArr = newArr.concat(star(p.pos.x,p.pos.y,par.innerStar,par.outerStar,par.starPoints));
				break;
			// case 'leftEar':
			// case 'rightEar':
			// case 'leftEye':
			// case 'rightEye':
			case 'leftShoulder':
			case 'rightShoulder':
			case 'leftElbow':
			case 'rightElbow':
			case 'leftWrist':
			case 'rightWrist':
			case 'leftHip':
			case 'rightHip':
			case 'leftKnee':
			case 'rightKnee':
			case 'leftAnkle':
			case 'rightAnkle':
			default:
				if (!par.noseOnly) newArr = newArr.concat(star(p.pos.x,p.pos.y,par.innerStar,par.outerStar,par.starPoints));
				break;
		}
	});

	return newArr;
}

function faceBodyNet(pose, fExp) {
	// console.log('faceBodyNet')
	// [{pos,part}...]
	// Needs an array of objects that have pos.x,pos.y,part
	// Will add points around the skeleton to increase the surface area
	let newArr = [];

	// We'll use these later for the torso
	let l1, l2, r1, r2;

	pose.forEach((p, i) => {
		// console.log(p)
		switch (p.part) {
			case 'nose':
				// function expandBlob(point, angles, minr, maxr, maxx,maxy, maxoff, texp) {
				newArr = newArr.concat(expandBlob(p, 1, 1, 200, 2, 4, 0.05, i, fExp));
				break;
			case 'leftEar':
			case 'rightEar':
				newArr = newArr.concat(expandBlob(p, 5, 5, 50, 2, 4, 0.01, i, fExp));
				break;
			case 'leftEye':
			case 'rightEye':
				newArr.push([p.pos.x, p.pos.y]);
				break;
			// Arms
			case 'leftShoulder':
				l1 = createVector(p.pos.x, p.pos.y);
				newArr = newArr.concat(expandBlob(p, 5, 5, 150, 2, 4, 0.01, i, fExp));
				break;
			case 'rightShoulder':
				r1 = createVector(p.pos.x, p.pos.y);
				newArr = newArr.concat(expandBlob(p, 5, 5, 150, 2, 4, -0.01, i, fExp));
				break;
			// case 'leftElbow':
			// case 'rightElbow':
			// case 'leftWrist':
			// case 'rightWrist':
			case 'leftHip':
				l2 = createVector(p.pos.x, p.pos.y);
				newArr = newArr.concat(expandBlob(p, 10, 5, 50, 2, 4, 0.02, i, fExp));
				break;
			case 'rightHip':
				r2 = createVector(p.pos.x, p.pos.y);
				newArr = newArr.concat(expandBlob(p, 10, 5, 50, 2, 4, -0.02, i, fExp));
				break;
			// case 'leftKnee':
			// case 'rightKnee':
			// case 'leftAnkle':
			// case 'rightAnkle':
			default:
				newArr = newArr.concat(expandBlob(p, 5, 5, 100, 2, 4, 0.01, i, fExp));
				break;
		}
	});

	// Torso
	let leftSide = p5.Vector.lerp(l1, l2, 0.5);
	let rightSide = p5.Vector.lerp(r1, r2, 0.5);
	let middle1 = p5.Vector.lerp(l1, r1, 0.5);
	let middle2 = p5.Vector.lerp(l2, r2, 0.5);

	newArr = newArr.concat(
		expandBlob(leftSide, 5, 1, 100, 2, 4, 0.001, -1, fExp)
	);
	newArr = newArr.concat(
		expandBlob(rightSide, 5, 1, 100, 2, 4, 0.001, -2, fExp)
	);
	newArr = newArr.concat(expandBlob(middle1, 5, 1, 100, 2, 4, 0.001, -3, fExp));
	newArr = newArr.concat(expandBlob(middle2, 5, 1, 100, 2, 4, 0.001, -4, fExp));

	return newArr;
}

function expandBlob(point, angles, minR, maxR, maxX, maxY, maxOff, i, fExp) {
	// console.log('texp')
	// console.log(texp)
	// console.log('maxr')
	// console.log(maxr)
	// console.log('minr')
	// console.log(minr)
	// console.log('nmax')
	// console.log(nmax)
	// console.log('point')
	// console.log(point)
	let x, y;
	let px, py;
	let newArr = [];
	if (point.x) {
		px = point.x;
		py = point.y;
	} else if (point.position) {
		px = point.position.x;
		py = point.position.y;
	} else if (point.pos) {
		px = point.pos.x;
		py = point.pos.y;
	} else if (point[0]) {
		px = point[0];
		py = point[1];
	}
	if (!fExp) fExp = par.emotionalScale;
	let effect = fExp;

	console.log(effect);
	for (let a = 0; a < 360; a += angles) {
		let xoff = map(cos(a + phase), -1, 1, 0, maxX * effect) + i;
		let yoff = map(sin(a + phase), -1, 1, 0, maxY * effect) + i;
		let r = map(noise(xoff, yoff, zoff), 0, 1, minR * effect, maxR * effect);
		x = px + r * cos(a);
		y = py + r * sin(a);
		newArr.push([x, y]);
	}
	let pOff = map(noise(zoff), 0, 1, 0, maxOff * effect);
	phase += pOff;
	zoff += par.zNoiseOffset;
	// console.log(newArr)
	return newArr;
}

function graphExpressions() {
	let expressions;

	push();
	translate(width, 0);
	scale(-1, 1);

	if (detections) {
		if (detections.length > 0) {
			({ expressions } = detections[0]);
			let keys = Object.keys(expressions);
			keys.forEach((item, idx) => {
				textAlign(RIGHT);
				text(item, 90, idx * 20 + 22);
				const val = map(expressions[item], 0, 1, 0, 100);
				text(floor(val), 140, idx * 20 + 22);
				rect(160, idx * 20 + 10, val, 15);
				textAlign(LEFT);
			});
		}
	}

	let sortedExpressions;

	if (expressions) {
		sortedExpressions = Object.entries(expressions);
		sortedExpressions.sort((a, b) => {
			return b[1] - a[1];
		});
		expression = sortedExpressions[0][0];
		textAlign(CENTER);
		textSize(18);
		text(expression, width / 2, height - 20);
	}
	pop();
}

function recordExpression2(history) {
	expressionHistory2.push(history);
	setCounter(expressionHistory2.length);
	if (expressionHistory2.length === par.framesToRecord) finishRecording();
}

function playModifiedShape2(history) {
	// Use the current frame counter as an iterator for looping through the recorded array
	let cp = frameCount % history.length;
	drawModifiedShape2(history[cp]);
	// Reset recorded state after finishing playback
	// if (cp === history.length - 1) loopPlayback();
}

// only gets called with expressionHistory?
function drawModifiedShape2(points) {
	let hpoints = points.pose;
	let hexp = points.exp;
	retargetAnchorsFromPose(hpoints);
	expanded = expand2(points);
	hullSet = hull(expanded, par.roundness);

	push();
	stroke(255);
	if (!par.showPreview) stroke(0);
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
