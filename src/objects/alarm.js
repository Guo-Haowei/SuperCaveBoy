function Alarm(handler) {
    
    this.handler = handler;
    this.count = 0;
    this.frames;
    this.activated = false;
    this.script;
    
    this._tick = function() {
        if (this.activated) {
            if (this.count < this.frames) {
                ++this.count;
            } else {
                this.count = 0;
                this.activated = false;
                if (this.script) this.script();
            }
        }
    }
    
    this._init = function(frames) {
        this.frames = frames;
        this.activated = true;
        this.count = 0;
    }
    
    this._setScript = function(script) {
        this.script = script;
    }
    
    this._enterNewRoom = function() {
        var level = this.handler._getLevel();
        //if (level.level >= levelNum-1) return;
        
        // reset player pos
        var player = this.handler._getPlayer();
        
        player.alpha = 1;
        player._setPos(SpawningX, SpawningY);
        player._setState(player._JumpingState);
        
        // reset camara pos
        this.handler._getCamera()._setoffset(480, SpawningY);
        // update floor
        if (WORLD.levelNum-1>level.level) {
            level._init();
        } else {
            this.handler._getGame().end = Date.now();
            this.handler._getGame()._setState(GAMESTATES.END);   
        }
    }
    
    this._quitDamangePlayer = function() {
        var player = this.handler._getPlayer();
        player._setState(player._MovingState);
        --player.health;
    }
}
