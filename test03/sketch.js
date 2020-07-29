// ml5 Face Detection Model
let faceapi;
let detections = [];

// Video
let video;
let status;

let frCounter;

let isNeutral;
let isHappy;
let isSad;
let isAngry;
let isFearful;
let isDisgusted;
let isSurprised;
let isNeutralP;
let isHappyP;
let isSadP;
let isAngryP;
let isFearfulP;
let isDisgustedP;
let isSurprisedP;

let showPreview = true;

const videos = [
	'../assets/face/video01.mp4',
	'../assets/face/video02.mp4',
	'../assets/face/video03.mp4',
	'../assets/face/video04.mp4',
	'../assets/face/video05.mp4',
	'../assets/face/video06.mp4',
	'../assets/face/video08.mp4',
	'../assets/face/video09.mp4',
	'../assets/face/video10.mp4',
	'../assets/face/video11.mp4',
	'../assets/face/video12.mp4',
	'../assets/face/video13.mp4',
	'../assets/face/video14.mp4',
	'../assets/face/video15.mp4',
];

const faceOptions = {
	withLandmarks: false,
	withExpressions: true,
	withDescriptors: false,
};

function setup() {
	let canvas = createCanvas(852, 450);
	canvas.parent('canvas-container');

	status = select('#status');
	frCounter = select('#framerate');

	isNeutral = select('#is-neutral');
	isHappy = select('#is-happy');
	isSad = select('#is-sad');
	isAngry = select('#is-angry');
	isFearful = select('#is-fearful');
	isDisgusted = select('#is-disgusted');
	isSurprised = select('#is-surprised');

	webcamButton = select('#webcam-button');
	webcamButton.mousePressed(getNewWebcam);
	videoButton = select('#video-button');
	videoButton.mousePressed(getNewVideo);
	stopWebcamButton = select('#stop-everything');
	stopWebcamButton.mousePressed(stopEverything);

	getNewWebcam()
	// getNewVideo()
	// getNewImage();
}

function getNewWebcam() {
	console.log('getNewWebcam');
	video = createCapture(VIDEO, videoReady);
	video.hide();
}

function getNewVideo() {
	console.log('getNewVideo');
	let which = random(videos);
	console.log('getting ' + which);
	video = createVideo(which, videoReady);
	video.volume(0);
	video.play();
	video.hide();
}

function getNewImage() {
	video = createImg(`https://source.unsplash.com/${width}x${height}/?face,closeup`,imgReady)
}
function imgReady() {
	video.hide()
	// videoReady()
}

function videoReady() {
	console.log('videoReady');
	faceapi = ml5.faceApi(video, faceOptions, faceReady);
}

function stopEverything() {
	video.stop();
}

function faceReady() {
	console.log('faceReady');
	faceapi.detect(gotFaces);
}

function gotFaces(error, result) {
	if (error) {
		console.log(error);
		return;
	}
	detections = result;
	faceapi.detect(gotFaces);
}

function framerateIndicator(el) {
	let fr = floor(frameRate());
	if (fr <= 15) {
		el.style('color', '#ff0000');
	} else if (fr <= 30) {
		el.style('color', '#ffff00');
	} else if (fr > 30) {
		el.style('color', '#00ff00');
	}
	el.html('FPS: ' + fr);
}

function draw() {
	framerateIndicator(frCounter);

	push();
	background(255);
	translate(width, 0);
	scale(-1, 1);
	if (video && showPreview) {
		image(video, 0, 0);
	}
	pop();

	let expressions;

	push();
	if (detections) {
		if (detections.length > 0) {
			({ expressions } = detections[0]);
			let keys = Object.keys(expressions);
			keys.forEach((item, idx) => {
				textAlign(RIGHT);
				text(item, 90, idx * 20 + 22);
				const val = map(expressions[item], 0, 1, 0, width / 2);
				text(floor(val), 140, idx * 20 + 22);
				rect(160, idx * 20 + 10, val, 15);
				textAlign(LEFT);
			});
		}
	}
	pop();

	let sortedExpressions;
	if (expressions) {
		sortedExpressions = Object.entries(expressions);
		sortedExpressions.sort((a,b)=> {
			return b[1] - a[1]
		})
		status.html(sortedExpressions[0][0])
	}
}
