// p5.js interface to Google MediaPipe Landmark Tracking 
// Tracks 478 points on the face, and calculates 52 face metrics.
// See https://mediapipe-studio.webapps.google.com/home
// Uses p5.js v.1.8.0 + MediaPipe v.0.10.7
// By Golan Levin, version of 10/29/2023
// Huge thanks to Orr Kislev, who made it work in p5's global mode!
// Based off of: https://editor.p5js.org/golan/sketches/0yyu6uEwM

// Don't change the names of these global variables.
let myFaceLandmarker;
let faceLandmarks;
let myCapture;
let lastVideoTime = -1;
let extra;

let myFont;
let eyebrowRaised = false; // Flag to track if eyebrow is raised

let letters = []; // letter array 
let letters2 = []; // letter array
let letters3 = [];
let letters4 = [];
let delayFrames = 240; // 2 seconds to being 
let addedW = false; // Track if first letter has been added 
let delayBetweenLetters = 3; // 1/6 of a second between letters
let nextLetterTime = 0; // Track when to add the next letter
let lettersToAdd = ["E","L","C","O","M","E"," ","P","L","A","Y","E","R"," ","2"]; 
let lettersToAdd2 = ["0","P","E","N"," ","Y","O","U","R"," ","J","A","W"]; // Letters to add
// let lettersToAdd2 = ["R","A","I","S","E"," ","Y","O","U","R"," ","E","Y","E","B","R","O","W","S" ]; // Letters to add
let lettersToAdd4 = [ "R","E","T","R","I","E","V","E"," ","Y","O","U","R"," ","C","O","L","O","U","R"," ","V","A","L","U","E",":", ];
let lettersToAdd3 = ["*","A","S"," ","M","U","C","H"," ","A","S"," ","P","O","S","S","I","B","L","E","*"];
// let lettersToAdd3 = ["*","A","S"," ","H","I","G","H"," ","A","S"," ","P","O","S","S","I","B","L","E","*"];

let tryingToNavigate = false; //for loading next html

let noFaceDetectedStartTime = null;
const NO_FACE_DETECTED_THRESHOLD = 30000;

// Works best with just one or two sets of landmarks.
const trackingConfig = {
  doAcquireFaceMetrics: true,
  cpuOrGpuString: "GPU", /* "GPU" or "CPU" */
  maxNumFaces: 1, // number of faces to track
};

//------------------------------------------
//loads the mediapipe Facelandmarker and sets up thhe fileset resolver for vision tasks
async function preload() {
  myFont = loadFont('PublicPixel.ttf');

  const mediapipe_module = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js');
  FaceLandmarker = mediapipe_module.FaceLandmarker;
  FilesetResolver = mediapipe_module.FilesetResolver;
  
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm"
  );
  
  // Face Landmark Tracking:
  // https://codepen.io/mediapipe-preview/pen/OJBVQJm
  // https://developers.google.com/mediapipe/solutions/vision/face_landmarker
	myFaceLandmarker = await FaceLandmarker.createFromOptions(vision, {
		numFaces: trackingConfig.maxNumFaces,
		runningMode: "VIDEO",
		outputFaceBlendshapes:trackingConfig.doAcquireFaceMetrics,
		baseOptions: {
			delegate: trackingConfig.cpuOrGpuString,
			modelAssetPath:
				"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
		},
	});
}

//------------------------------------------
//function to continously process video frames from the webcam using 'requestAnimationFrame'
async function predictWebcam() {
  let startTimeMs = performance.now();
  // console.log(myCapture);
  if (myCapture && lastVideoTime !== myCapture.elt.currentTime) {
    if (myFaceLandmarker) {
      faceLandmarks = myFaceLandmarker.detectForVideo(myCapture.elt,startTimeMs);
    }
    lastVideoTime = myCapture.elt.currentTime;
  }
  window.requestAnimationFrame(predictWebcam);
}

