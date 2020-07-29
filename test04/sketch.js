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
	let sketchControlsFolder = gui.addFolder('Sketch controls');
	let sampleContentFolder = gui.addFolder('Sample content');

	sampleContentFolder.add(tweak, 'loadSample');
	sampleContentFolder.add(tweak, 'startPlayback');
	sampleContentFolder.add(tweak, 'stopPlayback');
	sampleContentFolder.add(tweak, 'monitorPlayback');

	sketchControlsFolder.add(tweak, 'resolution', 16, 1024, 16);

	sampleContentFolder.open();
	sketchControlsFolder.open();

	status = select('#status');

	loadSample();
}

function draw() {
	background(50);
	noFill();
	stroke('white');
	strokeWeight(1);

	// Draw model shape for reference
	beginShape();
	modelShape.forEach(p => {
		vertex(p.x, p.y);
	});
	endShape(CLOSE);

	if (sample) {
		if (sample.isPlaying()) {
			fft.setInput(sample);

			// Make sure the number of bins we give fft is a power of 2 (even though we can input any value in dat.gui)
			let spectrum = fft.analyze(pow(2, ceil(log(tweak.resolution) / log(2))));

			let step = width / tweak.resolution;

			// first loop to draw references
			for (let i = 0; i < tweak.resolution; i++) {
				let f = spectrum[i];
				let x = i * step;
				let y = height - f;
				// Draw frequency analysis for reference
				beginShape();
				vertex(x, y);
				vertex(x + step, y);
				vertex(x + step, height);
				vertex(x, height);
				endShape();
				// Print level above each line
				push();
				textSize(16);
				noStroke();
				fill('white');
				text(f, x, y);
				pop();
			}

			// second loop to draw shapes

			strokeWeight(2);
			beginShape();
			for (let i = 0; i < tweak.resolution; i++) {
				let f = spectrum[i];
				blob(width / 2, height / 2, 100);
			}
			endShape(CLOSE);

			let waveform = fft.waveform();

			// Third loop to draw waveform
			wHistory.push(waveform);
			push();
			let cY = map(waveform, 0, 1, height, 0);
			translate(0, height / 2 - cY);
			beginShape();
			for (let i = 0; i < wHistory.length; i++) {
				let y = map(wHistory[i], 0, 1, height, 0);
				vertex(i, y);
			}
			endShape();
			pop();
			if (wHistory.length > width - 50) {
				wHistory.splice(0, 1);
			}
			line(wHistory.length, 0, wHistory.length, height);

			phase += 0.01;
		}
	}
}

let xoff = 0.01;
let yoff = 0.01;
let zoff = 0.01;

function blob(posX, posY, radius) {
	push();
	translate(posX, posY);
	stroke(0);
	strokeWeight(2);
	noFill();
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

	beginShape();
	let i = 0;
	for (let a = 0; a < TWO_PI; a += ang) {
		i++;
		let sx = x + cos(a) * rad2;
		let sy = y + sin(a) * rad2;
		console.log('sx' + sx);
		console.log('sy' + sy);
		fill(72, 139, 143);
		curveTightness(-0.5);
		curveVertex(sx, sy);

		sx = x + cos(a + halfAng) * randomCornerLengths[i];
		sy = y + y + sin(a + halfAng) * randomCornerLengths[i];

		curveVertex(sx, sy);
	}
	endShape(CLOSE);
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
