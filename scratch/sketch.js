let points;
let hullPoints;

function setup() {
	createCanvas(500, 500);
	points = [
		createVector(random(width), random(height)),
		createVector(random(width), random(height)),
		createVector(random(width), random(height)),
		createVector(random(width), random(height)),
	];
}

function draw() {
	points.forEach(p => {
		p.x += random(-1, 1);
		p.y += random(-1, 1);
	});
	background(50);
	stroke('white');
	strokeWeight(0.5);
	noFill();
	expandPoint(points, 20);
	// noLoop()
}

let newArr = [];
function expandPoint(arr, r) {
	newArr = [];
	arr.forEach(p => {
		push();
		let px = p.x;
		let py = p.y;
		translate(p);
		for (let angle = 0; angle < 360; angle += 37) {
			let x = r * sin(angle);
			let y = r * cos(angle);
			ellipse(x, y, r);
			newArr.push({ x: x, y: y, px: px, py: py });
		}
		pop();
	});
}
