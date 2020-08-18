/*const AvatarView = require("./AvatarView.js");
var TypeChecker = require('../../../utils/TypeChecker.js')


module.exports = */

const AVATAR_WIDTH = 64;
const AVATAR_HEIGHT = 128;

//Needed for calculating because avatar asset gets shrinked when drawn. 
const AVATAR_SCALE_WIDTH = 1.5;
const AVATAR_SCALE_HEIGHT = 0.3125;

class ParticipantAvatarView extends AvatarView {

    #participantId;
    #spriteSheet = new SpriteSheet('client/assets/avatar/CharacterSpriteSheetBody.png', AVATAR_WIDTH, AVATAR_HEIGHT);
    #topClothing = new SpriteSheet('client/assets/avatar/TopClothingBlueShirtSpriteSheet.png', AVATAR_WIDTH, AVATAR_HEIGHT);
    #bottomClothing = new SpriteSheet('client/assets/avatar/BottomBlackTrousersSpriteSheet.png', AVATAR_WIDTH, AVATAR_HEIGHT);
    #shoes = new SpriteSheet('client/assets/avatar/ShoesBlackSpriteSheet.png', AVATAR_WIDTH, AVATAR_HEIGHT);
    #walkingDownRightAnimation;
    #walkingUpRightAnimation;
    #walkingDownLeftAnimation;
    #walkingUpLeftAnimation;
    #standingUpLeftAnimation;
    #standingUpRightAnimation;
    #standingDownLeftAnimation;
    #standingDownRightAnimation;
    #currentAnimation;
    #walking = false;
    #isVisible;
    #username;
    #typeOfRoom;

    #gameEngine;

    constructor(position, direction, participantId, typeOfRoom, username, isVisible) {
        super(position, direction);
        TypeChecker.isString(participantId);
        this.#participantId = participantId;
        this.#walkingDownRightAnimation = new SpriteAnimation(this.#spriteSheet, this.#topClothing, this.#bottomClothing, this.#shoes, 3, 1, 4);
        this.#walkingUpRightAnimation = new SpriteAnimation(this.#spriteSheet, this.#topClothing, this.#bottomClothing, this.#shoes, 3, 11, 14);
        this.#walkingDownLeftAnimation = new SpriteAnimation(this.#spriteSheet, this.#topClothing, this.#bottomClothing, this.#shoes, 3, 6, 9);
        this.#walkingUpLeftAnimation = new SpriteAnimation(this.#spriteSheet, this.#topClothing, this.#bottomClothing, this.#shoes, 3, 16, 19);
        this.#standingUpLeftAnimation = new SpriteAnimation(this.#spriteSheet, this.#topClothing, this.#bottomClothing, this.#shoes, 15, 15, 15);
        this.#standingUpRightAnimation = new SpriteAnimation(this.#spriteSheet, this.#topClothing, this.#bottomClothing, this.#shoes, 15, 10, 10);
        this.#standingDownLeftAnimation = new SpriteAnimation(this.#spriteSheet, this.#topClothing, this.#bottomClothing, this.#shoes, 15, 5, 5);
        this.#standingDownRightAnimation = new SpriteAnimation(this.#spriteSheet, this.#topClothing, this.#bottomClothing, this.#shoes, 15, 0, 0);
        this.#currentAnimation = this.#standingDownRightAnimation;
        this.#typeOfRoom = typeOfRoom;
        this.#username = username;
        this.#isVisible = isVisible;

        this.#gameEngine = new IsometricEngine();
    }

    // changed the name here for test-purposes
    // otherwise the whole "finding the index"-routine in the GameView will not work
    getId() {
        return this.#participantId;
    }

    //Is called after server sends participantId
    setId(participantId) {
        this.#participantId = participantId;
    }

    //Is called after room switch
    setTypeOfRoom(typeOfRoom) {
        this.#typeOfRoom = typeOfRoom;
    }

    getVisibility() {
        return this.#isVisible;
    }

