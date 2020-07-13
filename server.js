/* ############################################################################### */
/* ####################### LOADING NON-VIMSU REQUIREMENTS ######################## */
/* ############################################################################### */

const express = require('express');

/* This package apparently is meant to make more difficult features of the
 * protocol easier to handle - I am not sure how it would be of use here, but
 * I have included since it was included in the example I am mostly working from,
 * see also below.
 * Add.: Without this, the server won't work.
 * - (E) */
const http = require('http');

/* This is a package that has a multitude of operations
 * on path-Strings implemented.
 * It is probably not necessary, but it was used in an example that I found,
 * so I am going to use it here as well (for now).
 * - (E) */
const path = require('path');
const socketio = require('socket.io');


/* ############################################################################### */
/* ######################## LOADING VIMSU REQUIREMENTS ########################### */
/* ############################################################################### */

const Position = require('./game/app/server/models/Position.js');
const Direction = require('./game/app/server/models/Direction.js');
const ServerController = require('./game/app/server/controller/ServerController.js');

const Participant = require('./game/app/server/models/Participant.js');
const ParticipantController = require('./game/app/server/controller/ParticipantController.js');

const Room  = require('./game/app/server/models/Room.js');
const RoomController = require('./game/app/server/controller/RoomController.js');
const TypeOfRoom = require('./game/app/server/models/TypeOfRoom.js');

const TypeChecker = require=('./game/app/client/utils/TypeChecker.js');

/* ############################################################################### */
/* ######################### SETTING UP THE SERVER ############################### */
/* ############################################################################### */

/* Set up port s.t. the app should work both on heroku
 * and on localhost. - (E) */
const PORT = process.env.PORT || 5000;

/* Setting up the server by
 *   (i) Setting up an express server
 *   (ii) Passing that as an argument to create a http-Server (for some reason)
 *   (iii) creating a socket-Server on top of that for real-time interaction
 * - (E) */
const app = express();
const httpServer = http.createServer(app);
const io = socketio(httpServer);



/* Sets the port-Field of the express-Instance to the proper port.
 * Why?
 * Because that's how they did it in the example.
 * I might later remove this to see if it breaks stuff.
 * - (E) */
app.set('port', PORT);

/* Tbh I don't really know what this does. I copied it from the old server.js.
 * - (E) */
app.use(express.static(path.join(__dirname + '/website')));
app.use('/client', express.static(path.join(__dirname + '/game/app/client')));
app.use('/utils', express.static(path.join(__dirname + '/game/app/utils'))); // This allows user to access shared files

/* On receiving a get-Request, the express-Server will deliver the
 * index.html file to the user.
 * - (E) */
app.get('/', (request, response) => {
	response.sendFile(path.join(__dirname, '/website/index.html'));
});


/* The http-Server starts listening on the port.
 * If this does not happen (if the express-instance 'app' listen here),
 * then socket.io will not work, as the GET-request for the client-API
 * will try to fetch the data from the wrong directory, resulting in a
 * 404 NOT FOUND error.
 * I don't know why this is, but thanks StackOverflow!
 * - (E) */
httpServer.listen(PORT, () => console.log(`Vimsu-Server listening on port ${PORT} . . .`));


/* We now initlialise a simple game-state (create a basic room along with it's controller
 * and so on).
 * This is still somewhat of a placeholder handling of this, and needs to be later moved into
 * the ServerController and ConferenceController.
 * (The idea being: server.js calls ServerController to create new conference and the
 * ConferenceController creates the room plus the RoomController as part of creating itself)
 * - (E) */

//const confID = 1;
//const gameConference



//const gameRoomId = 1000; // placeholder ID
//const gameRoom = new Room(gameRoomId, TypeOfRoom.FOYER); // Creates a foyer
//const gameRoomController = new RoomController(gameRoom); // Creates a controller for that foyer

// On trying out some stuff, the roomClass is broken, as the objectClass is broken.

/* ########################################################################################## */
/* ################################## REALTIME FUNCTIONALITY ################################ */
/* ########################################################################################## */

/* Now, we're going to implement the socketIO-functionality that makes our server capable
 * of handling several players at once and allows them to see each other.
 * This will (for now) be handled here, until I figured out how to have it properly handled
 * by individual ParticipantController-Instances.
 * - (E) */

const controller = new ServerController(io);
controller.init();