//------------------------------------------
///setup function: Initializes the canvas and sets up the webcam capture
const checkOthers = () => {
  fetch('http://10.10.1.1:3000/atIndex').then(res => res.json()).then(atIndexs => {
    if (atIndexs.R.value || atIndexs.G.value || atIndexs.B.value) {
      fetch('http://10.10.1.1:3000/reset')
      window.location.href = "Index.html"; // Redirect to the next interface
    }
  })
}

function setup() {
  checkOthers();
  createCanvas(1075, 1780);
  myCapture = createCapture(VIDEO);
  myCapture.size(320, 240);
  myCapture.hide();


  extra = createGraphics(1000,1100);  //Intruction text
  extra.background(255);
  detection = createGraphics(400,400);  //Intruction text
  detection.background(0,0,0,0.1);
  face = createGraphics (990,990);
  face.background(0,255,0);
}


function draw() { 
  background(0);
  //call all functions and extra canvas
  predictWebcam();
  drawVideoBackground();
  drawFacePoints();
  drawFaceMetrics();
  drawDiagnosticInfo(); 
  typography();

  extra.textFont(myFont);

  push();
  noFill(); //outer
  stroke(255);
  strokeWeight(1);
  rect(22,20,1030,1740)
  pop();

  push();
  noFill(); //outer
  stroke(255);
  strokeWeight(1);
  rect(42,40,985,100)
  pop();

  push();
  noFill(); //outer
  stroke(255);
  strokeWeight(1);
  rect(42,150,985,250)
  pop();

  push();
  noFill(); //outer
  stroke(255);
  strokeWeight(1);
  rect(42,430,985,1300)
  pop();

}

//The text typing 
//The text typing 
function typography() {
 
  push(); // the title
  extra.fill(255);
  extra.textSize(30);
  if (frameCount < delayFrames && !addedW) { //if frame count is smaller than delayframes add first letter
    letters.push("W"); //push the first letter
    addedW = true; // Indicate that first letter have been added
    nextLetterTime = frameCount + delayBetweenLetters; // time in between letters
  }

  if (frameCount >= nextLetterTime && lettersToAdd.length > 0) {
    letters.push(lettersToAdd.shift()); // Add the next letter from the array
    nextLetterTime = frameCount + delayBetweenLetters; //add next letter after 10 frames
  }

  const spacing = 30;// amount of spacing beteen letters 
  // Display the letters from the array
  for (let i = 0; i < letters.length; i++) {
   extra.text(letters[i], 20 + i * spacing, 100);//display on the extra canvas, add spacing so letters are clear
  }
pop();// the push and pop functions allow me to change the setting for brief parts of the code 
push(); // the title
extra.fill(255);
extra.textSize(25);
if (frameCount < delayFrames && !addedW) { //if frame count is smaller than delayframes add first letter
  letters2.push("T"); //push the first letter
  addedW = true; // Indicate that first letter have been added
  nextLetterTime = frameCount + delayBetweenLetters; // time in between letters
}

if (frameCount >= nextLetterTime && lettersToAdd2.length > 0) {
  letters2.push(lettersToAdd2.shift()); // Add the next letter from the array
  nextLetterTime = frameCount + delayBetweenLetters; //add next letter after 10 frames
}

const spacing2 = 30;// amount of spacing beteen letters 
// Display the letters from the array
for (let i = 0; i < letters2.length; i++) {
 extra.text(letters2[i], 20 + i * spacing2,220);//display on the extra canvas, add spacing so letters are clear
}
pop();// the push and pop functions allow me to change the setting for brief parts of the code 
push(); // the title
extra.fill(255);

if (frameCount < delayFrames && !addedW) { //if frame count is smaller than delayframes add first letter
  letters3.push("T"); //push the first letter
  addedW = true; // Indicate that first letter have been added
  nextLetterTime = frameCount + delayBetweenLetters; // time in between letters
}

if (frameCount >= nextLetterTime && lettersToAdd3.length > 0) {
  letters3.push(lettersToAdd3.shift()); // Add the next letter from the array
  nextLetterTime = frameCount + delayBetweenLetters; //add next letter after 10 frames
}

const spacing3 = 30;// amount of spacing beteen letters 
// Display the letters from the array
for (let i = 0; i < letters3.length; i++) {
 extra.text(letters3[i], 10 + i * spacing3, 260);//display on the extra canvas, add spacing so letters are clear
}
pop();// the push and pop functions allow me to change the setting for brief parts of the code 
push(); // the title
extra.fill(255);

if (frameCount < delayFrames && !addedW) { //if frame count is smaller than delayframes add first letter
  letters4.push("T"); //push the first letter
  addedW = true; // Indicate that first letter have been added
  nextLetterTime = frameCount + delayBetweenLetters; // time in between letters
}

if (frameCount >= nextLetterTime && lettersToAdd4.length > 0) {
  letters4.push(lettersToAdd4.shift()); // Add the next letter from the array
  nextLetterTime = frameCount + delayBetweenLetters; //add next letter after 10 frames
}

const spacing4 = 30;// amount of spacing beteen letters 
// Display the letters from the array
for (let i = 0; i < letters4.length; i++) {
 extra.text(letters4[i], 20 + i * spacing4, 340);//display on the extra canvas, add spacing so letters are clear
}
pop();// the push and pop functions allow me to change the setting for brief parts of the code 
}

