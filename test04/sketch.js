let maxRadius = 100;
let phase = 1.01;
let wHistory = [];

let sample, fft;
let modelShape;
let status;

let audioSamples = [
	'../assets/sounds/BabyElephantWalk60.wav',
	'../assets/sounds/CantinaBand60.wav',
	'../assets/sounds/Fanfare60.wav',
	'../assets/sounds/gettysburg.wav',
	'../assets/sounds/ImperialMarch60.wav',
	'../assets/sounds/PinkPanther30.wav',
	'../assets/sounds/preamble.wav',
	'../assets/sounds/StarWars60.wav',
	'../assets/sounds/taunt.wav',
];

class Tweak {
	constructor() {
		this.maxRadius = 100;
		this.resolution = 16; // fft bins
		this.phaseShift = 0.001;
		this.startMic = startMic;
		this.loadSample = loadSample;
		this.stopPlayback = stopPlayback;
		this.startPlayback = startPlayback;
		this.monitorPlayback = monitorPlayback;
	}
}

function setup() {
	let canvas = createCanvas(852, 600);
	canvas.parent('canvas-container');

	// Reference grid
	// textSize(10)
	// noFill()
	// for (let x = 0; x < width; x += 25) {
	// 	stroke(255,100)
	// 	line(x,0,x,height)
	// 	stroke('white')
	// 	text(x,x-2,12)
	// }
	// for (let y = 0; y < height; y += 25){
	// 	stroke(255,100)
	// 	line(0,y,width,y)
	// 	stroke('white')
	// 	text(y,2,y+2)
	// }

	modelShape = [
		createVector(225, 250),
		createVector(325, 200),
		createVector(535, 200),
		createVector(635, 250),
		createVector(width / 2, 300),
	];

	tweak = new Tweak();
	fft = new p5.FFT();

	let gui = new dat.GUI();
	let tweakFolderSketch = gui.addFolder('Sketch controls');
	let tweakFolderSample = gui.addFolder('Sample content');

	tweakFolderSample.add(tweak, 'startMic');
	tweakFolderSample.add(tweak, 'loadSample');
	tweakFolderSample.add(tweak, 'startPlayback');
	tweakFolderSample.add(tweak, 'stopPlayback');
	tweakFolderSample.add(tweak, 'monitorPlayback');

	tweakFolderSketch.add(tweak, 'resolution', 16, 1024, 16);

	tweakFolderSample.open();
	tweakFolderSketch.open();

	status = select('#status');

	loadSample();
}

function draw() {
	background(0)

	if (sample) {

		fft.setInput(sample);

		// Make sure the number of bins we give fft is a power of 2 
		// (even though we can input any value in dat.gui)
		spectrum = fft.analyze(pow(2, ceil(log(tweak.resolution) / log(2))));

		let step = width / tweak.resolution;

		// first loop to draw references
		stroke(255)
		strokeWeight(.5)
		noFill()
		for (let i = 0; i < tweak.resolution; i++) {
			let f = spectrum[i];
			let x = i * step;
			let y = height - f;
			// Draw frequency analysis for reference
			beginShape();
			vertex(x + 5, height);
			vertex(x + 5, y);
			vertex(x + step - 5, y);
			vertex(x + step - 5, height);
			endShape();
			// Print level above each line
			push();
			textSize(16);
			noStroke();
			fill(255,100);
			text(f, x+5, y-5);
			pop();
		}

		// second loop to draw shapes

		strokeWeight(2);
		// beginShape();
		for (let i = 0; i < tweak.resolution; i++) {
			let f = spectrum[i];

			blob(width / 2, height / 2, 100);
			status.html(f)
		}
		// endShape(CLOSE);

		let waveform = fft.waveform();

		phase += 0.01;
	}
}

let xoff = 0.01;
let yoff = 0.01;
let zoff = 0.01;

function blob(posX, posY, radius) {
	push();
	stroke(255)
	translate(posX, posY);
	beginShape();
	let noiseMax = 1;
	for (let a = 0; a < TWO_PI; a += radians(26)) {
		let xoff = map(cos(a + phase), -1, 1, 0, noiseMax);
		let yoff = map(sin(a + phase), -1, 1, 0, noiseMax);
		let r = map(noise(xoff, yoff, zoff), 0, 1, radius, height / 2);
		let x = r * cos(a);
		let y = r * sin(a);
		curveVertex(x, y);
		xoff += 0.0000001;
	}
	endShape(CLOSE);
	phase += 0.00004;
	zoff += 0.000001;
	pop();
}

function startMic() {
	sample = new p5.AudioIn();
	sample.start();
}

function loadSample() {
	let f = random(audioSamples);
	console.log(f);
	sample = loadSound(f, sampleReady);
}

function sampleReady() {
	console.log(sample);
	sample.disconnect();
	sample.loop();
}

function stopPlayback() {
	sample.stop();
}
function startPlayback() {
	sample.play();
}

function monitorPlayback() {
	sample.connect();
}
