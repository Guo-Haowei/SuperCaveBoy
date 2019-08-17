function GameState(handler) {
    // fields
    
    this.x = 0;
    this.y = 0;
    this.handler = handler;
    this.room = [];
    this.currentRoom = 0;
    
    // Polygon
    
    // methods
    this._tick = function() {
        this.handler._getCamera()._tick();
        this.handler._getPlayer()._tick();
        this.handler._getLevel()._tick();
    }


    this._render = function(graphics) {

        this.handler._getLevel()._render(graphics);
        this.handler._getPlayer()._render(graphics);
        this.handler._getGUI()._render(graphics);
        
    }
}
