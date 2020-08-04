class Paramaterize {
	constructor() {
		this.scene = 0;
		this.framesToRecord = 200;
		this.shapeStrokeWeight = 2;
		this.mississippi = 260; // about 260
		this.roundness = 95;
		this.emotionalScale = 0.5;
		this.showExpanded = false;
		this.innerStar = 100;
		this.outerStar = 200;
		this.starPoints = 9;
		this.noseOnly = false;
		this.useSamplePose = true;
		this.showDebug = false;

		this.minR = 44; // scene 0
		this.maxR = 66; // scene 0
		this.noiseMax = 1; // scene 0
		this.xNoiseMax = 1; // scene 0
		this.yNoiseMax = 1; // scene 0
		this.zNoiseOffset = 0.0001; // scene 0
		this.phaseMaxOffset = 0.01; // scene 0
		this.nosePhaseMax = 1;
		this.phaseMax = 0.1;
		this.inc = 12;
		this.noseRadius = 120;
		this.blobMin = 50;
		this.blobMax = 100;
		this.blobOffset = 0.1;
		this.blobPhaseOffset = 0.1;
		this.noseMinRadius = 100;
		this.noseMaxRadius = 200;
		this.topSpeed = 10;
		this.maxAcc = 4;
		this.radius = 50;
		this.noseYOffset = 55;
		this.earRadius = 35;
		this.wristRadius = 55;
		this.autoRadius = true;
		this.autoRadiusRatio = 0.5;
		this.manualRadiusRatio = 1;
		this.noseExpandRatio = 3.5;
		this.noiseLevel = 0.001;
		this.showAnchors = true;
		this.showPose = false;
		this.showHull = true;
		this.showPreview = false;
		this.fillShape = false;
		this.showCurves = false;
		this.audioResolution = 32; // bins
		this.happy = 1;
		this.angry = 1;
	}
}

par = new Paramaterize();
let gui = new dat.GUI({ autoPlace: true });
// let customContainer =document.getElementById('dat-gui-container');
// customContainer.appendChild(gui.domElement);
// let f1 = gui.addFolder('Blob');
// let f2 = gui.addFolder('Pose');
// let f3 = gui.addFolder('Face');
// let f4 = gui.addFolder('Voice');
// let f5 = gui.addFolder('Reference');

let sceneGui = gui.add(par, 'scene');
sceneGui.onChange(() => {
	gotoScene();
});

gui.add(par, 'showDebug')
gui.add(par, 'framesToRecord', 10, 10000, 1);
gui.add(par, 'shapeStrokeWeight');
gui.add(par, 'mississippi');
gui.add(par, 'roundness');
gui.add(par, 'zNoiseOffset');
gui.add(par, 'showExpanded');
// gui.add(par, 'happy');
// gui.add(par, 'angry');
gui.add(par, 'innerStar');
gui.add(par, 'outerStar');
gui.add(par, 'starPoints', 1);
gui.add(par, 'noseOnly');
gui.add(par, 'useSamplePose');
gui.close()

// gui.add(par, 'emotionalScale');
// f1.add(par, 'minR');
// f1.add(par, 'maxR');
// f1.add(par, 'noiseMax');
// f1.add(par, 'phaseMaxOffset');
// f1.add(par, 'inc');
// f1.close();
// let speedControl = f2.add(par, 'topSpeed');
// let accControl = f2.add(par, 'maxAcc');
// f2.add(par, 'radius');
// f2.add(par, 'noseYOffset');
// f2.add(par, 'earRadius');
// f2.add(par, 'wristRadius');
// f2.add(par, 'noiseLevel');
// speedControl.onFinishChange(() => updateAnchors());
// accControl.onFinishChange(() => updateAnchors());
// f2.close();
// f3.add(par,'blobMin')
// f3.add(par,'blobMax')
// f3.add(par,'blobOffset')
// f3.add(par,'blobPhaseOffset')
// f3.add(par,'noseRadius');
// f4.add(par, 'audioResolution');
// f5.add(par, 'showPose');
// f5.add(par, 'showHull');
// f5.add(par, 'showPreview');
// f5.add(par, 'showAnchors');
// f5.add(par, 'fillShape');
// f5.add(par, 'showCurves');
// f5.close();


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
let sample;
let webcamPreview;
let button;

let sceneReady = false;

let rec = false;
let preroll = false;
let play = false;
let full = false;
let prerollCounter = 0;

let posenet;
let poses = [];

/*
Stores recording from step 1 as array of posenet poses
[ 
	{ part: 'nose', position: { x: 1, y: 1 } },
	...
] 
*/
let poseHistory = [];

/*
Stores recording from step 2 as 2D array of expanded points
with expression data already applied
*/
let expressionHistory = [];

