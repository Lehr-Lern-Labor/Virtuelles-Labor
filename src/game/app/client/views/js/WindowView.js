/**
 * The Window View
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
class WindowView extends Views {

    /**
     * abstract WindowView class
     * @abstract @constructor WindowView
     */
    constructor() {
        super();

        if (new.target === WindowView) {
            throw new Error("Cannot construct abstract WindowView instances directly");
        }
    }

    /**
     * @abstract abstract draw method
     */
    draw() {
        throw new Error('draw() has to be implemented!');
    }
}