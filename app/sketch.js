let canvas, status;
let webcamPreview;

// function setup() {
// 	canvas = createCanvas(640, 480);
// 	canvas.parent('#canvas-container');

// 	// Use the status variable to send messages with the status.html method
// 	status = select('#status');

// }

// function draw() {
// 	background(0);

// }

let mgr;

function setup() {
	let canvas = createCanvas(800, 500);
	canvas.parent('#step01-canvas');
	background(51);

	mgr = new SceneManager();

	// Preload scenes. Preloading is normally optional
	// ... but needed if showNextScene() is used.
	mgr.addScene(intro);
	mgr.addScene(step01);
	mgr.addScene(Animation2);
	mgr.addScene(Animation3);

	mgr.showScene(step01);
}

function draw() {
	mgr.draw();
}

function mousePressed() {
	mgr.handleEvent('mousePressed');
}

function keyPressed() {
	// You can optionaly handle the key press at global level...
	switch (key) {
		case '1':
			mgr.showScene(intro);
			break;
		case '2':
			mgr.showScene(Animation2);
			break;
		case '3':
			mgr.showScene(Animation3);
			break;
	}

	// ... then dispatch via the SceneManager.
	mgr.handleEvent('keyPressed');
}

// =============================================================
// =                         BEGIN SCENES                      =
// =============================================================

function step01() {
	this.setup = function () {
		sample = createCapture(VIDEO, this.webcamReady);
	};
	this.draw = function () {
		ellipse(100, 100, 100);
	};
	this.webcamReady = function () {
		console.log('webcamReady');
		sample.parent('#step01-webcam');
	};
}

function intro() {
	this.enter = function () {
		background(51);

		text('intro', 100, 100);
	};

	this.keyPressed = function () {
		text(keyCode, textX, (textY += 10));
		if (textY > height) {
			textX += 20;
			textY = 0;
		}
	};

	this.mousePressed = function () {
		this.sceneManager.showNextScene();
	};
}

function Animation2() {
	this.y = 0;

	this.draw = function () {
		background('teal');

		line(0, this.y, width, this.y);
		this.y++;

		if (this.y > height) this.y = 0;
	};

	this.mousePressed = function () {
		this.sceneManager.showNextScene();
	};
}

// When defining scenes, you can also
// put the setup, draw, etc. methods on prototype
function Animation3() {
	this.oAnim1 = null;
}

Animation3.prototype.setup = function () {
	// access a different scene using the SceneManager
	oAnim1 = this.sceneManager.findScene(Animation2);
};

Animation3.prototype.draw = function () {
	background('lightblue');

	var r = sin(frameCount * 0.01);

	fill('white');
	ellipse(width / 2, height / 2, map(r, 0, 1, 100, 200));

	if (oAnim1 != null) {
		fill('black');
		textAlign(LEFT);
		text('Scene1 y: ' + oAnim1.oScene.y, 10, height - 20);
	}
};

Animation3.prototype.mousePressed = function () {
	this.sceneManager.showNextScene();
};
