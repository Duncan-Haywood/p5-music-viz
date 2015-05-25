/**
  Get track data by uploading a file to the echo nest. You'll need an API Key. 
  Then, open up the terminal and make this POST request with your mp3 path and API key:
  
  curl -F "api_key=[YOURAPIKEY]" -F "filetype=mp3" -F "track=@[PATH]" "http://developer.echonest.com/api/v4/track/upload"
  
  wait for the response...and copy the 'id' which is unique to your track upload.

  Paste the ID and your API key into this GET request:
  http://developer.echonest.com/api/v4/track/profile?api_key=[YOURAPIKEY]&format=json&id=[YOURTRACKID]&bucket=audio_summary

  Click through to analysis_url, and save that JSON file

  more info http://developer.echonest.com/raw_tutorials/faqs/faq_03.html
  Further reading: http://developer.echonest.com/docs/v4/_static/AnalyzeDocumentation.pdf
 */

var echonestAnalysis;
var cnv;
var notes = new Array(12);

var audioEl;

var maxDiameter;
var rotation = 0;
var rotationInc;
var rotations;

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  background(0);
  noStroke();
  colorMode(HSB, 255);

  maxDiameter = width;
  translate(width/2, height/2);

  rotations = [0, PI/60, -PI/60, PI/2, -PI/2, PI/6, -PI/3, PI/5, -PI/32];
  rotationInc = rotations[0];

  // draw keys
  for (var i = 0; i < notes.length; i++) {
    var diameter = width/8;
    var angle = TWO_PI/notes.length;
    var hue = round( map(i, 0, notes.length, 0, 255) );
    var c = color(hue, 250, 200, 255);
    notes[i] = new Arc(i, diameter, angle, c);
    notes[i].draw();
  }

  // loadJSON('../../music/Peter_Johnston_-_La_ere_gymnopedie.json', gotData);
  // audioEl = createAudio('../../music/Peter_Johnston_-_La_ere_gymnopedie.mp3');

  loadJSON('../../music/Alaclair_Ensemble_-_Twit_JournalisT.json', gotData);
  audioEl = createAudio('../../music/Alaclair_Ensemble_-_14_-_Twit_JournalisT.mp3');
}

function draw() {
  background(0, 0, 0, 20);

  rotate(rotation += rotationInc);

  for (var i = 0; i < notes.length; i++) {
    notes[i].draw(); 
  }

}

// callback from loadJSON
function gotData(data) {
  echonestAnalysis = data;

  scheduleSegments(data.segments);

  scheduleBeats(data.beats);

  scheduleSections(data.bars);

  audioEl.play();
}


/////////// schedule stuff based on json data
function scheduleSegments(segments) {

  for (var i = 0; i < segments.length; i++) {
    var seg = segments[i];
    if (seg.confidence > 0.01) {
      var startTime = seg.start;
      var endTime = seg.start + seg.duration;
      var pitches = seg.pitches;

      audioEl.setTimeline(triggerNote, startTime, pitches);
      audioEl.setTimeline(releaseNote, endTime);

    }
  }
}

function scheduleBeats(beats) {
  for (var i = 0; i < beats.length; i++) {
    var beat = beats[i];
    var startTime = beat.start;

    audioEl.setTimeline(triggerBeat, startTime);
  }
}

function scheduleSections(sections) {
  for (var i = 0; i < sections.length; i++) {
    var section = sections[i];
    var startTime = section.start;
    audioEl.setTimeline(changeRotation, startTime, i);
  }
}


///////// callbacks from timeline events
function triggerNote(time, pitches) {
  for (var i = 0; i < notes.length; i++) {
    if (pitches[i] > 0.8) {
      notes[i].triggerNote(pitches[i]);
    }
  }
}

function releaseNote() {
  for (var i = 0; i < notes.length; i++) {
    notes[i].releaseNote();
  }
}

function triggerBeat() {
  for (var i = 0; i < notes.length; i++) {
    notes[i].triggerBeat();
  }
}

function changeRotation(time, index) {
  rotationInc = rotations[index % rotations.length];
}

var Arc = function(index, diameter, angle, c) {
  this.index = index;
  this.diameter = diameter;
  this.extraRad = 1;

  this.angle = angle;
  this.color = c;
  this.alpha = this.color.rgba[3];
  this.decayRate = 0.95;
}

Arc.prototype.triggerNote = function(val) {
  this.alpha = 255 * val;
  this.decayRate = 1 + val/25;
  this.color.rgba[3] = this.alpha;
}

Arc.prototype.releaseNote = function() {
  this.decayRate = 0.9;
}

Arc.prototype.triggerBeat = function() {
  this.extraRad = 100;
  this.radRate = 1.3;
}

Arc.prototype.draw = function() {
  this.alpha *= this.decayRate;
  this.extraRad *= this.radRate * this.decayRate;
  this.extraRad = constrain(this.extraRad, 0.01, maxDiameter);

  this.radRate *= 0.98;
  this.radRate = constrain(this.radRate, 0.9, 1.5);

  this.color.rgba[3] = this.alpha;
  fill(this.color);

  var d = this.diameter + this.extraRad;

  arc(0, 0, d, d, this.index*this.angle, (this.index*this.angle) + this.angle);
}