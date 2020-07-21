let poseNet;
let poses = [];
let options = { minConfidence: 0.9, maxPoseDetections: 1 };

let sample;
let status;

let xoff = 0;
let xoffStep = 0.01;
let yoff = 1;
let yoffStep = 0.02;
let zoff = 0;
let zoffSetp = 0.03;

let sldr = {};

function setup() {
	var canvas = createCanvas(640, 480);

	// Put the canvas in its placeholder element so it works within the layout of the page
	// canvas.parent('sketch-placeholder');

	// Use the status variable to send messages
	status = select('#status');

	// Set up sliders to play around with variables
	rSldr = createSlider(1, 50, 1, 0.1);
	xSldr = createSlider(0, 1, 0.01, 0.001);
	ySldr = createSlider(0, 1, 0.01, 0.001);
	zSldr = createSlider(0, 1, 0.01, 0.001);

	rSldr.style('width: 200px');
	let radiusLabel = createDiv('Random range');
	rSldr.parent(radiusLabel);

	xSldr.style('width: 200px');
	let xLabel = createDiv('x step');
	xSldr.parent(xLabel);

	ySldr.style('width: 200px');
	let yLabel = createDiv('y step');
	ySldr.parent(yLabel);

	zSldr.style('width: 200px');
	let zLabel = createDiv('z step');
	zSldr.parent(zLabel);

	// Start the webcam on load
	getNewWebcam();
	noLoop()
}

function draw() {
	background('white');

	if (poses[0]) {
		// status.html(frameCount)
		// Draw small pink circles on each keypoint
		let points = poses[0].pose.keypoints;
		noStroke();
		fill(255, 100, 255, 50);
		for (p of points) {
			ellipse(p.position.x, p.position.y, 8);
		}

		// Draw black outline around body
		let vpoints = makeVectorArray(points);
		let hullPoints = convexHull(vpoints);
		strokeWeight(1.5);
		stroke('black');
		noFill();
		beginShape();
		for (p of hullPoints) {
			let rx =
				p.x + map(noise(xoff, zoff), 0, 1, -rSldr.value(), rSldr.value());
			let ry =
				p.y + map(noise(yoff, zoff), 0, 1, -rSldr.value(), rSldr.value());
			vertex(rx, ry);
			xoff += xSldr.value();
			yoff += ySldr.value();
		}
		endShape(CLOSE);
	}
	zoff += zSldr.value();
}

/**
 * Starts the webcam and calls webcamReady()
 *
 */
function getNewWebcam() {
	status.html('in getNewWebcam()');
	// Todo: disable buttons until we're ready to try again
	sample = createCapture(VIDEO, webcamReady);
}

/**
 * Handles the webcam feed
 */
function webcamReady() {
	status.html('in webcamReady()');

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
	status.html('Model ready');
}

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
