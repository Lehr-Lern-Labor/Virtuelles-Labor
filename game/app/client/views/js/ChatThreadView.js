/* Used to display a chat the user is a member of */

// Needs a button to return to chat overview
// Needs a button to send friend request
// Needs to know the id of the other participant for reusing the friend request method
// Also the friendRequest-button should only be drawn if the members aren't already friends

class ChatThreadView extends WindowView {
    
    #chat
    #messages

    constructor() {
        super();

        $('#chatMessageButton').off();
        $('#chatMessageButton').on('click', (event) => {
            event.preventDefault();
            this.sendMessage();
        });

        $('#chatMessageInput').off();
        $('#chatMessageInput').on('keydown', (event) => {
            if (event.keyCode === 13) {
                this.sendMessage();
            }
        });

        $('#chatLeaveButton').off();
        $('#chatLeaveButton').click((event) => {
            event.preventDefault();

            var result = confirm(`Are you sure you want to leave from the chat with ${this.#chat.title}?`)

            if (result) {
                $('#chatThreadModal').modal('hide');
                new EventManager().handleLeaveChat(this.#chat.chatId);
            }
            
            event.stopImmediatePropagation();
        });

        $('#chatFriendRequestButton').off();
        $('#chatFriendRequestButton').click((event) => {
            event.preventDefault();

            if (!this.#chat.partnerId) {
                return;
            }

            $('#chatFriendRequestButton').hide();
            $('#friendRequestSent').show();
            new EventManager().handleSendFriendRequest(this.#chat.partnerId, this.#chat.chatId);
        });

        $('#chatParticipantListBtn').click((event) => {
            event.preventDefault();

            if(this.#chat.partnerId) {
                return;
            }

            new EventManager().handleShowChatParticipantList(this.#chat.chatId);
        })

        $('#inviteFriendsBtn').click((event) => {
            event.preventDefault();

            if(this.#chat.partnerId) {
                return;
            }

            new EventManager().handleInviteFriendsClicked(this.#chat.title, this.#chat.chatId);
        });

    }

    sendMessage() {
        let messageVal = $('#chatMessageInput').val();

        if(messageVal !== '') {
            new EventManager().handleChatMessageInput(this.#chat.chatId, messageVal);
            $('#chatMessageInput').val('');
            $('#chatMessageInput').focus();
        }
    }
    
    draw(chat) { 
        //console.log(JSON.stringify(chat));
        this.#chat = chat;
        this.#messages = chat.messages;
        $('#chatThreadModalTitle').empty();
        $('#chatThreadModalTitle').text(chat.title);

        $('#chatThreadModal .modal-body .list-group').empty()

        this.#messages.forEach((message) => {
            this.#appendMessage(message);
        })

        this.updateFriendRequestButton(chat.chatId, chat.areFriends, chat.friendRequestSent);
        
        if(chat.groupChat) {
            $('#chatParticipantListBtn').show();
            $('#inviteFriendsBtn').show();
        } else {
            $('#chatParticipantListBtn').hide();
            $('#inviteFriendsBtn').hide();
        }
    };

    updateFriendRequestButton(chatId, areFriends, friendRequestSent) {
        if(this.#chat.chatId != chatId) {
            return;
        }

        if(areFriends) {
            $('#chatFriendRequestButton').hide();
            $('#friendRequestSent').hide();
        } else if(friendRequestSent) {
            $('#chatFriendRequestButton').hide();
            $('#friendRequestSent').show();
        } else {
            $('#friendRequestSent').hide();
            $('#chatFriendRequestButton').show();
        }
    }
    
    addNewMessage(chatId, message) {
        if(this.#chat.chatId != chatId) {
            return;
        }
        this.#messages.push(message);
        this.#appendMessage(message);
    };
    
    #appendMessage = (message) => {        
        var timestamp = new DateParser(new Date(message.timestamp)).parse();
        var senderUsername;
        if(message.senderUsername) {
            senderUsername = message.senderUsername + ":"
        } else {
            senderUsername = "";
        }

        var messageDiv = `
        <div>
            <small style="opacity: 0.3; float: right;">${timestamp}</small><br>
            <small><b>${senderUsername}</b></small>
            <small class="wrapword">${message.msgText}</small>
        </div>
        `;
        
        $('#chatThreadModalList').append(messageDiv);

        $('#chatThreadModalList').scrollTop($('#chatThreadModalList')[0].scrollHeight);
    }
    
}