//------------------------------------------
function drawVideoBackground() { //function to draw the webcam video feed as the background 
  push();
  translate(width/2, 0);
  scale(-1, 1);
     // Apply tint if eyebrow is raised
     if (eyebrowRaised) {
      tint(255, 0, 0, 0);; // Reset tint
      if (tryingToNavigate == false)//to make sure the html redirects as the next p5 sketch is drawn
      window.location.href = "Completed.html";  // Open the next interface
          tryingToNavigate = true;

  } else {
    tint(255, 0, 0, 0);; // Reset tint
  }
  if (myCapture) {
    image(myCapture, 0, 0, 400,400);
  }
  pop();

}

//------------------------------------------
// Tracks 478 points on the face. 
function drawFacePoints() { //draw the detected face landmarks
  let faceDetected = false;
  push();
	if (faceLandmarks && faceLandmarks.faceLandmarks) {
		const nFaces = faceLandmarks.faceLandmarks.length;
	  if (faceLandmarks && faceLandmarks.faceLandmarks) {
      const nFaces = faceLandmarks.faceLandmarks.length;
      if (nFaces > 0) {
        faceDetected = true;
        for (let f = 0; f < nFaces; f++) {
          let aFace = faceLandmarks.faceLandmarks[f];
          if (aFace) {
            let nFaceLandmarks = aFace.length;
          
					noFill();
					stroke("white");
					strokeWeight(0.5);
          
       scale(2,1);
        
					for (let i = 0; i < nFaceLandmarks; i++) {
						let px = aFace[i].x;
						let py = aFace[i].y;
						px = map(px, 0, 1, width, 0);
						py = map(py, 0, 1, 0, height);
						circle(px, py, 1);
					}
    
					noFill();
					stroke("white");
					strokeWeight(0.5);

					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_LIPS);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS);
					drawConnectors(aFace, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS);
					drawConnectors(aFace, FACELANDMARKER_NOSE); // Google offers no nose
          pop();
        }
      }
    }
  }
}

image(detection, 200, 200); 
detection.fill(255);
detection.textSize(20);
detection.textFont(myFont)

  if (faceDetected) {
    noFaceDetectedStartTime = null; // Reset timer when a face is detected
    detection.clear();
  } else {
    if (!noFaceDetectedStartTime) {
      noFaceDetectedStartTime = millis(); // Start timer when no face is detected
      detection.text("NO PLAYER DETECTED...", 20, 20)
    } else if (millis() - noFaceDetectedStartTime > NO_FACE_DETECTED_THRESHOLD) {
      if (!tryingToNavigate) {
        console.log("No face detected for more than 30 seconds. Redirecting...");
        window.location.href = "Index.html"; // Redirect to the next interface
        tryingToNavigate = true; // Mark navigation as initiated
      }
    }//hello
  }
}

