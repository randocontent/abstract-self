// TODO expand posenet points to circle
// TODO try without convex hull
// TODO try to connect outline points to specific body parts

const videos = [
	'../assets/body/video01.mp4',
	'../assets/body/video02.mp4',
	'../assets/body/video03.mp4',
	'../assets/body/video05.mp4',
	'../assets/body/video06.mp4',
	'../assets/body/video08.mp4',
	'../assets/body/video09.mp4',
	'../assets/body/video10.mp4',
	'../assets/body/video11.mp4',
	'../assets/body/video12.mp4',
	'../assets/body/video13.mp4',
	'../assets/body/video15.mp4',
	'../assets/body/video16.mp4',
];

const numAnchors = 20;

let poseNet;
let poses = [];
let options = { maxPoseDetections: 2 };

let webcamButton;
let imageButton;
let stopWebcamButton;

let sample;
let status;

let points = [];
let anchors = [];
let zpoints = [];
let expandedPoints = [];
let hullPoints = [];

let showPoseNet = false;
let showExpanded = false;
let showHull = false;
let showPreview = true;

let radiusSlider;
let speedSlider;
let forceSlider;

let isHeadOnly = false;

let showAnchors = false;
let showAbstract = true;
let showAbstractFill = false;
let showCurves = false;

function setup() {
	let canvas = createCanvas(852, 600);
	canvas.parent('canvas-container');

	// Prepare anchor points
	for (let i = 0; i < numAnchors; i++) {
		let anchor = new Anchor(width / 2, height / 2);
		anchors.push(anchor);
	}

	// Use the status variable to send messages
	status = select('#status');

	// Set up test controls

	webcamButton = select('#webcam-button');
	webcamButton.mousePressed(getNewWebcam);
	imageButton = select('#image-button');
	imageButton.mousePressed(getNewImage);
	videoButton = select('#video-button');
	videoButton.mousePressed(getNewVideo);
	stopWebcamButton = select('#stop-everything');
	stopWebcamButton.mousePressed(stopEverything);

	radiusSlider = createSlider(1, 300, 100, 1);
	radiusSlider.parent(select('#radius-slider-label'));
	speedSlider = createSlider(1, 10, 5, 0.1);
	speedSlider.size(300);
	speedSlider.parent(select('#speed-slider-label'));
	forceSlider = createSlider(0.1, 10, 0.5, 0.01);
	forceSlider.size(300);
	forceSlider.parent(select('#force-slider-label'));

	select('#update-anchors').mousePressed(updateAnchors);

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
	select('#toggle-body').mousePressed(() => {
		switch (isHeadOnly) {
			case true:
				isHeadOnly = false;
				break;
			case false:
				isHeadOnly = true;
			default:
				break;
		}
	});
	select('#toggle-anchors').mousePressed(() => {
		switch (showAnchors) {
			case true:
				showAnchors = false;
				break;
			case false:
				showAnchors = true;
			default:
				break;
		}
	});
	select('#toggle-abstract').mousePressed(() => {
		switch (showAbstract) {
			case true:
				showAbstract = false;
				break;
			case false:
				showAbstract = true;
			default:
				break;
		}
	});
	select('#toggle-abstract-fill').mousePressed(() => {
		switch (showAbstractFill) {
			case true:
				showAbstractFill = false;
				break;
			case false:
				showAbstractFill = true;
			default:
				break;
		}
	});
	select('#toggle-curves').mousePressed(() => {
		switch (showCurves) {
			case true:
				showCurves = false;
				break;
			case false:
				showCurves = true;
			default:
				break;
		}
	});

	// Start on load
	// getNewImage();
	// getNewVideo()
}

function draw() {
	background(0);
	translate(width, 0);
	scale(-1, 1);
	if (sample && showPreview) {
		image(sample, 0, 0);
	}

	if (poses[0]) {
		status.html('framerate: ' + frameRate());

		// Convert PoseNet points to P5 points
		points = Anchor.makeVectorArray(poses[0].pose.keypoints);

		// Mark PoseNet points with a Red dot
		if (showPoseNet) {
			stroke('red');
			strokeWeight(10);
			points.forEach(p => {
				point(p);
			});
		}

		// Expand PoseNet points
		if (isHeadOnly) {
			expandedPoints = Anchor.expandHeadPoints(points, radiusSlider.value());
		} else {
			expandedPoints = Anchor.expandPoints(points, radiusSlider.value());
		}

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

		// Outline hull points with a blue line
		if (showHull) {
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
			if (showAnchors) a.show();
		});

		// Draw abstract shape
		if (showAbstract) {
			if (showAbstractFill) {
				stroke('black');
				strokeWeight(10);
				fill(255);
			} else {
				stroke('white');
				strokeWeight(8);
				noFill();
			}
			beginShape();
			anchors.forEach(a => {
				if (showCurves) {
					curveVertex(a.pos.x, a.pos.y);
				} else {
					vertex(a.pos.x, a.pos.y);
				}
			});
			endShape(CLOSE);
		}

	}
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
			posenet = '';
			posenet = ml5.poseNet(options, () => {
				// Run when model is ready
				console.log('Model loaded for image');
				posenet.singlePose(sample);
			});
			posenet.on('pose', function (results) {
				poses = results;
			});
		}
	);
}

/**
 * Starts the webcam and calls webcamReady()
 */
function getNewWebcam() {
	sample = createCapture(VIDEO, videoReady);
	sample.hide();
}

/**
 * Handles the webcam feed
 */
function videoReady() {
	posenet = ml5.poseNet(sample, options, modelReady);
	posenet.on('pose', function (results) {
		poses = results;
	});
}

/**
 * Called when the PoseNet model is ready.
 * There's not much to do at that point since it sets up its own loop.
 */
function modelReady() {
	console.log('Model Ready');
}

function stopEverything() {
	posenet.removeAllListeners();
	poses[0] = null;
	sample.stop();
}

function getNewVideo() {
	let video = random(videos);
	console.log('getting ' + video);
	sample = createVideo(video, videoReady);
	sample.volume(0);
	sample.loop();
	sample.hide();
}

function videoReady() {
	console.log('Video Ready');
	posenet = ml5.poseNet(sample, options, modelReady);
	posenet.on('pose', function (results) {
		// console.log('Poses Ready')
		poses = results;
	});
}

function updateAnchors() {
	anchors.forEach(a => {
		a.topSpeed = speedSlider.value();
		a.maxForce = forceSlider.value();
	});
}
