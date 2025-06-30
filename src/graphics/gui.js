function GUI(handler) {
    
    this.handler = handler;
    this.heart = this.handler._getGameAssets().spr_gui_heart;
    this.sapphire = this.handler._getGameAssets().spr_gui_sapphire;
    
    this._tick = function() {
        
    }
    
    this._render = function(graphics) {

        // graphics.fillStyle = "#000";
        // graphics.fillRect(30, 520, 90, 54);
        // graphics.fillRect(840, 520, 90, 54);

        // for (var i = 0; i < heal; ++i) {
        //     this.heart.draw(graphics, 15+74*i, 15);
        // }
        // this.sapphire.draw(graphics, 800, 15);
        // graphics.fillStyle = "#ffffff";
        // graphics.font = "36pt Arial";
        // graphics.fillText('x '+ sapphire, 870, 64);

        // graphics.font = "18pt Arial";
        // graphics.fillText('Restart', 35, 555);
        // graphics.fillText('Skip', 860, 555);
    }
}