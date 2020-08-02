class Paramaterize {
	constructor() {
		this.scene = 1;
		this.minR = 33; // scene 0
		this.maxR = 66; // scene 0
		this.xNoiseMax = 2; // scene 0
		this.yNoiseMax = 2; // scene 0
		this.zNoiseOffset = 0.01; // scene 0
		this.phaseOffset = 0.001; // scene 0
		this.inc = 26;
		this.blobR = 100;
		this.showPose = false;
		this.showExpanded = false;
		this.showHull = false;
		this.showPreview = false;
		this.showAnchors = false;
		this.showAbstract = true;
		this.showAbstractFill = false;
		this.showCurves = true;
		this.isHeadOnly = true;
		this.numAnchors = 20;
		this.topSpeed = 10;
		this.maxForce = 10;
		this.autoRadius = true;
		this.autoRadiusRatio = 1.2;
		this.noiseStep = 0.001;
		this.concave = 1000;
		this.sampleSpeed = 0.5;
		this.recLength = 50;
	}
}

par = new Paramaterize();

let gui = new dat.GUI({ autoPlace: false });
let customContainer = document.getElementById('dat-gui-container');
customContainer.appendChild(gui.domElement);

let sceneGui = gui.add(par, 'scene');
sceneGui.onFinishChange(() => {
	gotoScene();
});
gui.add(par, 'minR');
gui.add(par, 'minR');
gui.add(par, 'maxR');
gui.add(par, 'xNoiseMax');
gui.add(par, 'yNoiseMax');
gui.add(par, 'zNoiseOffset');
gui.add(par, 'phaseOffset');
gui.add(par, 'inc');
gui.add(par, 'blobR');
gui.add(par, 'showPose');
gui.add(par, 'showExpanded');
gui.add(par, 'showHull');
gui.add(par, 'showPreview');
gui.add(par, 'showAnchors');
gui.add(par, 'showAbstract');
gui.add(par, 'showAbstractFill');
gui.add(par, 'showCurves');
gui.add(par, 'isHeadOnly');
gui.add(par, 'numAnchors');
gui.add(par, 'topSpeed');
gui.add(par, 'maxForce');
gui.add(par, 'autoRadius');
gui.add(par, 'autoRadiusRatio');
gui.add(par, 'noiseStep');
gui.add(par, 'concave');
gui.add(par, 'sampleSpeed', 0.1, 2, 0.1);
gui.add(par, 'recLength', 10, 10000, 1);

gui.close();

const NOSE = 0;
const LEFTEYE = 1;
const RIGHTEYE = 2;
const LEFTEAR = 3;
const RIGHTEAR = 4;
const LEFTSHOULDER = 5;
const RIGHTSHOULDER = 6;
const LEFTELBOW = 7;
const RIGHTELBOW = 8;
const LEFTWRIST = 9;
const RIGHTWRIST = 10;
const LEFTHIP = 11;
const RIGHTHIP = 12;
const LEFTKNEE = 13;
const RIGHTKNEE = 14;
const LEFTANKLE = 15;
const RIGHTANKLE = 16;

const PARTS = [
	'nose',
	'leftEye',
	'rightEye',
	'leftEar',
	'rightEar',
	'leftShoulder',
	'rightShoulder',
	'leftElbow',
	'rightElbow',
	'leftWrist',
	'rightWrist',
	'leftHip',
	'rightHip',
	'leftKnee',
	'rightKnee',
	'leftAnkle',
	'rightAnkle',
];

// --posenet

let canvas, status;
let webcamPreview;
let button;

let sceneReady = false;
let recorded = false;
let recording = false;
let playback = false;

let rec = false;
let play = false;
let replay = false;
let full = false;
// let recLength = 100; // in frames

let posenet;
let poses = [];
let posesHistory = [];
let history1 = [];
let history2 = [];
let expressionHistory = [];
let options = { maxPoseDetections: 2 };

let numAnchors = 50;
let points = [];
let anchors = [];
let expanded = [];
let hullSet = [];

let phase = 0.0;
let noiseMax = 1;
let zoff = 0.0;

let eyeDist;
let shoulderDist;
let hipDist;
let eyeShoulderRatio;
let eyeWaistRatio;
let shoulderWaistRatio;

// --faceapi

let faceapi;
let detections = [];
let expression;

const faceOptions = {
	withLandmarks: false,
	withExpressions: true,
	withDescriptors: false,
};

let mgr, g;
p5.disableFriendlyErrors = true;

