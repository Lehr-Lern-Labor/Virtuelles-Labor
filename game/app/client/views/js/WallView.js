class WallView extends GameObjectView {
    #wallImage;
    #position;

    constructor(wallImage, position) {
        super(wallImage, position);
        this.#wallImage = wallImage;
        this.#position = position;
    }

    draw() {
        ctx_map.drawImage(this.#wallImage, this.#position.getCordX(), this.#position.getCordY());
    }

    onclick() {
        //TODO
    }
}