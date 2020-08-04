let videos = [
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

let poseNet;
let poses = [];
let options = { maxPoseDetections: 1 };

let webcamButton;
let imageButton;
let stopWebcamButton;

let sample;
let status;

let points = [];
let zpoints = [];
let expandedPoints = [];
let hullPoints = [];

let showPoseNet = true;
let showExpanded = true;
let showHull = true;

let isHeadOnly = false;

let headPoints = [];

function setup() {
	let canvas = createCanvas(853, 600);
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
	stopWebcamButton = select('#stop-webcam');
	stopWebcamButton.mousePressed(stopEverything);

	// Set up test controls

	webcamButton = select('#webcam-button');
	webcamButton.mousePressed(getNewWebcam);
	imageButton = select('#image-button');
	imageButton.mousePressed(getNewImage);
	videoButton = select('#video-button');
	videoButton.mousePressed(getNewVideo);

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
			expandedPoints = Anchor.expandHeadPoints(points, 100);
		} else {
			expandedPoints = Anchor.expandPoints(points, 100);
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
	sample = createCapture(VIDEO, webcamReady);
	sample.hide();
}

/**
 * Handles the webcam feed
 */
function webcamReady() {
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
	console.log('Model Ready');
}

function stopEverything() {
	poseNet.removeAllListeners();
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
	poseNet = ml5.poseNet(sample, options, modelReady);
	poseNet.on('pose', function (results) {
		// console.log('Poses Ready')
		poses = results;
	});
}
