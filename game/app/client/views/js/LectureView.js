// TODO: need refactoring
class LectureView extends WindowView {

    #timerIntervalId;
    #lectureStatus;
    #hasToken;
    #lectureId;
    #timeLeft;

    constructor() {
        super();

        this.#lectureStatus = LectureStatus.PENDING;

        /*sets functions when document is ready, without this it is not possible to assign functions to
          appended buttons*/
        $(document).ready(() => {
            function sendMessage(event) {
                event.preventDefault();

                let messageVal = $('#lectureChatInput').val();
                if (messageVal !== '') {
                    new EventManager().handleLectureChatMessageInput(messageVal);
                    $('#lectureChatInput').val('');
                    $('#lectureChatInput').focus();
                }
            }

            $(document).on('click', '#lectureChatButton', () => {
                sendMessage(event);
            });

            $(document).on('keydown', function(e) {
                if(document.activeElement === $("#lectureChatInput")[0] && e.keyCode === 13) {
                    sendMessage(event);
                }
            });

            $(document).off('click', ".closeButton");

            $(document).on('click', ".closeButton", () => {
                this.leaveLecture();
            })

        });

    }

    draw(lecture, hasToken, lectureChat) {
        this.#hasToken = hasToken;
        this.#lectureId = lecture.id;
        // hide the overview of current lectures
        $('#currentLectures').hide();

        this.drawChat(lectureChat);

        //empties chat input to disable lecture chat
        $('#lectureChatInputGroup').empty();
        $('#pendingLectureChatMessage').empty();
        $('#closeButton').empty();

        $('#closeButton').append(`
        <button id="${lecture.id}" class="ml-auto pl-1 pr-1 closeButton" style="background-color: transparent !important; border-color: transparent !important; color: antiquewhite; box-shadow: 0px 0px 0px transparent;" name="closeLectureVideoButton" type="button"><i class="fa fa-close"></i></button>
        `)

        $('#lectureChatMessages').append(`
            <div id="pendingLectureChatMessage">
            <p style="text-align: center">You can ask questions in this chat after the lecture!</p>
            </div>
        `);

        $('#lectureTitleLabel').text(lecture.title);
        $('#lectureSpeakerLabel').text(lecture.oratorName);

        //empties video div to prevent showing the wrong video
        $('#lectureVideo').empty();

        //opens lecture video window
        $('#lectureVideoWindow').show();

        $('#lectureVideo').append(`
        <video id="${"lectureVideo" + lecture.id}" width="100%" height = "100%" controls preload controlsList="nodownload" src="${lecture.videoUrl}"></video>
        `)
        var video = $(`#lectureVideo${lecture.id}`)[0]; // get the first element otherwise the video is wrapped as jquery object

        // set default controls
        video.disablePictureInPicture = true;


        video.addEventListener('loadeddata', () => {
            video.pause();

            var lectureStartingTime = new Date(lecture.startingTime).getTime(); // TODO: replace with lecture.startingTime, assuming lecture starts in 20 seconds for now

            var lectureDuration = lecture.duration * 1000; //duration of the lecture in milliseconds

            this.#timerIntervalId = setInterval(() => {
                var currentTimeDifference = Date.now() - lectureStartingTime;

                if (currentTimeDifference < 0) {
                    $('#lecturePending').remove();
                    $('#lectureVideo').append(`
                    <div id="lecturePending" style="top: 0; left: 0; position: absolute; width: 100%; height: 100%; background: black; z-index: 1053; padding: 15%;" class="text-center">
                        <div id="countdown"></div>
                        <div>seconds left till the</div>
                        <div>presentation starts</div>
                    </div>
                `)
                    this.#lectureStatus = LectureStatus.PENDING;

                    var newTimeLeft = (-1) * Math.round(currentTimeDifference / 1000);
                    if (this.#timeLeft !== newTimeLeft) {
                        this.#timeLeft = newTimeLeft;
                        $('#countdown').empty()
                        $('#countdown').append(`<div style="font-size: 40px;" class="animate__animated animate__bounceIn"><b>${this.#timeLeft}</b></div>`);
                    }

                    video.pause();
                } else if (currentTimeDifference >= 0 && currentTimeDifference <= lectureDuration && video.paused) {
                    $('#lecturePending').hide();
                    this.#lectureStatus = LectureStatus.RUNNING;
                    video.currentTime = Math.round(currentTimeDifference / 1000);
                    video.play();
                } else if (currentTimeDifference >= 0 && currentTimeDifference > lectureDuration) {
                    clearInterval(this.#timerIntervalId);
                    $('#lecturePending').hide();
                    $('#pendingLectureChatMessage').empty();
                    this.#lectureStatus = LectureStatus.OVER
                    this.drawToken(this.#hasToken, TokenMessages.TIMEOUT);
                    video.controlsList.remove('nodownload');
                    video.pause();
                    
                }
            }, 1000); // check lecture status every 1s

            video.addEventListener('pause', () => {
                if (this.#lectureStatus === LectureStatus.RUNNING) {
                    video.play();
                }
            })

            video.addEventListener('play', () => {
                if (this.#lectureStatus === LectureStatus.OVER) {
                    video.pause();
                }
            })
        });
    }

