/* ############################################################################### */
/* ########################### LOADING REQUIREMENTS ############################## */
/* ############################################################################### */

const socketio = require('socket.io');
const path = require('path');

const Position = require('../models/Position.js');
const Direction = require('../models/Direction.js');

const Participant = require('../models/Participant.js');
const ParticipantController = require('./ParticipantController.js');

const Room  = require('../models/Room.js');
const RoomService = require('../services/RoomService.js');
const RoomController = require('./RoomController.js');
const TypeOfRoom = require('../models/TypeOfRoom.js');
const Settings = require('../../utils/Settings.js');
const Commands = require('../../utils/Commands.js');
const Door = require('../models/Door.js');
const DoorService = require('../services/DoorService.js');
const BusinessCard = require('../models/BusinessCard.js');
const LectureService = require('../services/LectureService');
const AccountService = require('../../../../website/services/AccountService')
const Schedule = require('../models/Schedule')

const TypeChecker = require('../../utils/TypeChecker.js');
const Conference = require('../models/Conference.js');

const ChatService = require('../services/ChatService.js');




/* This should later on be turned into a singleton */
module.exports = class ServerController {
    
    #io;
    #conference;
    #listOfConfCont;
    #DEBUGMODE;
    ppantControllers;

    //TODO: Muss noch ausgelagert werden in RoomController oder ConferenceController
    #rooms;
    
    constructor(socket) {
        this.#io = socket;
        this.#DEBUGMODE = true;
    }
    
    //There are currently 3 differenct socketIo Channels
    //foyerChannel: Settings.FOYER_ID.toString()
    //foodCourtChannel: Settings.FOODCOURT_ID.toString()
    //receptionChannel: Settings.RECEPTION_ID.toString()


    init() {
        var counter = 0;
        
        this.ppantControllers = new Map();
        const ppants = new Map();  // Array to hold all participants

        
        //Init all rooms
        var roomService = new RoomService();
        this.#rooms = roomService.getAllRooms();

        /*
        FOYER: this.#rooms[Settings.FOYER_ID - 1];
        FOODCOURT: this.#rooms[Settings.FOODCOURT_ID - 1];
        RECEPTION: this.#rooms[Settings.RECEPTION_ID - 1];
        */

        
        /*########## ChatService Fiddle for Debuging #######################################*/
        //ChatService.newGroupChat("1", ["2", "3", "4"]);
        //ChatService.removeParticipant('5f1723f13b690e1498c4bac4', "1", "3");
        //ChatService.storeParticipants('5f1723f13b690e1498c4bac4', "1", ["10", "12", "13"]);
        //ChatService.newGroupChat("1", ["3", "4", "5"]);
        //ChatService.newGroupChat("1", ["6", "7", "8"]);
        //ChatService.newLectureChat("3");
        //ChatService.newOneToOneChat("1", "2");

        //var chats = [];
        //setTimeout( function() {
            //chats = ChatService.loadChatList("1");
            //ChatService.removeParticipant("3");
            //console.log(ChatService.loadChatList("1"));

        //}, 1000);


        //initilaize conference with schedule. TODO: create conference in DB and initialize conference
        //model with id from the DB
        LectureService.createAllLectures("1").then(lectures => {
            var schedule = new Schedule(lectures);
            var conference = new Conference(schedule);
            this.#conference = conference;
        }).catch(err => {
            console.error(err);    
        })
    
        /*var foyerRoom = this.#rooms[0];
        var foodCourtRoom = this.#rooms[1];
        var receptionRoom = this.#rooms[2];*/

        //RoomController not needed at this point (P)
        //const gameRoomController = new RoomController(foyerRoom);

        /* This is the program logic handling new connections.
         * This may late be moved into the server or conference-controller?
         * - (E) */
        this.#io.on('connection', (socket) => {
            /* When a new player connects, we create a participant instance, initialize it to
             * the right position (whatever that is) and the emit that to all the other players,
             * unless we're just doing regular game-state updates.
             * - (E) */
            socket.on('new participant', () => {

                //First Channel (P)
                socket.join(Settings.FOYER_ID.toString());
                
                /* If we already have a ppant connected on this socket, we do nothing
                /* - (E) */
                if (this.ppantControllers.has(socket.id) || !socket.request.session.loggedin) {
                    return;
                }

                console.log('Participant ' + socket.id + ' has conected to the game . . . ');
                
                /* What happens here:
                 *    (i) We generate a new ppantID
                 *   (ii) We create a new ppantCont for that ID - inside the constructor of
                 *        the ppantCont, it also creates a new ppant with that id
                 *        (I think this should be changed - the ppant-Constructor expects
                 *         a ppantCont-Instance, but also information the ppantCont does 
                 *         not know at this time. Maybe the roomController should create
                 *         a new ppantCont when one is added, but that also causes difficulty
                 *         with how to make sure the ppantCont knows the socket it should send
                 *         on.)
                 *  (iii) We add that ppantCont to the list of all ppantConts, indexed by socket
                 *        (This list is a bit redundant here - as more functionality is moved into
                 *        the ppantCont-Classe, it can probably be removed)
                 *   (iv) We also add it to the list of ppantConts in the roomCont
                 *    (v) We set up the ppant to have the right id and position and
                 *        send this back to the client, so he may draw the initial gameState
                 *        properly
                 *   (vi) We emit the necessary information to the other clients
                 * - (E) */ 

                // (i) to (iii)
                var ppantID = (counter++).toString(); // let's hope I am a smart boy and this works - (E)
                console.log("test1");
                
                //TODO: Needs to be adjusted when multiple rooms exist (P)
                //currently every participant spawns in foyer at the start position
                //Future Goal: Spawn returning participants at position, where he disconnected
                //Spawn new participants at reception start position

                var startPosition = this.#rooms[Settings.FOYER_ID - 1].getStartPosition();
                var x = startPosition.getCordX();
                var y = startPosition.getCordY();
                var d = this.#rooms[Settings.FOYER_ID - 1].getStartDirection();
                console.log("accId: " + socket.request.session.accountId);

                //variables for creating BusinessCard and Paricipant instance
                let accountId = socket.request.session.accountId;
                let username = socket.request.session.username;
                let title = socket.request.session.title;
                let surname = socket.request.session.surname;
                let forename = socket.request.session.forename;
                let job = socket.request.session.job;
                let company = socket.request.session.company;
                let email = socket.request.session.email;

                var businessCard = new BusinessCard(ppantID, username, title, surname, forename, job, company, email);

                //Needed for emiting this business card to other participants in room
                var businessCardObject = { 
                            id: ppantID, 
                            username: username, 
                            title: title, 
                            surname: surname, 
                            forename: forename, 
                            job: job, 
                            company: company, 
                            email: email 
                        };
                
                var ppant = new Participant(ppantID, accountId, businessCard, startPosition, d); 

                //At this point kind of useless, maybe usefull when multiple rooms exist (P)
                this.#rooms[Settings.FOYER_ID - 1].enterParticipant(ppant);
        
                var ppantCont = new ParticipantController(ppant);
                console.log("test2");
                ppants.set(ppantID, ppant);
                this.ppantControllers.set(socket.id, ppantCont);
                console.log("test3");

                // (iv)
                // The position of the participant-Instance is also set here
                // gameRoomController.addParticipantController(ppantCont);
                
                
                // (v)
                /* Some notes on the following few lines of code:
                 * This is supposed to make sure the client-side game state is initialized properly
                 * This should probably later on be moved into the ParticipantController class
                 * Not just one message since the first function should only be called once
                 * Where as the second one will probably be called more often
                 * - (E) */ 
                // Sends the newly generated ppantID back to the client so the game-states are consistent
                //this.#io.to(socket.id).emit('currentGameStateYourID', ppantID);
                console.log("test4");
                //Send room information of start room (P)
                //TODO: When multiple rooms exist, get right room (P)

                let gameObjects = this.#rooms[Settings.FOYER_ID - 1].getListOfGameObjects();
                let gameObjectData = [];

                //needed to send all gameObjects of starting room to client
                //would be nicer and easier if they both share GameObject.js
                gameObjects.forEach(gameObject => {
                    gameObjectData.push({ id: gameObject.getId(),
                      name: gameObject.getName(),
                      width: gameObject.getWidth(),
                      length: gameObject.getLength(),
                      cordX: gameObject.getPosition().getCordX(),
                      cordY: gameObject.getPosition().getCordY(),
                      isSolid: gameObject.getSolid()
                    });
                })
                
                //Server sends Room ID, typeOfRoom and listOfGameObjects to Client
                this.#io.to(socket.id).emit('currentGameStateYourRoom', Settings.FOYER_ID, TypeOfRoom.FOYER, 
                                            gameObjectData);

                // Sends the start-position, participant Id and business card back to the client so the avatar can be initialized and displayed in the right cell
                this.#io.to(socket.id).emit('initOwnParticipantState', { id: ppantID, businessCard: businessCardObject, cordX: x, cordY: y, dir: d});
                
                // Sends the start-position back to the client so the avatar can be displayed in the right cell
                this.#io.to(socket.id).emit('currentGameStateYourPosition', { cordX: x, 
                                                                        cordY: y, 
                                                                        dir: d});
                // Initialize Allchat
                this.#io.to(socket.id).emit('initAllchat', this.#rooms[Settings.FOYER_ID - 1].getMessages());
                console.log("test5");
                
                ppants.forEach((ppant, id, map) => {
                    
                    if(id != ppantID && ppant.getPosition().getRoomId() === Settings.FOYER_ID) {

                        var username = ppant.getBusinessCard().getUsername();

                        var tempPos = ppant.getPosition();
                        var tempX = tempPos.getCordX();
                        var tempY = tempPos.getCordY();
                        var tempDir = ppant.getDirection();

                        this.#io.to(socket.id).emit('roomEnteredByParticipant', { id: id, username: username, cordX: tempX, cordY: tempY, dir: tempDir });
                        console.log("Participant " + id + " is being initialized at the view of participant " + ppantID);
                    }   
                });
                // (vi)
                /* Emits the ppantID of the new participant to all other participants
                 * connected to the server so that they may create a new client-side
                 * participant-instance corresponding to it.
                 * - (E) */
                // This should send to all other connected sockets but not to the one
                // that just connected
                // It might be nicer to move this into the ppantController-Class
                // later on
                // - (E)
                    socket.to(Settings.FOYER_ID.toString()).emit('roomEnteredByParticipant', { id: ppantID, username: businessCardObject.username, cordX: x, cordY: y, dir: d });
                    console.log("test6");                
               
            });

            socket.on('sendMessage', (ppantID, text) => {

                var participant = ppants.get(ppantID);
    
                /* Adding the possibility of chat-based commands for moderators.
                 * Checks if the participant is a moderator and if the first character
                 * of their message is the "command-starting character" (atm, this
                 * is a backslash). Only if these two conditions are met we start
                 * checking for the actual commands.
                 *
                 * You could probably use the '==='-operator here, but I am not a 
                 * hundred percent sure, so I didn't for now.
                 *
                 *  - (E) */
                if(participant.isModerator() && text.charAt(0) == Settings.CMDSTARTCHAR) {
                    /* Now, we check if the message contains any command
                     * known by the server and handle this appropriately.
                     * We move this to another method for better readability.
                     *
                     * We also remove the first character of the string (the
                     * "command-starting character"), because we do no longer
                     * need it.
                     *
                     * - (E) */
                    this.commandHandler(participant, text.substr(1));
                } else { // If the message contains a command, we don't want to be handled like a regular message
                
                var roomID = participant.getPosition().getRoomId();
                var username = participant.getBusinessCard().getUsername();

                // timestamping the message - (E)
                var currentDate = new Date();
                var currentTime = (currentDate.getHours()<10?'0':'') +currentDate.getHours().toString() + ":" + (currentDate.getMinutes()<10?'0':'') + currentDate.getMinutes().toString();
                console.log("<" + currentTime + "> " + ppantID + " says " + text);
                this.#rooms[roomID - 1].addMessage(ppantID, username, currentTime, text);
                
                // Getting the roomID from the ppant seems to not work?
                this.#io.in(roomID.toString()).emit('newAllchatMessage', { senderID: ppantID, username: username, timestamp: currentTime, text: text });
                
                //this.#io.sockets.in(roomID.toString()).emit('newAllchatMessage', ppantID, currentTime, text);
                }

             });
            
            /* Now we handle receiving a movement-input from a participant.
             * NOTE:
             * WE'RE GOING TO WRITE THIS IN A WAY THAT MAKES THE SERVER HANDLE
             * EACH MOVEMENT INDIVIDUALLY, MEANING THAT THE SERVER HANDLES AND
             * INFORMS ABOUT EACH MOVEMENT ACTION SEPERATELY, NOT COLLECTING
             * THEM INTO A SINGLE MESSAGE THAT GETS SEND OUT REGULARLY
             * - (E) */
            socket.on('requestMovementStart', (ppantID, direction, newCordX, newCordY) => {
                
                let roomId = ppants.get(ppantID).getPosition().getRoomId();
                
                let oldDir = ppants.get(ppantID).getDirection();
                let oldPos = ppants.get(ppantID).getPosition();
                let newPos = new Position(roomId, newCordX, newCordY);

                //check if new position is legit. Prevents manipulation from Client
                if (oldPos.getCordX() - newPos.getCordX() >= 2 || newPos.getCordX() - oldPos.getCordX() >= 2) {
                    this.#io.to(socket.id).emit('currentGameStateYourPosition', { cordX: oldPos.getCordX(), cordY: oldPos.getCordY(), dir: oldDir});
                    return;
                }

                if (oldPos.getCordY() - newPos.getCordY() >= 2 || newPos.getCordY() - oldPos.getCordY() >= 2) {
                    this.#io.to(socket.id).emit('currentGameStateYourPosition', { cordX: oldPos.getCordX(), cordY: oldPos.getCordY(), dir: oldDir});
                    return;
                }

                //CollisionCheck
                //No Collision, so every other participant gets the new position (P)
                if (!this.#rooms[roomId - 1].checkForCollision(newPos)) {
                    ppants.get(ppantID).setPosition(newPos);
                    ppants.get(ppantID).setDirection(direction);
                    socket.to(roomId.toString()).emit('movementOfAnotherPPantStart', ppantID, direction, newCordX, newCordY);
                } else {
                    //Server resets client position to old Position (P)
                    this.#io.to(socket.id).emit('currentGameStateYourPosition', { cordX: oldPos.getCordX(), cordY: oldPos.getCordY(), dir: oldDir});
                }
            });
            
            //Handle movement stop
            socket.on('requestMovementStop', (ppantID) => {
                var roomId = ppants.get(ppantID).getPosition().getRoomId();

                socket.to(roomId.toString()).emit('movementOfAnotherPPantStop', ppantID);
            });

            //Event to handle click on food court door tile
            socket.on('enterRoom', (ppantID, targetRoomType) => {
                   
                //get right target room id
                var targetRoomId;
                if (targetRoomType === TypeOfRoom.FOYER) {
                    targetRoomId = Settings.FOYER_ID;
                } else if (targetRoomType === TypeOfRoom.FOODCOURT) {
                    targetRoomId = Settings.FOODCOURT_ID;
                } else if (targetRoomType === TypeOfRoom.RECEPTION) {
                    targetRoomId = Settings.RECEPTION_ID;
                }

                var currentRoomId = ppants.get(ppantID).getPosition().getRoomId();

                //Singleton
                let doorService = new DoorService();

                //get door from current room to target room
                let door = doorService.getDoorByRoom(currentRoomId, targetRoomId);

                //check if participant is in right position to enter room
                //ppants.get(ppantID).getPosition() !== door.getStartPosition() did not work for some reason
                if (ppants.get(ppantID).getPosition().getRoomId() !== door.getStartPosition().getRoomId() ||
                    ppants.get(ppantID).getPosition().getCordX() !== door.getStartPosition().getCordX() ||
                    ppants.get(ppantID).getPosition().getCordY() !== door.getStartPosition().getCordY()) {
                    console.log('wrong position');
                    return;
                }
                    
                let newPos = door.getTargetPosition();
                let x = newPos.getCordX();
                let y = newPos.getCordY();
                let d = door.getDirection();



                /*
                /Foyer has ID 1 and is this.#rooms[0]
                /FoodCourt has ID 2 and is this.#rooms[1]
                /Reception has ID 3 and is this.#rooms[2]
                */

                this.#rooms[targetRoomId - 1].enterParticipant(ppants.get(ppantID));
                this.#rooms[currentRoomId - 1].exitParticipant(ppantID);

                //get all GameObjects from target room
                let gameObjects = this.#rooms[targetRoomId - 1].getListOfGameObjects();
                let gameObjectData = [];
            
                //needed to send all gameObjects of starting room to client
                //would be nicer and easier if they both share GameObject.js
                gameObjects.forEach(gameObject => {
                    gameObjectData.push({ id: gameObject.getId(),
                    name: gameObject.getName(),
                    width: gameObject.getWidth(),
                    length: gameObject.getLength(),
                    cordX: gameObject.getPosition().getCordX(),
                    cordY: gameObject.getPosition().getCordY(),
                    isSolid: gameObject.getSolid()
                    });
                });
                    
                //emit new room data to client
                this.#io.to(socket.id).emit('currentGameStateYourRoom', targetRoomId, targetRoomType, gameObjectData);

                //set new position in server model
                ppants.get(ppantID).setPosition(newPos);
                ppants.get(ppantID).setDirection(d);

                //Get username
                let username = ppants.get(ppantID).getBusinessCard().getUsername();
                
                //Emit new position to participant
                this.#io.to(socket.id).emit('currentGameStateYourPosition', { cordX: x, cordY: y, dir: d});

                //Emit to all participants in old room, that participant is leaving
                socket.to(currentRoomId.toString()).emit('remove player', ppantID);

                //Emit to all participants in new room, that participant is joining
                socket.to(targetRoomId.toString()).emit('roomEnteredByParticipant', { id: ppantID, username: username, cordX: x, cordY: y, dir: d });

                //Emit to participant all participant positions, that were in new room before him
                ppants.forEach((ppant, id, map) => {
                    if(id != ppantID && ppant.getPosition().getRoomId() === targetRoomId) {
                        var username = ppant.getBusinessCard().getUsername();
                        var tempPos = ppant.getPosition();
                        var tempX = tempPos.getCordX();
                        var tempY = tempPos.getCordY();
                        var tempDir = ppant.getDirection();
                        this.#io.to(socket.id).emit('roomEnteredByParticipant', { id: id, username: username, cordX: tempX, cordY: tempY, dir: tempDir });
                        console.log("Participant " + id + " is being initialized at the view of participant " + ppantID);
                    }   
                });

                //switch socket channel
                socket.leave(currentRoomId.toString());
                socket.join(targetRoomId.toString());
                this.#io.to(socket.id).emit('initAllchat', this.#rooms[targetRoomId - 1].getMessages());

            });

            socket.on('lectureMessage', (ppantID, text) => {
                var lectureID = socket.currentLecture; // socket.currentLecture is the lecture the participant is currently in
                var lecture = this.#conference.getSchedule().getLecture(lectureID);
                var lectureChat = lecture.getLectureChat();
                // timestamping the message - (E)
                var currentDate = new Date();
                var currentTime = (currentDate.getHours()<10?'0':'') + currentDate.getHours().toString() + ":" + (currentDate.getMinutes()<10?'0':'') + currentDate.getMinutes().toString();
                var message = {senderID: ppantID, timestamp: currentTime, messageText: text}
                lectureChat.appendMessage(message);
                console.log("<" + currentTime + "> " + ppantID + " says " + text + " in lecture.");
                // Getting the roomID from the ppant seems to not work?
                
                this.#io.in(socket.currentLecture).emit('lectureMessageFromServer', message);
                //this.#io.sockets.in(roomID.toString()).emit('newAllchatMessage', ppantID, currentTime, text);
            

            });

            var currentLecturesData = [];

            socket.on('enterLecture', (ppantID, lectureId) => {

                console.log(ppantID + " joins " + lectureId)

                let idx = currentLecturesData.findIndex(x => x.id === lectureId);

                if (idx < 0) {
                    throw new Error(lectureId + " is not in list of current lectures")
                }

                socket.join(lectureId);
                socket.currentLecture = lectureId;
                
                var schedule = this.#conference.getSchedule();
                var lecture = schedule.getLecture(lectureId);
                lecture.enter(ppantID);
                
                var token = lecture.hasToken(ppantID);
                var lectureChat = lecture.getLectureChat();
                console.log(lectureChat);
                var messages = lecture.getLectureChat().getMessages();
                console.log(messages);

                LectureService.getVideo(currentLecturesData[idx].videoId).then(videoName => {
                    currentLecturesData[idx].videoUrl = "./game/video/" + videoName;
                    socket.emit('lectureEntered',  currentLecturesData[idx], token, messages);
                    socket.broadcast.emit('hideAvatar', ppantID);
                })
            })

            socket.on('leaveLecture', (participantId, lectureId) => {
                var schedule = this.#conference.getSchedule();
                var lecture = schedule.getLecture(lectureId);
                lecture.leave(participantId);
                console.log(participantId + " leaves " + lectureId)
                socket.leave(lectureId);
                socket.currentLecture = undefined;
                socket.broadcast.emit('showAvatar', participantId);
            });

            socket.on('getFriendRequestList', (ppantID) => {
                var participant = ppants.get(ppantID);
                //TODO

                //socket.emit('friendRequestList', friendRequestList);
                
            })

            socket.on('getCurrentLectures', (ppantID) => {
                let doorService = new DoorService();
                let lectureDoorPosition = doorService.getLectureDoorPosition();

                //check if participant is in right position to enter room
                //ppants.get(ppantID).getPosition() !== door.getStartPosition() did not work for some reason
                if (ppants.get(ppantID).getPosition().getRoomId() !== lectureDoorPosition.getRoomId() ||
                    ppants.get(ppantID).getPosition().getCordX() !== lectureDoorPosition.getCordX() ||
                    ppants.get(ppantID).getPosition().getCordY() !== lectureDoorPosition.getCordY()) {
                    console.log('wrong position');
                    return;
                }

                var schedule = this.#conference.getSchedule();
                var currentLectures = schedule.getCurrentLectures();

                currentLecturesData = [];
                currentLectures.forEach(lecture => {
                    currentLecturesData.push( 
                        {
                            id: lecture.getId(),
                            title: lecture.getTitle(),
                            videoId: lecture.getVideoId(),
                            remarks: lecture.getRemarks(),
                            oratorName: lecture.getOratorName(),
                            startingTime: lecture.getStartingTime(),
                            maxParticipants: lecture.getMaxParticipants()
                        }
                    )
                })

                socket.emit('currentLectures', currentLecturesData);
            });

            socket.on('getSchedule', () => {
                var schedule = this.#conference.getSchedule();
                var lectures = schedule.getAllLectures();

                var lecturesData = [];
                lectures.forEach(lecture => {
                    lecturesData.push( 
                        {
                            id: lecture.getId(),
                            title: lecture.getTitle(),
                            remarks: lecture.getRemarks(),
                            oratorName: lecture.getOratorName(),
                            startingTime: lecture.getStartingTime(),
                            maxParticipants: lecture.getMaxParticipants()
                        }
                    )
                })

                socket.emit('currentSchedule', lecturesData);
            });    

            socket.on('getBusinessCard', (ppantID, targetID) => {
                let businessCard = ppants.get(targetID).getBusinessCard();
                let businessCardObject = {
                    id: businessCard.getParticipantId(),
                    username: businessCard.getUsername(),
                    title: businessCard.getTitle(),
                    surname: businessCard.getSurname(),
                    forename: businessCard.getForename(),
                    job: businessCard.getJob(),
                    company: businessCard.getCompany(),
                    email: undefined
                }

                //Check if ppant with targetID is a friend
                //if so, emit the email
                if (ppants.get(ppantID).getFriendList().includes(targetID)) {
                    businssCardObject.email = businessCard.getEmail();
                }

                socket.emit('businessCard', businessCardObject);

            });

            socket.on('getFriendList', (ppantID) => {
                var friendList = ppants.get(ppantID).getFriendList();

                //JUST FOR TESTING PURPOSES
                ppants.get(ppantID).addFriendRequest(new BusinessCard('22abc', 'MaxMusterFriend', 'Dr', 'Mustermann', 'Max', 'racer', 'Mercedes', 'max.mustermann@gmail.com'));
                ppants.get(ppantID).acceptFriendRequest('22abc');

                var friendListData = [];
                
                friendList.getAllBusinessCards().forEach(businessCard => {
                    friendListData.push(
                        {   
                            friendId: businessCard.getParticipantId(),
                            username: businessCard.getUsername(),
                            title: businessCard.getTitle(),
                            surname: businessCard.getSurname(),
                            forename: businessCard.getForename(),
                            surname: businessCard.getSurname(),
                            job: businessCard.getJob(),
                            company: businessCard.getCompany(),
                            email: businessCard.getEmail()
                        }
                    )
                });

                socket.emit('friendList', friendListData);
            }); 

            socket.on('getFriendRequestList', (ppantID) => {
                var friendRequestList = ppants.get(ppantID).getFriendRequestList();

                var friendRequestListData = [];
                
                friendRequestList.getAllBusinessCards().forEach(businessCard => {
                    friendRequestListData.push(
                        {   
                            friendId: businessCard.getParticipantId(),
                            username: businessCard.getUsername(),
                            title: businessCard.getTitle(),
                            surname: businessCard.getSurname(),
                            forename: businessCard.getForename(),
                            surname: businessCard.getSurname(),
                            job: businessCard.getJob(),
                            company: businessCard.getCompany(),
                            email: businessCard.getEmail()
                        }
                    )
                });

                socket.emit('friendRequestList', friendRequestListData);
            }); 

            socket.on('handleFriendRequest', (targetID, requesterID, acceptRequest) => {
                let target = ppants.get(targetID);
                let requester = ppants.get(requesterID);

                if (acceptRequest) {
                    target.acceptFriendRequest(requesterID);

                    //add target in requesterList
                    //at this moment not sure how this works
                    //Is there a list for outgoing requests? (P)
                } else {
                    target.declineFriendRequest(requesterID);
                }

                //Not sure if a answer from server is necessary
            });

            // This will need a complete rewrite once the server-side models are properly implemented
            // as of now, this is completely broken
            socket.on('disconnect', () => {
                //Prevents server crash because client sends sometimes disconnect" event on connection to server.
                if(!this.ppantControllers.has(socket.id)) {
                    console.log("disconnect");
                    return;
                }

                /* This still needs error-Handling for when no such ppantCont exists - (E) */
                var ppantID = this.ppantControllers.get(socket.id).getParticipant().getId();
                
                // gameRoomController.removeParticipantController(this.ppantControllers.get(socket.id);
                // The next line can probably be just handled inside the previous one
                //io.sockets.emit('remove player', ppantID);
                console.log(ppantID);
                socket.broadcast.emit('remove player', ppantID);
                console.log('Participant with Participant_ID: ' + ppantID + ' has disconnected from the game . . .');

                //remove participant from room
                var currentRoomId = ppants.get(ppantID).getPosition().getRoomId();
                this.#rooms[currentRoomId - 1].exitParticipant(ppantID);
                
                this.ppantControllers.delete(socket.id);
                ppants.delete(ppantID);

                // Destroy ppant and his controller
            });

            //Allows debugging the server. 
            //BEWARE: In debug mode everything can be manipulated so the server can crash easily.
            socket.on('evalServer', (data) => {
                if(!this.#DEBUGMODE)
                    return;

                try {
                    var res = eval(data);
                } catch (e) {
                    console.log("Eval Error: Can't find " + data + " in code.");
                    return;
                }		
                socket.emit('evalAnswer',res);
            });

        });

        /* Set to the same time-Interval as the gameplay-loop, this just sends out
         * an updated gameState every something miliseconds.
         * As the gameStates are still quite small, I reckon this should be alright
         * (for now). This will, however, later be fixed when the system is a bit
         * further down development.
         * - (E) */
        //setInterval( () => {
        //    io.sockets.emit('gameStateUpdate', participants);
        //}, 50);
    
    }
    
    commandHandler(moderator, input) {
        /* commands need to be delimited by a space. So we first split
         * the input at each occurence of a whitespace character.
         * - (E) */  
        var commandArgs = input.split(" ");

        /* Now we extract the command from the input.
         * 
         * The command can only occur at the very beginning of an input, so
         * we just take the substring of the input up to (but obviously not
         * including) the first whitespace-character.
         *
         * We also covert the string to lower case, so that we can easily compare
         * it to our constants. This means that the moderator does not need to
         * worry about capitalization when inputting a command, which may be
         * undesirable behaviour.
         *
         * - (E) */  
        var command = commandArgs[0].toLowerCase();
        console.log(command);        
        /* Every command is saved in an enum-File similiar to the directions.
         * So we can use the TypeChecker-class to check if the input includes
         * a legal command.
         * - (E) */   
        /*
        try {
            Typechecker.isEnumOf(command, Commands);
        } catch (TypeError) {
            // TODO: tell mod this is not a recognized command
            return;
        }
        */

        /* So now we check which command the user actually entered.
         * I would like to just iterate over every command via a 
         * "for ... in ..."-loop, but I'm not sure how to do handling
         * in this case (short of adding the handling as a property of
         * the command itself). So we just have to use a switch-statement.
         *
         * Tbh, I do somewhat detest this solution. 
         * Of course, using this does also make the previous use of the
         * TypeChecker coompletely redundant.
         *
         * This does also, for now, not including every command.
         *
         * A better solution would be to turn the commands into objects
         * that contain their own handling. Then we could just iterate
         * over every command and have them call their own handling.
         * This would also make adding new commands a lot easier I think.
         *
         *  - (E) */
         switch(command) {
            case Commands.GLOBAL:
                // Allows to send a global message

                /* We get the message that the moderator wanted to send by just
                 * looking for the first occurence of a whitespace-character,
                 * which should occur after the command.
                 * Everything inputted after the command is treated as the message
                 * the moderator wanted to send.
                 *
                 * if the commandArgs-array has a lengt of one, no text occurs after
                 * the command, and we do not need any handling.
                 *
                 * - (E) */
                if(commandArgs.length > 1) {
                    var currentDate = new Date();
                    var currentTime = (currentDate.getHours()<10?'0':'') +currentDate.getHours().toString() + ":" + (currentDate.getMinutes()<10?'0':'') + currentDate.getMinutes().toString();
                    var messageHeader =  "On " + currentTime + " moderator " + moderator.getId() + " announces:";
                    var messageText = input.substr(input.indexOf(" "));

                    /* Sending the global message to all the users.
                     * This might later be altered to include the id of the
                     * moderator or some fancy window-dressing for the message.
                     *
                     * Furthermore, we might alter the handling to not send
                     * any global messages to any other moderators.
                     *
                     * - (E) */
                    this.#io.emit('New global message', messageHeader, messageText); // This might be altered to not
                                                                  // include moderators
                }
                break;
            case Commands.LOGMESSAGES:
                // Display msgIDs and the senderIDs of the messages to mod
            case Commands.HELP:
                // send list of commands to mod
            case Commands.REMOVEPLAYER:
                // removes player from conference

                /* This will assume that the first argument after the command
                 * is the ppantID, and remove that player from the game.
                 */
                 
                /* First, it gets the socket object corresponding to player that
                 * is supposed to be removed from the game. 
                 * - (E) */
                 
                
                console.log(commandArgs[1]);
                var id = this.getSocketId(commandArgs[1]);
                console.log(id);
                var socket = this.getSocketObject(id);
                
                /*
                var roomsToRemoveFrom = Object.keys(socketToRemove.rooms));
                for(var i = 1; i < roomsToRemoveFrom.length; i++) {
                    socketToRemove.leave(roomsToRemoveFrom[i], () => {
                        // This still needs proper removal handling
                    }
                }*/
                
                /* This is, for now, just the disconnect handling copy-pasted.
                 * Lazy, I know, but it should work for now.
                 * I will later rework this, so that the client gets removed
                 * from the socket-rooms/-namespaces as well and maybe add something
                 * s.t. he can not simply rejoin immediately.
                 *
                 * The big issue here being that if a client alters the client-side
                 * handling of this
                 * - (E) */

                var ppantID = this.ppantControllers.get(socket.id).getParticipant().getId();
                console.log(ppantID);
                socket.broadcast.emit('remove player', ppantID);
                console.log('Participant with Participant_ID: ' + ppantID + ' was removed from the game . . .');

                //remove participant from room
                //var currentRoomId = ppants.get(ppantID).getPosition().getRoomId();
                //this.#rooms[currentRoomId - 1].exitParticipant(ppantID);
                
                this.ppantControllers.delete(socket.id);
                //ppants.delete(ppantID);
                
                
                break;
        } 
    }
    
        getSocketId(ppantID) {
            /* So this is functional using this helping variable, but I will need to redo it in pretty.
             * The problem is that, since the forEach()-method takes a function as a callbkac-parameter,
             * when we call "return socketId;" inside of the if-statement, we only return it to the
             * method calling the function containing the if-statement, which is the forEach()-method.
             * This means that the return-value doesn't actually reach the commandHandler the way it is
             * supposed to. Instead, the getSocketId()-method returns an undefined value.
             * Returning the help-variable instead fixes the issue (for now), but it is not a pretty
             * solution.
             * - (E) */
            var id;
            this.ppantControllers.forEach( (ppantCont, socketId) => {
                console.log("ppantId: " + ppantCont.getParticipant().getId() + ", socketId: " + socketId);
                if (ppantCont.getParticipant().getId() == ppantID) {
                    console.log("Returning: " + socketId);
                    id = socketId;
                }
            });
            return id;
        }

        getSocketObject(socketId) {
            var mainNamespace = this.#io.of('/');
            var socketKeys = Object.keys(mainNamespace.connected);
            console.log(socketKeys);
            for (var i = 0; i < socketKeys.length; i++) {
            console.log("Comparing " + socketKeys[i] + " against " + socketId + ", a match would return " + mainNamespace.connected[socketKeys[i]].id);
                if(socketKeys[i] == socketId) {
                    
                    return mainNamespace.connected[socketKeys[i]];
                }
            }
        }
    
    
}