function setup() {
	mgr = new SceneManager();

	// // Preload scenes. Preloading is normally optional
	// // ... but needed if showNextScene() is used.
	mgr.addScene(scene00);
	mgr.addScene(scene01);
	mgr.addScene(scene02);

	canvas = createCanvas(350, 350);
	canvas.parent('#canvas-01');

	background(255);

	// --b

	select('#begin-button').mousePressed(() => {
		mgr.showScene(scene01);
	});
	select('#record-button-01').mousePressed(() => {
		startRecording();
	});
	select('#record-button-02').mousePressed(() => {
		startRecording();
	});

	startWebcam(false, 467, 350);
	gotoScene();
}

function draw() {
	mgr.draw();
}

function gotoScene() {
	switch (par.scene) {
		case 0:
			mgr.showScene(scene00);
			break;
		case 1:
			mgr.showScene(scene01);
			break;
		default:
			break;
	}
}

function startWebcam(autoSize, sw, sh) {
	sample = createCapture(VIDEO, webcamReady);
	if (!autoSize) {
		sample.size(sw, sh);
	}
	// TODO - too ugly
	sample.parent('#webcam-monitor-0' + par.scene);
}

function webcamReady() {
	console.log('webcamReady');
	posenet = ml5.poseNet(sample, options, modelReady);
	posenet.on('pose', function (results) {
		poses = results;
		sceneReady = true;
	});
}

function modelReady() {
	console.log('modelReady');
}

// takes an array of posenet keypoints
function retargetAnchorsFromPose(targets) {
	// TODO: mark anchors, text or color or something
	anchors.forEach((a, i) => {
		if (targets[i]) {
			let v = createVector(targets[i].position.x, targets[i].position.y);
			a.setTarget(v);
		} else {
			let v = createVector(targets[0].position.x, targets[0].position.y);
			a.setTarget(v);
		}
		a.behaviors();
		a.update();
		if (par.showAnchors) a.show();
	});
}

function refreshAnchors() {
	anchors.forEach(a => {
		a.behaviors();
		a.update();
		if (par.showAnchors) a.show();
	});
}

// Takes anchors and returns 2D array of points for hull()
// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
function expand1(pose) {
	let newArr = [];
	let xoff = 0.0;
	let yoff = 0.0;

	pose.forEach(p => {
		for (let angle = 0; angle < 360; angle += par.angles) {
			let n = noise(xoff, yoff);
			let radius;
			if (par.autoRadius) {
				if (p.part === 'nose') {
					radius = eyeDist * par.autoRadiusRatio * 2.5;
				} else {
					radius = eyeDist * par.autoRadiusRatio;
				}
			} else {
				if (p.part === 'nose') {
					radius = par.radius * 2.5;
				} else {
					radius = par.radius;
				}
			}

			let x = p.pos.x + n + radius * sin(angle);
			let y = p.pos.y + n + radius * cos(angle);

			let newP = [x, y];
			newArr.push(newP);
			xoff += par.noiseStep;
			yoff += par.noiseStep;
		}
	});

	return newArr;
}

function expand2(pose) {
	let newArr = [];
	let xoff = 0.0;
	let yoff = 0.0;

	let happy, surprised;

	if (detections) {
		if (detections[0]) {
			// ({ expressions } = detections[0]);
			happy = detections[0].expressions.happy;
			surprised = detections[0].expressions.happy;
		}
	}

	pose.forEach(p => {
		for (let angle = 0; angle < 360; angle += par.angles) {
			let n = noise(xoff, yoff);
			let radius;
			if (par.autoRadius) {
				if (p.part === 'nose') {
					radius = eyeDist * par.autoRadiusRatio * 2.5;
				} else {
					radius = eyeDist * par.autoRadiusRatio;
				}
			} else {
				if (p.part === 'nose') {
					radius = par.radius * 2.5;
				} else {
					radius = par.radius;
				}
			}

			radius = map(happy, 0, 1, 200, 50);

			let x = p.pos.x + n + radius * sin(angle);
			let y = p.pos.y + n + radius * cos(angle);

			let newP = [x, y];
			newArr.push(newP);
			xoff += par.noiseStep;
			yoff += par.noiseStep;
		}
	});

	return newArr;
}
// Gets a posenet pose and returns distance between two points
function poseDist(pose, a, b) {
	let left = createVector(pose[a].position.x, pose[a].position.y);
	let right = createVector(pose[b].position.x, pose[b].position.y);
	return p5.Vector.dist(left, right);
}

// Gets a posenet pose and returns eye distance
function checkEyeDist(pose) {
	// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
	// 1	leftEye, 2	rightEye
	let left = createVector(pose[1].position.x, pose[1].position.y);
	let right = createVector(pose[2].position.x, pose[2].position.y);
	return p5.Vector.dist(left, right);
}

// Gets a posenet pose and returns eye-should ratio
function checkEyeShoulderRatio() {
	// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
	//  1	leftEye
	//  2	rightEye
	//  5	leftShoulder
	//  6	rightShoulder
}

