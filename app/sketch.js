class Paramaterize {
	constructor() {
		this.scene = 0;
		this.framesToRecord = 100;
		this.shapeStrokeWeight = 2;

		this.minR = 44; // scene 0
		this.maxR = 66; // scene 0
		this.xNoiseMax = 1; // scene 0
		this.yNoiseMax = 1; // scene 0
		this.zNoiseOffset = 0.001; // scene 0
		this.phaseMaxOffset = 0.01; // scene 0
		this.nosePhaseMax = 1;
		this.inc = 12;

		this.noseMinRadius = 100;
		this.noseMaxRadius = 200;
		this.topSpeed = 10;
		this.maxAcc = 4;
		this.angles = 12;
		this.radius = 50;
		this.noseRadius = 120;
		this.noseYOffset = 55;
		this.earRadius = 35;
		this.wristRadius = 55;
		this.autoRadius = true;
		this.autoRadiusRatio = 0.5;
		this.manualRadiusRatio = 1;
		this.noseExpandRatio = 3.5;
		this.noiseLevel = 0.001;
		this.roundness = 250;
		this.emotionalScale = 2;
		this.mississippi = 260;

		this.showAnchors = true;
		this.showPose = false;
		this.showExpanded = false;
		this.showHull = true;
		this.showPreview = false;
		this.fillShape = false;
		this.showCurves = false;

		this.audioResolution = 32; // bins
	}
}

par = new Paramaterize();

let gui = new dat.GUI({ autoPlace: true });
// let customContainer =document.getElementById('dat-gui-container');
// customContainer.appendChild(gui.domElement);

let f1 = gui.addFolder('Blob');
let f2 = gui.addFolder('Pose');
let f3 = gui.addFolder('Face');
let f4 = gui.addFolder('Voice');
let f5 = gui.addFolder('Reference');

// let sceneGui = gui.add(par, 'scene');
// sceneGui.onFinishChange(() => {
// 	gotoScene();
// });

gui.add(par, 'framesToRecord', 10, 10000, 1);
gui.add(par, 'shapeStrokeWeight');

f1.add(par, 'minR');
f1.add(par, 'maxR');
f1.add(par, 'xNoiseMax');
f1.add(par, 'yNoiseMax');
f1.add(par, 'zNoiseOffset');
f1.add(par, 'phaseMaxOffset');
f1.add(par, 'inc');
f1.close();

let speedControl = f2.add(par, 'topSpeed');
let accControl = f2.add(par, 'maxAcc');
f2.add(par, 'angles');
f2.add(par, 'radius');
f2.add(par, 'noseRadius');
f2.add(par, 'noseYOffset');
f2.add(par, 'earRadius');
f2.add(par, 'wristRadius');
f2.add(par, 'noiseLevel');
f2.add(par, 'roundness');
f2.add(par, 'mississippi');
f2.add(par, 'emotionalScale');
speedControl.onFinishChange(() => updateAnchors());
accControl.onFinishChange(() => updateAnchors());
f2.close();

f4.add(par, 'audioResolution');

f5.add(par, 'showPose');
f5.add(par, 'showExpanded');
f5.add(par, 'showHull');
f5.add(par, 'showPreview');
f5.add(par, 'showAnchors');
f5.add(par, 'fillShape');
f5.add(par, 'showCurves');
f5.close();

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

let canvas, vf;
let status;
let sample, audioSample;
let webcamPreview;
let button;

let sceneReady = false;
let isAudioSampleReady = false;

let rec = false;
let preroll = false;
let play = false;
let full = false;
let prerollCounter = 0;

let posenet;
let poses = [];
let poseHistory = [];
let expressionHistory = [];
let expressionHistory2 = [];
let voiceHistory = [];
let options = { maxPoseDetections: 2 };

let noseAnchor;
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
let faceapiLoading = true;
let stopFaceapi = false;

const faceOptions = {
	withLandmarks: false,
	withExpressions: true,
	withDescriptors: false,
};

// --sound

let fft;
let mic;

let mgr, g;
p5.disableFriendlyErrors = true;

