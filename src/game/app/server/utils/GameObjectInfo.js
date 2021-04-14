const GameObjectType = require('../../client/shared/GameObjectType.js');
const Settings = require('../utils/Settings.js');

/**
 * Indexed by the contents of the GameObjectType-file,
 * this file makes the information need to generate
 * an object from just its type easily accessible.
 * 
 * Uses the values of the GameObjectType-properties as keys.
 * This needed to be in a separate file, as changing the
 * GameObjectType-file to contain this surplus of information
 * would break several client-side classes, and I can't be bothered
 * to fix them all.
 * 
 * Done as a static class for reasons of privacy. It is just nicer to
 * call a function instead of nested calls of object properties.
 * 
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
class GameObjectInfo {
    /***********************************************************/
    /** When adding the information for a new GameObjectType  **/
    /** file, please stick to the following instructions:     **/
    /**                                                       **/
    /**   (a) Add the  needed information as a  new entry to  **/ 
    /**       #INFORMATION-field. You don't need to stick to  **/
    /**       the categories,  but it helps keeping the file  **/
    /**       more clearly structured.                        **/
    /**                                                       **/
    /**   (b) Add a new property  to the #INFORMATION-field.  **/
    /**       It should be formatted like this:               **/
    /**       [GameObjectType.<property_key>]: {},            **/
    /**                  (key)               (value)          **/
    /**       The brackets [] around the key are mandatory!   **/
    /**       Replace  <property_key>  with the  KEY of the   **/
    /**       property you just added to the GameObjectType.  **/
    /**                                                       **/
    /**   (c) For the value of the just added*/
    /***********************************************************/


    // Necessary information for each to add:
    // - isSolid
    // - size
    // - necessary assetPaths
    //   (these should not be the value, but the key)

    // TODO
    // - add custom-type object
 
    // All the info for each GameObjectType
    static #INFORMATION = Object.freeze({
        // Blank
        [GameObjectType.BLANK]: {
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: '',
        },

        // Tiles
        [GameObjectType.TILE]: {
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "tile_default",
        },
        [GameObjectType.SELECTED_TILE]: {
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "tile_selected",
        },
        [GameObjectType.LEFTTILE]: {
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "tile_default",
        },
        [GameObjectType.RIGHTTILE]: {
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "tile_default",
        },

        // Walls
        [GameObjectType.LEFTWALL]: {
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "leftwall_default",
        },
        [GameObjectType.RIGHTWALL]: {
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "rightwall_default",
        },

        // Wall-like objects
        // Schedule, Windows, Logo, Picture Frames...
        [GameObjectType.LEFTSCHEDULE]: {
            // MULTIPART OBJECT
            isMultiPart: true,
            size: [3, 1],
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: ["leftschedule_default0", "leftschedule_default1", "leftschedule_default2"],
        },
        [GameObjectType.RIGHTWINDOW]: {
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "rightwindow_default0", // TODO object with variations
        },
        [GameObjectType.LEFTWINDOW]: {
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "leftwindow_default0", // TODO object with variations
        },
        [GameObjectType.PICTUREFRAME]: {
            isMultiPart: true,
            size: [1, 3],
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: [["rightwallframe_default0", "rightwallframe_default1", 
            "rightwallframe_default2"]],
        },
        [GameObjectType.CONFERENCELOGO]: {
            // MULTIPART OBJECT
            /* How does this work?
             *   (i) Set flag (isMultiPart = true) 
             *  (ii) Set size-field (this is the size
             *       of the completed object, whereas
             *       width and length give part-size)
             * (iii) assetName needs to be array of
             *       arrays, size[0] * size[1].    */
            isMultiPart: true,
            size: [5, 1],
            isSolid: false,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: ["leftconferencelogo_default0",
                "leftconferencelogo_default1", "leftconferencelogo_default2",
                "leftconferencelogo_default3",
                "leftconferencelogo_default4"],
        },
        
        // Plant 
        [GameObjectType.PLANT]: {
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "plant_default",
        },    

        // Seating
        [GameObjectType.CHAIR]: {
            hasVariation: true,
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: ["leftchair_default", "leftchairback_default", "rightchair_default", "rightchairback_default",],
        },
        [GameObjectType.SOFA]: {
            hasVariation: true,
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: ["leftsofa_default", "rightsofa_default"],
        },

        // Tables
        [GameObjectType.TABLE]: {
            // NOT COHERENT WITH ART STYLE
            // DO NOT USE
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "table_default",
        },
        [GameObjectType.RIGHTTABLE]: {
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: 3 * Settings.SMALL_OBJECT_LENGTH,
            assetName: "righttable_default",
        },
        [GameObjectType.SMALLDINNERTABLE]: {
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "smalldinnertable_default",
        },

        // Counters
        [GameObjectType.CANTEENCOUNTER]: {
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: 3 * Settings.SMALL_OBJECT_LENGTH,
            assetName: "canteencounter_default",
        },
        [GameObjectType.RECEPTIONCOUNTER]: {
            // OBJECT WITH ADDITIONAL PARTS
            hasAdditionalParts: true,
            parts: [
                // type, positional offsets, maybe variation
                {type: GameObjectType.RECEPTIONCOUNTERSIDEPART, offset_x: 1, offset_y: 0, variation: 0}, 
                {type: GameObjectType.RECEPTIONCOUNTERSIDEPART, offset_x: 1, offset_y: 6, variation: 1}
            ],
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: 7 * Settings.SMALL_OBJECT_LENGTH,
            assetName: "receptionCounterFrontPart_default",
        },
        [GameObjectType.RECEPTIONCOUNTERSIDEPART]: {
            // OBJECT WITH VARIATIONS
            hasVariation: true,
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: ["receptionCounterLeftPart_default","receptionCounterRightPart_default"],
        },

        // Food & Drinks
        [GameObjectType.DRINKS]: {
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: 2 * Settings.SMALL_OBJECT_LENGTH,
            assetName: "drinks_default",
        },
        [GameObjectType.TEA]: {
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: "tea_default",
        },
        [GameObjectType.SMALLDINNERTABLEFOOD]: {
            // OBJECT WITH VARIATIONS
            hasVariation: true,
            isSolid: true,
            width: Settings.SMALL_OBJECT_WIDTH,
            length: Settings.SMALL_OBJECT_LENGTH,
            assetName: ["koeriWurst_default", "koeriWurst_bothSides", "koeriWurst_upperSide", "koeriWurst_lowerSide"],
        },
    });

    /**
     * Takes a GameObjectType and a <key> as arguments and checks
     * if a property with the name <key> is stored for the passed
     * GameObjectType. If yes, it is returned. If no, throws error.
     * 
     * TypeChecking should be done by whoever calls this method!
     * 
     * @method module:GameObjectInfo#getInfo
     * 
     * @param {String} objectType 
     * @param {String} key 
     * @returns {*} The information saved for the passed GameObjectType
     *              under the passed key (if it exists).
     */
     static getInfo(objectType, key) {
        if (GameObjectInfo.#INFORMATION[objectType].hasOwnProperty(key)) {
            return GameObjectInfo.#INFORMATION[objectType][key];
        } else {
            throw new Error("The passed GameObjectType " + objectType + " does not have the property " + key);
        }
    } 
    
    /**
     * Takes a GameObjectType and a <key> as arguments and checks
     * if a property with the name <key> is stored for the passed
     * GameObjectType. If yes, returns true, if no, returns false.
     * 
     * @method module:GameObjectInfo#hasProperty
     * 
     * @param {String} objectType 
     * @param {String} key
     *  
     * @returns {Boolean} If the object specified by the passed type
     *                    has a property indexed by the passed key
     */
     static hasProperty(objectType, key) {
        return GameObjectInfo.#INFORMATION[objectType].hasOwnProperty(key)
     }
    
}

if (typeof module === 'object' && typeof exports === 'object') {
    module.exports = GameObjectInfo;
}