let voiceHistory = [];
let options = { maxPoseDetections: 2 };

let noseAnchor;
let anchors = [];
let expanded = [];
let hullSet = [];

let phase = 0.0;
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

		// Prepare anchors to chase posenet points
		PARTS.forEach(p => {
			let anchor = new Anchor(width / 2, height / 2, p);
			anchors.push(anchor);
		});
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
	select('#record-button-03').mousePressed(() => {
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
		hideScenes(); unhideScene('#scene-00');
			break;
		case 1:
			mgr.showScene(scene01);
		hideScenes(); unhideScene('#scene-01');
			break;
		case 2:
			mgr.showScene(scene02);
		hideScenes(); unhideScene('#scene-02');
			break;
		case 3:
			mgr.showScene(scene03);
		hideScenes(); unhideScene('#scene-03');
			break;
		case 4:
			mgr.showScene(scene04);
		hideScenes(); unhideScene('#scene-04');
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

function modelReady() {
	// modelReady
}

function faceReady() {
	faceapi.detect(gotFaces);
}

function gotFaces(error, result) {
	if (error) {
		cl(error);
		return;
	}
	detections = result;
	faceapiLoading = false;
	if (!stopFaceapi) faceapi.detect(gotFaces);
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
				// if (par.showAnchors) noseAnchor.show();

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
				for (let a = 0; a < 360; a += par.inc) {
					// Follow a circular path through the noise space to create a smooth flowing shape
					let xoff = map(cos(a + phase), -1, 1, 0, par.xNoiseMax);
					let yoff = map(sin(a + phase), -1, 1, 0, par.yNoiseMax);
					let r = map(noise(xoff, yoff, zoff), 0, 1, par.minR, par.maxR);
					let x = r * cos(a);
					let y = r * sin(a);
					if (par.showCurves) {
						curveVertex(x, ay);
					} else {
						vertex(x, y);
					}
				}
				endShape(CLOSE);
				let pOff = map(noise(zoff, phase), 0, 1, 0, par.phaseMaxOffset * 1000);
				phase += pOff;
				zoff += par.zNoiseOffset;
				pop();
			}
		}
	};
}

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
	cl('retargetAnchorsFromPose ',targets)
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

function noPreroll() {
	startRecording();
}

function startRecording() {
	preroll = false;
	prerollCounter = 0;
	rec = true;
	button.addClass('rec');
	button.html('Recording');
}

function loopPlayback() {
	// cl('loopPlayback');
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
function deriveProportions(pose) {
	eyeDist = floor(poseDist(pose, LEFTEYE, RIGHTEYE));
	shoulderDist = floor(poseDist(pose, LEFTSHOULDER, RIGHTSHOULDER));
	hipDist = floor(poseDist(pose, LEFTHIP, RIGHTHIP));
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

function playPreroll() {
	if (preroll) {
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
			vf.textSize(180);
			vf.textAlign(CENTER, CENTER);
			vf.text(counter, vf.width / 2, vf.height / 2);
			vf.pop();
			prerollCounter++;
		} else {
			startRecording();
		}
	}
}

function bezierEllipse(pts, radius, controlRadius) {
	let cx1 = 0;
	let cy1 = 0;
	let cx2 = 0;
	let cy2 = 0;
	let ax = 0;
	let ay = 0;
	let rot = TWO_PI / pts;
	let theta = 0;
	let controlTheta1 = rot / random(3.0); // 3.0;
	let controlTheta2 = controlTheta1 * random(2.0); // 2.0;

	let newArr = [];
	for (let i = 0; i < pts; i++) {
		cx1 = cos(theta + controlTheta1) * controlRadius;
		cy1 = sin(theta + controlTheta1) * controlRadius;
		cx2 = cos(theta + controlTheta2) * controlRadius;
		cy2 = sin(theta + controlTheta2) * controlRadius;
		ax = cos(theta + rot) * radius;
		ay = sin(theta + rot) * radius;

		if (i == 0) {
			// initial vertex required for bezierVertex()
			newArr.push([cos(0) * radius, sin(0) * radius]);
		}
		// close ellipse
		if (i == pts - 1) {
			newArr.push([cx1, cy1, cx2, cy2, cos(0) * radius, sin(0) * radius]);
		}
		// ellipse body
		else {
			newArr.push([cx1, cy1, cx2, cy2, ax, ay]);
		}

		theta += rot;
	}
	return newArr;
}

function hideScenes() {
	selectAll('.fullscreen').forEach(el => {
		el.addClass('hidden');
	});
}
function unhideScene(sceneId) {
	cl('unhideScene')
	cl(sceneId)
	select(sceneId).removeClass('hidden');
}

function cl(message) {
	if (par.showDebug) {
		console.log(message)
	}
}