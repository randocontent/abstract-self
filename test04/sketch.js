let colors, ball;

let sample;
let fft;

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

let loadSampleButton;
let stopPlaybackButton;
let monitorPlaybackButton;

let modelShape;

let status;

let maxRadius = 100;
let bins = 16;
let phase = 1.01;

function setup() {
	let canvas = createCanvas(852, 600);
	canvas.parent('canvas-container');

	status = select('#status');

	fft = new p5.FFT();

	modelShape = [
		// createVector(300, 270),
		createVector(300, 250),
		createVector(350, 200),
		createVector(500, 200),
		createVector(550, 250),
		createVector(450, 300),
		createVector(300, 250),
		// createVector(300, 100),
	];
	console.table(modelShape);

	loadSampleButton = select('#load-sample');
	loadSampleButton.mousePressed(loadSample);
	stopPlaybackButton = select('#stop-playback');
	stopPlaybackButton.mousePressed(stopPlayback);
	monitorPlaybackButton = select('#monitor-playback');
	monitorPlaybackButton.mousePressed(monitorPlayback);

	colors = new Color();

	let gui = new dat.GUI();

	gui.add(colors, 'h', 0, 360);
	gui.add(colors, 's', 0, 100);
	gui.add(colors, 'b', 0, 100);

	loadSample();
}

function draw() {
	noFill();
	stroke('white');
	strokeWeight(1);

	push();
	colorMode(HSB);
	background(colors.h, colors.s, colors.b);
	pop();

	// Draw model shape for reference
	beginShape();
	modelShape.forEach(p => {
		vertex(p.x, p.y);
	});
	endShape();

	if (sample) {
		if (sample.isPlaying()) {
			fft.setInput(sample);

			let spectrum = fft.analyze(bins);
			// console.log(spectrum)

			let step = width / bins;
			status.html(step);

			for (let i = 0; i < bins; i++) {
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

			push();
			stroke(100)
			strokeWeight(20)
			beginShape();
			for (let i = 0; i < bins; i++) {
				let f = spectrum[i];

				let x = i * step;
				let y = height - f;

				// Assign points on the shape (face) to fragments of the wave length
				// let pIndex = round(i % modelShape.length);
				let pIndex = round(map(i, 0, bins, 0, modelShape.length - 1));
				let p = modelShape[pIndex];

				let v = map(i, 0, bins, 0, 360);

				translate(p.x, p.y);
				let noiseMax = 1;
				for (let a = 0; a < TWO_PI; a += radians(26)) {
					let xoff = map(cos(a + phase), -1, 1, 0, noiseMax);
					let yoff = map(sin(a + phase), -1, 1, 0, noiseMax);
					let r = map(noise(xoff, yoff, zoff), 0, 1, f / 2, f);
					let x = r * cos(a);
					let y = r * sin(a);
					point(x, y);
					// console.log(x,y)
				}
			}
			endShape(CLOSE);
			pop();
			
			let waveform = fft.waveform();
			// console.log(waveform)

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
		vertex(x, y);
	}
	endShape(CLOSE);
	phase += 0.003;
	zoff += 0.01;

	pop();
}

function Color() {
	this.h = random(360);
	this.s = random(100);
	this.b = random(70, 90);
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

function monitorPlayback() {
	sample.connect();
}
