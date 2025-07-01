function Handler(game) {
    // fields
    this.game = game;

    // methods
    this._getGame = function() {
        return this.game;
    }

    this._getMusic = function() {
        return this.game.music;
    }

    this._getLevel = function() {
        return this.game.room;
    }

    this._getObjects = function() {
        return this.game.room.objects;
    }

}