    setVisibility(visible) {
        this.#isVisible = visible;
    }

    update() {
        this.#currentAnimation.update();
    }

    updateCurrentAnimation() {
        var direction = super.getDirection();
        var currPos = super.getGridPosition();
        if (this.#walking === true) {
            if (direction === 'UPLEFT') {
                this.#currentAnimation = this.#walkingUpLeftAnimation;
            } else if (direction === 'UPRIGHT') {
                this.#currentAnimation = this.#walkingUpRightAnimation;
            } else if (direction === 'DOWNLEFT') {
                this.#currentAnimation = this.#walkingDownLeftAnimation;
            } else if (direction === 'DOWNRIGHT') {
                this.#currentAnimation = this.#walkingDownRightAnimation;
            }


        } else {
            if (direction === 'UPLEFT') {
                this.#currentAnimation = this.#standingUpLeftAnimation;
            } else if (direction === 'UPRIGHT') {
                this.#currentAnimation = this.#standingUpRightAnimation;
            } else if (direction === 'DOWNLEFT') {
                this.#currentAnimation = this.#standingDownLeftAnimation;
            } else if (direction === 'DOWNRIGHT') {
                this.#currentAnimation = this.#standingDownRightAnimation;
            }
        }
    }

    //only there for testing, TODO: remove
    getGridPosition() {
        return super.getGridPosition();
    }

    updateWalking(isMoving) {
        this.#walking = isMoving;
    }

    draw() {
        if (this.#isVisible) {

            let cordX = super.getGridPosition().getCordX();
            let cordY = super.getGridPosition().getCordY();
            this.updateCurrentAnimation();
            
            var screenX = this.#gameEngine.calculateScreenPosX(cordX, cordY) + AVATAR_SCALE_WIDTH * AVATAR_WIDTH;
            var screenY = this.#gameEngine.calculateScreenPosY(cordX, cordY) - AVATAR_SCALE_HEIGHT * AVATAR_HEIGHT;
            
            ctx_avatar.font = "1em sans-serif";
            ctx_avatar.textBaseline = 'top';
            ctx_avatar.fillStyle = "antiquewhite";
            ctx_avatar.textAlign = "center";
            ctx_avatar.fillRect(screenX - AVATAR_WIDTH / 4, screenY - 1, AVATAR_WIDTH * 1.5, parseInt(ctx_avatar.font, 10));

            ctx_avatar.fillStyle = "black";
            ctx_avatar.fillText(this.#username, screenX + AVATAR_WIDTH / 2, screenY);

            this.#currentAnimation.draw(screenX, screenY); //TODO pass position of avatar
        }
    }

    onClick(/*mousePos*/) {

        /*
        //Needed for calculating the correct position of 
        //sprite animation in the spritesheet body click map.
        var clickMapOffsetX;
        var clickMapOffsetY;

        //Getting the row and column at which the animation frame was taken of the body sprite sheet.
        //Calc the actual offset of animation frame.
        clickMapOffsetX = this.#currentAnimation.getCol() * AVATAR_WIDTH;
        clickMapOffsetY = this.#currentAnimation.getRow() * AVATAR_HEIGHT;

        var clickImgCordX = Math.abs( this.#screenX - Math.round(mousePos.x) ) + clickMapOffsetX;
        var clickImgCordY = Math.abs( this.#screenY - Math.round(mousePos.y) ) + clickMapOffsetY;

        console.log("image x pos: " + clickImgCordX + "image y pos: " + clickImgCordY);
        
        if ( SpriteSheetBodyClickMap.clickMap[clickImgCordY][clickImgCordX] === 1 ) {
            //alert("image x pos: " + clickImgCordX + "image y pos: " + clickImgCordY);
            */
        if (this.#isVisible) {

            $('#businessCardModal').modal('toggle');
            let eventManager = new EventManager();
            eventManager.handleAvatarClick(this.#participantId);
        }
        //}
    }
}
