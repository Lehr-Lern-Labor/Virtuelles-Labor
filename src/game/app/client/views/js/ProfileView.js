/**
 * The Profile Window View
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
class ProfileView extends WindowView {
    #businessCard;
    #isModerator;

    /**
     * Creates an instance of ProfileView
     */
    constructor() {
        super();

        if (!!ProfileView.instance) {
            return ProfileView.instance;
        }

        ProfileView.instance = this;
    }

    /**
     * Draws profile window
     * 
     * @param {BusinessCard} businessCard own business card
     * @param {boolean} isModerator true if moderator, otherwise false
     */
    draw(businessCard, isModerator) {
        $('#profileWait').hide();
        $('#profileModal .modal-header').empty()
        $('#profileModal .modal-body').empty()

        this.#businessCard = businessCard;
        this.#isModerator = isModerator;

        $('#profileModal .modal-header').append(`
            <h5 class="modal-title d-inline-block" id="profileModalTitle">
            <i class="fa fa-user-circle pr-2 navbarIcons" style="transform: scale(1)"></i>
            ${this.#businessCard.getForename() + " " + " (@" + this.#businessCard.getUsername() + ")"}</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
            </button>
        `)

        $('#profileModal .modal-body').append(`
            <div class="d-flex" style="overflow-x: auto">
                <table id="profile" class="center ml-auto mr-auto" style = "color: antiquewhite;">
        `)

        if(this.#isModerator) {
            $('#profileModal .modal-body #profile').append(`
                    <tr>
                        <td style="border-right: 1pt solid antiquewhite ; text-align: right; padding: 15px">Role</td>
                        <td style="padding: 15px">Moderator</td>
                    </tr>
            `)
        } else {
            $('#profileModal .modal-body #profile').append(`
                    <tr>
                        <td style="border-right: 1pt solid antiquewhite ; text-align: right; padding: 15px">Role</td>
                        <td style="padding: 15px">Participant</td>
                    </tr>
            `)
        }

        $('#profileModal .modal-body').append(`
                </table>
            </div>
        `)

        
    }
}