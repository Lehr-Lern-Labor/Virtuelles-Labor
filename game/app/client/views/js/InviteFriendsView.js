class InviteFriendsView extends WindowView {

    #businessCards;
    #groupName;
    #limit;
    #chatId;
    #invitedFriends = [];

    constructor() {
        super();
    }

    draw(businessCards, groupName, limit, chatId) {
        $('#inviteFriendsModal .modal-body .list-group').empty();
        $('#inviteFriendsModal .modal-body #nofriendtoinvite').empty();
        $('#createGroupChat').show();

        if (businessCards) {
            if (businessCards.length < 1) {
                $('#inviteFriendsModal .modal-body #nofriendtoinvite').text("No friends to invite.");
                $('#createGroupChat').hide();
            }

            const sortedBusinessCards = businessCards.sort((a, b) => a.getForename().localeCompare(b.getForename()))
            this.#businessCards = sortedBusinessCards;
            this.#groupName = groupName;
            this.#limit = limit;
            this.#chatId = chatId;

            $('#noinvitedfriends').hide();
            $('#toomanyinvitedfriends').hide();
            $('#toomanyinvitedfriends').empty();

            this.#businessCards.forEach(businessCard => {
                $('#inviteFriendsModal .modal-body .list-group').append(`
                    <ul id="${"invitefriend" + businessCard.getParticipantId()}">
                        <li class="list-group-item bg-transparent" >
                            <div class="row w-100">
                                <div class="col-12 col-sm-2 px-0">
                                    <i class="fa fa-user fa-5x navbarIcons" style="margin-left: 5px" ></i>
                                </div>
                                <div class="col-12 col-md-9 text-center text-sm-left">
                                    <label class="name lead">${businessCard.getTitle() + " " + businessCard.getForename() + " " + businessCard.getSurname() + " (@" + businessCard.getUsername() + ")"}</label>
                                    <br> 
                                    <span class="fa fa-briefcase fa-fw" data-toggle="tooltip" title="" data-original-title=""></span>
                                    <span >${businessCard.getJob() + " at " + businessCard.getCompany()}</span>
                                    <br>
                                    <span class="fa fa-envelope fa-fw" data-toggle="tooltip" data-original-title="" title=""></span>
                                    <span class="small">${businessCard.getEmail()}</span>
                                </div>
                                <div class="col-12 col-md-1">
                                    <button id="${"invite" + businessCard.getParticipantId()}" style="position: absolute; margin-top: -7px; margin-left: 5px" class="btn">
                                        <i class="fa fa-plus-circle fa-2x navbarIcons"></i>
                                    </button>
                                    <button id="${"selected" + businessCard.getParticipantId()}" style="position: absolute; display: none; margin-top: -7px; margin-left: 5px" class="btn">
                                        <i class="fa fa-check-circle fa-2x navbarIcons"></i>
                                    </button>
                                </div>    
                            </div>
                        </li>
                    </ul>
                `)

                $('#invite' + businessCard.getParticipantId()).click((event) => {
                    this.#invitedFriends.push(businessCard.getParticipantId());
                    $('#invite' + businessCard.getParticipantId()).hide();
                    $('#selected' + businessCard.getParticipantId()).show();
                })

                $('#selected' + businessCard.getParticipantId()).click((event) => {
                    let index = this.#invitedFriends.indexOf(businessCard.getParticipantId());
                    this.#invitedFriends.splice(index, 1);
                    $('#selected' + businessCard.getParticipantId()).hide();
                    $('#invite' + businessCard.getParticipantId()).show();
                })

                $('#createGroupChat').off();
                $('#createGroupChat').click((event) => {
                    if(this.#invitedFriends.length > 0 && this.#invitedFriends.length < this.#limit + 1) {
                        $('#noinvitedfriends').hide();
                        $('#toomanyinvitedfriends').hide();
                        $('#inviteFriendsModal').modal('hide');
                        new EventManager().handleCreateGroupChat(this.#groupName, this.#invitedFriends, this.#chatId);
                        this.#invitedFriends = [];
                    } else if (this.#invitedFriends.length < 1) {
                        $('#toomanyinvitedfriends').hide();
                        $('#noinvitedfriends').show();
                    } else {
                        $('#noinvitedfriends').hide();
                        $('#toomanyinvitedfriends').empty();
                        var diff = this.#invitedFriends.length - this.#limit;
                        $('#toomanyinvitedfriends').text("You may only invite " + this.#limit + " friend(s)! Please unselect " + diff + " friend(s).");
                        $('#toomanyinvitedfriends').show();
                    }

                })

            });

        } else {
            $('#inviteFriendsModal .modal-body').text("Group name was empty!")
        }
        
        $('#inviteFriendsModal').modal('show');
    }

    addToInviteFriends(businessCard, hasLeftChat) {
        this.#businessCards.push(businessCard);

        if (hasLeftChat) {
            this.#limit = this.#limit + 1;
        }

        this.draw(this.#businessCards, this.#groupName, this.#limit, this.#chatId);
    }

    removeFromInviteFriends(participantId, isMemberOfChat) {
        var found = false;
        this.#businessCards.forEach(businessCard => {
            if (businessCard.getParticipantId() === participantId) {
                let index = this.#businessCards.indexOf(businessCard);
                this.#businessCards.splice(index, 1);
                found = true;
            }
        });

        if(found) {
            if (isMemberOfChat) {
                this.#limit = this.#limit - 1;
            }
            this.draw(this.#businessCards, this.#groupName, this.#limit, this.#chatId);
        }
    }
}

if (typeof module === 'object' && typeof exports === 'object') {
    module.exports = InviteFriendsView;
}