function drawAbstractShape() {
	if (par.showAbstractFill) {
		stroke(0);
		strokeWeight(10);
		fill(255);
	} else {
		stroke(0);
		strokeWeight(8);
		noFill();
	}
	beginShape();
	anchors.forEach(a => {
		if (par.showCurves) {
			curveVertex(a.pos.x, a.pos.y);
		} else {
			vertex(a.pos.x, a.pos.y);
		}
	});
	endShape(CLOSE);
}

function makePointSet(vArr) {
	let set = [];
	vArr.forEach(v => {
		let pt = [v.x, v.y];
		set.push(pt);
	});
	return set;
}

// =============================================================
// =                         BEGIN SCENES                      =
// =============================================================

// --0 intro

function scene00() {
	this.enter = function () {
		// Hide previous scene
		select('#scene-01').addClass('hidden');
		// show this scene
		select('#scene-00').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-00');
		// move the webcam monitor over
		sample.parent('#webcam-monitor-00');
		// resize video to fit previe frame
		sample.size(467, 350);
	};

	this.draw = function () {
		if (sceneReady) {
			background(255);
			if (poses[0]) {
				let p = createVector(poses[0].pose.nose.x, poses[0].pose.nose.y);
				push();
				let pad = constrain(par.maxR * 2, 0, width / 3);
				let fx = map(p.x, 0, width, width, 0);
				let cx = constrain(fx, pad, width - pad);
				let cy = constrain(p.y, pad, height - pad);

				translate(cx, cy);
				stroke(0);
				strokeWeight(2);
				noFill();
				beginShape();
				for (let a = 0; a < TWO_PI; a += radians(par.inc)) {
					let xoff = map(cos(a + phase), -1, 1, 0, par.xNoiseMax);
					let yoff = map(sin(a + phase), -1, 1, 0, par.yNoiseMax);
					let r = map(noise(xoff, yoff, zoff), 0, 1, par.minR, par.maxR);
					let x = r * cos(a);
					x = x;
					let y = r * sin(a);
					curveVertex(x, y);
				}

				endShape(CLOSE);
				phase += par.phaseOffset;
				zoff += par.zNoiseOffset;
				pop();
			}
		}
	};
}

// --1 pose

function scene01() {
	// Will run when entering the scene, seems like a good place to do clean up
	// from the previous one
	this.enter = function () {
		// hide the other scenes
		select('#scene-00').addClass('hidden');
		// show this scene
		select('#scene-01').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-01');
		resizeCanvas(820, 820);
		// move the webcam monitor over
		sample.parent('#webcam-monitor-01');
		// resize video for a larger preview this time
		sample.size(666, 500);
		button = select('#record-button-01');
	};

	this.setup = function () {
		// Prepare anchors to chase the shape
		PARTS.forEach(p => {
			let anchor = new Anchor(width / 2, height / 2);
			anchor.part = p;
			anchors.push(anchor);
		});
	};

	// --1draw
	this.draw = function () {
		background(255);
		translate(width, 0);
		scale(-1, 1);

		if (sample) sample.speed(par.sampleSpeed);

		if (sample && par.showPreview) {
			image(sample, 0, 0);
		}

		if (play) playShape(history1);

		if (poses) {
			if (poses[0]) {
				let pose = poses[0].pose.keypoints;

				deriveProportions(pose);

				if (rec) recordPose(pose);

				if (replay) {
					playShape(history1);
				} else {
					drawShape(pose);
				}

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
					stroke('teal');
					strokeWeight(5);
					expanded.forEach(p => {
						point(p[0], p[1]);
					});
					pop();
				}
			}
		}
	};
	// this.counter = function () {};
}

// --2 face

function scene02() {
	this.enter = function () {
		// Entering this scene, cleanup the last one
		full = false;
		// remove posenet listeners
		posenet.removeAllListeners();
		poses[0] = null;
		// hide the other scenes
		select('#scene-01').addClass('hidden');
		// show this scene
		select('#scene-02').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-02');
		resizeCanvas(820, 820);
		// move the webcam monitor over
		sample.parent('#webcam-monitor-02');
		// resize video for a larger preview this time
		sample.size(666, 500);
		button = select('#record-button-02');
		button.removeClass('primary');
		button.html('Record');
		faceapi = ml5.faceApi(sample, faceOptions, faceReady);
	};

	this.setup = function () {
		// What's the difference between .enter() and .setup()? Does .setup() get run for all scenes when we start?
	};

	// --2draw
	this.draw = function () {
		button.mousePressed(() => {
			console.log('button 2');
			startRecording();
		});

		background(255);
		translate(width, 0);
		scale(-1, 1);

		if (full) {
			playShapeWithFace(history1);
		} else if (replay) {
			playShapeWithFace(history1);
		}

		if (detections) {
			graphExpressions();
			if (rec) recordExpressions(detections);
		}
	};
	// this.counter = function () {};
}


