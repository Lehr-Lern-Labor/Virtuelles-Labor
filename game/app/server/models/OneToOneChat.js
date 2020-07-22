var TypeChecker = require('../../utils/TypeChecker.js');
var Chat = require('./Chat.js');

module.exports = class OneToOneChat extends Chat{
    
    #chatName;
    #sentStatus;
    #memberId;
    #messageList;

    constructor(chatId, chatName, sentStatus, memberId, messageList) {
        super(chatId, ownerId);

        this.#chatName = chatName;
        this.#sentStatus = sentStatus;
        this.#memberId = memberId;
        this.#messageList = messageList;
    }

    //Adds a message to the message list.
    //If message list is full then the half of the message list gets deleted.
    addMessage(msg) {
        //TypeChecker.isInstanceOf(msg, StatusMessage);
        if(this.#messageList.length >= super.getMaxNumMessages())
            this.#messageList.splice(0, super.getMaxNumMessages());

        this.#messageList.push(msg);
    }

    isSent() {
        return this.#sentStatus;
    }

    getChatName() {
        return this.#chatName;
    }

    getReceiverName() {
        return this.#memberId;
    }

    sendRequest(senderId) {
        //TODO
    }

    setSent(status) {
        TypeChecker.isBoolean(status);
        this.#sentStatus = status;
    }

    setChatName(chatName) {
        TypeChecker.isString(chatName);
        this.#chatName = chatName;
    }

    setMember(memberId) {
        TypeChecker.isString(memberId);
        this.#memberId = memberId;
    }

}