/**
 * The NPC Story Window View
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
class NPCStoryView extends WindowView {

    /**
     * Creates an instance of NPCStoryView
     */
    constructor() {
        super();

        if (!!NPCStoryView.instance) {
            return NPCStoryView.instance;
        }

        NPCStoryView.instance = this;
    }

    /**
     * Draws NPC story window
     * 
     * @param {String} name NPC name
     * @param {String[]} story NPC story
     * @param {String} npcId NPC id
     */
    draw(name, story, npcId) {
        $('#npcStoryWait' + npcId).hide()
        $(`#npcStoryModal${npcId} .modal-header`).empty()
        $('#npcStory' + npcId).empty();
        
        $(`#npcStoryModal${npcId} .modal-header`).append(`
            <h5 class="modal-title d-inline-block" id="npcStoryTitle${npcId}">${name + " says..."}</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `)

        for (var i = 0; i < story.length; i++) {
            $('#npcStory' + npcId).append(`
                <h5 style="background-color: rgba(0, 0, 0, 0); padding: 5px; text-align: left; display:none" id='${"story" + npcId + i.toString()}'>${story[i]}</h5>
                <button style="float:left; display: none; outline: none; box-shadow: none" class="btn" id='${"backwardStory" + npcId + i.toString()}'>
                    <i class="fa fa-arrow-left fa-3x navbarIcons"></i>
                </button>
                <button style="float:right; display: none; outline: none; box-shadow: none" class="btn" id='${"forwardStory" + npcId + i.toString()}'>
                    <i class="fa fa-arrow-right fa-3x navbarIcons"></i>
                </button>

                <script>
                    $("#backwardStory${npcId}${i}").on('click', function(event) {
                        $('#story${npcId}${i}').hide();
                        $('#backwardStory${npcId}${i}').hide();
                        $('#forwardStory${npcId}${i}').hide();
                        $('#story${npcId}${i - 1}').show();
                        $('#forwardStory${npcId}${i - 1}').show();

                        if(!${i === 1}) {
                            $('#backwardStory${npcId}${i - 1}').show();
                        }
                    })    
                    $("#forwardStory${npcId}${i}").on('click', function(event) {
                        $('#story${npcId}${i}').hide();
                        $('#backwardStory${npcId}${i}').hide();
                        $('#forwardStory${npcId}${i}').hide();
                        $('#story${npcId}${i + 1}').show();
                        $('#backwardStory${npcId}${i + 1}').show();

                        if(!${i === story.length - 2}) {
                            $('#forwardStory${npcId}${i + 1}').show();
                        }
                    }) 
                </script>
            `);

            if (i === 0) {
                $('#story' + npcId + i).show();
                $('#forwardStory' + npcId + i).show();
            };
        }
    }

    /**
     * Add new NPC story window
     * 
     * @param {String} npcId NPC id
     */
    addNewNPCStoryWindow(npcId) {
        if (!($('#npcStoryModal' + npcId).length)) {
            $('#npcStoryModalCollection').append(`
                <div class="modal fade" id="npcStoryModal${npcId}" tabindex="-1" role="dialog" aria-labelledby="npcStoryTitle${npcId}"
                    aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered mw-100 w-50" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                            </div>
                            <div class="modal-body">
                                <div id="npcStoryWait${npcId}" style="text-align: center;">
                                    <i class="fas fa-circle-notch fa-spin fa-2x"></i>
                                </div>
                                <div id="npcStory${npcId}"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `)
        }

        $('#npcStoryModal' + npcId).modal('show');
    }
}