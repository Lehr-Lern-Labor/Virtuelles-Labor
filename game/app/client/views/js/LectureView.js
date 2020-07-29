class LectureView extends WindowView {

    #timerIntervalId;
    #lectureStatus;
    #hasToken;
    #lectureId;

    constructor() {
        super();

        this.#lectureStatus = LectureStatus.PENDING;

        $(document).ready(() => {
            function sendMessage() {
                let messageVal = $('#lectureChatInput').val();
                if(messageVal !== '') {
                  clientController.sendToServerLectureChatMessage($('#lectureChatInput').val());
                  $('#lectureChatInput').val('');
                  $('#lectureChatInput').focus();
                }
            }
        
            $(document).on('click', '#lectureChatButton', () => { 
                sendMessage();
            });
        
            $('#lectureChatInput').keydown((e) => {
                if (e.keyCode === 13) {
                    sendMessage();
                }
            });
        
        
            $(document).on('click', ".closeButton" , () => {
                this.leaveLecture();
            })
        
        });
        
    }

    draw(lecture, hasToken, lectureChat) {
        this.#hasToken = hasToken;
        this.#lectureId = lecture.id;
        // hide the overview of current lectures
        $('#currentLectures').hide(); 

        //chat box is emptied to prevent messages from showing in the wrong lecture chat
        $('#lectureChatMessages').empty();

        //chat box is filled with the lecture chat
        if (lectureChat.length > 0) {
            for(var i = 0; i < lectureChat.length; i++) {
                var message = lectureChat[i];
                var messageHeader = message.username + ", " + message.timestamp + ":";
                var $newMessageHeader = $( "<div style='font-size: small;'></div>" );
                var $newMessageBody = $( "<div style='font-size: medium;'></div>" );
                $newMessageHeader.text(messageHeader);
                $newMessageBody.text(message.messageText);
                $('#lectureChatMessages').append($newMessageHeader);
                $('#lectureChatMessages').append($newMessageBody);
            }
        } 
        
        //the input field is added if the user has a valid token
        if(this.#hasToken) {
            if ($('#lectureChatInputGroup').is(':empty')) {   
            $('#lectureChatInputGroup').append(`
            <input id="lectureChatInput" type="text" style="background-color: #1b1e24; color: antiquewhite" class="form-control" placeholder="Enter message ...">
            <div class="input-group-append">
                <button id="lectureChatButton" class="btn btn-lecture mr-3" type="button">Send</button>
            </div>
            `)
            }
            $('#tokenIcon').empty();
            $('#tokenIcon').append(`
            <i class="fa fa-question-circle fa-4x"></i>
            `)
            $('#tokenLabel').empty();
            $('#tokenLabel').append('You obtained a question token!')

        // the input field is emptied if the user does not have a valid token
        } else {
            $('#lectureChatInputGroup').empty();
            $('#tokenIcon').empty();
            $('#tokenIcon').append(`
            <i class="fa fa-times-circle fa-4x"></i>
            `)
            $('#tokenLabel').empty();
            $('#tokenLabel').append('You left the lecture for too long. Therefore, you are not able to ask questions in the lecture chat.')
        }
        $('#closeButton').empty();

        $('#closeButton').append(`
        <button id="${lecture.id}" class="ml-auto pl-1 pr-1 closeButton" style="background-color: transparent !important; border-color: transparent !important; color: antiquewhite; box-shadow: 0px 0px 0px transparent;" name="closeLectureVideoButton" type="button"><i class="fa fa-close"></i></button>
        `)

        $('#lectureTitleLabel').text(lecture.title);
        $('#lectureSpeakerLabel').text(lecture.oratorName);

        $('#lectureVideo').empty();
        $('#lectureVideo').append(`
            <video id="${"lectureVideo" + lecture.id}" width="100%" height = "100%" controls preload controlsList="nodownload" src="${lecture.videoUrl}"></video>
        `)

        $('#lectureVideoWindow').show();
        
        
        var video = $(`#lectureVideo${lecture.id}`)[0]; // get the first element otherwise the video is wrapped as jquery object
        
        // set default controls
        video.disablePictureInPicture = true;
        
        
        video.addEventListener('loadeddata', () => {
            video.pause();

            var lectureStartingTime = Date.now() + 20000; // TODO: replace with lecture.startingTime, assuming lecture starts in 20 seconds for now
            var lectureDuration = video.duration * 1000; //duration of the lecture in milliseconds

            this.#timerIntervalId = setInterval(() => {
                var currentTimeDifference =  Date.now() - lectureStartingTime;

                if (currentTimeDifference < 0) {
                    this.#lectureStatus = LectureStatus.PENDING;
                    console.log("Waiting for the lecture to start.")
                    video.pause();
                } else if (currentTimeDifference >= 0 && currentTimeDifference <= lectureDuration && video.paused) {
                    this.#lectureStatus = LectureStatus.RUNNING;
                    console.log("Lecture is running.")
                    video.play();
                } else if (currentTimeDifference >= 0 && currentTimeDifference > lectureDuration) {
                    this.#lectureStatus = LectureStatus.OVER;
                    console.log("Lecture is finished.")
                }
            }, 100); // check lecture status every 100ms
        });
    }   

    leaveLecture() {
        if (this.#lectureStatus === LectureStatus.RUNNING || this.#lectureStatus === LectureStatus.PENDING) {
            var shouldLeave = false;
            if (this.#hasToken) {
                shouldLeave = confirm('The lecture is not over! When you leave, you have 5 minutes to come back. After that time, your token will expire for this lecture. Are you sure you want to leave?')
            } else {
                shouldLeave = confirm('Are you sure you want to leave?')
            }

            if (shouldLeave) { this.close(); }
        } else {
            this.close();
        }
    }

    close() {
        clearInterval(this.#timerIntervalId);
        $('#lectureVideo').empty();
        $('#lectureVideoWindow').hide();
        var eventManager = new EventManager();
        eventManager.handleLectureLeft(this.#lectureId, false);
    }
}


const LectureStatus = Object.freeze
({
    PENDING: "PENDING",
    RUNNING: "RUNNING",
    OVER: "OVER"
});
