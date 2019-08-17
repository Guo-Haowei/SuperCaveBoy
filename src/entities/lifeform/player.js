function Player(x, y, speed, handler) {
    
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.handler = handler;
    this.face = DIRECTION.RIGHT;
    
    this.health = 3;
    this.sapphire = 0;
    
    this.hspeed = 0;
    this.vspeed = 0;
    
    this.takingJump = false;
    this.landed = false;
    
    this.jump_animation;
    this.walk_animation = new Array(2);
    
    this.currentState;
    this.currentFrame;
    
    this.grabbing = false;
        
    this.bound = new Rect(16, 10, 32, 60);
    
    this._init = function() {
        this.walk_animation[0] = new Animation(2, handler._getGameAssets().spr_player_walk[0]);
        this.walk_animation[1] = new Animation(2, handler._getGameAssets().spr_player_walk[1]);
        this.jump_animation = handler._getGameAssets().spr_player_jump;
        this.currentFrame = this.jump_animation[1][1];
        this.currentState = this._JumpingState;
    }
    
    this._move = function() {
        if (this.hspeed === 1) this.face = 1;
        else if (this.hspeed === -1) this.face = 0;
        if (this.x <= 50) {
            this.x = 50;
            this.state = ENTITY_STATES.IDLING;
        } else if (this.x >= WWIDTH-110) {
            this.x = WWIDTH-110;
            this.state = ENTITY_STATES.IDLING;
        }
        // check collison with walls
        if (!checkAllCollition(this, this.handler._getObstacles(), hCollison))        this.x += this.hspeed * speed;
        this.grabbing = false;
    }
    
    this._GrabState = function() {
        this.currentFrame = this.handler._getGameAssets().spr_player_grab[this.face];
    }
    
    this._IdlingState = function() {
        this.currentFrame = this.handler._getGameAssets().spr_player_idle[this.face];
        if (this.hspeed !== 0) this.currentState = this._MovingState;
    }
    
    this._MovingState = function() {
        if (this.hspeed === 0) {
            this.currentState == this._IdlingState;
            this.currentFrame = this.handler._getGameAssets().spr_player_idle[this.face];
            return;
        }
        this._move();
        this.currentFrame = this.walk_animation[this.face]._getFrame();
        this.walk_animation[this.face]._tick();
    }
    
    this._JumpingState = function() {
        this.currentFrame = this.jump_animation[this.face][this.vspeed<0?0:1];
        if (this.hspeed !== 0) this._move();
    }
    
    this._tick = function() {
        // hspeed
        this.hspeed = this.handler._getKeyManager().rightKey - this.handler._getKeyManager().leftKey;
        // vspeed
        if (this.handler._getKeyManager().upKey>0 && ((this.takingJump && this.vspeed === 1.5) || this.grabbing)) {
            if (!this.grabbing) {
                this.vspeed = JUMPFORCE;
            } else {
                this.vspeed = -20;
            }
            this.currentState = this._JumpingState;
            this.takingJump = false;
            this.grabbing = false;
        }
        // check grabbing state
        if (checkAllCollition(this, this.handler._getObstacles(), grabbingCollision)) {
            this.grabbing = true;
        }
        
        // vertical
        if (this.grabbing) {
            this.currentState = this._GrabState;
        } else {
            if (checkAllCollition(this, this.handler._getObstacles(), downCollision)) {
            } else {
                this.y += this.vspeed;
                this.vspeed += GRAVITY;
            }
            checkAllCollition(this, this.handler._getObstacles(), upCollision);
        }
        // tick state
        this.currentState();
        // tick handler
        this.handler._getKeyManager()._tick();
    }
    
    this._land = function() {
        if (this.vspeed === 0) return;
        this.takingJump = true;
        this.currentState = this._IdlingState;
        this.handler._getMusic().snd_step.play();
        this.vspeed = 0;
    }
    
    this._render = function(graphics) {
        var xoffset = this.handler._getCamera()._getxoffset() - WIDTH/2,
            yoffset = this.handler._getCamera()._getyoffset() -HEIGHT/2 - YOFFSET;
        this.currentFrame.draw(graphics, this.x - xoffset, this.y - yoffset);
    }
    
    this._setState = function(state) {
        this.currentState = state;
    }
    
    this._setPos = function(x, y) {
        this.x = x;
        this.y = y;
    }
}

//Player.prototype = new GameObject(x, y, handler, rect, sprite);