class Paramaters {
	constructor() {
		this.concave = 150;
		this.showPreview = true;
		this.showPose = false;
		this.showExpanded = false;
		this.noiseStep = 0.001;
		this.autoRadius = true;
		this.autoRadiusRatio = 1.8;
		this.radius = 100;
		this.angles = 10;
		this.leftHandRadius = 100;
		this.leftHandAngles = 10;
		this.rightHandRadius = 100;
		this.rightHandAngles = 10;
		this.startWebcam = function () {
			startWebcam();
		};
		this.changeVideo = function () {
			reloadVideo();
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
gui.add(par, 'noiseStep');
gui.add(par, 'autoRadius');
gui.add(par, 'autoRadiusRatio');
gui.add(par, 'radius');
gui.add(par, 'angles');
gui.add(par, 'leftHandRadius');
gui.add(par, 'rightHandRadius');
gui.add(par, 'leftHandAngles');
gui.add(par, 'rightHandAngles');
gui.add(par, 'startWebcam');
gui.add(par, 'changeVideo');
gui.add(par, 'stop');

let posenet;
let poses = [];
let options = { maxPoseDetections: 2 };
let eyeDistance;

const videos = [
	'../assets/body/video02.mp4',
	'../assets/body/video03.mp4',
	'../assets/body/video08.mp4',
	'../assets/body/video09.mp4',
	'../assets/body/video10.mp4',
	'../assets/body/video11.mp4',
	'../assets/body/video13.mp4',
];

function setup() {
	createCanvas(720, 500);
	// startWebcam()
	loadNewVideo();
}

function draw() {
	background(255);

	if (sample && par.showPreview) {
		image(sample, 0, 0);
	}

	if (poses) {
		if (poses[0]) {
			//  will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
			let pose = poses[0].pose.keypoints;

			eyeDistance = checkEyeDistance(pose);

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
			let pointSet = expandAllPoints(pose);

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
				vertex(p[0], p[1]);
			});
			endShape(CLOSE);
			pop();
		}
	}
}

function expandAllPoints(pose) {
	let newArr = [];
	let xoff = 0.0
	let yoff = 0.0
	pose.forEach(p => {
		for (let angle = 0; angle < 360; angle += par.angles) {
			let x, y;
			let n = noise(xoff,yoff)
			// console.log(n)
			if (par.autoRadius) {
				let radius = eyeDistance * par.autoRadiusRatio;
				x = p.position.x + n + radius * sin(angle);
				y = p.position.y + n + radius * cos(angle);
			} else {
				x = p.position.x + n + par.radius * sin(angle);
				y = p.position.y + n + par.radius * cos(angle);
			}
			let newP = [x, y];
			newArr.push(newP);
			xoff += par.noiseStep
			yoff += par.noiseStep
		
		}
	});

	return newArr;
}

// Takes posenet poses and returns 2D array of points for hull()
function expandPoints(pose) {
	// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
	let newArr = [];

	// First add all points
	pose.forEach(p => {
		let newP = [p.position.x, p.position.y];
		newArr.push(newP);
	});

	/**
	 0	nose
	 1	leftEye
	 2	rightEye
	 3	leftEar
	 4	rightEar
	 5	leftShoulder
	 6	rightShoulder
	 7	leftElbow
	 8	rightElbow
	 9	leftWrist
	 10	rightWrist
	 11	leftHip
	 12	rightHip
	 13	leftKnee
	 14	rightKnee
	 15	leftAnkle
	 16	rightAnkle
	 */

	let part;
	// Expand nose
	part = { x: pose[0].position.x, y: pose[0].position.y };
	for (let angle = 0; angle < 360; angle += par.angles) {
		let x, y;
		if (par.autoRadius) {
			let radius = eyeDistance * par.autoRadiusRatio;
			x = part.x + radius * sin(angle);
			y = part.y + radius * cos(angle);
		} else {
			x = part.x + par.radius * sin(angle);
			y = part.y + par.radius * cos(angle);
		}
		let newP = [x, y];
		newArr.push(newP);
	}

	// Expand left hand
	part = { x: pose[9].position.x, y: pose[9].position.y };
	for (let angle = 0; angle < 360; angle += par.leftHandAngles) {
		if (par.autoRadius) {
			let radius = eyeDistance * par.autoRadiusRatio * 0.5;
			x = part.x + radius * sin(angle);
			y = part.y + radius * cos(angle);
		} else {
			x = part.x + par.leftHandRadius * sin(angle);
			y = part.y + par.leftHandRadius * cos(angle);
		}
		let newP = [x, y];
		newArr.push(newP);
	}

	// Expand right hand
	part = { x: pose[10].position.x, y: pose[10].position.y };
	for (let angle = 0; angle < 360; angle += par.rightHandAngles) {
		if (par.autoRadius) {
			let radius = eyeDistance * par.autoRadiusRatio * 0.75;
			x = part.x + radius * sin(angle);
			y = part.y + radius * cos(angle);
		} else {
			x = part.x + par.rightHandRadius * sin(angle);
			y = part.y + par.rightHandRadius * cos(angle);
		}
		let newP = [x, y];
		newArr.push(newP);
	}
	return newArr;
}

// Gets a posenet pose and returns eye distance
function checkEyeDistance(pose) {
	// Pose will look like [{part:'nose',position: {x: 0,y:0},score:.99}]
	// 1	leftEye 2	rightEye
	let left = createVector(pose[1].position.x, pose[1].position.y);
	let right = createVector(pose[2].position.x, pose[2].position.y);
	return p5.Vector.dist(left, right);
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
}

function loadNewVideo() {
	let video = random(videos);
	console.log('getting ' + video);
	sample = createVideo(video, sampleReady);
	sample.volume(0);
	sample.loop();
	sample.hide();
}

function reloadVideo() {
	stopEverything();
	loadNewVideo();
}

function stopEverything() {
	posenet.removeAllListeners();
	poses[0] = null;
	sample.stop();
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
