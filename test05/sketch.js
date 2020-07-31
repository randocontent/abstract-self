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

class Paramaters {
	constructor() {
		this.concave = 100;
		this.showPreview = true;
		this.showPose = false;
		this.showExpanded = false;
		this.showAnchors = false;
		this.noiseStep = 0.001;
		this.autoRadius = false;
		this.autoRadiusRatio = 1.6;
		this.radius = 33;
		this.angles = 37;
		this.leftHandRadius = 100;
		this.leftHandAngles = 10;
		this.rightHandRadius = 100;
		this.rightHandAngles = 10;
		this.slowMotion = 1;
		this.startWebcam = function () {
			startWebcam();
		};
		this.loadSampleVideo = function () {
			reloadVideo();
		};
		this.pause_play = function () {
			togglePlayback();
		};
		this.stop = function () {
			stopEverything();
		};
	}
}

let par = new Paramaters();

let gui = new dat.GUI();
gui.add(par, 'concave');
gui.add(par, 'showPreview');
gui.add(par, 'showPose');
gui.add(par, 'showExpanded');
gui.add(par, 'showAnchors');
gui.add(par, 'noiseStep');
gui.add(par, 'autoRadius');
gui.add(par, 'autoRadiusRatio');
gui.add(par, 'radius');
gui.add(par, 'angles');
gui.add(par, 'slowMotion', 0.1, 1, 0.1);
gui.add(par, 'startWebcam');
gui.add(par, 'loadSampleVideo');
gui.add(par, 'pause_play');
gui.add(par, 'stop');

let sample;
let posenet;
let poses = [];
let options = { maxPoseDetections: 2 };
let playing = false;

let anchors = [];

let eyeDist;
let shoulderDist;
let hipDist;
let eyeShoulderRatio;
let eyeWaistRatio;
let shoulderWaistRatio;

let zoff = 0.0;

const videos = [
	'../assets/body/video27.mp4',
	'../assets/body/video10.mp4',
	'../assets/body/video11.mp4',
	'../assets/body/video12.mp4',
	'../assets/body/video13.mp4',
	'../assets/body/video14.mp4',
	'../assets/body/video15.mp4',
	'../assets/body/video16.mp4',
	'../assets/body/video17.mp4',
	'../assets/body/video09.mp4',
	'../assets/body/video18.mp4',
	'../assets/body/video19.mp4',
	'../assets/body/video20.mp4',
	'../assets/body/video21.mp4',
	'../assets/body/video22.mp4',
	'../assets/body/video23.mp4',
	'../assets/body/video24.mp4',
	'../assets/body/video25.mp4',
	'../assets/body/video26.mp4',
	'../assets/body/video28.mp4',
	'../assets/body/video29.mp4',
	'../assets/body/video30.mp4',
	'../assets/body/video31.mp4',
];

p5.disableFriendlyErrors = true;

function setup() {
	let canvas = createCanvas(910, 500);
	canvas.parent('#canvas-container');

	for (let i = 0; i < 17; i++) {
		let anchor = new Anchor(width / 2, height / 2);
		anchors.push(anchor);
	}

	// startWebcam()
	// loadNewVideo();
}

function draw() {
	background(255);

	if (sample) {
		sample.speed(par.slowMotion);
	}

	if (sample && par.showPreview) {
		image(sample, 0, 0);
	}

	if (poses) {
		if (poses[0]) {
			//  will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
			let pose = poses[0].pose.keypoints;

			// Set anchors to track pose
			anchors.forEach((a, i) => {
				if (pose[i]) {
					a.setTarget(pose[i].position.x, pose[i].position.y, pose[i].part);
				} else {
					a.setTarget(pose[0].position.x, pose[0].position.y, pose[0].part);
				}
				a.behaviors();
				a.update();
				if (par.showAnchors) a.show();
			});

			eyeDist = floor(poseDist(pose, LEFTEYE, RIGHTEYE));
			select('#eye-distance').html('Eye distance: ' + eyeDist);

			shoulderDist = floor(poseDist(pose, LEFTSHOULDER, RIGHTSHOULDER));
			select('#shoulder-distance').html('Shoulder distance: ' + shoulderDist);

			hipDist = floor(poseDist(pose, LEFTHIP, RIGHTHIP));
			select('#hip-distance').html('Hip distance: ' + hipDist);

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

			// Prepare pointlist for hull()
			let pointSet = expandAllPoints(anchors);

			// Draw expanded points for reference
			if (par.showExpanded) {
				push();
				stroke('teal');
				strokeWeight(5);
				pointSet.forEach(p => {
					point(p[0], p[1]);
				});
				pop();
			}
			// Find convex hull
			hullSet = hull(pointSet, par.concave);

			push();
			stroke(255);
			if (!par.showPreview) {
				stroke(0);
			}
			strokeWeight(6);
			noFill();
			beginShape();
			hullSet.forEach(p => {
				curveVertex(p[0], p[1]);
			});
			endShape(CLOSE);
			pop();
		}
	}
}

// Takes posenet poses and returns 2D array of points for hull()
// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
function expandAllPoints(pose) {
	let newArr = [];
	let xoff = 0.0;
	let yoff = 0.0;
	pose.forEach(p => {
		for (let angle = 0; angle < 360; angle += par.angles) {
			let x, y;
			let n = noise(xoff, yoff);

			let radius;
			if (par.autoRadius) {
				// if (p.part === 'nose') {
				// 	radius = eyeDistance * par.autoRadiusRatio * 3;
				// } else {
				// 	radius = eyeDistance * par.autoRadiusRatio;
				// }
				radius = eyeDist * par.autoRadiusRatio;
			} else {
				// if (p.part === 'nose') {
				// 	radius = par.radius * 3;
				// } else {
				// 	radius = par.radius;
				// }
				radius = par.radius;
			}

			x = p.pos.x + n + radius * sin(angle);
			y = p.pos.y + n + radius * cos(angle);

			x = p.pos.x + n + radius * sin(angle);
			y = p.pos.y + n + radius * cos(angle);

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
function checkEyeDistance(pose) {
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

function startWebcam(autoSize, sw, sh) {
	stopEverything();
	sample = createCapture(VIDEO, sampleReady);
	sample.hide();
	if (!autoSize) {
		sample.size(sw, sh);
	}
	// TODO - too ugly
	// sample.parent('#webcam-monitor-0' + par.scene);
	playing = true;
}

function videoSample() {
	let video = random(videos);
	console.log('getting ' + video);
	sample = createVideo(video, sampleReady);
	sample.volume(0);
	sample.loop();
	sample.hide();
	playing = true;
}

function reloadVideo() {
	if (playing) {
		stopEverything();
		videoSample();
	} else {
		videoSample();
	}
}

function togglePlayback() {
	if (playing) {
		sample.pause()
		playing = false;
	} else {
		sample.loop()
		playing = true;
	}
}

function stopEverything() {
	posenet.removeAllListeners();
	poses[0] = null;
	sample.stop();
	playing = false;
}

function sampleReady() {
	console.log('Video Ready');
	posenet = ml5.poseNet(sample, options, modelReady);
	posenet.on('pose', function (results) {
		// console.log('Poses Ready')
		poses = results;
	});
}

function webcamReady() {
	console.log('webcamReady');
	posenet = ml5.poseNet(sample, options, modelReady);
	posenet.on('pose', function (results) {
		poses = results;
	});
}

function modelReady() {
	console.log('modelReady');
}
