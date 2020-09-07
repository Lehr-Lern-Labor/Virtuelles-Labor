/**
 * The Game Object View Factory
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
class GameObjectViewFactory {
    #tileColumnWidth;
    #tileRowHeight;
    #assetImages;
    #defaultOffset;

    #gameEngine;
    #eventManager;

    /**
     * Creates an instance of GameObjectViewFactory
     * @constructor GameObjectViewFactory
     * 
     * @param {Image[]} assetImages asset images
     * @param {IsometricEngine} gameEngine game engine instance
     * @param {EventManager} eventManager event manager instance
     */
    constructor(assetImages, gameEngine, eventManager) {
        this.#assetImages = assetImages;

        this.#gameEngine = gameEngine;
        this.#eventManager = eventManager;

        //gets map tile size
        this.#tileColumnWidth = this.#gameEngine.getTileColumnWidth();
        this.#tileRowHeight = this.#gameEngine.getTileRowHeight();

        this.#defaultOffset = { x: 0, y: 0 };
    }

    /**
     * Gets click map
     * 
     * @param {Image} image image
     * @param {PositionClient} pos position
     * @param {number} offset offset
     * 
     * @return clickMap
     */
    getClickMap(image, pos, offset) {
        var clickMap = [];
        let screenPosXY = this.#gameEngine.calculateScreenPosXY(pos.getCordX(), pos.getCordY());
        let screenPosWithOffsetX = screenPosXY.x + offset.x;
        let screenPosWithOffsetY = screenPosXY.y + offset.y;

        //This draws on the map canvas because getImageData is buggy when called on avatar canvas.
        //Probably because a reference to the canvas is not released after calling getImageData.
        //There is also an issue on chrome dev site: https://bugs.chromium.org/p/chromium/issues/detail?id=977179
        ctx_map.drawImage(image, screenPosWithOffsetX, screenPosWithOffsetY);
        var imageData = ctx_map.getImageData(screenPosWithOffsetX, screenPosWithOffsetY, image.width, image.height).data;
        ctx_map.clearRect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);

        for (var i = 0, n = imageData.length; i < n; i += 4) {
            var row = Math.floor((i / 4) / image.width);
            var col = (i / 4) - (row * image.width);

            if (!clickMap[row]) clickMap[row] = [];

            clickMap[row][col] = imageData[i + 3] === 0 ? 0 : 1;
        }
        return clickMap;
    }

    /* ##################################################################### */
    /* ###################### GAMEOBJECT CREATION INFORMATIONS ############# */
    /* ##################################################################### */

    /**
     * In order to make an Object not tile clickable but pixel clickable a new object type and class needs to be added to 
     * one of the creation methods and also an if statement to declare on what condition this 
     * new object should be created. Also a click map should be generated with the method getClickMap()
     * and passed to the new clickable Object.
     */

    /**
     * calculates the position of a game map element and creates it.
     * 
     * @param {GameObjectType} gameObjectType game object type
     * @param {PositionClient} pos position
     * @param {String} objectName object name
     * @param {boolean} isClickable true if map element is clickable, otherwise false
     */
    createGameMapElementView(gameObjectType, pos, objectName, isClickable) {
        TypeChecker.isEnumOf(gameObjectType, GameObjectType);
        TypeChecker.isInstanceOf(pos, PositionClient);
        TypeChecker.isString(objectName);
        TypeChecker.isBoolean(isClickable);

        var gameMapElementView;
        var gameMapElementImage;

        switch (gameObjectType) {

            case GameObjectType.TILE:
                gameMapElementImage = this.#assetImages[objectName];

                if (gameMapElementImage !== undefined)
                    gameMapElementView = new GameMapElementView(gameMapElementImage, pos, this.#defaultOffset, objectName);
                else throw new Error("The image for the tile view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;
            case GameObjectType.LEFTSCHEDULE:
            case GameObjectType.LEFTWALL:
                gameMapElementImage = this.#assetImages[objectName];

                var wallOffset = { x: 0, y: this.#tileRowHeight / 2 - gameMapElementImage.width + 1 };

                if (gameMapElementImage !== undefined) {
                    if (gameObjectType === GameObjectType.LEFTSCHEDULE)
                        gameMapElementView = new ScheduleView(gameMapElementImage, pos, wallOffset, objectName, this.getClickMap(gameMapElementImage, pos, wallOffset), this.#eventManager);
                    else
                        gameMapElementView = new GameMapElementView(gameMapElementImage, pos, wallOffset, objectName);
                } else throw new Error("The image for the left wall view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            case GameObjectType.RIGHTWALL:
                gameMapElementImage = this.#assetImages[objectName];

                var wallOffset = { x: -this.#tileColumnWidth, y: this.#tileRowHeight / 2 - gameMapElementImage.width + 1 };

                if (gameMapElementImage !== undefined)
                    gameMapElementView = new GameMapElementView(gameMapElementImage, pos, wallOffset, objectName);
                else throw new Error("The image for the right wall view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            case GameObjectType.LEFTTILE:
                gameMapElementImage = this.#assetImages[objectName];

                pos = new PositionClient(pos.getCordX(), (pos.getCordY() + 1));

                if (gameMapElementImage !== undefined)
                    gameMapElementView = new GameMapElementView(gameMapElementImage, pos, this.#defaultOffset, objectName);
                else throw new Error("The image for the left door tile view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            case GameObjectType.RIGHTTILE:
                gameMapElementImage = this.#assetImages[objectName];

                pos = new PositionClient((pos.getCordX() - 1), pos.getCordY());

                if (gameMapElementImage !== undefined)
                    gameMapElementView = new GameMapElementView(gameMapElementImage, pos, this.#defaultOffset, objectName);
                else throw new Error("The image for the right door tile view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;
            default:
                gameMapElementView = null;
        }

        return gameMapElementView;
    }

    /**
     * calculates the position of a game object and creates it.
     * 
     * @param {GameObjectType} gameObjectType game object type
     * @param {PositionClient} pos position
     * @param {String} objectName object name
     * @param {boolean} isClickable true if object is clickable, otherwise false
     */
    createGameObjectView(gameObjectType, pos, objectName, isClickable) {
        TypeChecker.isEnumOf(gameObjectType, GameObjectType);
        TypeChecker.isInstanceOf(pos, PositionClient);
        TypeChecker.isString(objectName);
        TypeChecker.isBoolean(isClickable);

        var gameObjectView;
        var gameObjectImage;

        switch (gameObjectType) {

            case GameObjectType.SELECTED_TILE:
                gameObjectImage = this.#assetImages[objectName];

                if (gameObjectImage !== undefined)
                    gameObjectView = new GameObjectView(gameObjectImage, pos, this.#defaultOffset, objectName);
                else throw new Error("The image for tile indicator view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            case GameObjectType.TABLE:
                gameObjectImage = this.#assetImages[objectName];

                var tableOffset = { x: 0, y: this.#tileRowHeight - gameObjectImage.height + 7 };

                if (gameObjectImage !== undefined)
                    gameObjectView = new GameObjectView(gameObjectImage, pos, tableOffset, objectName);
                else throw new Error("The image for the table view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;
            case GameObjectType.SMALLDINNERTABLEFOOD:
                gameObjectImage = this.#assetImages[objectName];

                var tableOffset = { x: -4, y: this.#tileRowHeight - gameObjectImage.height + 20 };

                if (gameObjectImage !== undefined)
                    gameObjectView = new GameObjectView(gameObjectImage, pos, tableOffset, objectName);
                else throw new Error("The image for the food view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            case GameObjectType.SMALLDINNERTABLE:
                gameObjectImage = this.#assetImages[objectName];

                var tableOffset = { x: 0, y: this.#tileRowHeight - gameObjectImage.height + 20 };

                if (gameObjectImage !== undefined)
                    gameObjectView = new GameObjectView(gameObjectImage, pos, tableOffset, objectName);
                else throw new Error("The image for the table view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            case GameObjectType.RIGHTTABLE:
                    gameObjectImage = this.#assetImages[objectName];
    
                    var tableOffset = { x: 0, y: this.#tileRowHeight - gameObjectImage.height + 52 };
    
                    if (gameObjectImage !== undefined)
                        gameObjectView = new GameObjectView(gameObjectImage, pos, tableOffset, objectName);
                    else throw new Error("The image for the table view could not be found in the cache for images. Did you reload the images after cache clear?");
    
                    break; 
            
            case GameObjectType.CANTEENCOUNTER:
                gameObjectImage = this.#assetImages[objectName];

                var tableOffset = { x: 0, y: this.#tileRowHeight - gameObjectImage.height + 50 };

                if (gameObjectImage !== undefined)
                    gameObjectView = new GameObjectView(gameObjectImage, pos, tableOffset, objectName);
                else throw new Error("The image for the canteen counter could not be found in the cache for images. Did you reload the images after cache clear?");

                break; 

            case GameObjectType.DRINKS:
                gameObjectImage = this.#assetImages[objectName];

                var tableOffset = { x: 14, y: this.#tileRowHeight - gameObjectImage.height + 12 };

                if (gameObjectImage !== undefined)
                    gameObjectView = new GameObjectView(gameObjectImage, pos, tableOffset, objectName);
                else throw new Error("The image for the drinking machine could not be found in the cache for images. Did you reload the images after cache clear?");

                break; 

            case GameObjectType.CHAIR:
                gameObjectImage = this.#assetImages[objectName];

                var chairOffset = { x: 15, y: this.#tileRowHeight - gameObjectImage.height - 6 };

                if (gameObjectImage !== undefined)
                    gameObjectView = new GameObjectView(gameObjectImage, pos, chairOffset, objectName);
                else throw new Error("The image for the chair view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            case GameObjectType.SOFA:
                gameObjectImage = this.#assetImages[objectName];

                var sofaOffset = { x: 0, y: this.#tileRowHeight - gameObjectImage.height - 4 };

                if (gameObjectImage !== undefined)
                    gameObjectView = new GameObjectView(gameObjectImage, pos, sofaOffset, objectName);
                else throw new Error("The image for the sofa view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            case GameObjectType.PLANT:
                gameObjectImage = this.#assetImages[objectName];

                var plantOffset = { x: -5, y: this.#tileRowHeight - gameObjectImage.height - 10 };
                if (gameObjectImage !== undefined) {

                    if (isClickable) {
                        gameObjectView = new PlantView(gameObjectImage, pos, plantOffset, objectName);
                    } else
                        gameObjectView = new GameObjectView(gameObjectImage, pos, plantOffset, objectName);

                }
                else throw new Error("The image for the plant view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            default:
                gameObjectView = null;
        }

        return gameObjectView;
    }

    /**
     * calculates the position of a door and creates it.
     * 
     * @param {TypeOfDoor} typeOfDoor type of door
     * @param {PositionClient} pos position
     * @param {String} objectName door name
     */
    createDoorView(typeOfDoor, pos, objectName) {
        TypeChecker.isEnumOf(typeOfDoor, TypeOfDoor);
        TypeChecker.isInstanceOf(pos, PositionClient);
        TypeChecker.isString(objectName);

        var doorView;
        var doorImage;

        switch (typeOfDoor) {

            case TypeOfDoor.LECTURE_DOOR:
            case TypeOfDoor.LEFT_DOOR:

                doorImage = this.#assetImages[objectName];

                var leftDoorOffset = { x: 0, y: this.#tileRowHeight / 2 - doorImage.width + 1 };

                if (doorImage !== undefined)
                    doorView = new DoorView(doorImage, pos, typeOfDoor, leftDoorOffset, objectName, this.#eventManager);
                else throw new Error("The image for lefthandside door view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            case TypeOfDoor.RIGHT_DOOR:

                doorImage = this.#assetImages[objectName];

                var rightDoorOffset = { x: -this.#tileColumnWidth, y: this.#tileRowHeight / 2 - doorImage.width + 1 };

                if (doorImage !== undefined)
                    doorView = new DoorView(doorImage, pos, typeOfDoor, rightDoorOffset, objectName, this.#eventManager);
                else throw new Error("The image for righthandside door view could not be found in the cache for images. Did you reload the images after cache clear?");

                break;

            default:
                doorView = null;
        }
        return doorView;
    }

}