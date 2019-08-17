function MenuState(handler) {
    // fields

    this.handler = handler;
    
    // methods
    this._tick = function() {
        this.handler._getKeyManager()._tick();
        if (this.handler._getKeyManager().spaceKey === BOOL.TRUE) {
            this.handler._getGame()._setState(GAMESTATES.RUNNING);
            this.handler._getGame().start = Date.now();
        }
    }
    
    this._drawText = function(graphics) {
        graphics.fillStyle = "#ffffff";
        graphics.font = "36pt Arial";
        graphics.fillText("Press [space] to start", 250, 480);
        graphics.font = "64pt Arial";
        graphics.fillText("Super Cave Boy", 190, 250);
    }
    
    this._render = function(graphics) {
        this.handler._getGameAssets().bg_menu.draw(graphics, 0, HEIGHT/2-270);
        this._drawText(graphics);
    }
}