function setup() {
	angleMode(DEGREES);
	mgr = new SceneManager();

	// loadSample();
	// // Preload scenes. Preloading is normally optional
	// // ... but needed if showNextScene() is used.

	mgr.addScene(scene00);
	mgr.addScene(scene01);
	mgr.addScene(scene02);
	mgr.addScene(scene03);
	mgr.addScene(scene04);

	canvas = createCanvas(350, 350);
	canvas.parent('#canvas-01');

	vf = createGraphics(500, 470);
	vf.translate(vf.width, 0);
	vf.scale(-1, 1);

	background(255);

	// --b

	select('#begin-button').mousePressed(() => {
		mgr.showScene(scene01);
	});
	select('#record-button-01').mousePressed(() => {
		startPreroll();
	});
	select('#record-button-02').mousePressed(() => {
		startPreroll();
	});
	select('#record-button-02').mousePressed(() => {
		startPreroll();
	});

	// Prepare a dedicated anchor for the intro screen
	noseAnchor = new Anchor(width / 2, height / 2);

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

function startMic() {
	mic = new p5.AudioIn();
	mic.start();
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
	posenet = ml5.poseNet(sample, options, modelReady);
	posenet.on('pose', function (results) {
		poses = results;
		sceneReady = true;
	});
}

function modelReady() {}

function faceReady() {
	faceapi.detect(gotFaces);
}

function gotFaces(error, result) {
	if (error) {
		console.log(error);
		return;
	}
	detections = result;
	faceapiLoading = false;
	if (!stopFaceapi) faceapi.detect(gotFaces);
}

function loadSample() {
	let f = '/assets/music/spk.mp3';
	audioSample = loadSound(f, audioSampleReady);
}

function audioSampleReady() {
	isAudioSampleReady = true;
	audioSample.disconnect();
	audioSample.loop();
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

	// --0draw
	this.draw = function () {
		if (sceneReady) {
			background(255);
			if (poses[0]) {
				let p = createVector(poses[0].pose.nose.x, poses[0].pose.nose.y);
				noseAnchor.setTarget(p);

				noseAnchor.behaviors();
				noseAnchor.update();
				if (par.showAnchors) noseAnchor.show();

				let nx = noseAnchor.pos.x;
				let ny = noseAnchor.pos.y;

				// Keeps shape from reaching the corners
				let pad = constrain(par.maxR * 2, 0, width / 4);
				// Mirror? Flip back?
				let fx = map(nx, 0, width, width, 0);
				let cx = constrain(fx, pad, width - pad);
				let cy = constrain(ny, pad, height - pad);

				push();
				translate(cx, cy);
				stroke(0);
				strokeWeight(par.shapeStrokeWeight);
				noFill();
				beginShape();
				for (let a = 0; a < TWO_PI; a += radians(par.inc)) {
					// Follow a circular path through the noise space to create a smooth flowing shape
					let xoff = map(cos(a + phase), -1, 1, 0, par.xNoiseMax);
					let yoff = map(sin(a + phase), -1, 1, 0, par.yNoiseMax);
					let r = map(noise(xoff, yoff, zoff), 0, 1, par.minR, par.maxR);
					let x = r * cos(a);
					x = x;
					let y = r * sin(a);
					if (par.showCurves) {
						curveVertex(x, ay);
					} else {
						vertex(x, y);
					}
				}

				endShape(CLOSE);
				let pOff = map(noise(zoff, phase), 0, 1, 0, par.phaseMaxOffset);
				phase += pOff;
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
			startPreroll();
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
		playPreroll();

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

// --3 speech

function scene03() {
	this.enter = function () {
		// Entering this scene, cleanup the last one
		full = false;
		rec = false;
		preroll = false;
		play = false;
		// Stop faceapi
		stopFaceapi = true;
		startMic();
		// hide the other scenes
		select('#scene-02').addClass('hidden');
		// show this scene
		select('#scene-03').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-03');
		vf.hide()
		button = select('#record-button-03');
		button.removeClass('primary');
		button.html('Record');
		button.mousePressed(() => {
			startPreroll();
		});
		fft = new p5.FFT();
	};

	// --3draw
	this.draw = function () {
		background(255);

		mirror();

		if (sample) {
			// vs is 500x470 but feed is 627x470
			vf.image(sample, -50, 0);
		}

noPreroll()
		// if (isAudioSampleReady) fft.setInput(mic);
		if (mic) fft.setInput(mic);

		// Number of bins can only be a power of 2
		let bins = pow(2, ceil(log(par.audioResolution) / log(2)));
		let spectrum = fft.analyze(bins);

		if (!full) playShape3(expressionHistory2, spectrum);
		if (full) playModifiedShape3(voiceHistory);
	};
}

// --4
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

// --f

function refreshAnchors() {
	anchors.forEach(a => {
		a.behaviors();
		a.update();
		if (par.showAnchors) a.show();
	});
}

// Takes an array of posenet keypoints
// What happens if this array also has epxression data at index [17]?
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
	if (par.fillShape) {
		stroke(0);
		strokeWeight(par.shapeStrokeWeight);
		fill(255);
	} else {
		stroke(0);
		strokeWeight(par.shapeStrokeWeight);
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

function startPreroll() {
	preroll = true;
	button.addClass('preroll');
	button.html('...');
}

function startRecording() {
	preroll = false;
	prerollCounter = 0;
	rec = true;
	button.addClass('rec');
	button.html('Recording');
}

function recordPose(points) {
	poseHistory.push(points);
	setCounter(poseHistory.length);
	if (poseHistory.length === par.framesToRecord) finishRecording();
}

function setCounter(count) {
	// Easier than trying to figure out which counter is shown...
	let counters = selectAll('.counter');
	counters.forEach(counter => {
		counter.html(count);
	});
}

function finishRecording() {
	// TODO localStorage?
	rec = false;
	full = true;
	play = true;
	button.removeClass('rec');
	button.addClass('primary');
	button.html('Next');
	button.mousePressed(() => {
		mgr.showNextScene();
	});
	let counters = selectAll('.counter');
	counters.forEach(counter => {
		counter.html('redo');
	});
}

// Gets array of posenet poses
function playShape2(history) {
	// Use the current frame counter as an iterator for looping through the recorded array
	let cp = frameCount % history.length;
	drawShape2(history[cp]);
	if (rec && detections) recordExpression(detections, history[cp]);
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

	expanded = faceBodyNet(anchors, happy);
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

function expand2(pointData) {
	let hpose, hexp;

	if (pointData.exp) hexp = pointData.exp;
	if (pointData.pose) {
		hpose = pointData.pose;
	} else {
		hpose = pointData;
	}

	let newArr = [];
	let xoff = 0.0;
	let yoff = 0.0;

	let happy,
		surprised = 0.5;

	if (detections) {
		if (detections[0]) {
			happy = detections[0].expressions.happy;
			surprised = detections[0].expressions.surprised;
		}
	}

	if (hexp) {
		if (hexp[0]) {
			happy = hexp[0].expressions.happy;
			surprised = hexp[0].expressions.surprised;
		}
	}

	happy = map(happy, 0, 1, -50, 50);
	surprised = map(surprised, 0, 1, -50, 50);

	hpose.forEach(p => {
		for (let angle = 0; angle < 360; angle += par.angles) {
			let n = map(noise(xoff, yoff), 0, 1, 1, 100);
			let radius;
			let ratio = par.manualRadiusRatio;
			if (par.autoRadius) ratio = par.autoRadiusRatio;
			if (p.part === 'nose') {
				radius = eyeDist * ratio * par.noseExpandRatio;
			} else {
				radius = eyeDist * ratio;
			}

			radius = radius + happy - surprised;

			let x, y;
			if (p.position) {
				x = p.position.x + n + radius * sin(angle);
				y = p.position.y + n + radius * cos(angle);
			} else if (p.pos) {
				x = p.pos.x + n + radius * sin(angle);
				y = p.pos.y + n + radius * cos(angle);
			}

			let newP = [x, y];
			newArr.push(newP);
			xoff += par.noiseLevel;
			yoff += par.noiseLevel;
		}
	});

	return newArr;
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

function loopPlayback() {
	// console.log('loopPlayback');
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
	expanded = bodyNet(anchors);
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
	// [{pos,part}...]
	// Needs an array of objects that have pos.x,pos.y,part
	// Will add points around the skeleton to increase the surface area
	let newArr = [];
	pose.forEach(p => {
		// Big circle around nose...
		if (p.part === 'nose') {
			let radius = par.noseRadius;
			for (let angle = 0; angle < 360; angle += par.angles) {
				let x = p.pos.x + radius * sin(angle);
				let y = p.pos.y + radius * cos(angle) - par.noseYOffset;
				newArr.push([x, y]);
			}
		}
		if (p.part === 'leftEar' || p.part === 'rightEar') {
			let radius = par.earRadius;
			for (let angle = 0; angle < 360; angle += par.angles) {
				let x = p.pos.x + radius * sin(angle);
				let y = p.pos.y + radius * cos(angle);
				newArr.push([x, y]);
			}
		}
		if (p.part === 'leftWrist' || p.part === 'rightWrist') {
			let radius = par.wristRadius;
			for (let angle = 0; angle < 360; angle += par.angles) {
				let x = p.pos.x + radius * sin(angle);
				let y = p.pos.y + radius * cos(angle);
				newArr.push([x, y]);
			}
		}
		if (
			p.part === 'leftAnkle' ||
			p.part === 'rightAnkle' ||
			p.part === 'leftElbow' ||
			p.part === 'rightElbow' ||
			p.part === 'leftShoulder' ||
			p.part === 'rightShoulder' ||
			p.part === 'leftKnee' ||
			p.part === 'rightKnee' ||
			p.part === 'leftHip' ||
			p.part === 'rightHip'
		) {
			let radius = par.radius;
			for (let angle = 0; angle < 360; angle += par.angles * 2) {
				let x = p.pos.x + radius * sin(angle);
				let y = p.pos.y + radius * cos(angle);
				newArr.push([x, y]);
			}
		}
	});
	return newArr;
}

function faceBodyNet(pose, exp) {
	// [{pos,part}...]
	// Needs an array of objects that have pos.x,pos.y,part
	// Will add points around the skeleton to increase the surface area
	let newArr = [];
	let phaseMax = par.nosePhaseMax;
	if (exp) {
		phaseMax = exp * par.emotionalScale;
	}

	pose.forEach(p => {
		if (p.part === 'nose') {
			for (let a = 0; a < 360; a += par.angles) {
				let xoff = map(cos(a + phase), -1, 1, 0, par.xNoiseMax);
				let yoff = map(sin(a + phase), -1, 1, 0, par.yNoiseMax);
				let r = map(
					noise(xoff, yoff, zoff),
					0,
					1,
					par.noseMinRadius,
					par.noseMaxRadius
				);
				let x = p.pos.x + r * cos(a);
				let y = p.pos.y + r * sin(a);
				newArr.push([x, y]);
			}
			let pOff = map(noise(zoff), 0, 1, 0, phaseMax);
			phase += pOff;
			zoff += par.zNoiseOffset;
		}
		if (p.part === 'leftEar' || p.part === 'rightEar') {
			for (let a = 0; a < 360; a += par.angles) {
				let xoff = map(cos(a + phase), -1, 1, 0, par.xNoiseMax);
				let yoff = map(sin(a + phase), -1, 1, 0, par.yNoiseMax);
				let r = map(
					noise(xoff, yoff, zoff),
					0,
					1,
					par.earRadius - 10,
					par.earRadius + 10
				);
				let x = p.pos.x + r * cos(a);
				let y = p.pos.y + r * sin(a);
				newArr.push([x, y]);
			}
			let pOff = map(noise(zoff), 0, 1, 0, phaseMax);
			phase += pOff;
			zoff += par.zNoiseOffset;
		}
		if (p.part === 'leftWrist' || p.part === 'rightWrist') {
			let radius = par.wristRadius;
			for (let angle = 0; angle < 360; angle += par.angles) {
				let x = p.pos.x + radius * sin(angle);
				let y = p.pos.y + radius * cos(angle);
				newArr.push([x, y]);
			}
		}
		if (
			p.part === 'leftAnkle' ||
			p.part === 'rightAnkle' ||
			p.part === 'leftElbow' ||
			p.part === 'rightElbow' ||
			p.part === 'leftShoulder' ||
			p.part === 'rightShoulder' ||
			p.part === 'leftKnee' ||
			p.part === 'rightKnee' ||
			p.part === 'leftHip' ||
			p.part === 'rightHip'
		) {
			for (let a = 0; a < 360; a += par.angles) {
				let xoff = map(cos(a + phase), -1, 1, 0, par.xNoiseMax);
				let yoff = map(sin(a + phase), -1, 1, 0, par.yNoiseMax);
				let r = map(
					noise(xoff, yoff, zoff),
					0,
					1,
					par.radius - 10,
					par.radius + 50
				);
				let x = p.pos.x + r * cos(a);
				let y = p.pos.y + r * sin(a);
				newArr.push([x, y]);
			}
			let pOff = map(noise(zoff), 0, 1, 0, phaseMax);
			phase += pOff;
			zoff += par.zNoiseOffset;
		}
	});
	return newArr;
}

// Takes anchors and returns 2D array of points for hull()
// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
function expand1(pose) {
	let newArr = [];
	let xoff = 0.0;
	let yoff = 0.0;

	pose.forEach(p => {
		for (let angle = 0; angle < 360; angle += par.angles) {
			let radius;
			let n = noise(xoff, yoff);
			let ratio = par.manualRadiusRatio;
			if (par.autoRadius) ratio = par.autoRadiusRatio;
			if (p.part === 'nose') {
				radius = eyeDist * ratio * par.noseExpandRatio;
			} else {
				radius = eyeDist * ratio;
			}

			let x = p.pos.x + n + radius * sin(angle);
			let y = p.pos.y + n + radius * cos(angle);

			let newP = [x, y];
			newArr.push(newP);
			xoff += par.noiseLevel;
			yoff += par.noiseLevel;
		}
	});

	return newArr;
}

function deriveProportions(pose) {
	eyeDist = floor(poseDist(pose, LEFTEYE, RIGHTEYE));
	shoulderDist = floor(poseDist(pose, LEFTSHOULDER, RIGHTSHOULDER));
	hipDist = floor(poseDist(pose, LEFTHIP, RIGHTHIP));
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

function recordExpression(exp, pose) {
	let newArr = { pose: pose, exp: exp };
	expressionHistory.push(newArr);
	setCounter(expressionHistory.length);
	if (expressionHistory.length === par.framesToRecord) finishRecording();
}

function recordExpression2(history) {
	expressionHistory2.push(history);
	setCounter(expressionHistory2.length);
	if (expressionHistory2.length === par.framesToRecord) finishRecording();
}

function recordVoice(history) {
	voiceHistory.push(history);
	setCounter(voiceHistory.length);
	if (voiceHistory.length === par.framesToRecord) finishRecording();
}

function mirror() {
	translate(width, 0);
	scale(-1, 1);
}

function updateAnchors() {
	anchors.forEach(a => {
		a.topSpeed = par.topSpeed;
		a.maxForce = par.maxAcc;
	});
	noseAnchor.topSpeed = par.topSpeed;
	noseAnchor.maxForce = par.maxAcc;
}

// Should get an array of hull points from the previous step (what about recording the )
function playFinalShape(history) {
	let cp = frameCount % history.length;
	drawFinalShape(history[cp]);
}

function drawFinalShape(points) {
	push();
	stroke(255);
	if (!par.showPreview) stroke(0);
	strokeWeight(par.shapeStrokeWeight);
	noFill();
	beginShape();
	points.forEach(p => {
		if (par.showCurves) {
			curveVertex(p[0], p[1]);
		} else {
			vertex(p[0], p[1]);
		}
	});

	pop();
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

function noPreroll(){
startRecording()
}
function playPreroll() {
	if (preroll) {
		let iterator = frameCount % par.mississippi;
		let counter = floor(map(prerollCounter, 0, par.mississippi, 4, 0));
		if (counter > 0) {
			vf.push();
			vf.translate(vf.width, 0);
			vf.scale(-1, 1);
			vf.noStroke();
			vf.fill(0, 200);
			vf.rect(0, 0, vf.width, vf.height);
			vf.fill(255);
			vf.textFont('Space Mono');
			vf.textSize(280);
			vf.textAlign(CENTER);
			vf.text(counter, vf.width / 2, vf.height / 2 + 100);
			vf.pop();
			prerollCounter++;
		} else {
			startRecording();
		}
	}
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
				vf.translate(-50,0)
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
