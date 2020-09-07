/**
 * The Plant Object View
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
class PlantView extends GameObjectView {
    #story = ['Hey I\'m a beautiful plant. Don\'t touch me!',
              'Seriously, DON\'T TOUCH ME!!'];

    /**
     * Creates an instance of PlantView
     * @constructor PlantView
     * 
     * @param {Image} objectImage plant image
     * @param {PositionClient} gridPosition plant position
     * @param {number} screenPositionOffset platn screen position offset
     * @param {String} name plant name
     */
    constructor(objectImage, gridPosition, screenPositionOffset, name) {
        super(objectImage, gridPosition, screenPositionOffset, name);
    }

    /**
     * Called if participant clicks the plant
     */
    onclick() {
        new NPCStoryView().draw("Beautiful Plant", this.#story);
    }
}