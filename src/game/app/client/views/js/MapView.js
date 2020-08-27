/**
 * The Map View
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
class MapView extends Views {
    #map;
    #objectMap;
    #clickableTiles;
    #clickableObjects;
    #tiles;
    #gameObjects;
    #xNumTiles;
    #yNumTiles;
    #selectedTile;

    #gameObjectViewFactory;
    #gameEngine;
    #eventManager;

    selectionOnMap = false;

    /**
     * @constructor Creates an instance of MapView
     * 
     * @param {Object[]} assetPaths asset paths
     * @param {number[][]} map map array
     * @param {number[][]} objectMap object map array
     * @param {IsometricEngine} gameEngine game engine
     * @param {eventManager} eventManager event manager
     */
    constructor(assetPaths, map, objectMap, gameEngine, eventManager) {
        super();

        this.#map = map;
        this.#objectMap = objectMap;

        //map components that are drawn on screen
        this.#tiles = [];

        //map gameObjects that are drawn on screen
        this.#gameObjects = [];

        //map components that can be clicked
        this.#clickableTiles = [];
        this.#clickableObjects = [];

        this.#gameEngine = gameEngine;
        this.#eventManager = eventManager;

        this.#initProperties(assetPaths);
    }

    /**
     * Gets map array
     * 
     * @return map
     */
    getMap() {
        return this.#map;
    }

    /**
     * Gets object map array
     * 
     * @return objectMap
     */
    getObjectMap() {
        return this.#objectMap;
    }

    /**
     * Gets tiles
     * 
     * @return tiles
     */
    getTiles() {
        return this.#tiles;
    }

    /**
     * Gets selected tile
     * 
     * @return selectedTile
     */
    getSelectedTile() {
        return this.#selectedTile;
    }

    /**
     * Gets game objects
     * 
     * @return gameObjects
     */
    getGameObjects() {
        return this.#gameObjects;
    }

    /**
     * @private initializes properties and build map
     * @param {Object[]} assetPaths asset paths
     */
    #initProperties = async (assetPaths) => {
        this.#xNumTiles = this.#map.length;
        this.#yNumTiles = this.#map[0].length;

        assetPaths.tileselected_default = "client/assets/tiles/tile_selected.png";
        var assetImages = await this.#gameEngine.initGameEngine(assetPaths, this.#xNumTiles, this.#yNumTiles);

        this.#gameObjectViewFactory = new GameObjectViewFactory(assetImages, this.#gameEngine, this.#eventManager);

        this.#buildMap();
    }

    /**
     * @private Creates a map of gameObjects to draw on screen.
     */
    #buildMap = function() {

        this.#selectedTile = this.#gameObjectViewFactory.createGameObjectView(GameObjectType.SELECTED_TILE, new PositionClient(0, 2), "tileselected_default", false);

        for (var row = (this.#xNumTiles - 1); row >= 0; row--) {
            for (var col = 0; col < this.#yNumTiles; col++) {

                var position = new PositionClient(row, col);

                var mapObject = this.#map[row][col];
                if (mapObject !== null) {

                    if (mapObject instanceof Array) {
                        mapObject.forEach(object => {
                            this.#createMapElementView(object, position);
                        });
                    } else {
                        this.#createMapElementView(mapObject, position);
                    }
                }

                var gameObject = this.#objectMap[row][col];
                if (gameObject !== null) {
                    if (gameObject instanceof Array) {
                        gameObject.forEach(object => {
                            this.#createObjectView(object, position);
                        });
                    }
                    this.#createObjectView(gameObject, position);
                }
            };
        };

        this.#updateMapElements();
        this.#update();
        this.#drawMapElements();
    }

    /**
     * @private creates map elements that build the map terrain.
     * 
     * @param {number} mapObject map object
     * @param {PositionClient} position map element position
     */
    #createMapElementView = function(mapObject, position) {
        var tileType;
        var tile;

        if (mapObject instanceof DoorClient) {
            tileType = mapObject.getTypeOfDoor();
            tile = this.#gameObjectViewFactory.createDoorView(tileType, position, mapObject.getName());
        } else {
            tileType = mapObject.getGameObjectType();
            tile = this.#gameObjectViewFactory.createGameMapElementView(tileType, position, mapObject.getName(), mapObject.isClickable());
        }

        if (tile != null) {
            this.#tiles.push(tile);

            if (mapObject instanceof DoorClient || mapObject.isClickable())
                this.#clickableTiles.push(tile);

        }
    }

    /**
     * @private creates game objects that are shown on the screen.
     * 
     * @param {number} gameObject game object
     * @param {PositionClient} position game object position
     */
    #createObjectView = function(gameObject, position) {
        var objectType = gameObject.getGameObjectType();
        var object = this.#gameObjectViewFactory.createGameObjectView(objectType, position, gameObject.getName(), gameObject.isClickable());

        if (object != null) {
            this.#gameObjects.push(object);

            if (gameObject.isClickable())
                this.#clickableObjects.push(object);
        }
    }

    /**
     * finds the tile in the list of clickable tiles
     * 
     * @param {Object} selectedTileCords selected tile coordinates
     * @param {boolean} isClicked true if tile is clicked
     * @param {Canvas} canvas canvas
     */
    findClickableTileOrObject(selectedTileCords, isClicked, canvas) {
        let tile = this.#map[selectedTileCords.x][selectedTileCords.y];
        let object = this.#objectMap[selectedTileCords.x][selectedTileCords.y];

        if (tile instanceof Array) {
            tile.forEach(tile => {
                this.#findTile(tile, isClicked, canvas);
            });
        } else
            this.#findTile(tile, isClicked, canvas);

        if (object instanceof Array) {
            object.forEach(obj => {
                this.#findObject(obj, isClicked, canvas);
            });
        } else
            this.#findObject(object, isClicked, canvas);
    }

    /**
     * @private determines if the tile is clickable and change cursor/clicks it in that case.
     * 
     * @param {number} tile selected tile
     * @param {boolean} isClicked true if tile is clicked
     * @param {Canvas} canvas canvas
     */
    #findTile = function(tile, isClicked, canvas) {
        if (tile !== null && (tile instanceof DoorClient || tile.isClickable())) {
            this.#clickableTiles.forEach(viewObject => {
                let tileName = tile.getName();
                let viewObjectName = viewObject.getName();

                if (tile instanceof DoorClient && tileName === viewObjectName) {
                    if (isClicked)
                        viewObject.onclick(tile.getTargetRoomId());
                    else
                        canvas.style.cursor = 'pointer';
                }
                else if (tile instanceof GameObjectClient && tileName === viewObjectName) {
                    if (isClicked)
                        viewObject.onclick();
                    else
                        canvas.style.cursor = 'pointer';
                }
            });
        } else
            canvas.style.cursor = 'default';
    }

    /**
     * @private determines if the object is clickable and change cursor/clicks it in that case.
     * 
     * @param {number} object selected object
     * @param {boolean} isClicked true if tile is clicked
     * @param {Canvas} canvas canvas
     */
    #findObject = function(object, isClicked, canvas) {
        if (object !== null && object.isClickable()) {
            this.#clickableObjects.forEach(viewObject => {
                let objectName = object.getName();
                let viewObjectName = viewObject.getName();

                if (object instanceof GameObjectClient && objectName === viewObjectName) {
                    if (isClicked)
                        viewObject.onclick();
                    else
                        canvas.style.cursor = 'pointer';
                }
            });
        }
    }

    /**
     * finds the clicked element in the list of clickable tiles
     * 
     * @param {Object} canvasMousePos mouse position
     */
    findClickedElementOutsideMap(canvasMousePos) {
        this.#clickableTiles.forEach(elem => {
            let screenPos = elem.getScreenPosition();
            let screenPosOffset = elem.getScreenPositionOffset();
            let image = elem.getObjectImage();

            //determines if mouse position on canvas is inside the asset image.
            if (!(elem instanceof DoorView) && canvasMousePos.x > screenPos.getCordX() + screenPosOffset.x
                && canvasMousePos.x < screenPos.getCordX() + screenPosOffset.x + image.width
                && canvasMousePos.y > screenPos.getCordY() + screenPosOffset.y
                && canvasMousePos.y < screenPos.getCordY() + screenPosOffset.y + image.height) {
            }
        });
    }

    /**
     * Checks if the mouse cursor is in bounds of the game map.
     * 
     * @param {number} cordX x coordinate
     * @param {number} cordY y coordinate
     */
    isCursorOnPlayGround(cordX, cordY) {
        if (cordX >= 0 && cordY >= 2 && cordX < (this.#xNumTiles - 2) && cordY < this.#yNumTiles) {
            let mapObject = this.#map[cordX][cordY];
            let result = true;

            //Room walls
            if (mapObject instanceof Array) {

                for (let i = 0, n = mapObject.length; i < n; i++) {

                    if (mapObject[i] === null || mapObject[i].getGameObjectType() === GameObjectType.LEFTWALL ||
                        mapObject[i].getGameObjectType() === GameObjectType.RIGHTWALL || mapObject[i].getGameObjectType() === GameObjectType.BLANK) {
                        result = false;
                        break;
                    }

                };
            } else if (mapObject instanceof DoorClient || mapObject !== null && mapObject.getGameObjectType() !== GameObjectType.LEFTWALL &&
                mapObject.getGameObjectType() !== GameObjectType.RIGHTWALL && mapObject.getGameObjectType() !== GameObjectType.BLANK) {
            } else
                result = false;

            return result;
        }

    }

    /**
     * Checks if the mouse cursor is out of the bounds of the game map.
     * 
     * @param {number} cordX x coordinate
     * @param {number} cordY y coordinate
     */
    isCursorOutsidePlayGround(cordX, cordY) {
        if ((cordY >= -1 && cordX <= this.#xNumTiles && ((cordY <= 2 && cordX >= 0) || (cordY < this.#yNumTiles && cordX >= (this.#xNumTiles - 3)))))
            return true;
        else
            return false;
    }

    /**
     * Updates selected tile
     * 
     * @param {Object} selectedTileCords selected tile coordinates
     */
    updateSelectedTile(selectedTileCords) {

        //selectedTileCords not loaded yet
        if (!selectedTileCords) {
            return;
        }

        //Calculate new screen Position of tile indicator.
        let screenXY = this.#gameEngine.calculateScreenPosXY(selectedTileCords.x, selectedTileCords.y);

        let position = new PositionClient(screenXY.x, screenXY.y);

        if (this.#selectedTile !== undefined)
            this.#selectedTile.updateScreenPos(position);
    }

    /**
     * @private update map elements
     */
    #updateMapElements = function() {
        if (this.#tiles.length !== 0) {
            this.#tiles.forEach(object => {
                let gridPos = object.getGridPosition();

                //calculates the screen position where to draw the game object
                let screenPosXY = this.#gameEngine.calculateScreenPosXY(gridPos.getCordX(), gridPos.getCordY());
                let screenPos = new PositionClient(screenPosXY.x, screenPosXY.y);

                object.updateScreenPos(screenPos);
            })
        }
    }

    /**
     * @private updates game object
     */
    #update = function() {
        if (this.#gameObjects.length !== 0) {
            this.#gameObjects.forEach(object => {
                let gridPos = object.getGridPosition();

                //calculates the screen position where to draw the game object
                let screenPosXY = this.#gameEngine.calculateScreenPosXY(gridPos.getCordX(), gridPos.getCordY());
                let screenPos = new PositionClient(screenPosXY.x, screenPosXY.y);

                object.updateScreenPos(screenPos);
            })
        }
    }

    /**
     * @private draws map elements
     */
    #drawMapElements = function() {
        if (this.#tiles.length !== 0) {
            this.#tiles.forEach(object => object.draw());
        }
    }
}