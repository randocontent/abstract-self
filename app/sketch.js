class Paramaterize {
	constructor() {
		this.scene = 1;
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

let numAnchors = 20;
let points = [];
let anchors = [];
let zpoints = [];
let expandedPoints = [];
let hullPoints = [];

function setup() {
	canvas = createCanvas(350, 350);
	canvas.parent('#canvas-01');
	background(255);

	par = new Paramaterize();

	let gui = new dat.GUI();

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
	gui.close()

	mgr = new SceneManager();

	// Preload scenes. Preloading is normally optional
	// ... but needed if showNextScene() is used.
	mgr.addScene(scene01);
	mgr.addScene(scene02);

	select('#begin-button').mousePressed(() => {
		mgr.showScene(scene02);
	});
	select('#record-button-02').mousePressed(() => {
		recording = true;
		console.log('recording started')
		select('#record-button-02').addClass('rec');
	});

	startWebcam(false, 467, 350);
	gotoScene();
}

function draw() {
	mgr.draw();
}

function gotoScene() {
	switch (par.scene) {
		case 1:
			mgr.showScene(scene01);
			break;
		case 2:
			mgr.showScene(scene02);
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
	});
}

function modelReady() {
	console.log('modelReady');
}

// =============================================================
// =                         BEGIN SCENES                      =
// =============================================================

// --1

function scene01() {
	this.enter = function () {
		select('#scene-02').addClass('hidden');
		select('#scene-01').removeClass('hidden');
		canvas.parent('#canvas-01');
		// move the webcam monitor over
		sample.parent('#webcam-monitor-01');
		sample.size(467, 350);
	};

	this.setup = function () {};

	this.draw = function () {
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
	};
}

// --2

function scene02() {
	// Will run when entering the scene, seems like a good place to do clean up
	// from the previous one
	this.enter = function () {
		// hide the other scenes
		select('#scene-01').addClass('hidden');
		// show this scene
		select('#scene-02').removeClass('hidden');
		// move the canvas over
		canvas.parent('#canvas-02');
		resizeCanvas(820, 820);
		// move the webcam monitor over
		sample.parent('#webcam-monitor-02');
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

		if (recording) {
			posesHistory.push(poses[0].pose.keypoints);
			if (posesHistory.length > 1000) {
				console.log('recording ended')
				console.log(posesHistory);
				recording = false;
				recorded = true;
				select('#record-button-02').removeClass('rec');
			}
		}

		if (recorded) {
			let cp = frameCount % posesHistory.length;
			console.log(cp)
			let np = posesHistory[cp];
			console.log(np);
			point(np[0].position.x, np[0].position.y);
			point(np[1].position.x, np[1].position.y);
			point(np[2].position.x, np[2].position.y);
			if (cp === posesHistory.length-1) {
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

			// Find convex hull for all points
			hullPoints = Anchor.convexHull(expandedPoints);

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
			anchors.forEach((a, i) => {
				if (hullPoints[i]) {
					a.setTarget(hullPoints[i]);
				} else {
					a.setTarget(hullPoints[0]);
				}
				a.behaviors();
				a.update();
				if (par.showAnchors) a.show();
			});

			// Draw abstract shape
			if (par.showAbstract) {
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
		}
	};
	this.counter = function () {};
}
