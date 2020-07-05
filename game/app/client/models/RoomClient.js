//var TypeChecker = require('../../utils/TypeChecker.js');
//var ParticipantClient = require('./ParticipantClient.js');

/*module.exports = */class RoomClient {

    #roomId;
    //clientRoomChat
    #typeOfRoom;
    #length;
    #width;
    #listOfPPants;
    #occupationMap;
    //listOfNPCs
    #listOfGameObjects;
    //listOfDoors
    #map;

    /**
     * Erzeugt RoomClient Instanz
     * 
     * @author Philipp
     * 
     * @param {int} roomId 
     * @param {TypeOfRoomClient} typeOfRoom
     * @param {int} length 
     * @param {int} width 
     * @param {Array of ParticipantClient} listOfPPants 
     * @param {Array of GameObjectClient} listOfGameObjects
     * @param {Array of Array of int} occupationMap 
     */
    constructor(roomId, typeOfRoom, length, width, listOfPPants, listOfGameObjects, occupationMap) {
        TypeChecker.isInt(roomId);
        TypeChecker.isEnumOf(typeOfRoom, TypeOfRoomClient)
        TypeChecker.isInt(length);
        TypeChecker.isInt(width);
        TypeChecker.isInstanceOf(listOfPPants, Array);
        TypeChecker.isInstanceOf(listOfGameObjects, Array);

        listOfPPants.forEach(element => {
            TypeChecker.isInstanceOf(element, ParticipantClient);
        });

        listOfGameObjects.forEach(element => {
            TypeChecker.isInstanceOf(element, GameObjectClient);
        })

        TypeChecker.isInstanceOf(occupationMap, Array);

        occupationMap.forEach(element => {
            TypeChecker.isInstanceOf(element, Array);
            element.forEach(item => {
                TypeChecker.isInt(item);
            });
        });

        //Es existiert nur RoomClientInstanz des Raumes, in dem sich der Teilnehmer gerade befindet
        if(!!RoomClient.instance) {
            return RoomClient.instance;
        }

        RoomClient.instance = this;

        this.#roomId = roomId;
        this.#typeOfRoom = typeOfRoom;
        this.#length = length;
        this.#width = width;
        this.#listOfPPants = listOfPPants;
        this.#occupationMap = occupationMap;
        this.buildMapArray();
    }

    getRoomId() {
        return this.#roomId;
    }

    getTypeOfRoom() {
        return this.#typeOfRoom;
    }

    getWidth() {
        return this.#width;
    }

    getLength() {
        return this.#length;
    }

    getListOfPPants() {
        return this.#listOfPPants;
    }

    getListOfGameObjects() {
        return this.#listOfGameObjects;
    }

    /**
     * Fügt Participant in Raumliste ein, falls dieser noch nicht darin ist
     * 
     * @author Philipp
     * 
     * @param {ParticipantClient} participant 
     */
    enterParticipant(participant) {
        TypeChecker.isInstanceOf(participant, ParticipantClient);
        if (!this.#listOfPPants.includes(participant)) {
            this.#listOfPPants.push(participant);
        }
    }

    /**
     * Entfernt Participant aus Raumliste, falls dieser darin ist
     * 
     * @author Philipp
     * 
     * @param {ParticipantClient} participant 
     */
    exitParticipant(participant) {
        TypeChecker.isInstanceOf(participant, ParticipantClient);
        if (this.#listOfPPants.includes(participant)) {
            let index = this.#listOfPPants.indexOf(participant);
            this.#listOfPPants.splice(index, 1);
        }
    }

    /**
     * Checkt, ob es auf der gelieferten Position zu einer Kollision kommt. 
     * 
     * @author Philipp
     * 
     * @param {PositionClient} position 
     * @returns true, bei Kollision
     * @returns false, sonst
     */
    checkForCollision(position) {
        TypeChecker.isInstanceOf(position, PositionClient);
        let cordX = position.getCordX();
        let cordY = position.getCordY();

        if (this.#occupationMap[cordX][cordY] == 1) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * Wird bei Raumwechsel aufgerufen
     * 
     * @author Philipp
     * 
     * @param {int} roomId 
     * @param {TypeOfRoomClient} typeOfRoom
     * @param {int} length 
     * @param {int} width 
     * @param {Array of ParticipantClient} listOfPPants 
     * @param {Array of Array of int} occupationMap 
     */
    swapRoom(roomId, typeOfRoom, length, width, listOfPPants, occupationMap) {
        TypeChecker.isInt(roomId);
        TypeChecker.isEnumOf(typeOfRoom, TypeOfRoomClient);
        TypeChecker.isInt(length);
        TypeChecker.isInt(width);
        TypeChecker.isInstanceOf(listOfPPants, Array);

        listOfPPants.forEach(element => {
            TypeChecker.isInstanceOf(element, ParticipantClient);
        });

        TypeChecker.isInstanceOf(occupationMap, Array);

        occupationMap.forEach(element => {
            TypeChecker.isInstanceOfOf(element, Array);
            element.forEach(item, item => {
                TypeChecker.isInt(item);
            });
        });

        this.#roomId = roomId;
        this.#typeOfRoom = typeOfRoom;
        this.#length = length;
        this.#width = width;
        this.#listOfPPants = listOfPPants;
        this.#occupationMap = occupationMap;
        this.buildMapArray();
    }

    buildMapArray() {

        //force minimal room sizes for foyer
        if (this.#typeOfRoom == "FOYER") {
            if (this.#width < 6) {
                this.#width = 5;
            }

            if (this.#length < 8) {
                this.#length = 7;
            }
        }

        var mapLength = this.#width + 2;
        this.#map = new Array(mapLength);
        
        for (var i = 0; i < mapLength; i++) {
            this.#map[i] = new Array(this.#length + 2).fill(1);
        }

        for (var i = 0; i < mapLength; i++) {
            this.#map[i][0] = 0;
            this.#map[mapLength - 1][i] = 0;

            //walls
            if(i < mapLength - 2)
                this.#map[i][1] = 2;
                this.#map[mapLength - 2][i+2] = 3;
        }

        for (var i = 0; i < this.#listOfGameObjects.length; i++) {
            if(this.#listOfGameObjects[i].getName().startsWith("Table")) {
                var positionX = this.#listOfGameObjects[i].getPosition().getCordX();
                var positionY = this.#listOfGameObjects[i].getPosition().getCordY();
                this.#map[positionX + 2][positionY] = 7;
            }
        }

        if (this.#typeOfRoom == "FOYER") {
            this.#map[2][0] = 8;
            this.#map[2][1] = 4;
            this.#map[mapLength - 2][4] = 5;
            this.#map[mapLength - 1][4] = 9;
            this.#map[mapLength - 2][this.#map[0].length - 3] = 6;
            this.#map[mapLength - 1][this.#map[0].length - 3] = 9;      
        }        
    }

    getMap() {
        return this.#map;
    }
}