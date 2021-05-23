
//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream;                      //stream from getUserMedia()
var rec;                            //Recorder.js object
var input;                          //MediaStreamAudioSourceNode we'll be recording


var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record
var analyserContext = null;
var interval;
var totalSeconds = 0;

$('.paused').hide()
$('.preview').hide()

var recordButton = document.getElementById("btn-record");
var resumeButton = document.getElementById('btn-resume')
var stopButton = document.getElementById("btn-stop");
var pauseButton = document.getElementById("btn-pause");
// //
// //add events to those 2 buttons

recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);

//
// $('#recordButton').click(function(e) {
//
//
//
//
//         //
//         // $('#btn-pause').click(function (){
//         //        clearInterval(interval)
//         //        $('#btn-pause').hide()
//         //        $('#btn-resume').show()
//         //
//         //       pauseRecording()
//         //       console.log("Click pause button!")
//         // });
//         //
//         // // $('#btn-resume').click(function (){
//         // //
//         // //       console.log("Click resume button!")
//         // //       startTimer()
//         // //
//         // //        $('#btn-pause').show()
//         // //        $('#btn-resume').hide()
//     // // });
//
// });
//
var distortion

function showTimer() {

        ++totalSeconds;
        var minutesLabel = document.getElementById("recording-timer");
        minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60)) + ":" +pad(totalSeconds % 60);

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



   startTimer()

    /*
        Simple constraints object, for more advanced audio features see
        https://addpipe.com/blog/audio-constraints-getusermedia/
    */

    var constraints = { audio: true, video:false }

    /*
        Disable the record button until we get a success or fail from getUserMedia()
    */

    // recordButton.disabled = true;
    // stopButton.disabled = false;
    // pauseButton.disabled = false

    /*
        We're using the standard promise based getUserMedia()
        https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

        /*
            create an audio context after getUserMedia is called
            sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
            the sampleRate defaults to the one set in your OS for your playback device

        */


        audioContext = new AudioContext();

        inputPoint = audioContext.createGain();
        analyserContext = audioContext.createAnalyser();

        //console.log(audioContext.sampleRate)
        //update the format
        //document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

        /*  assign to gumStream for later use  */
        gumStream = stream;

        /* use the stream */
        input = audioContext.createMediaStreamSource(stream);


        analyserContext.fftSize = 2048;
        input.connect(analyserContext)

        //analyserContext.connect(audioContext.destination )
       // analyserContext.connect(audioContext.destination)
        // analyserContext.connect(distortion);
        // distortion.connect(audioContext.destination);


        /*
            Create the Recorder object and configure to record mono sound (1 channel)
            Recording 2 channels  will double the file size
        */
        rec = new Recorder(input,{numChannels:1})




        //start the recording process
        rec.record()



        console.log("Recording started");

    }).catch(function(err) {
        //enable the record button if getUserMedia() fails
        // recordButton.disabled = false;
        // stopButton.disabled = true;
        // pauseButton.disabled = true
        console.log('fail audio')
    });
}

function pauseRecording(){
    //console.log("pauseButton clicked rec.recording=",rec.recording);
    if (rec.recording){
        //pause
        rec.stop();
        clearInterval(interval)
        pauseButton.style.backgroundColor = 'blue'
        console.log("Click pause ....")
    }else{
        //resume
        startTimer()
        rec.record()
        pauseButton.style.backgroundColor = 'white'

        console.log("Resume")
    }
}

function stopRecording() {
    console.log("stopButton clicked");

    //disable the stop button, enable the record too allow for new recordings
    // stopButton.disabled = true;
    // recordButton.disabled = false;
    // pauseButton.disabled = true;

    //reset button just in case the recording is stopped while paused


    //tell the recorder to stop the recording

    clearInterval(interval)
    rec.stop();

    //stop microphone access
    gumStream.getAudioTracks()[0].stop();

    // analyserContext.fftSize = 2048;
    // var bufferLength = analyserContext.frequencyBinCount;
    // var dataArray = new Uint8Array(bufferLength);
    var canvas = document.getElementById( "wavedisplay" );

   // analyserContext.getByteTimeDomainData(dataArray);
   // drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), dataArray);
    drawContext = canvas.getContext('2d')
   // drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), dataArray);
   // window.requestAnimationFrame(drawBuffer)
    //create the wav blob and pass it on to createDownloadLink



     var freqDomain = new Uint8Array(analyserContext.frequencyBinCount);
    // analyserContext.getByteFrequencyData(freqDomain);
    // for (var i = 0; i < analyserContext.frequencyBinCount; i++) {
    //     var value = freqDomain[i];
    //     var percent = value / 256;
    //     var height =  canvas.height * percent;
    //     var offset =  canvas.height - height - 1;
    //     var barWidth = canvas.width/analyserContext.frequencyBinCount;
    //     var hue = i/analyserContext.frequencyBinCount * 360;
    //     drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
    //     drawContext.fillRect(i * barWidth, offset, barWidth, height);
    // }

        var timeDomain = new Uint8Array(analyserContext.frequencyBinCount);
        analyserContext.getByteTimeDomainData(timeDomain);

        console.log(analyserContext.frequencyBinCount)
        for (var i = 0; i < analyserContext.frequencyBinCount; i++) {
        var value = timeDomain[i];
        var percent = value / 256;
        var height = canvas.height * percent;
        var offset = canvas.height - height - 1;
        var barWidth = canvas.width / analyserContext.frequencyBinCount;
        drawContext.fillStyle = 'black';
        drawContext.fillRect(i * barWidth, offset, 1, 1);
      }
    window.requestAnimationFrame = (function(){
    return window.requestAnimationFrame  ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function(callback){
      window.setTimeout(callback, 1000 / 60);
    };
    })();




    rec.exportWAV(createDownloadLink);


}

function createDownloadLink(blob) {

    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');

    //name of .wav file to use during upload and download (without extendion)
    count = 0
    var filename = "FileRecorde" + count;

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    //save to disk link
    link.href = url;
    link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
    link.innerHTML = "Save to disk";

    //add the new audio element to li
    li.appendChild(au);

    //add the filename to the li
    li.appendChild(document.createTextNode(filename+".wav "))

    //add the save to disk link to li
    li.appendChild(link);

    //upload link
    var upload = document.createElement('a');
    upload.href="#";
    upload.innerHTML = "Upload";
    upload.addEventListener("click", function(event){
          var xhr=new XMLHttpRequest();
          xhr.onload=function(e) {
              if(this.readyState === 4) {
                  console.log("Server returned: ",e.target.responseText);
              }
          };
          var fd=new FormData();
          fd.append("audio_data",blob, filename);
          xhr.open("POST","/",true);
          xhr.send(fd);
    })
    li.appendChild(document.createTextNode (" "))//add a space in between
    li.appendChild(upload)//add the upload link to li

    //add the li element to the ol
    recordingsList.appendChild(li);

    count += 1
}


function drawBuffer( width, height, context, data ) {

    var step = Math.ceil( data.length / width );
    var amp = height / 2;
    context.fillStyle = "green";
    context.clearRect(0,0,width,height);
    for(var i=0; i < width; i++){
        var min = 1.0;
        var max = -1.0;
        for (j=0; j<step; j++) {
            var datum = data[(i*step)+j];
            if (datum < min)
                min = datum;
            if (datum > max)
                max = datum;
        }
        context.fillRect(i,(1+min)*amp,1,Math.max(1,(max-min)*amp));
    }
}




