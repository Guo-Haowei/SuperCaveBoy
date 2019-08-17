function Handler(game) {
    // fields
    this.game = game;
    
    // methods
    this._getGame = function() {
        return this.game;
    }
    
    this._getGameAssets = function() {
        return this.game.assets;
    }
    
    this._getGameEntities = function() {
        return this.game.entities;
    }
    
    this._getKeyManager = function() {
        return this.game.keyManager;
    }
    
    this._getPlayer = function() {
        return this.game.player;
    }
    
    this._getCamera = function() {
        return this.game.camera;
    }
    
    this._getMusic = function() {
        return this.game.music;
    }
    
    this._getLevel = function() {
        return this.game.level;
    }
    
    this._getObstacles = function() {
        return this.game.level.obstacles;
    }
    
    this._getObjects = function() {
        return this.game.level.objects;
    }
    
    this._getMonsters = function() {
        return this.game.level.monsters;
    }
    
    this._getGUI = function() {
        return this.game.gui;
    }
}
