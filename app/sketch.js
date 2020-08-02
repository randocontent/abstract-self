class Paramaterize {
	constructor() {
		this.scene = 0;
		this.minR = 33;
		this.maxR = 66;
		this.xNoiseMax = 2;
		this.yNoiseMax = 2;
		this.zNoiseOffset = 0.01;
		this.phaseOffset = 0.001;
		this.inc = 26;
		this.blobR = 100;
		this.showPoseNet = false;
		this.showExpanded = false;
		this.showHull = false;
		this.showPreview = false;
		this.showAnchors = false;
		this.showAbstract = true;
		this.showAbstractFill = false;
		this.showCurves = true;
		this.isHeadOnly = true;
		this.numAnchors = 20;
	}
}

let sceneReady = false;

let recorded = false;
let canvas, status;
let webcamPreview;

let recording = false;

let posenet;
let poses = [];
let posesHistory = [];
let options = { maxPoseDetections: 2 };

let phase = 0.0;
let noiseMax = 1;
let zoff = 0.0;

let mgr, g;

let numAnchors = 50;
let points = [];
let anchors = [];
let zpoints = [];
let expandedPoints = [];
let hullPoints = [];

function setup() {
	canvas = createCanvas(350, 350);
	canvas.parent('#canvas-01');
	background(255);
	// hull()

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
	gui.add(par, 'showPoseNet');
	gui.add(par, 'showExpanded');
	gui.add(par, 'showHull');
	gui.add(par, 'showPreview');
	gui.add(par, 'showAnchors');
	gui.add(par, 'showAbstract');
	gui.add(par, 'showAbstractFill');
	gui.add(par, 'showCurves');
	gui.add(par, 'isHeadOnly');
	gui.add(par, 'numAnchors');
	gui.close();

	mgr = new SceneManager();

	// Preload scenes. Preloading is normally optional
	// ... but needed if showNextScene() is used.
	mgr.addScene(scene00);
	mgr.addScene(scene01);

	select('#begin-button').mousePressed(() => {
		mgr.showScene(scene01);
	});

	select('#record-button-01').mousePressed(() => {
		recording = true;
		console.log('recording started');
		select('#record-button-01').addClass('rec');
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

function retargetAnchors(targets) {
	anchors.forEach((a, i) => {
		// TODO: really need to add/remove anchors dynamically here
		// Should add something like anchors.makeFit(n)
		// with n being the number of anchors we need
		if (targets[i]) {
			// console.log(targets[i])
			// console.log(targets[i])
			// TODO: convert this array back to vectors closer to where we get it back from hull()
			let v = createVector(targets[i][0],targets[i][1])
			a.setTarget(v);
		} else {
			let v = createVector(targets[0][0],targets[0][1])
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

function abstractShape() {
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

// --0

function scene00() {
	this.enter = function () {
		select('#scene-01').addClass('hidden');
		select('#scene-00').removeClass('hidden');
		canvas.parent('#canvas-00');
		// move the webcam monitor over
		sample.parent('#webcam-monitor-00');
		sample.size(467, 350);
	};

	this.setup = function () {};

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

// --1

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
		sample.size(666, 500);
	};

	this.setup = function () {
		// Prepare anchors to chase the shape
		for (let i = 0; i < numAnchors; i++) {
			let anchor = new Anchor(width / 2, height / 2);
			anchors.push(anchor);
		}
	};

	this.draw = function () {
		background(255);
		translate(width, 0);
		scale(-1, 1);
		// if (sample && showPreview) {
		// 	image(sample, 0, 0);
		// }

		// Check if the recording is over
		if (recording) {
			if (posesHistory.length > 500) {
				console.log('recording ended');
				console.log(posesHistory);
				recording = false;
				recorded = true;
				select('#record-button-02').removeClass('rec');
			}
		}

		if (recorded) {
			console.log('playback starting');

			// Use the current frame counter as an iterator for looping through the recorded array
			let cp = frameCount % posesHistory.length;
			let np = posesHistory[cp];
			// console.log('current index in recording: ', cp);
			// console.log('point in current index: ', np);
			// Just mark a point at the first three values, which are the eyes and nose
			// point(np[0].position.x, np[0].position.y);
			// point(np[1].position.x, np[1].position.y);
			// point(np[2].position.x, np[2].position.y);

			// Set up anchors to follow hull outline
			retargetAnchors(np);

			// Draw abstract shape
			abstractShape();

			if (cp === posesHistory.length - 1) {
				recorded = false;
			}
		}

		if (poses[0] && !recorded) {
			// status.html('framerate: ' + frameRate());

			// Convert PoseNet points to P5 points
			points = Anchor.makeVectorArray(poses[0].pose.keypoints);

			// Mark PoseNet points with a Red dot
			if (par.showPoseNet) {
				stroke('red');
				strokeWeight(10);
				points.forEach(p => {
					point(p);
				});
			}

			// Expand PoseNet points
			if (par.isHeadOnly) {
				expandedPoints = Anchor.expandHeadPoints(points, par.blobR);
			} else {
				expandedPoints = Anchor.expandPoints(points, par.blobR);
			}

			// console.table(expandedPoints)

			// Mark expanded points with Green dots
			if (par.showExpanded) {
				stroke('green');
				strokeWeight(5);
				beginShape();
				expandedPoints.forEach(p => {
					point(p.x, p.y);
				});
				endShape(CLOSE);
			}

			// Prepare points (again?)
			let pointSet = makePointSet(expandedPoints);
			// Find convex hull for all points
			hullPoints = hull(pointSet,1);
			

			// Store a "frame" in the recording as the position of hull points
			if (recording) {
				posesHistory.push(hullPoints);
			}

			// Outline hull points with a blue line
			if (par.showHull) {
				// console.table(hullPoints)
				noFill();
				stroke('blue');
				strokeWeight(0.5);
				beginShape();
				hullPoints.forEach(p => {
					vertex(p.x, p.y);
				});
				endShape(CLOSE);
			}

			// Set up anchors to follow hull outline
			retargetAnchors(hullPoints);

			// Draw abstract shape
			if (par.showAbstract) abstractShape();
		}
	};
	this.counter = function () {};
}
