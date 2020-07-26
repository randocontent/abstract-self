
// ml5 Face Detection Model
let faceapi;
let detections = [];

// Video
let video;
let report;


function setup() {
  createCanvas(360, 270);
  report = select('#status');
  // Creat the video and start face tracking
  video = createCapture(VIDEO);
  video.size(width, height);
  // Only need landmarks for this example
  const faceOptions = { withLandmarks: true, withExpressions: true, withDescriptors: true };
  faceapi = ml5.faceApi(video, faceOptions, faceReady);
  video.hide()
  
}

// Start detecting faces
function faceReady() {
  faceapi.detect(gotFaces);
}

// Got faces
function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  detections = result;
  faceapi.detect(gotFaces);
}

// Draw everything
function draw() {
  background(0);

  let reportData;
  // Just look at the first face and draw all the points
  if (detections.length > 0) {
    let points = detections[0].landmarks.positions;
    for (let i = 0; i < points.length; i++) {
      stroke(161, 95, 251);
      strokeWeight(4);
      point(points[i]._x, points[i]._y);
      // reportData = reportData + `<tr><td>x</td><td>${points[i]._x}</td><td>y</td><td>${points[i]._y}</td></tr>`;
      reportData = detections[0].expressions
    }
  }
  if (reportData) {
    report.html(`
      <table>
<tr><td>neutral</td><td>${reportData.neutral}</td></tr>
<tr><td>happy</td><td>${reportData.happy}</td></tr>
<tr><td>sad</td><td>${reportData.sad}</td></tr>
<tr><td>angry</td><td>${reportData.angry}</td></tr>
<tr><td>fearful</td><td>${reportData.fearful}</td></tr>
<tr><td>disgusted</td><td>${reportData.disgusted}</td></tr>
<tr><td>surprised</td><td>${reportData.surprised}</td></tr>
</table>
`)
  }

  
}