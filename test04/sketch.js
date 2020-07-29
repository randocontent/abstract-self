let maxRadius = 100;
let phase = 1.01;
let wHistory = [];

let sample, fft;
let bins;

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
		this.audioResolution = 16; // fft bins
		this.blobRadius = 100; 
		this.sizeRatio = 270;
		this.phaseShift = 0.001;
		this.zNoiseMin = 0
		this.zNoiseMax = 1
		this.yNoiseMin = 0
		this.yNoiseMax = 1
		this.xNoiseMin = 0
		this.xNoiseMax = 1
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

	tweakFolderSketch.add(tweak, 'audioResolution', 16, 129, 1);
	tweakFolderSketch.add(tweak, 'blobRadius',33,666,100);
	tweakFolderSketch.add(tweak, 'sizeRatio',10,5000,1);

	tweakFolderSketch.add(tweak, 'zNoiseMin',0,1,0.1);
	tweakFolderSketch.add(tweak, 'zNoiseMax',0,10,0.1);
	tweakFolderSketch.add(tweak, 'yNoiseMin',0,1,0.1);
	tweakFolderSketch.add(tweak, 'yNoiseMax',0,10,0.1);
	tweakFolderSketch.add(tweak, 'xNoiseMin',0,1,0.1);
	tweakFolderSketch.add(tweak, 'xNoiseMax',0,10,0.1);

	tweakFolderSample.open();
	tweakFolderSketch.open();

	status = select('#status');

	// loadSample();
}

function draw() {
	background(0)

	if (sample) {

		fft.setInput(sample);

		// Make sure the number of bins we give fft is a power of 2 
		// (even though we can input any value in dat.gui)
		bins = pow(2, ceil(log(tweak.audioResolution) / log(2)))
		spectrum = fft.analyze(bins);

		let step = width / tweak.audioResolution;

		// first loop to draw references
		stroke(255)
		strokeWeight(.5)
		noFill()
		for (let i = 0; i < tweak.audioResolution; i++) {
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
		strokeWeight(4);
		// fill(255)
		for (let i = 0; i < tweak.audioResolution; i++) {
			let f = spectrum[i];
			blob(width / 2, height / 2, tweak.blobRadius, f);
			status.html(f)
		}

		let waveform = fft.waveform();

		phase += 0.01;
	}
}

function blob(posX, posY, radius, level) {
	push();
	stroke(255)
	translate(posX, posY);
	beginShape();
	let noiseMax = 1;
	for (let a = 0; a < TWO_PI; a += radians(tweak.sizeRatio/bins)) {
		zoff = map(level,0,255,tweak.zNoiseMin,tweak.zNoiseMax)
		let xoff = map(cos(a + phase), -1, 1, tweak.xNoiseMin, tweak.xNoiseMax);
		let yoff = map(sin(a + phase), -1, 1, tweak.zNoiseMin, tweak.yNoiseMax);
		let r = map(noise(xoff, yoff, zoff), 0, 1, radius, height / 2);
		let x = r * cos(a);
		let y = r * sin(a);
		stroke(map(level,0,255,255,0))
		curveVertex(x, y);
	}
	endShape(CLOSE);
	phase += 0.00004;
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
