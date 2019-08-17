function Camera(x, y) {
    // fields
    this.xoffset = x;
    this.yoffset = y;
    this.target = null;
    
    // methods
    this._getxoffset = function() {
        return this.xoffset;
    }
    
    this._getyoffset = function() {
        return this.yoffset;
    }
    
    this._setoffset = function(x, y) {
        this.xoffset = x;
        this.yoffset = y;
    }
    
    this._tick = function() {
        this._followTarget();
    }
    
    this._setTarget = function(obj) {
        this.target = obj;
    }
    
    this._followTarget = function() {
        if (this.target == null) return;
        var objx = this.target.x, objy = this.target.y;
        this.xoffset += (objx - this.xoffset)/20.0;
        this.yoffset += (objy - this.yoffset)/20.0;
        if (this.xoffset <= WIDTH/2) {
            this.xoffset = WIDTH/2;
        } else if (this.xoffset >= WWIDTH - WIDTH/2) {
            this.xoffset = WWIDTH - WIDTH/2;
        }
        if (this.yoffset <= HEIGHT/2+YOFFSET) {
            this.yoffset = HEIGHT/2+YOFFSET;
        } else if (this.yoffset >= WHEIGHT - HEIGHT/2) {
            this.yoffset = WHEIGHT - HEIGHT/2;
        }
    }
}
