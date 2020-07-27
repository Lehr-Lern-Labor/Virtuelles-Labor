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
const RankListService = require('../services/RankListService')

const TypeChecker = require('../../utils/TypeChecker.js');
const Conference = require('../models/Conference.js');

const ChatService = require('../services/ChatService.js');

const warning = {
    header: "Warning",
    body: "One of your messages was removed by a moderator. Please follow the " + 
          "general chat etiquette. Additional infractions may result in a permanent " +
          "ban."
}

const removal = {
    header: "Removal",
    body: "You have been removed from this lecture by a moderator. Please follow the " +
          "general chat etiquette."
}


/* This should later on be turned into a singleton */
module.exports = class ServerController {
    
    #io;
    #conference;
    #listOfConfCont;
    #DEBUGMODE;
    #banList;
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


        //JUST FOR TESTING PURPOSES
        ppants.set('22abc', new Participant('22abc', '', new BusinessCard('22abc', 'MaxFriend', 'Dr', 'Mustermann', 'Max', 'racer', 'Mercedes', 'max.mustermann@gmail.com'), new Position(500, 0, 0), Direction.DOWNLEFT));  
        ppants.set('22abcd', new Participant('22abcd', '', new BusinessCard('22abcd', 'MaxFReq', 'Dr', 'Mustermann', 'Hans', 'racer', 'Ferrari', 'hans.mustermann@gmail.com'), new Position(501, 0, 0), Direction.DOWNLEFT)) 

        this.#banList = [];
        
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
                
                if (this.isBanned(socket.request.session.accountId)) {
                    this.#io.to(socket.id).emit('remove yourself');
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
                ppants.set(ppantID, ppant);
                this.ppantControllers.set(socket.id, ppantCont);

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

                ppants.get(ppantID).increaseAchievementCount('messagesSent')

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
                    !door.getStartPosition().getCordX().includes(ppants.get(ppantID).getPosition().getCordX()) ||
                    !door.getStartPosition().getCordY().includes(ppants.get(ppantID).getPosition().getCordY())) {
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

            socket.on('lectureMessage', (ppantID, username, text) => {
                
                var lectureID = socket.currentLecture; // socket.currentLecture is the lecture the participant is currently in
                var lecture = this.#conference.getSchedule().getLecture(lectureID);
                var lectureChat = lecture.getLectureChat();
                var participant = ppants.get(ppantId);
                
                /* We want to check if the ppant "owns" the lecture here.
                 * As the orator-class seems not be actually used yet, we just use
                 * the orator-name from the lecture class and compare it to the username
                 * of the aprticipant. And since I'm not sure if that will work, we just allow
                 * every moderator to use commands in the lecture-chat (for testing purposes).
                 * 
                 * - (E) */
                if(/* (participant.getBusinessCard().getUsername() == lecture.getOratorName() || */
                 participant.isModerator() /*)*/ && text.charAt(0) == Settings.CMDSTARTCHAR) {
                    /* Now, we check if the message contains any command
                     * known by the server and handle this appropriately.
                     * We move this to another method for better readability.
                     *
                     * We also remove the first character of the string (the
                     * "command-starting character"), because we do no longer
                     * need it.
                     *
                     * - (E) */
                    this.commandHandlerLecture(socket, lecture, text.substr(1));
                } else {
                
                    participant.increaseAchievementCount('messagesSent')

                    // timestamping the message - (E)
                    var currentDate = new Date();
                    var currentTime = (currentDate.getHours()<10?'0':'') + currentDate.getHours().toString() + ":" + (currentDate.getMinutes()<10?'0':'') + currentDate.getMinutes().toString();
                    var message = {senderID: ppantID, username: username, messageID: lectureChat.getMessages().length, timestamp: currentTime, messageText: text}
                    lectureChat.appendMessage(message);
                    console.log("<" + currentTime + "> " + ppantID + " says " + text + " in lecture.");
                    // Getting the roomID from the ppant seems to not work?
                    
                    this.#io.in(socket.currentLecture).emit('lectureMessageFromServer', message);
                    //this.#io.sockets.in(roomID.toString()).emit('newAllchatMessage', ppantID, currentTime, text);
            
                }
            });

            var currentLecturesData = [];

            socket.on('enterLecture', (ppantID, lectureId) => {

                let idx = currentLecturesData.findIndex(x => x.id === lectureId);

                if (idx < 0) {
                    throw new Error(lectureId + " is not in list of current lectures")
                }
                
                var schedule = this.#conference.getSchedule();
                var lecture = schedule.getLecture(lectureId);
                
                if(lecture.isBanned(socket.request.session.accountId)) {
                    this.sendRemoval(socket.id);
                    return;
                }

                if(lecture.enter(ppantID)) {
                    console.log(ppantID + " joins " + lectureId);
                    socket.join(lectureId);
                    socket.currentLecture = lectureId;
                    
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

                    ppants.get(ppantID).increaseAchievementCount('lecturesVisited')
                } else {
                    socket.emit('lectureFull', currentLecturesData[idx].id);
                }
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

            socket.on('getCurrentLectures', (ppantID) => {
                let doorService = new DoorService();
                let lectureDoorPosition = doorService.getLectureDoorPosition();

                //check if participant is in right position to enter room
                //ppants.get(ppantID).getPosition() !== door.getStartPosition() did not work for some reason
                if (ppants.get(ppantID).getPosition().getRoomId() !== lectureDoorPosition.getRoomId() ||
                    !lectureDoorPosition.getCordX().includes(ppants.get(ppantID).getPosition().getCordX()) ||
                    !lectureDoorPosition.getCordY().includes(ppants.get(ppantID).getPosition().getCordY())) {
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
                    businessCardObject.email = businessCard.getEmail();
                }

                socket.emit('businessCard', businessCardObject);

            });

            socket.on('getAchievements', (ppantID) => {
                var achievements = ppants.get(ppantID).getAchievements();

                socket.emit('achievements', achievements);
            });

            socket.on('getRankList', () => {
                var rankList = [
                    {
                        participantId: "22abcd",
                        username: "MaxFriend",
                        points: 40,
                        rank: 1,
                        self: false
                    },
                    {
                        participantId: "22abc",
                        username: "MaxFReq",
                        points: 30,
                        rank: 2,
                        self: false
                    },
                    {
                        participantId: "30abc",
                        username: "Myself",
                        points: 30,
                        rank: 2,
                        self: true
                    },
                    {
                        participantId: "40abc",
                        username: "MusFriend",
                        points: 25,
                        rank: 3,
                        self: false
                    },
                    {
                        participantId: "40abc",
                        username: "MusFReq",
                        points: 20,
                        rank: 4,
                        self: false
                    },
                ]

                socket.emit('rankList', rankList);

                //if DB is initialized
                /*RankListService.getRankListWithUsername("1", 30).then(rankList => {
                    socket.emit('rankList', rankList);
                })*/
            })

            socket.on('getFriendList', (ppantID) => {
                var friendList = ppants.get(ppantID).getFriendList();

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
                var friendRequestList = ppants.get(ppantID).getReceivedRequestList();

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

            //adds a new Friend Request to the system
            socket.on('newFriendRequest', (requesterID, targetID) => {
                let target = ppants.get(targetID);
                let requester = ppants.get(requesterID);
                let targetBusCard = target.getBusinessCard();
                let requesterBusCard = requester.getBusinessCard();

                target.addFriendRequest(requesterBusCard);
                requester.addSentFriendRequest(targetBusCard);
            });

            //handles a friendrequest, either accepted or declined
            socket.on('handleFriendRequest', (targetID, requesterID, acceptRequest) => {
                let target = ppants.get(targetID);
                let requester = ppants.get(requesterID);


                if (acceptRequest) {
                    target.acceptFriendRequest(requesterID);
                    requester.sentFriendRequestAccepted(targetID);
                } else {
                    target.declineFriendRequest(requesterID);
                    requester.sentFriendRequestDeclined(targetID);
                }

                //Not sure if a answer from server is necessary
            });

            //handles removing a friend in both friend lists
            socket.on('removeFriend', (removerID, removedFriendID) => {
                let remover = ppants.get(removerID);
                let removedFriend = ppants.get(removedFriendID);

                remover.removeFriend(removedFriendID);
                removedFriend.removeFriend(removerID);
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

                if(socket.currentLecture) {
                    var schedule = this.#conference.getSchedule();
                    var lectureId = socket.currentLecture;
                    var lecture = schedule.getLecture(lectureId);
                    lecture.leave(ppantID);
                    console.log(ppantID + " leaves " + lectureId)
                    socket.leave(lectureId);
                    socket.currentLecture = undefined;
                }

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
                    var messageHeader =  "On " + currentTime + " moderator " + moderator.getId() + " announced:"; //TODO: replace id with username
                    var messageText = input.substr(input.indexOf(" "));

                    /* Sending the global message to all the users.
                     * Furthermore, we might alter the handling to not send
                     * any global messages to any other moderators.
                     *
                     * - (E) */
                    this.#io.emit('New global message', messageHeader, messageText); // This might be altered to not
                                                                  // include moderators
                }
                break;
            case Commands.LOGMESSAGES:
                /* Display msgIDs and the senderIDs of the messages to mod.
                 * This can be used to identify the senderIDs of messages send into the allchat,
                 * so that the moderator can remove the right user from a conference.
                 * - (E) */
                 var room = this.#rooms[moderator.getPosition().getRoomId() - 1];
                 var messageHeader = "List of messages posted in " + room.getTypeOfRoom();
                 var messageBody = [];
                 var msg = room.getMessages();
                 for(var i = 0; i < msg.length; i++) {
                     messageBody.splice(0 , 0, "[" + msg[i].timestamp + "] (senderId: " + msg[i].senderID +
                      ") has messageId: " + msg[i].messageID);
                 }
                 this.#io.to(this.getSocketId(moderator.getId())).emit('New global message', messageHeader, messageBody);
                 break;
            case Commands.HELP:
                // TODO: maybe move all these strings into a util-file?
                var messageHeader = "List of Commands."
                var messageBody = ["\\global <message>  --  Post a message into the global chat. " +
                                        "It will display in every participants game-view as a pop-up.",
                                   "\\help  --  This command. Displays a list of all commands and how to use them.", 
                                   "\\log --  Will show a log of all messages send into the allchat of the room you're " +
                                   "currently in, including the messageID and senderID of each message.", 
                                   "\\rmuser <list of participantIDs>  -- Takes a list of participantIDs, each one " +
                                   "seperated from the next by a whitespace-character, and removes all of them from " +
                                   "the conference. They will not be able to reenter the conference.\n WARNING: It is " +
                                   "not yet possible to unban a banned user!",
                                   "\\rmmsg <list of msgIDs  -- Takes a list of messageIDs, each one separated from the next " +
                                   "one by a whitespace character, and removes the corresponding messages - " +
                                   "if they exist - from the allchat of the room you're currently in. Will also send a warning to " +
                                   "the senders of the messages, reminding them to follow chat etiquette.",
                                   "\\rmallby <list of participantIDs>  --  Takes a list of participantIDs, each one " +
                                   "seperated from the next by a whitespace-character, and removes all messages posted " +
                                   "by them into the allchat of the room you're currently in. Will also send a warning " +
                                   "to these participants, reminding them to follow chat-etiquette."];
                this.#io.to(this.getSocketId(moderator.getId())).emit('New global message', messageHeader, messageBody);
                break;
            case Commands.REMOVEPLAYER:
                // removes player(s) from conference
                // Maybe instead of being able to remove several players be able
                // to remove just one and give them a ban message instead?
                
                //TODO have this take something else instead of participant-IDs

                /* This will assume that each argument supplied with the \rmuser-command
                 * is a valid participantID, each one separated from the next by a whitespace.
                 * It will perform the removal.
                 */
                 for(var i = 1; i < commandArgs.length; i++) {
                     
                    var ppantID = commandArgs[i];
                     
                    
                    /* First, it gets the socket object corresponding to player that
                     * is supposed to be removed from the game. 
                     * - (E) */
                    var id = this.getSocketId(ppantID); // get the Id of the socket belonging to the 
                                                        // participant that is to be removed
                    
                    if(id != undefined) {
                        var socket = this.getSocketObject(id); // get the actual socket object
                    
                        /* Tells the clientController to remove itself from the game
                         * (meaning to return to the homepage). Since the handling of
                         * this can be altered client-side, we also need to remove the socket
                         * from all the rooms (see below).
                         * - (E) */
                        this.#io.to(id).emit('remove yourself');
                        this.#banList.push(socket.request.session.accountId);
                        
                        /* Get all the socketIO-rooms the socket belonging to the participant that
                         * is to be removed is currently in and remove the socket from all those rooms
                         * - (E) */
                        var roomsToRemoveFrom = Object.keys(socket.rooms);
                        console.log(roomsToRemoveFrom);
                        for(var i = 0; i < roomsToRemoveFrom.length; i++) {
                            var room = roomsToRemoveFrom[i];
                            socket.leave(room);
                            console.log(room);
                            this.#io.in(room).emit("remove player", ppantID);  
                        }
                        
                        console.log('Participant with Participant_ID: ' + ppantID + ' was removed from the game . . .');
                        
                        /* We do for now not delete the socket from the ppantControllers-list,
                         * as I want to see if this will keep the user from reentering the game.
                         * UPDATE: IT DOES NOT.
                         * Also, we can not remove the participant from the ppant-List, as the
                         * ppant-List is not known at this part of the program.
                         * - (E) */
                        //this.ppantControllers.delete(socket.id);
                        //ppants.delete(ppantID);
                    }
                }
                break;
            case Commands.REMOVEMESSAGE:
                var messagesToDelete = commandArgs.slice(1);
                var roomID = moderator.getPosition().getRoomId();
                var msg = this.#rooms[roomID - 1].getMessages();
                for(var i = 0; i < msg.length; i++) {
                     if(messagesToDelete.includes(msg[i].messageID.toString())) {
                         this.sendWarning(this.getSocketId(msg[i].senderID));
                         msg.splice(i, 1);
                         i--; // This is important, as without it, we could not remove
                              // two subsequent messages
                     }
                }
                this.#io.in(roomID.toString()).emit('initAllchat', msg);
                break;
            case Commands.REMOVEMESSAGEYBYUSER:
                var roomID = moderator.getPosition().getRoomId();
                var msg = this.#rooms[roomID - 1].getMessages();
                var newMsg = msg;
                for(var i = 0; i < msg.length; i++) {
                     if(commandArgs.includes(msg[i].senderID.toString())) {
                         this.sendWarning(this.getSocketId(msg[i].senderID));
                         msg.splice(i, 1);
                         i--; // This is important, as without it, we could not remove
                              // two subsequent messages
                     }
                }
                this.#io.in(roomID.toString()).emit('initAllchat', msg);
                break;
            default:
                var messageHeader = "Unrecognized command."
                var messageText = "You entered an unrecognized command. Enter '\\help' to receive an overview of all commands and how to use them."
                this.#io.to(this.getSocketId(moderator.getId())).emit('New global message', messageHeader, messageText); 
                break;
        } 
    };
    
    commandHandlerLecture(socket, lecture, input) {
        // TODO
        // TO IMPLEMENT
        // - revoke user token
        // - grant user token
        
        /* commands need to be delimited by a space. So we first split
         * the input at each occurence of a whitespace character.
         * - (E) */  
        var commandArgs = input.split(" ");
        
        /* Get the chat of the lecture we're currently in for message operations */
        var lectureChat = lecture.getLectureChat().getMessages();

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
        
        switch(command) {
            case Commands.REMOVEMESSAGE:
                for(var i = 0; i < lectureChat.length; i++) {
                     if(commandArgs.includes(lectureChat[i].messageID.toString())) {
                         this.sendWarning(this.getSocketId(lectureChat[i].senderID));
                         lectureChat.splice(i, 1);
                         i--; // This is important, as without it, we could not remove
                              // two subsequent messages
                     }
                }
                this.#io.in(socket.currentLecture).emit('updateLectureChat', lectureChat);
                break;
            case Commands.REMOVEMESSAGESBYUSER:
                for(var i = 0; i < lectureChat.length; i++) {
                     if(commandArgs.includes(lectureChat[i].senderID.toString())) {
                         this.sendWarning(this.getSocketId(lectureChat[i].senderID));
                         lectureChat.splice(i, 1);
                         i--; // This is important, as without it, we could not remove
                              // two subsequent messages
                     }
                }
                this.#io.in(socket.currentLecture).emit('updateLectureChat', lectureChat);
                break;
            case Commands.REMOVEPLAYER:
                for(var i = 1; i < commandArgs.length; i++) {
                    var ppantId = commandArgs[i];
                    if(lecture.hasPPant(ppantId)) {
                        var socket = this.getSocketObject(this.getSocketId(ppantId));
                        lecture.leave(ppantId);
                        lecture.revokeToken(ppantId);
                        lecture.ban(socket.request.session.accountId);
                        socket.leave(lectureId);
                        socket.currentLecture = undefined;
                        socket.broadcast.emit('showAvatar', participantId);
                        this.sendRemoval(socket.id);
                    }
                }
                break;
            case Commands.REVOKETOKEN:
                for(var i = 1; i < commandArgs.length; i++) {
                    lecture.revokeToken(commandArgs[i]);
                    // TODO: switch token display in users client
                }
                break;
            case Commands.GRANTTOKEN:
                for(var i = 1; i < commandArgs.length; i++) {
                    lecture.grantToken(commandArgs[i]);
                    // TODO: switch token display in users client
                }
                break;
            case Commands.HELP:
                var messageHeader = "List of Commands."
                var messageBody = ["\\help  --  This command. Displays a list of all commands and how to use them.", 
                                   "\\log --  Will show a log of all messages send into the lecture chat" +
                                   ", including the messageID and senderID of each message.", 
                                   "\\rmuser <list of participantIDs>  --  Takes a list of participantIDs, each one " +
                                   "seperated from the next by a whitespace-character, and removes all of them from " +
                                   "the lecture. They will not be able to reenter the lecture.\n WARNING: It is " +
                                   "not yet possible to revert this!",
                                   "\\rmmsg <list of msgIDs  --  Takes a list of messageIDs, each one seperated from the " +
                                   "next one by a whitespace character, and removes the corresponding messages - " +
                                   "if they exist - from the lecture chat. Will also send a warning to " +
                                   "the senders of the messages, reminding them to follow chat etiquette.",
                                   "\\rmallby <list of participantIDs>  --  Takes a list of participantIDs, each one " +
                                   "seperated from the next by a whitespace-character, and removes all messages posted " +
                                   "by them into the lecture chat. Will also send a warning " +
                                   "to these participants, reminding them to follow chat-etiquette.",
                                   "\\revoke <list of participantIDs> --  Takes a list of participantIDs, each one " +
                                   "seperated from the next by a whitespace-character, and revokes their lecture tokens " +
                                   "(if they own one). They will no longer be able to post messages into the lecture chat.",
                                   "\\grant <list of participantIDs> --  Takes a list of participantIDs, each one " +
                                   "seperated from the next by a whitespace-character, and grants them lecture tokens " +
                                   "(if they are currently listening to the lecture and do not own one). They will " +
                                   "be able to post messages into the lecture chat."];
                this.#io.to(socket.id).emit('New global message', messageHeader, messageBody);
                break;
            case Commands.LOGMESSAGES:
                 var messageHeader = "List of messages posted in " + lecture.getTitle();
                 var messageBody = [];
                 for(var i = 0; i < lectureChat.length; i++) {
                     messageBody.splice(0 , 0, "[" + lectureChat[i].timestamp + "] (senderId: " + lectureChat[i].senderID +
                      ") has messageId: " + lectureChat[i].messageID);
                 }
                 this.#io.to(socket.id).emit('New global message', messageHeader, messageBody);
                 break;
            default:
                var messageHeader = "Unrecognized command."
                var messageText = "You entered an unrecognized command. Enter '\\help' to receive an overview of all commands and how to use them."
                this.#io.to(this.getSocketId(orator.getId())).emit('New global message', messageHeader, messageText); 
                break;
        }
        
    };
    
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
                if (ppantCont.getParticipant().getId() == ppantID) {
                    id = socketId;
                }
            });
            return id;
        };

        // The following methods should probably be private

        getSocketObject(socketId) {
            var mainNamespace = this.#io.of('/');
            var socketKeys = Object.keys(mainNamespace.connected);
            for (var i = 0; i < socketKeys.length; i++) {
                if(socketKeys[i] == socketId) {
                    return mainNamespace.connected[socketKeys[i]];
                }
            }
        };
        
        getIdOf(username) {
            /* Gets the participantId belonging to a username.
             * Since double-log-ins are still possible atm, this will only return
             * the id of last logged-in participant of a user.
             * - (E) */
            var id;
            this.ppantControllers.forEach( (ppantCont, socketId) => {
                if (ppantCont.getParticipant().getBusinessCard().getUsername() == username) {
                    id = ppantCont.getParticipant().getId();
                }
            });
            return id;
        };
        
        /* Sends a warning to the user who is connected to the socket with the passed Id.
         * If the id is undefined, this will do nothing.
         * - (E) */
        sendWarning(socketid) {
            if(socketid != undefined) {
                this.#io.to(socketid).emit("New global message", warning.header, warning.body);
            }
        };
        
        sendRemoval(socketid) {
            if(socketid != undefined) {
                this.#io.to(socketid).emit("New global message", removal.header, removal.body);
            }
        };
        
        isBanned(accountId) {
            if (this.#banList.includes(accountId)) {
                return true;
            };
            return false;
        };
        
        /* Can't actually be used yet, as it requires accountIds as arguments,
         * but nothing (no user or method) knows enough to properly use this.
         * - (E) */
        unban(accountId) {
            if (this.#banList.includes(accountId)) {
                this.#banList.splice(this.#banList.indexOf(accountId), 1);
            };
        };
    
    
}
