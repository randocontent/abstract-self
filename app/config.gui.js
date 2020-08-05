class Paramaterize {
	constructor() {
		this.scene = 0;
		this.framesToRecord = 20;
		this.shapeStrokeWeight = 2;
		this.mississippi = 26; // about 260
		this.roundness = 95;
		this.emotionalScale = 0.5;
		this.showExpanded = false;
		this.innerStar = 100;
		this.outerStar = 200;
		this.starPoints = 9;
		this.noseOnly = false;
		this.useSamplePose = true;
		this.debug = false;
		this.frameRate = true;

		this.minR = 44; // scene 0
		this.maxR = 66; // scene 0
		this.noiseMax = 1; // scene 0
		this.xNoiseMax = 1; // scene 0
		this.yNoiseMax = 1; // scene 0
		this.zNoiseOffset = 0.0001; // scene 0
		this.phaseMaxOffset = 0.01; // scene 0
		this.nosePhaseMax = 0.0001;
		this.phaseMax = 0.0001;
		this.inc = 12;
		this.noseRadius = 120;
		this.blobMin = 50;
		this.blobMax = 100;
		this.blobOffset = 0.1;
		this.blobPhaseOffset = 0.1;
		this.noseMinRadius = 100;
		this.noseMaxRadius = 200;
		this.topSpeed = 10;
		this.maxAcc = 4;
		this.radius = 50;
		this.noseYOffset = 55;
		this.earRadius = 35;
		this.wristRadius = 55;
		this.autoRadius = true;
		this.autoRadiusRatio = 0.5;
		this.manualRadiusRatio = 1;
		this.noseExpandRatio = 3.5;
		this.noiseLevel = 0.001;
		this.showAnchors = true;
		this.showPose = false;
		this.showHull = true;
		this.fillShape = false;
		this.showCurves = false;
		this.audioResolution = 32; // bins
		this.happy = 1;
		this.angry = 1;
	}
}

par = new Paramaterize();
let gui = new dat.GUI({ autoPlace: true });
let sceneGui = gui.add(par, 'scene');
sceneGui.onChange(() => {
	gotoScene();
});
gui.add(par, 'debug')
gui.add(par, 'framesToRecord', 10, 10000, 1);
gui.add(par, 'shapeStrokeWeight');
gui.add(par, 'mississippi');
gui.add(par, 'roundness');
gui.add(par, 'zNoiseOffset');
gui.add(par, 'showExpanded');
gui.add(par, 'innerStar');
gui.add(par, 'outerStar');
gui.add(par, 'starPoints', 1);
gui.add(par, 'noseOnly');
gui.add(par, 'useSamplePose');
gui.close()