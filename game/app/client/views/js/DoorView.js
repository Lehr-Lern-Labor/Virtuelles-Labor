if (typeof module === 'object' && typeof exports === 'object') {
    GameObjectView = require('./GameObjectView');
    EventManager = require('../../utils/EventManager')
}

class DoorView extends GameObjectView {
    #doorImage;
    #position;
    #DOORTYPE;

    constructor(doorImage, position, doorType) {
        super(doorImage, position);
        this.#doorImage = doorImage;
        this.#position = position;
        this.#DOORTYPE = doorType;
    }

    getDoorType() {
        return this.#DOORTYPE;
    }

    draw() {
        ctx_map.drawImage(this.#doorImage, this.#position.getCordX(), this.#position.getCordY());
    }

    onclick() {
        
        if (this.#DOORTYPE === GameObjectTypeClient.LECTUREDOOR) {
            eventManager.handleLectureDoorClick();
        }
        else if (this.#DOORTYPE === GameObjectTypeClient.FOODCOURTDOOR) {
            eventManager.handleFoodCourtDoorClick();
        }
        else if (this.#DOORTYPE === GameObjectTypeClient.RECEPTIONDOOR) {
            eventManager.handleReceptionDoorClick();
        }
        else if(this.#DOORTYPE === GameObjectTypeClient.FOYERDOOR) {
            eventManager.handleFoyerDoorClick();
        }
    }
}

if (typeof module === 'object' && typeof exports === 'object') {
    module.exports = DoorView;
}