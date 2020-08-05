class Paramaterize {
	constructor() {
		this.scene = 0;
		this.effect = 1;
		this.minR = 40;
		this.maxR = 150; 
		this.maxY = 20; 
		this.maxX = 20; 
		this.minSoundLevel = 300;
		this.maxSoundLevel = -10;
		this.voiceScaleModifier = 1;
		this.framesToRecord = 100; // 900 frames is about 15 seconds
		this.shapeStrokeWeight = 2;
		this.mississippi = 24; // 240 frames is about 4 seconds
		this.roundness = 95;
		this.angles = 6;
		this.phase = 1
		this.emotionalScale = 0.5;
		this.innerStar = 100;
		this.outerStar = 200;
		this.starPoints = 9;
		this.noseOnly = false;
		this.useSamplePose = true;
		this.debug = true;
		this.frameRate = false;
		this.phaseMultiplier = 0.1;
		this.emotionalIntensity = 10;
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
gui.add(par, 'angles');
gui.add(par, 'phase');
gui.add(par, 'minSoundLevel');
gui.add(par, 'maxSoundLevel');
gui.add(par, 'effect');
gui.add(par, 'minR');
gui.add(par, 'maxR');
gui.add(par, 'maxY');
gui.add(par, 'maxX');
gui.close()