    leaveLecture() {
        if (this.#lectureStatus === LectureStatus.RUNNING) {
            var shouldLeave = false;
            if (this.#hasToken) {
                shouldLeave = confirm('The lecture is not over! When you leave, you have 5 minutes to come back. After that time, your token will expire for this lecture. Are you sure you want to leave?')
            } else {
                shouldLeave = confirm('Are you sure you want to leave?')
            }

            if (shouldLeave) {
                this.close();
            }

        } else if (this.#lectureStatus === LectureStatus.PENDING) {
            alert('When you leave, you have 5 minutes after the lecture begins to come back. After that time, your token will expire for this lecture. Please come back on time!')
            this.close();
        }

        else {
            this.close();
        }
    }

    close() {
        var video = $(`#lectureVideo${this.#lectureId}`)[0];
        if (video !== undefined) {
            video.removeAttribute('src'); // empty source
            video.load();
            clearInterval(this.#timerIntervalId);
            $('#lectureVideo').empty();
            $('#lectureVideoWindow').hide();

            var eventManager = new EventManager();
            if (this.#lectureStatus === LectureStatus.RUNNING || this.#lectureStatus === LectureStatus.PENDING) {
                eventManager.handleLectureLeft(this.#lectureId, false);
            } else {
                eventManager.handleLectureLeft(this.#lectureId, true);
            }
        } else {
            $('#lectureVideoWindow').hide();
        }
    }

    drawChat(lectureChat) {
        $('#lectureChatMessages').empty();
        if (lectureChat.length > 0) {
            for (var i = 0; i < lectureChat.length; i++) {
                var message = lectureChat[i];
                var timestamp = new DateParser(new Date(message.timestamp)).parseOnlyTime()
                var messageHeader = message.username + ", " + timestamp + ":";
                var $newMessageHeader = $("<div style='font-size: small;'></div>");
                var $newMessageBody = $("<div style='font-size: medium;'></div>");
                $newMessageHeader.text(messageHeader);
                $newMessageBody.text(message.text);
                $('#lectureChatMessages').append($newMessageHeader);
                $('#lectureChatMessages').append($newMessageBody);
            }

        }
    }
    
    drawToken(hasToken, message) {
        if (hasToken) {
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
            $('#tokenLabel').append('You obtained a question token!');
        // the input field is emptied if the user does not have a valid token
        } else {
            $('#lectureChatInputGroup').empty();
            $('#tokenIcon').empty();
            $('#tokenIcon').append(`
                <i class="fa fa-times-circle fa-4x"></i>
            `)
            $('#tokenLabel').empty();
            $('#tokenLabel').append(message)
        }
    };
}
