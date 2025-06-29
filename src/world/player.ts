import { Rect } from '../math';

export class Player {
    x: number;
    y: number;
    speed: number;
    handler: any;
    face: number;
    health = 3;
    sapphire = 0;
    hspeed = 0;
    vspeed = 0;
    takingJump = false;
    landed = false;

    constructor(x, y, speed, handler) {
        this.x = x;
        this.y = y;
        this.speed = speed;

        this.handler = handler;
        this.face = DIRECTION.RIGHT;

        this.jump_animation;
        this.walk_animation;

        this.currentState;
        this.currentFrame;

        this.grabbing = false;
        this.hurt = false;

        this.bound = new Rect(16, 10, 32, 62);

        this.alpha = 1;

        this.pausing = false;

        this.alarm0 = new Alarm(this.handler);

        this.alarm1 = new Alarm(this.handler);
        this.walk_animation = new OldAnimation(2, handler._getGameAssets().spr_player_walk);
        this.jump_animation = handler._getGameAssets().spr_player_jump;
        this.currentFrame = this.jump_animation[1];
        this.currentState = this._JumpingState;
    }

    _move() {
        if (this.hspeed === 1) this.face = 1;
        else if (this.hspeed === -1) this.face = 0;
        if (this.x <= 60) {
            this.x = 60;
            this.state = ENTITY_STATES.IDLING;
        } else if (this.x >= WWIDTH-125) {
            this.x = WWIDTH-125;
            this.state = ENTITY_STATES.IDLING;
        }
        // check collision with walls
        if (!checkAllCollision(this, this.handler._getObstacles(), hCollision)) {
            this.x += this.hspeed * this.speed;
        }
        this.grabbing = false;
    }

    _damageTrigger(x) {
        this.grabbing = false;
        this.alarm1._init(20);
        this.alarm1._setScript(this.alarm1._quitDamangePlayer);
        this._setState(this._DamagedState);
        this.vspeed = -15;
        if (this.x > x) {
            this.hspeed = 1;
        } else {
            this.hspeed = -1;
        }
        this.handler._getMusic().snd_ouch.play();
    }

    _DamagedState() {
        // damaged state
        this.hurt = true;
        this._move();
        this.currentFrame = this.handler._getGameAssets().spr_player_damage;
    }

    _GrabState = function() {
        // grab state
        this.currentFrame = this.handler._getGameAssets().spr_player_grab;
    }

    _IdlingState = function() {
        // idling state
        this.currentFrame = this.handler._getGameAssets().spr_player_idle;
        if (this.hspeed !== 0) this.currentState = this._MovingState;
    }

    _MovingState = function() {
        // moving state
        if (this.hspeed === 0) {
            this.currentState == this._IdlingState;
            this.currentFrame = this.handler._getGameAssets().spr_player_idle;
            return;
        }
        this._move();
        this.currentFrame = this.walk_animation._getFrame();
        this.walk_animation._tick();
    }

    _JumpingState = function() {
        // jumping state
        this.currentFrame = this.jump_animation[this.vspeed<0?0:1];
        if (this.hspeed !== 0) this._move();
    }

    _revive = function() {
        this.alarm0.activated = false;
        this.alarm1.activated = false;
        this.hspeed = 0;
        this.vspeed = 0;
        this.face = DIRECTION.RIGHT;
        this.takingJump = false;
        this.grabbing = false;
        this.health = 3;
        this.sapphire = 0;
        this._setPos(SpawningX, SpawningY);
        this._setState(this._JumpingState);
        // reset camara pos
        this.handler._getCamera()._setoffset(480, SpawningY);
        this.handler._getLevel()._init(true);
    }

    _tick() {
        this.hurt = false;
        if (this.pausing) {return;}
        if (this.health <= 0) {this._revive();}
        if (this.alarm0.activated) {
            this.alarm0._tick();
            if (this.alarm0.activated && this.alpha >= 0.1) this.alpha -= 0.1;
            return;
        }

        // hspeed
        if (!this.alarm1.activated  && this.currentState != this._DamagedState)this.hspeed = this.handler._getKeyManager().rightKey - this.handler._getKeyManager().leftKey;
        // vspeed
        if (this.handler._getKeyManager().upKey>0 && !this.alarm1.activated && this.currentState != this._DamagedState && ((this.takingJump && this.vspeed === 1.5) || this.grabbing)) {
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
        if (checkAllCollision(this, this.handler._getObstacles(), grabbingCollision)) {
            this.grabbing = true;
        }

        if (this.alarm1.activated) {
            this.alarm1._tick();
        }
        // vertical
        if (this.grabbing && !this.hurt) {
            this.currentState = this._GrabState;
        } else {
            if (checkAllCollision(this, this.handler._getObstacles(), downCollision)) {
            } else {
                this.y += this.vspeed;
                this.vspeed += GRAVITY;
            }
            checkAllCollision(this, this.handler._getObstacles(), upCollision);
        }
        // tick state
        this.currentState();
        // tick handler
        this.handler._getKeyManager()._tick();
    }

    _land() {
        if (this.vspeed === 0) return;
        this.takingJump = true;
        this.currentState = this._IdlingState;
        this.handler._getMusic().snd_step.play();
        this.vspeed = 0;
    }

    _render(graphics) {
        var xoffset = this.handler._getCamera()._getxoffset() - WIDTH/2,
            yoffset = this.handler._getCamera()._getyoffset() -HEIGHT/2 - YOFFSET;
        this.currentFrame.draw(graphics, this.x - xoffset, this.y - yoffset, this.alpha, (this.face===0?HORIZONTAL_FLIP:0));
    }

    _setState(state) {
        this.currentState = state;
    }

    _setPos(x, y) {
        this.x = x;
        this.y = y;
    }
}