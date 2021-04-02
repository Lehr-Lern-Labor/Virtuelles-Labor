/**
 * The Rank List Window View
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
class RankListView extends WindowView {

    rankList;

    /**
     * Creates an instance of RankListView
     */
    constructor() {
        super();

        if (!!RankListView.instance) {
            return RankListView.instance;
        }

        RankListView.instance = this;
    }

    /**
     * Draws rank list window
     * 
     * @param {Object[]} rankList rank list
     */
    draw(rankList) {
        $('#ranklistwait').hide();
        $('#rankListModal .modal-body #ranklistrow').empty();

        if (rankList.length < 1) {
            $('#noranklist').text("There are no participants in this conference yet.");
            return;
        }

        this.rankList = rankList;

        this.rankList.forEach(ppant => {

            var color;

            if (ppant.rank == 1)
                color = 'gold';
            else if (ppant.rank == 2)
                color = 'antiquewhite';
            else if (ppant.rank == 3)
                color = '#f79736';
            else
                color = '#A9A9A9';


            $('#rankListModal .modal-body #ranklistrow').append(`
                <div class="col-sm-4 mb-2 mt-2">
                    <div class="card currentLecturesContainer" id="${"rank" + ppant.participantId}" style="border-radius: 0px; border-color: ${color}; color: ${color}; border-style: groove;">
                        <div class="card-body">
                            <div class="card-text" id="${"cardtext" + ppant.participantId}">
                                <div class="row">
                                    <div class="col-md-auto">${ppant.rank}</div>
                                    <div class="col-md-auto">${ppant.username}</div>
                                    <div class="col text-right">${ppant.points + "P"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `)

            if (ppant.rank == 1 || ppant.rank == 2 || ppant.rank == 3)
                document.getElementById("cardtext" + ppant.participantId).style.fontWeight = "bold";

            if (ppant.self)
                document.getElementById("rank" + ppant.participantId).style.boxShadow = '0 0 4px 4px ' + color;
        })
    }
}