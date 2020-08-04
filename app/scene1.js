function scene01() {
	// Will run when entering the scene, seems like a good place to do clean up
	// from the previous one
	this.enter = function () {
		noseAnchor = '';
		// hide the other scenes
		select('#scene-00').addClass('hidden');
		// show this scene
		select('#scene-01').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-01');
		resizeCanvas(820, 820);
		// move the webcam monitor over
		// sample.parent('#webcam-monitor-01');
		// resize video for a larger preview this time
		sample.size(627, 470);
		sample.hide();

		vf.parent('#webcam-monitor-01');
		vf.show();
		button = select('#record-button-01');
		// Prepare anchors to chase posenet points
		PARTS.forEach(p => {
			let anchor = new Anchor(width / 2, height / 2, p);
			anchors.push(anchor);
		});
	};

	this.setup = function () {};

	// --1draw
	this.draw = function () {
		background(255);
		translate(width, 0);
		scale(-1, 1);

		if (sample) {
			// vs is 500x470 but feed is 627x470
			vf.image(sample, -50, 0);
		}

		playPreroll();

		if (play && !preroll) playShape(poseHistory);

		if (poses) {
			if (poses[0]) {
				let pose = poses[0].pose.keypoints;

				// Draw skeleton in vf
				if (!preroll) previewSkeleton(poses[0]);

				// Draw pose for reference
				if (par.showPose) {
					push();
					stroke('red');
					strokeWeight(10);
					pose.forEach(p => {
						point(p.position.x, p.position.y);
					});
					pop();
				}

				// Draw expanded points for reference
				if (par.showExpanded) {
					push();
					stroke('paleturquoise');
					strokeWeight(5);
					expanded.forEach(p => {
						point(p[0], p[1]);
					});
					pop();
				}

				deriveProportions(pose);

				if (rec) recordPose(pose);

				if (!full) drawShape(pose);
			}
		}
	};
	// this.counter = function () {};
}

function playShape(history) {
	// Use the current frame counter as an iterator for looping through the recorded array
	let cp = frameCount % history.length;
	drawShape(history[cp]);
	// Reset recorded state after finishing playback
	if (cp === history.length - 1) loopPlayback();
}

// Draws an outline based on posenet keypoints
function drawShape(points) {
	retargetAnchorsFromPose(points);
	expanded = bodyNet(anchors, par.happy);
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

function bodyNet(pose) {
	let newArr = [];

	// We'll use these later for the torso
	let l1, l2, r1, r2;

	pose.forEach((p, i) => {
		// console.log(p)
		switch (p.part) {
			case 'nose':
				newArr = newArr.concat(expandEllipse(p, 120, 120, 30));
				break;
			case 'leftEar':
			case 'rightEar':
				newArr = newArr.concat(expandEllipse(p, 50, 50));
				break;
			case 'leftEye':
			case 'rightEye':
				newArr.push([p.pos.x, p.pos.y]); // no expansion
				break;
			// Arms
			case 'leftShoulder':
				l1 = createVector(p.pos.x, p.pos.y);
				newArr = newArr.concat(expandEllipse(p, 50, 50, 54));
				break;
			case 'rightShoulder':
				r1 = createVector(p.pos.x, p.pos.y);
				newArr = newArr.concat(expandEllipse(p, 50, 50, 54));
				break;
			// case 'leftElbow':
			// case 'rightElbow':
			// case 'leftWrist':
			// case 'rightWrist':
			case 'leftHip':
				l2 = createVector(p.pos.x, p.pos.y);
				newArr = newArr.concat(expandEllipse(p, 50, 50, 54));
				break;
			case 'rightHip':
				r2 = createVector(p.pos.x, p.pos.y);
				newArr = newArr.concat(expandEllipse(p, 50, 50, 54));
				break;
			// case 'leftKnee':
			// case 'rightKnee':
			// case 'leftAnkle':
			// case 'rightAnkle':
			default:
				newArr.push([p.pos.x, p.pos.y]); // no expansion
				break;
		}
	});

	// Torso
	let leftSide = p5.Vector.lerp(l1, l2, 0.5);
	let rightSide = p5.Vector.lerp(r1, r2, 0.5);
	let middle1 = p5.Vector.lerp(l1, r1, 0.5);
	let middle2 = p5.Vector.lerp(l2, r2, 0.5);

	newArr = newArr.concat(expandEllipseXY(leftSide.x,leftSide.y, 50, 50, 54));
	newArr = newArr.concat(expandEllipseXY(rightSide.x,rightSide.y, 50, 50, 54));
	newArr = newArr.concat(expandEllipseXY(middle1.x,middle1.y, 50, 50, 54));
	newArr = newArr.concat(expandEllipseXY(middle2.x,middle2.y, 50, 50, 54));

	return newArr;
}

function recordPose(points) {
	poseHistory.push(points);
	setCounter(poseHistory.length);
	if (poseHistory.length === par.framesToRecord) finishRecording();
}

function expandEllipseXY(px,py, minr, maxr, angles) {
	if (!angles) angles = 30;
	let newX, newY;
	let newArr = [];
	for (let a = 0; a < 360; a += angles) {
		let r = random(minr, maxr);
		newX = px + r * cos(a);
		newY = py + r * sin(a);
		newArr.push([newX, newY]);
	}
	// console.log(newArr)
	return newArr;
}

function expandEllipse(point, minr, maxr, angles) {
	if (!angles) angles = 30;
	let x, y;
	let px, py;
	let newArr = [];
	if (point.position) {
		px = point.position.x;
		py = point.position.y;
	} else if (point.pos) {
		px = point.pos.x;
		py = point.pos.y;
	} else if (point[0]) {
		px = point[0];
		py = point[1];
	}
	for (let a = 0; a < 360; a += angles) {
		let r = random(minr, maxr);
		x = px + r * cos(a);
		y = py + r * sin(a);
		newArr.push([x, y]);
	}
	// console.log(newArr)
	return newArr;
}

function previewSkeleton(pose) {
	let skeleton;
	if (pose) {
		if (pose.skeleton[0]) {
			skeleton = pose.skeleton;

			// For every skeleton, loop through all body connections
			for (let j = 0; j < skeleton.length; j++) {
				let partA = skeleton[j][0];
				let partB = skeleton[j][1];
				vf.push();
				vf.translate(-50, 0);
				vf.stroke('#AFEEEE');
				vf.line(
					partA.position.x,
					partA.position.y,
					partB.position.x,
					partB.position.y
				);
				vf.ellipse(partA.position.x, partA.position.y, 5);
				vf.ellipse(partB.position.x, partB.position.y, 5);
				vf.pop();
			}
		}
	}
}
