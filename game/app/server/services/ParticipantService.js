const TypeChecker = require('../../utils/TypeChecker.js');
const Position = require('../models/Position.js');
const BusinessCard = require('../models/BusinessCard')
const Participant = require('../models/Participant')
const Settings = require('../../utils/Settings.js');
const ObjectId = require('mongodb').ObjectID;
const Account = require('../../../../website/models/Account')
const dbconf = require('../../../../config/dbconf');
const AccountService = require('../../../../website/services/AccountService');
const Achievement = require('../models/Achievement.js');
const ChatService = require('./ChatService.js');
const FriendList = require('../models/FriendList.js');

var vimsudb;
function getDB() {
    return dbconf.setDB().then(res => {
        vimsudb = dbconf.getDB()
        console.log("get DB success")
    }).catch(err => {
        console.error(err)
    });
}

module.exports = class ParticipantService {
    static async createParticipant(account, conferenceId) {
        TypeChecker.isInstanceOf(account, Account);
        TypeChecker.isString(conferenceId);
        var accountId = account.getAccountID();
        console.log('test');

        return getDB().then(res => {
            return this.getParticipant(accountId, conferenceId).then(par => {
                var participant;
                

                if(par) {
                    //Get Chats
                    return ChatService.loadChatList(par.participantId, conferenceId).then(async chatList => {
                        let friendList = [];
                        let friendRequestListReceived = [];
                        let friendRequestListSent = [];

                        await par.friendIds.forEach(friendId => {
                            this.getBusinessCard(friendId, conferenceId).then(busCard => {
                                friendList.push(busCard);
                            }).catch(err => {
                                console.error(err)
                            });
                        });

                        await par.friendRequestIds.received.forEach(friendId => {
                            this.getBusinessCard(friendId, conferenceId).then(busCard => {
                                friendRequestListReceived.push(busCard);
                            }).catch(err => {
                                console.error(err)
                            });
                        });

                        await par.friendRequestIds.sent.forEach(friendId => {
                            this.getBusinessCard(friendId, conferenceId).then(busCard => {
                                friendRequestListSent.push(busCard);
                            }).catch(err => {
                                console.error(err)
                            });
                        });

                        return participant = new Participant(par.participantId, accountId, new BusinessCard(par.participantId, account.getUsername(), 
                            account.getTitle(), account.getSurname(), account.getForename(), account.getJob(), account.getCompany(), 
                            account.getEmail()), new Position(par.position.roomId, par.position.cordX, par.position.cordY), par.direction, 
                            new FriendList(par.participantId, friendList), new FriendList(par.participantId, friendRequestListReceived), new FriendList(par.participantId, friendRequestListSent), 
                            par.achievements, par.isModerator, par.points, chatList, par.visitedLectureIds);
                    });
                }
            
                else {
                    var par = {
                        participantId: new ObjectId().toString(),
                        accountId: accountId,
                        position: {
                            roomId: Settings.STARTROOM_ID,
                            cordX: Settings.STARTPOSITION_X,
                            cordY: Settings.STARTPOSITION_Y
                        },
                        direction: Settings.STARTDIRECTION,
                        friendIds: [],
                        friendRequestIds: {
                            sent: [],
                            received: []
                        },
                        achievements: [],
                        isModerator: false,
                        points: 0,
                        visitedLectureIds: []
                    }

                    //Write new ppant in DB
                    getDB().then(res => {
                        vimsudb.insertOneToCollection("participants_" + conferenceId, par);
                    }).catch(err => {
                        console.error(err)
                    });

                    return participant = new Participant(par.participantId, accountId, new BusinessCard(par.participantId, account.getUsername(), 
                            account.getTitle(), account.getSurname(), account.getForename(), account.getJob(), account.getCompany(), 
                            account.getEmail()), new Position(par.position.roomId, par.position.cordX, par.position.cordY), par.direction, 
                            new FriendList(par.participantId, []), new FriendList(par.participantId, []), new FriendList(par.participantId, []), [], par.isModerator, par.points, [], []);
                } 

            }).catch(err => {
                console.error(err)
            })
        }).catch(err => {
            console.error(err)
        });
    }

    static getParticipant(accountId, conferenceId) {
        TypeChecker.isString(accountId);
        TypeChecker.isString(conferenceId);

        return getDB().then(res => {
            return vimsudb.findOneInCollection("participants_" + conferenceId, {accountId: accountId}, "").then(par => {
                if (par) {
                    return par;
                }
                else {
                    console.log("participant with accountId " + accountId + " is not found in collection participants_" + conferenceId);
                    return false;
                }
            }).catch(err => {
                console.error(err);
            })
        })
    }

    static getUsername(participantId, conferenceId) {
        TypeChecker.isString(participantId);

        return getDB().then(res => {
            return vimsudb.findOneInCollection("participants_" + conferenceId, {participantId: participantId}, {accountId: 1}).then(par => {
                if (par) {
                    return AccountService.getAccountUsername(par.accountId).then(username => {
                        return username;
                    }).catch(err => {
                        console.error(err);
                    })
                }
                else {
                    console.log("participant with Id " + participantId + " is not found in collection participants_" + conferenceId);
                    return false;
                }
            }).catch(err => {
                console.error(err);
            })
        })
    }

    static getBusinessCard(participantId, conferenceId) {
        TypeChecker.isString(participantId);
        TypeChecker.isString(conferenceId);

        return getDB().then(res => {
            return vimsudb.findOneInCollection("participants_" + conferenceId, {participantId: participantId}, "").then(par => {
                if (par) {
                    return AccountService.getAccount(par.accountId).then(account => {
                        return new BusinessCard(par.id, account.username, account.title, account.surname, account.forename, account.job, account.company, account.email);
                    });
                }
                else {
                    console.log("participant with participanntId " + participantId + " is not found in collection participants_" + conferenceId);
                    return false;
                }
            }).catch(err => {
                console.error(err);
            })
        })
    }

    static updateParticipantPosition(participantId, conferenceId, position) {
        TypeChecker.isString(participantId);
        TypeChecker.isInstanceOf(position, Position);

        var pos = {
            roomId: position.getRoomId(),
            cordX: position.getCordX(),
            cordY: position.getCordY()
        }

        return getDB().then(res => {
            vimsudb.updateOneToCollection("participants_" + conferenceId, {participantId: participantId}, {'position.roomId': pos.roomId, 'position.cordX': pos.cordX, 'position.cordY': pos.cordY});
        }).catch(err => {
            console.error(err)
        });

    }
} 