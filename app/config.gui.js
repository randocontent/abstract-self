class Paramaterize {
	constructor() {
		this.scene = 2;
		this.voiceScaleModifier = 1;
		this.framesToRecord = 900; // 900 frames is about 15 seconds
		this.shapeStrokeWeight = 2;
		this.mississippi = 240; // 240 frames is about 4 seconds
		this.roundness = 95;
		this.emotionalScale = 0.5;
		this.innerStar = 100;
		this.outerStar = 200;
		this.starPoints = 9;
		this.noseOnly = false;
		this.useSamplePose = true;
		this.debug = false;
		this.frameRate = false;
		this.phaseMultiplier = 0.1;
		this.emotionalIntensity = 10;
		this.minR = 44;
		this.maxR = 66; 
		this.noiseMax = 1; 
		this.xNoiseMax = 1; 
		this.yNoiseMax = 1;
		this.zNoiseOffset = 0.0001; 
		this.phaseMaxOffset = 0.01; 
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
		this.angles = 20;
		this.noseYOffset = 55;
		this.earRadius = 35;
		this.wristRadius = 55;
		this.autoRadius = true;
		this.autoRadiusRatio = 0.5;
		this.manualRadiusRatio = 1;
		this.noseExpandRatio = 3.5;
		this.noiseLevel = 0.001;
		this.showExpanded = false;
		this.showAnchors = false;
		this.showPose = false;
		this.showHull = false;
		this.fillShape = false;
		this.showCurves = false;
		this.audioResolution = 32; // bins
		this.happy = 1;
		this.angry = 1;
		this.padding = 133;
		this.sampleWidth = 627;
		this.sampleHeight = 470;
	}
}

par = new Paramaterize();
let gui = new dat.GUI({ autoPlace: true });
let sceneGui = gui.add(par, 'scene');
sceneGui.onChange(() => {
	gotoScene();
});
gui.add(par, 'debug')
gui.add(par, 'frameRate');
gui.add(par, 'framesToRecord');
gui.add(par, 'shapeStrokeWeight');
gui.add(par, 'mississippi');
gui.add(par, 'roundness');
gui.add(par, 'padding');
gui.add(par, 'sampleWidth');
gui.add(par, 'sampleHeight');
gui.hide()