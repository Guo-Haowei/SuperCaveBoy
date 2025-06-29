function Tile(x, y, type, handler) {

    this.x = x;
    this.y = y;
    this.type = type;
    this.handler = handler;
    this.spr_dirt = this.handler._getGameAssets().spr_dirt;
    this.spr_wall = this.handler._getGameAssets().spr_background;
    
    // Polygon
    
    this._render = function(graphics) {
        var xoffset = this.handler._getCamera()._getxoffset() - WIDTH/2,
        yoffset = this.handler._getCamera()._getyoffset() -HEIGHT/2 - YOFFSET;
        if (this.type === 1) {
            this.spr_dirt.draw(graphics, this.x - xoffset, this.y - yoffset);
        } else {
            this.spr_wall.draw(graphics, this.x - xoffset, this.y - yoffset);
        }
        
        // draw bound
        // graphics.strokeStyle = '#000';
        var x = this.x-xoffset, y = this.y-yoffset;
        // graphics.strokeRect(x, y, 64, 64);
    }
    
    this._renderBound = function(graphics) {
    } 
    
}
