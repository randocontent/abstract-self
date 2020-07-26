let faceapi, sample, img, detections;
let options = {
	withLandmarks: true,
	withDescriptors: true,
	withExpressions: true,
};

let status;
let webcamButton, imageButton, stopWebcamButton;

let showPreview = true;

function preload() {
	img = loadImage('https://source.unsplash.com/852x600/?person,face')
}

function setup() {
	let canvas = createCanvas(852, 600);
	canvas.parent('canvas-container');

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

	// Start on load
	getNewImage();
}

function draw() {
	image(sample,0,0)
}

function getNewImage() {
	console.log('getNewImage');
	let imageSource = `https://source.unsplash.com/${width}x${height}/?person,face`;
	console.log(imageSource);
	sample = createImg(imageSource, '','', imageReady);
	sample.hide()
}

function imageReady() {
	console.log('imageReady');
	faceapi = ml5.faceApi(img, options, modelReady);
}

function modelReady() {
	console.log('modelReady');
	faceapi.detect(detectionsReady);
}

function detectionsReady(err, result) {
	if (err) {
		console.error(err);
		return;
	}
	detections = result;
	faceapi.detect(detectionsReady)
}

function getNewWebcam() {
	sample = createCapture(VIDEO, webcamReady);
	sample.hide();
}

function webcamReady() {}

function stopEverything() {
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
}
