const Direction = require('../../client/shared/Direction');
const ShirtColor = require('../../client/shared/ShirtColor.js');

/**
 * other constants
 * @module Settings
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
module.exports = Object.freeze({

    /* Start-Position Constants */
    RECEPTION_ID: 0,
    LOUNGE_ID: 1, 
    WORKSHOP_1_ID:2,
    WORKSHOP_2_ID:3,
    BEISPIEL_ID: 4,
    STARTROOM_ID: 0,
    STARTPOSITION_X: 3,
    STARTPOSITION_Y: 12,
    STARTDIRECTION: Direction.UPLEFT,
    TYPE_OF_STARTROOM: 'CUSTOM',

    /* Chat Constants */
    MAXNUMMESSAGES_LECTURECHAT: 100,
    MAXNUMMESSAGES_ALLCHAT: 100,
    MAXNUMMESSAGES_GROUPCHAT: 100,
    MAXNUMMESSAGES_ONETOONECHAT: 100,
    MAXGROUPPARTICIPANTS: 255,

    /* Ranklist Constants */
    MAXNUMRANKLIST: 21,

    /* Object Constants */
    SMALL_OBJECT_WIDTH: 1,
    SMALL_OBJECT_LENGTH: 1,

    /* Conference Constants */
    CONFERENCE_ID: 'LLL',

    /* Meeting Constants */
    CONFERENCE_MEETINGNAME: 'Conference Meeting',
    DEFAULT_MEETINGDOMAIN: '//talk.lehr-lern-labor.info/',

    /* Lecture Constants */
    SHOWLECTURE: 10 * 60 * 1000, //lecture is shown 10 minutes before lecture start 
    TOKENCOUNTERSTART: 5 * 60 * 1000,

    /* Moderator-Settings */
    CMDSTARTCHAR: "\\", // moved the actual commands into a separate file for easier handling,

    /* Movement-Speed Constants */
    MOVEMENTSPEED_X: 1,
    MOVEMENTSPEED_Y: 1,

    /* Shirt Color Default Settings */
    DEFAULT_SHIRTCOLOR_PPANT: ShirtColor.BLUE,
    DEFAULT_SHIRTCOLOR_NPC: ShirtColor.RED,

    /* Decides wheter video storage is needed or not */
    VIDEOSTORAGE_ACTIVATED: false,

    /* Decides wheter chat meeting is allowed or not */
    CHATMEETING_ACIVATED: false
});