const RoomDecorator = require('../models/RoomDecorator.js');
const GameObjectService = require('../services/GameObjectService.js');
const NPCService = require('../services/NPCService.js');
const Direction = require('../../client/shared/Direction.js');
const Settings = require('../../utils/Settings.js');
const DoorService = require('../services/DoorService.js');
const Position = require('./Position.js');

module.exports = class FoyerRoomDecorator extends RoomDecorator {
    #room;

    #assetPaths = {
        "tile_default": "client/assets/tiles/tile_default.png",
        "leftwall_default": "client/assets/walls/wall1.png",
        "rightwall_default": "client/assets/walls/wall2.png",
        "leftlecturedoor_default": "client/assets/doors/door_lecturehall.png",
        "rightfoodcourtdoor_default": "client/assets/doors/door_foodcourt.png",
        "rightreceptiondoor_default": "client/assets/doors/door_reception.png",
        "leftschedule_default0": "client/assets/walls/schedule1.png",
        "leftschedule_default1": "client/assets/walls/schedule2.png",
        "leftschedule_default2": "client/assets/walls/schedule3.png",
        "leftwindow_default0": "client/assets/windows/left_small_window_default0.png",
        "rightwindow_default0": "client/assets/windows/right_small_window_default0.png",
        "rightwindow_default1": "client/assets/windows/right_small_window_default1.png",
        "leftconferencelogo_default0": "client/assets/logos/conferencelogo1.png",
        "leftconferencelogo_default1": "client/assets/logos/conferencelogo2.png",
        "leftconferencelogo_default2": "client/assets/logos/conferencelogo3.png",
        "leftconferencelogo_default3": "client/assets/logos/conferencelogo4.png",
        "leftconferencelogo_default4": "client/assets/logos/conferencelogo5.png",
        "rightwallframe_default0": "client/assets/frames/wallframe1.png",
        "rightwallframe_default1": "client/assets/frames/wallframe2.png",
        "rightwallframe_default2": "client/assets/frames/wallframe3.png",
        "leftsofa_default": "client/assets/chairs/sofa_left.png",
        "rightsofa_default": "client/assets/chairs/sofa_right.png",
        "plant_default": "client/assets/plants/plant.png",
        "table_default": "client/assets/tables/table.png",

    }

    constructor(room) {
        super();
        this.#room = room;

        let objService = new GameObjectService();

        /* Get all map elements from service */

        //Get tiles
        let listOfMapElements = [];

        for (var i = 0; i < this.#room.getLength(); i++) {

            for (var j = 0; j < this.#room.getWidth(); j++) {
                listOfMapElements.push(objService.createDefaultTile(Settings.FOYER_ID, i, j, false));
            }

        }

        //Get left walls
        for (var i = 0; i < this.#room.getLength(); i++) {
            listOfMapElements.push(objService.createDefaultLeftWall(Settings.FOYER_ID, 1, 1, i, -1, false));
        }

        //Get right walls
        for (var j = 0; j < this.#room.getWidth(); j++) {
            listOfMapElements.push(objService.createDefaultRightWall(Settings.FOYER_ID, 1, 1, this.#room.getLength(), j, false));
        }

        /*//Get left doors
        listOfMapElements.push(objService.createDefaultLectureLeftDoor(Settings.FOYER_ID, ));

        //Get right doors
        listOfMapElements.push(objService.createDefaultReceptionRightDoor(),
                               objService.createDefaultFoodcourtRightDoor());

        */
        //Get all gameObjects from service
        let listOfGameObjects = [];

        for (var i = 4; i < 9; i++)
            listOfGameObjects.push(objService.createTable(Settings.FOYER_ID, i, 0, true));

        //Get schedule elements
        let schedules = objService.createLeftSchedule(Settings.FOYER_ID, 1, 3, 5, -1, false);
        schedules.forEach(schedule => {

            listOfGameObjects.push(schedule);

        });

        listOfGameObjects.push(objService.createPlant(Settings.FOYER_ID, this.#room.getLength() - 1, 0, true));

        for (var i = this.#room.getLength() - 3; i < this.#room.getLength() - 1; i++) {
            listOfGameObjects.push(objService.createLeftSofa(Settings.FOYER_ID, i, 0, true));
            listOfGameObjects.push(objService.createLeftWindowDefault0(Settings.FOYER_ID, 1, 1, i, -1, false))
        }

        listOfGameObjects.push(objService.createLeftWindowDefault0(Settings.FOYER_ID, 1, 1, this.#room.getLength() - 1, -1, false))
        listOfGameObjects.push(objService.createRightWindowDefault0(Settings.FOYER_ID, 1, 1, this.#room.getLength(), 0, false))

        for (var j = 1; j < 6; j++) {
            listOfGameObjects.push(objService.createRightSofa(Settings.FOYER_ID, this.#room.getWidth() - 1, j, true));
            listOfGameObjects.push(objService.createRightWindowDefault0(Settings.FOYER_ID, 1, 1, this.#room.getLength(), j, false));
        }

        let conferenceLogos = objService.createLeftConferenceLogo(Settings.FOYER_ID, 1, 5, 13, -1, false);
        conferenceLogos.forEach(conferenceLogo => {
            listOfGameObjects.push(conferenceLogo);
        });

        listOfGameObjects.push(objService.createRightWindowDefault1(Settings.FOYER_ID, 1, 1, this.#room.getLength(), this.#room.getWidth() - 2, false))
 
        let wallFrames = objService.createRightWallFrame(Settings.FOYER_ID, 1, 3, this.#room.getLength(), 14, false);
        wallFrames.forEach(wallFrame => {
            listOfGameObjects.push(wallFrame);
        });

        //Get all npcs from service
        let npcService = new NPCService();
        let listOfNPCs = [];

        listOfNPCs.push(npcService.createFoyerHelperNPC(Settings.FOYER_ID, 0, 0, Direction.DOWNRIGHT));


        //Get all doors from service
        let doorService = new DoorService();
        let listOfDoors = [];

        listOfDoors.push(doorService.createLectureDoor(new Position(Settings.FOYER_ID, 2, -1)),
            doorService.createFoodCourtDoor(new Position(Settings.FOYER_ID, 25, 9), new Position(Settings.FOODCOURT_ID, 2, 0), Direction.DOWNRIGHT),
            doorService.createReceptionDoor(new Position(Settings.FOYER_ID, 25, 21), new Position(Settings.RECEPTION_ID, 2, 0), Direction.DOWNRIGHT));

        //Get door tiles
        listOfMapElements.push(objService.createDefaultLeftTile(Settings.FOYER_ID, 2, -2, false),
            objService.createDefaultRightTile(Settings.FOYER_ID, 26, 9, false),
            objService.createDefaultRightTile(Settings.FOYER_ID, 26, 21, false));

        //Assign lists to room and build occupation map
        this.#room.setMapElements(listOfMapElements);
        this.#room.setGameObjects(listOfGameObjects);
        this.#room.setNPCs(listOfNPCs);
        this.#room.setDoors(listOfDoors);
        this.#room.buildOccMap();
    }

    getRoom() {
        return this.#room;
    }

    getAssetPaths() {
        return this.#assetPaths;
    }
}