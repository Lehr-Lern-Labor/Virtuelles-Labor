class CurrentLecturesView extends WindowView {

    #eventManager;

    /**
     * @constructor Creates an instance of CurrentLecturesView
     * 
     * @param {EventManager} eventManager event manager
     */
    constructor(eventManager) {
        super();

        if (!!CurrentLecturesView.instance) {
            return CurrentLecturesView.instance;
        }

        CurrentLecturesView.instance = this;

        this.#eventManager = eventManager;

        $(document).ready(() => {
            $('#closeCurrentLecturesButton').off();
            $('#closeCurrentLecturesButton').click(() => {
                this.#eventManager.handleClearInterval();
                $('#currentLectures').hide();
            })
        })
    }

    /**
     * Draws current lectures window
     * 
     * @param {Object[]} lectures 
     */
    draw(lectures) {
        $('#currentLecturesContainer').empty();
        $('#nolecture').empty();

        if (lectures.length < 1) {
            $('#nolecture').text("Lectures will be shown here 10 minutes before the start. Please check the schedule and come back later.")
        }
        lectures.forEach(lecture => {
            var startingTime = new DateParser(new Date(lecture.startingTime)).parseOnlyTime();

            $('#currentLecturesContainer').append(`
                <div class="currentLecturesContainer d-flex flex-column align-items-start col-5 m-5 pt-3">
                    <h5 style="display:inline">${lecture.title} </h5>
                    <div>${lecture.remarks}</div>
                    <div class="small">${"By " + lecture.oratorName}</div>
                    <br>
                    <div class="small">${"Start: " + startingTime + " || Duration: " + Math.floor(lecture.duration / 60) + " minutes" + " || Seat: " + lecture.maxParticipants + " participants"}</div>
                    <span id="${"full" + lecture.id}" style="color: red; display:none" class="align-self-end mt-1 p-2">Lecture is currently full.</span>
                    <button id='${"show" + lecture.id}' class="btn btn-lecture m-2 align-self-end mt-auto">Show</button>
                </div>
            `)

            $('#show' + lecture.id).click((event) => {
                $('#show' + lecture.id).hide();
                this.#eventManager.handleLectureClicked(lecture.id);
            })
        });

        $('#currentLectures').show();
    }

    /**
     * Draws lecture full on current lectures window
     * 
     * @param {String} lectureId lecture ID
     */
    drawLectureFull(lectureId) {
        $('#show' + lectureId).hide();
        $('#full' + lectureId).show()
    }

}