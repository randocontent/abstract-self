// TODO expand posenet points to circle
// TODO try without convex hull
// TODO try to connect outline points to specific body parts

let poseNet;
let poses = [];
let options = { maxPoseDetections: 1 };

let webcamButton;
let imageButton;
let stopWebcamButton;

let sample;
let status;

let anchors = [];
let zpoints = [];
let expandedPoints = [];
let hullPoints = [];

let showPoseNet = true;
let showExpanded = true;
let showHull = true;
let showPreview = true;

function setup() {
	let canvas = createCanvas(800, 600);
	canvas.parent('canvas-container');

	// Use the status variable to send messages
	status = select('#status');

	// Toggle marker points
	select('#toggle-preview').mousePressed(() => {
		switch (showPreview) {
			case true:
				showPreview = false;
				break;
			case false:
				showPreview = true;
			default:
				break;
		}
	});
	select('#toggle-posenet').mousePressed(() => {
		switch (showPoseNet) {
			case true:
				showPoseNet = false;
				break;
			case false:
				showPoseNet = true;
			default:
				break;
		}
	});
	select('#toggle-expanded').mousePressed(() => {
		switch (showExpanded) {
			case true:
				showExpanded = false;
				break;
			case false:
				showExpanded = true;
			default:
				break;
		}
	});
	select('#toggle-hull').mousePressed(() => {
		switch (showHull) {
			case true:
				showHull = false;
				break;
			case false:
				showHull = true;
			default:
				break;
		}
	});

	stopWebcamButton = select('#stop-webcam');
	stopWebcamButton.mousePressed(stopWebcam);

	// Set up test controls

	webcamButton = select('#webcam-button');
	webcamButton.mousePressed(getNewWebcam);
	imageButton = select('#image-button');
	imageButton.mousePressed(getNewImage);

	// Create six anchor points
	for (let i = 0; i < 16; i++) {
		let anchor = new Anchor(width / 2, height / 2);
		anchors.push(anchor);
	}

	// Start on load
	// getNewImage();
}

function draw() {
	background(0);
	translate(width, 0);
	scale(-1, 1);
	if (sample && showPreview) {
		image(sample, 0, 0);
	}

	if (poses[0]) {
		status.html(frameRate());

		// Convert PoseNet points to P5 points
		let points = Anchor.makeVectorArray(poses[0].pose.keypoints);

		// Mark PoseNet points with a Red dot
		if (showPoseNet) {
			stroke('red');
			strokeWeight(10);
			points.forEach(p => {
				point(p);
			});
		}

		// Expand PoseNet points
		expandedPoints = Anchor.expandPoints(points, 100);
		// console.table(expandedPoints)

		// Mark expanded points with Green dots
		if (showExpanded) {
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

		if (showHull) {
		// console.table(hullPoints)
		// Outline hull points with a blue line
		noFill();
		stroke('blue');
		strokeWeight(2);
		beginShape();
		hullPoints.forEach(p => {
			vertex(p.x, p.y);
		});
		endShape(CLOSE);
}
		// // make an array of hull points
		// let vpoints = makeVectorArray(points);
		// console.table(vpoints);
		// zpoints = expandPoints(vpoints, 20);
		// console.table(zpoints);
		// let hullPoints = convexHull(zpoints);
		// console.table(hullPoints);

		// a.behaviors();
		// a.update();
		// // a.show();
		// // });

		// noStroke();
		// fill('red');
		// for (p of points) {
		// 	ellipse(p.position.x, p.position.y, 8);
		// }

		// // Draw black around anchors
		// strokeWeight(1.5);
		// stroke('black');
		// noFill();
		// beginShape();
		// for (a of anchors) {
		// 	vertex(a.pos.x, a.pos.y);
		// }
		// endShape(CLOSE);
	}
	// noLoop();
}

/**
 * Gets a new image from Unsplash and runs it through PoseNet.
 *
 */

function getNewImage() {
	sample = loadImage(
		`https://source.unsplash.com/${width}x${height}/?body,person`,
		() => {
			// Run when image is ready
			poseNet = '';
			poseNet = ml5.poseNet(options, () => {
				// Run when model is ready
				console.log('Model loaded for image');
				poseNet.singlePose(sample);
			});
			poseNet.on('pose', function (results) {
				poses = results;
			});
		}
	);
}

/**
 * Starts the webcam and calls webcamReady()
 */
function getNewWebcam() {
	// status.html('in getNewWebcam()');
	// Todo: disable buttons until we're ready to try again
	sample = createCapture(VIDEO, webcamReady);
	// sample.size(width);
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

function stopWebcam() {
	poseNet.removeAllListeners();
	poses[0] = null;
	sample.stop();
}
