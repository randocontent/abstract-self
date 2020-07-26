// TODO expand posenet points to circle
// TODO try without convex hull
// TODO try to connect outline points to specific body parts

const videos = [
	'../videos/video01.mp4',
	'../videos/video02.mp4',
	'../videos/video03.mp4',
	'../videos/video04.mp4',
	'../videos/video05.mp4',
	'../videos/video06.mp4',
	'../videos/video07.mp4',
	'../videos/video08.mp4',
	'../videos/video09.mp4',
	'../videos/video10.mp4',
	'../videos/video11.mp4',
	'../videos/video12.mp4',
	'../videos/video13.mp4',
	'../videos/video14.mp4',
	'../videos/video15.mp4',
	'../videos/video16.mp4',
];

const numAnchors = 20;

let poseNet;
let poses = [];
let options = { maxPoseDetections: 1 };

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

function setup() {
	let canvas = createCanvas(852, 600);
	canvas.parent('canvas-container');

	// Use the status variable to send messages
	status = select('#status');

	radiusSlider = createSlider(1, 300, 50, 1);
	radiusSlider.parent(select("#radius-slider-label"))
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
	stopWebcamButton = select('#stop-webcam');
	stopWebcamButton.mousePressed(stopEverything);

	// Set up test controls

	webcamButton = select('#webcam-button');
	webcamButton.mousePressed(getNewWebcam);
	imageButton = select('#image-button');
	imageButton.mousePressed(getNewImage);
	videoButton = select('#video-button');
	videoButton.mousePressed(getNewVideo);

	// Prepare anchor points
	for (let i = 0; i < numAnchors; i++) {
		let anchor = new Anchor(width/2, height/2);
		anchors.push(anchor);
	}

	// Start on load
	// getNewImage();
	getNewVideo()
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
		if (showAbstract){
		if (showAbstractFill) {
			stroke('black')
			strokeWeight(8)
			fill(255,150)
		} else {
			stroke('white')
			strokeWeight(6)
			noFill();
		}
		beginShape()
		anchors.forEach(a => {
			curveVertex(a.pos.x, a.pos.y)
		});
		endShape(CLOSE)}

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

function updateAnchors() {
	anchors.forEach(a => {
		a.r = radiusSlider.value()
	})
}