function drawFaceMetrics(){ //draw the calculated face metrics
  if (trackingConfig.doAcquireFaceMetrics){
    if (faceLandmarks && faceLandmarks.faceBlendshapes) {
      const nFaces = faceLandmarks.faceLandmarks.length;
      for (let f = 0; f < nFaces; f++) {
        let aFaceMetrics = faceLandmarks.faceBlendshapes[f];
        if (aFaceMetrics){
          
          fill('black'); 
          textSize(10.5); 
          let tx = 50; 
          let ty = 40; 
          let dy = 11;
          let vx0 = tx-5; 
          let vx1 = 5;
          
        
          let nMetrics = aFaceMetrics.categories.length; 
          for (let i=1; i<nMetrics; i++){
            let metricName = aFaceMetrics.categories[i].categoryName;
            noStroke();
            text(metricName, tx,ty); 
            
            let metricValue = aFaceMetrics.categories[i].score;
            let vx = map(metricValue,0,1,vx0,vx1);
            stroke(0,0,0); 
            strokeWeight(2.0); 
            line(vx0,ty-2, vx,ty-2); 
            stroke(0,0,0,20);
            line(vx0,ty-2, vx1,ty-2); 
            ty+=dy;
          }

          image(extra, 100, 0);
              // Log the value of 'facepucker' metric

              //talking function If talking 
              // let mouthPucker = aFaceMetrics.categories.find(category => category.categoryName === 'mouthPucker');
              // let jawOpen = aFaceMetrics.categories.find(category => category.categoryName === 'jawOpen');
              let mouthLowerDownLeft = aFaceMetrics.categories.find(category => category.categoryName === 'mouthLowerDownLeft');
              let mouthUpperUpRight = aFaceMetrics.categories.find(category => category.categoryName === 'mouthUpperUpRight');
              let jawOpen = aFaceMetrics.categories.find(category => category.categoryName === 'jawOpen');
              
            

              if ((mouthUpperUpRight && mouthUpperUpRight.score < 0.1) || (mouthLowerDownLeft && mouthLowerDownLeft.score < 0.1)) {
                  extra.color(255,0,0);
                  extra.clear();
              } else {
                  extra.clear();
                  extra.fill(255,0,0);
               
              }
              
              if ((jawOpen && jawOpen.score >= 0.6)) {
                console.log("eyebrowRaise");
eyebrowRaised = true; // Flag to track if eyebrow is raised
            }
              

        }
      }
    }
  }
}


//------------------------------------------
function drawConnectors(landmarks, connectorSet) {//draw lines connecting specific landmark points
  if (landmarks) {
    let nConnectors = connectorSet.length;
    for (let i=0; i<nConnectors; i++){
      let index0 = connectorSet[i].start; 
      let index1 = connectorSet[i].end;
      let x0 = map(landmarks[index0].x, 0,1, width,0);
      let y0 = map(landmarks[index0].y, 0,1, 0,height);
      let x1 = map(landmarks[index1].x, 0,1, width,0);
      let y1 = map(landmarks[index1].y, 0,1, 0,height);
      line(x0,y0, x1,y1); 
    }
  }
}

//------------------------------------------
function drawDiagnosticInfo() { //draw diagnostic information life frames per second 
  noStroke();
  fill("black");
  textSize(12); 
  text("FPS: " + int(frameRate()), 50, 27);
}

function mousePressed (){
  window.location.href = "Index.html";
}

 //Get rid of the names down the side
 //make the function fully green when its correct 
 //Notify whichever sender 

  // Enumerate devices and start capture