// --3 speech

function scene03() {
	this.enter = function () {
		// Entering this scene, cleanup the last one
		full = false;
		// Remove faceapi listeners?
		// hide the other scenes
		select('#scene-02').addClass('hidden');
		// show this scene
		select('#scene-03').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-03');
		resizeCanvas(820, 820);
		// move the webcam monitor over
		sample.parent('#webcam-monitor-03');
		// resize video for a larger preview this time
		sample.size(666, 500);
		button = select('#record-button-03');
		button.removeClass('primary');
		button.html('Record');
	};

	this.setup = function () {
		// What's the difference between .enter() and .setup()? Does .setup() get run for all scenes when we start?
	};

	// --2draw
	this.draw = function () {
		button.mousePressed(() => {
			console.log('button 3');
			startRecording();
		});

		background(255);
		translate(width, 0);
		scale(-1, 1);

		if (full) {
			playShapeWithFace(history1);
		} else if (replay) {
			playShapeWithFace(history1);
		}

	};
}

// --f

function startRecording() {
	console.log('startRecording');
	if (!full) {
		rec = true;
		replay = false;
		play = false;
		button.addClass('rec');
		// TODO start counter?
	}
}

function recordPose(points) {
	history1.push(points);
	setCounter(history1.length);
	if (history1.length === par.recLength) finishRecording();
}

function setCounter(count) {
	// Easier than trying to figure out which counter is shown...
	let counters = selectAll('.counter');
	counters.forEach(counter => {
		counter.html(count);
	});
}

function finishRecording() {
	console.log('finishRecording');
	// TODO localStorage?
	rec = false;
	full = true;
	play = true;
	button.removeClass('rec');
	button.addClass('primary');
	button.html('Next');
	button.mousePressed(() => {
		console.log('button 1 next');
		mgr.showNextScene();
	});
	let counters = selectAll('.counter');
	counters.forEach(counter => {
		counter.html('redo');
	});
}

function playShape(history) {
	// Use the current frame counter as an iterator for looping through the recorded array
	let cp = frameCount % history.length;
	drawShape(history[cp]);
	// Reset recorded state after finishing playback
	if (cp === history.length - 1) loopPlayback();
}

function playShapeWithFace(history) {
	// Use the current frame counter as an iterator for looping through the recorded array
	let cp = frameCount % history.length;
	drawShapeWithFace(history[cp]);
	// Reset recorded state after finishing playback
	if (cp === history.length - 1) loopPlayback();
}

function loopPlayback() {
	console.log('loopPlayback');
	play = false;
	replay = true;
	// TODO add an event for the next button
	// TODO change the counter to a Redo button
}

function drawShape(points) {
	retargetAnchorsFromPose(points);
	expanded = expand1(anchors);
	hullSet = hull(expanded, par.concave);

	push();
	stroke(255);
	if (!par.showPreview) stroke(0);
	strokeWeight(6);
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

function drawShapeWithFace(points) {
	retargetAnchorsFromPose(points);
	expanded = expand2(anchors);
	hullSet = hull(expanded, par.concave);

	push();
	stroke(255);
	if (!par.showPreview) stroke(0);
	strokeWeight(6);
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

function deriveProportions(pose) {
	eyeDist = floor(poseDist(pose, LEFTEYE, RIGHTEYE));
	shoulderDist = floor(poseDist(pose, LEFTSHOULDER, RIGHTSHOULDER));
	hipDist = floor(poseDist(pose, LEFTHIP, RIGHTHIP));
}

function faceReady() {
	faceapi.detect(gotFaces);
}

function gotFaces(error, result) {
	if (error) {
		console.log(error);
		return;
	}
	detections = result;
	faceapi.detect(gotFaces);
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

function emotionalPoints(pArr) {
	let happy, surprised;

	if (detections) {
		if (detections[0]) {
			// ({ expressions } = detections[0]);
			happy = detections[0].expressions.happy;
			surprised = detections[0].expressions.happy;
		}
	}

	pArr.forEach(p => {
		p[0] = p[0] + map(happy, 0, 1, -100, 100);
		p[1] = p[1] + map(surprised, 0, 1, 100, 300);
	});

	return pArr;
}

function recordExpressions(exp) {
	console.log('recordExpressions');
	history2.push(anchors);
	expressionHistory.push(exp);
	setCounter(history2.length);
	if (history2.length === par.recLength) finishRecording();
}
