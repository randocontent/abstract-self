function scene00() {
	this.enter = function () {
		dbg('scene00');
		frameRate(par.frameRate)
		// -----clean-up
		sample.size(668,500)
		sample.hide();
		// -----page layout
		sketchCanvas.parent('#canvas-00');
		resizeCanvas(350, 350);
		monitor.parent('#webcam-monitor-00');
		monitor.resizeCanvas(350, 350);
		monitor.show();
		// -----ui
		// -----scene management
		chooseScene('#scene-00');
	};

	// --0draw
	this.draw = function () {
		frameRate(par.frameRate)
		background(255);
		if (isWebcamReady && isFaceApiReady && isPosenetReady) {
			// render video on the monitor canvas, centered and flipped
			if (sample) {
				monitor.push();
				mirror(monitor);
				monitor.image(sample, -120,0)
				monitor.pop();
			}
			if (poses[0]) {
				let noseV = createVector(poses[0].pose.nose.x, poses[0].pose.nose.y);
				noseAnchor.setTarget(noseV);

				noseAnchor.behaviors();
				noseAnchor.update();
				if (par.showAnchors || par.debug) noseAnchor.show();

				// Keeps shape from reaching the corners
				let nx = noseAnchor.position.x;
				let ny = noseAnchor.position.y;
				let pad = par.padding / 2;

				let sampleWidth = sample.width ? sample.width : 640;
				let sampleHeight = sample.height ? sample.height : 480;
				let cx = remap(nx, sampleWidth, width, pad);
				let cy = remap(ny, sampleHeight, height, pad);

				push();
				mirror();
				translate(cx, cy);
				stroke(0);
				strokeWeight(par.shapeStrokeWeight);
				noFill();
				beginShape();
				for (let a = 0; a < 360; a += 1) {
					// Follow a circular path through the noise space to create a smooth flowing shape
					let xoff = map(cos(a + phase), -1, 1, 0, 1);
					let yoff = map(sin(a + phase), -1, 1, 0, 1);
					let r = map(noise(xoff, yoff, zoff), 0, 1, 50, 60);
					let x = r * cos(a);
					let y = r * sin(a);
					curveVertex(x, y);
				}
				endShape(CLOSE);
				phase += 0.001;
				zoff += 0.03;
				pop();
			}
		} else {
			// loading animation while we wait
			background(colors.dark);
			let r = cos(frameCount) * 50;
			let l = sin(frameCount) * 50;
			fill('#393939');
			ellipse(width / 2, height / 2, r);
			fill('#595959');
			textAlign(CENTER, CENTER);
			// text('Loading', width / 2, height -34);
			monitor.background(color.dark);
			monitor.fill('#393939');
			monitor.ellipse(width / 2, height / 2, l);
			monitor.fill('#595959');
			monitor.textAlign(CENTER, CENTER);
			// monitor.text('Loading', width / 2, height - 34);
		}
		if (par.frameRate|| par.debug) {
			// mirror();
			fps();
			// mirror(); // Yeah, perfectly reasonable solution...
		}
	};
}