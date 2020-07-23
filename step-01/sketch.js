let poseNet;
let poses = [];
let options = { minConfidence: 0.9, maxPoseDetections: 1 };

let forceSlider;
let speedSlider;

let sample;
let status;

let xoff = 0;
let xoffStep = 0.01;
let yoff = 1;
let yoffStep = 0.02;
let zoff = 0;
let zoffSetp = 0.03;
let noiseRange = 5;

let anchors = [];

function setup() {
	// Create a variable we can later use to control the canvas
	var canvas = createCanvas(800,600);
	canvas.parent('canvas')

	// Use the status variable to send messages
	// status = select('#status');

	speedSlider = createSlider(1, 20, 1, 0.1)
	speedSlider.parent('speed-slider')
	forceSlider = createSlider(0.1, 10, 0.1, 0.1);
	forceSlider.parent('force-slider')

	// Create six anchor points
	for (let i = 0; i < 10; i++) {
		let anchor = new Anchor(width/2,height/2);
		anchors.push(anchor)
	}

	// Start the webcam on load
	getNewWebcam();
	// noLoop();
}

function draw() {

	anchors.forEach(a=>{
		a.topSpeed = speedSlider.value()
		a.maxForce = forceSlider.value()
	})

	background('white');
	image(sample,0,0,width,height)
	noStroke()
	fill(255,200)
	rect(0,0,width,height)

	if (poses[0]) {
		// status.html(frameRate());

		// Get an array of all points
		let points = poses[0].pose.keypoints;

		// make an array of hull points
		let vpoints = makeVectorArray(points);
		let hullPoints = convexHull(vpoints);

		anchors.forEach((a, i) => {
			if (hullPoints[i]) {
				a.setTarget(hullPoints[i])
			} else {
				a.setTarget(anchors[0].target)
			}
			a.behaviors();
			a.update();
			// a.show();
		});

		// noStroke();
		// fill(255, 100, 255, 50);
		// for (p of points) {
		// 	ellipse(p.position.x, p.position.y, 8);
		// }

		// Draw black around anchors
		strokeWeight(1.5);
		stroke('black');
		noFill();
		beginShape();
		for (a of anchors) {
			curveVertex(a.pos.x, a.pos.y);
		}
		endShape(CLOSE);
	}
}

function Anchor(x, y) {
	this.pos = createVector(x, y);
	this.target = createVector(x, y);
	this.vel = p5.Vector.random2D();
	this.acc = createVector();
	this.r = 10;
	this.topSpeed = 1;
	this.maxForce = 0.1;
}

Anchor.prototype.update = function () {
	this.pos.add(this.vel);
	this.vel.add(this.acc);
	this.acc.mult(0);
};

Anchor.prototype.show = function () {
	noStroke();
	fill('orange');
	ellipse(this.pos.x, this.pos.y, this.r);
};

Anchor.prototype.addVertex = function () {
	curveVertex(this.pos.x, this.pos.y);
};

Anchor.prototype.setTarget = function (v) {
	this.target = v;
}

// Runs behaviors
Anchor.prototype.behaviors = function () {
	let goto = this.arrive(this.target);
	this.applyForce(goto);
};

// Applies forces returned by the bejavior functions
Anchor.prototype.applyForce = function (f) {
	this.acc.add(f);
};

// Returns a force
Anchor.prototype.seek = function (target) {
	let desired = p5.Vector.sub(target, this.pos);
	desired.setMag(this.topSpeed);
	let steer = p5.Vector.sub(desired, this.vel);
	return steer.limit(this.maxForce);
};

// Returns a force
Anchor.prototype.flee = function (target) {
	let desired = p5.Vector.sub(target, this.pos);
	if (desired.mag() < 90) {
		desired.setMag(this.topSpeed);
		// Reverse direction
		desired.mult(-1);
		let steer = p5.Vector.sub(desired, this.vel);
		steer.limit(this.maxForce);
		return steer;
	} else {
		return createVector(0, 0);
	}
};

// Returns a force
Anchor.prototype.arrive = function (target) {
	let desired = p5.Vector.sub(target, this.pos);
	let distance = desired.mag();
	let speed = this.topSpeed;
	if (distance < 100) {
		speed = map(distance, 0, 100, 0, this.topSpeed);
	}
	desired.setMag(speed);
	let steer = p5.Vector.sub(desired, this.vel);
	return steer.limit(this.maxForce);
};

/**
 * Gets an array of keypoints from PoseNet
 * Creates an array of p5 vectors
 */
function makeVectorArray(arr) {
	let newArr = [];
	for (const p of arr) {
		newArr.push(createVector(p.position.x, p.position.y));
	}
	return newArr;
}

/**
 * Starts the webcam and calls webcamReady()
 *
 */
function getNewWebcam() {
	// status.html('in getNewWebcam()');
	// Todo: disable buttons until we're ready to try again
	sample = createCapture(VIDEO, webcamReady);
	sample.size(width,height)
	sample.hide();
}

/**
 * Handles the webcam feed
 */
function webcamReady() {
	// status.html('in webcamReady()');

	// select('#webcam-preview-placeholder').html('');
	// sample.parent('webcam-preview-placeholder');

	poseNet = ml5.poseNet(sample, options, modelReady);
	poseNet.on('pose', function (results) {
		poses = results;
	});
}

/**
 * Called when the PoseNet model is ready.
 * There's not much to do at that point since it sets up its own loop.
 */
function modelReady() {
	// status.html('Model ready');
}

/**
 * convexhull-js
 * Copyright (c) 2015 Andrey Naumenko
 * https://github.com/indy256/convexhull-js
 * See license below
 */

/**
 * Get an array of points.
 * Return points to draw a convex hull around them.
 */
function convexHull(points) {
	function removeMiddle(a, b, c) {
		var cross = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);
		var dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
		return cross < 0 || (cross == 0 && dot <= 0);
	}
	points.sort(function (a, b) {
		return a.x != b.x ? a.x - b.x : a.y - b.y;
	});

	var n = points.length;
	var hull = [];

	for (var i = 0; i < 2 * n; i++) {
		var j = i < n ? i : 2 * n - 1 - i;
		while (
			hull.length >= 2 &&
			removeMiddle(hull[hull.length - 2], hull[hull.length - 1], points[j])
		)
			hull.pop();
		hull.push(points[j]);
	}

	hull.pop();
	return hull;
}

/**
 * License for convexhull-js
 *

The MIT License (MIT)

Copyright (c) 2015 Andrey Naumenko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
