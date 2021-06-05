/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext;
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;

var audio;
var interval;
var totalSeconds = 0;

var id = 0;
var process_line = 70;

$('.paused').hide();
$('.preview').hide();

$('#btn-resume').hide();

$('#btn-pre-pause').hide();

$('#model_result_area').hide();
$('#btn-text-save').hide();

var recordButton = document.getElementById("btn-record");
var pauseButton = document.getElementById("btn-pause");
var resumeButton = document.getElementById("btn-resume");
var stopButton = document.getElementById("btn-stop");

var prePlayButton = document.getElementById("btn-pre-play");
var prePauseButton = document.getElementById("btn-pre-pause");
var saveButton = document.getElementById("btn-save");
var quitButton = document.getElementById("btn-quit");
var convertButton = document.getElementById("btn-convert")
var textSaveButton = document.getElementById("btn-text-save");

//recording
recordButton.addEventListener("click", startRecording);
pauseButton.addEventListener("click", pauseRecording);
resumeButton.addEventListener('click', resumeRecording);
stopButton.addEventListener("click", stopRecording);
//preview
prePlayButton.addEventListener("click", prePlayRecording);
prePauseButton.addEventListener("click", prePauseRecording);
saveButton.addEventListener("click", saveAudio)
quitButton.addEventListener("click", quitRecording);
convertButton.addEventListener("click", convertToText);


function convertToText() {
    audioRecorder.exportWAV(createDownloadLink);
}
function saveAudio() {
    //console.log("save click")
    audioRecorder.exportWAV(doneEncoding)

}

function gotBuffers( buffers ) {
    var canvas = document.getElementById( "wavedisplay" );

    drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );

    // the ONLY time gotBuffers is called is right after a new recording is completed -
    // so here's where we should set up the download.
   // audioRecorder.exportWAV( doneEncoding );

   audioRecorder.exportWAV(createAudioBlob)




}

function createAudioBlob(blob)
{
    //var li = document.createElement('li');
    var url = URL.createObjectURL(blob);
    audio = document.createElement('audio');

    audio.controls = false;
    audio.src = url;
    audio.id = "audio-record"

    $('#audio-display').append(audio);

     //add the new audio element to li
    //  li.appendChild(au);

}


function doneEncoding( blob ) {
    Recorder.setupDownload( blob, "audio" + id + ".wav" );
    id++;


}

function toggleRecording( e ) {



        // stop recording
        audioRecorder.stop();
        // e.classList.remove("recording");
        audioRecorder.getBuffers( gotBuffers );


        // start recording
        if (!audioRecorder)
            return;
        // e.classList.add("recording");
        audioRecorder.clear();
        audioRecorder.record();
        // recordButton.style.backgroundColor = 'white'
}




function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}

function updateAnalysers(time) {
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

        analyserNode.getByteFrequencyData(freqByteData);

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor( i * multiplier );
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (var j = 0; j< multiplier; j++)
                magnitude += freqByteData[offset + j];
            magnitude = magnitude / multiplier;
            var magnitude2 = freqByteData[i * multiplier];
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
    }

    rafID = window.requestAnimationFrame( updateAnalysers );
}

function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    audioContext = new AudioContext();
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

//    audioInput = convertToMono( input );

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint );


    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
    updateAnalysers();
}

function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
}

window.addEventListener('load', initAudio );




function showTimer() {

        ++totalSeconds;
        var minutesLabel = document.getElementById("recording-timer");
        minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60)) + ":" + pad(totalSeconds % 60);

}

function pad(val) {
    var valString = val + "";
    if (valString.length < 2) {
    return "0" + valString;
    } else {
    return valString;
    }
}
function startTimer() {
    interval = setInterval(showTimer, 1000)
}



function startRecording() {
    console.log("recordButton clicked");

    $('.wait-record').hide()
    $('.paused').show()


    if (!audioRecorder)
            return;
        // e.classList.add("recording");
    audioRecorder.clear();
    audioRecorder.record();

    startTimer();

}

function pauseRecording(){
        //console.log("pauseButton clicked rec.recording=",rec.recording);

        console.log('pause');

        audioRecorder.stop();
        clearInterval(interval)

        $('#btn-pause').hide()
        $('#btn-resume').show()

}

function resumeRecording() {

    $('#btn-resume').hide()
    $('#btn-pause').show()
    startTimer()
    audioRecorder.record()
    console.log("Resume")

}

function stopRecording() {

     clearInterval(interval)
     audioRecorder.stop();
        // e.classList.remove("recording");
     audioRecorder.getBuffers( gotBuffers );

     $('.paused').hide();
     $('.preview').show();


     time = pad(parseInt(totalSeconds / 60)) + ":" + pad(totalSeconds % 60);


     $('#cb-right').attr('data-content', time)

}




function createDownloadLink(blob) {


    var url = URL.createObjectURL(blob);

    var filename = "audio" + id + ".wav";

    var xhr = new XMLHttpRequest();
    xhr.onload=function(e) {
      if(this.readyState === 4) {

          $('#model_result_area').show();
          $('#btn-text-save').show();
          document.getElementById("result").innerHTML = e.target.responseText
          console.log("Server returned: ",e.target.responseText);
      }
    };
    var fd=new FormData();
    fd.append("audio_data",blob, filename);
    xhr.open("POST","/",true);
    xhr.send(fd);
    id++;



}


function prePlayRecording(){

    console.log(audio.duration)
    // console.log(Math.round(audio.duration * 10) / 10)
    // console.log(audio.duration)


    audio.play();



    $('#play-area').removeClass("flex-1")
    $('#btn-pre-play').hide()

    var progress_bar = document.getElementById("play-progress-line")

    var play_time = setInterval(frame, parseInt(audio.duration))

    function frame() {
     if (process_line >= 1456) {
        clearInterval(play_time);
        process_line = 70;
        $('#btn-pre-pause').hide()
         $('#btn-pre-play').show()
      } else {
        process_line += 1.5;
        progress_bar.style.left = process_line + "px";
      }
    }

    $('#btn-pre-pause').show()
}



function prePauseRecording()
{
    audio.pause();
    $('#btn-pre-pause').hide()
    $('#play-area').addClass("flex-1")
    $('#btn-pre-play').show()


}

function quitRecording(){
   // $("#top-controls").addClass("visible")
    $("#dialog-quit").addClass("visible")


}


$("#btn-quit-accept").click(function () {
    //reset

    $(".dialog-quit").removeClass("visible")
    document.getElementById("recording-timer").innerHTML = "00:00"
    totalSeconds = 0

    audioRecorder.clear()

    $('.preview').hide()

    $('.wait-record').show()

     $('#model_result_area').hide();
     $('#btn-text-save').hide();
     document.getElementById("result").innerHTML = ""
});


$("#btn-quit-deny").click(function () {
    //$(".top-controls").removeClass("visible")
    $(".dialog-quit").removeClass("visible")
});

$("#btn-text-save").click(function (){

    var data = document.getElementById("result").innerHTML;
    console.log(data)
    if(data.length > 1){
          var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
          saveAs(blob, "speech2text" + id + ".txt");
    }

});