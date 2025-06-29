import { Rect } from '../math';

export function SpecialObject(handler, x, y, type) {
    // fields
    this.handler = handler;
    this.x = x;
    this.y = y;
    this.bound;
    this.destroyed = false;
    this.sprite;
    this.type = type;
    this.collided = false;
    this.trigger;
    this.lavaAnimation;
    this.length = 1;
    this.alarm0;
    this.triggerActivated = false;
    this.hspeed = 5;
    this.boss;
    
    this._init = function(length) {
        switch (this.type) {
            case TYPE.SAPPHIRE:
                this.trigger = this._SapphireTrigger;
                this.bound = new Rect(6, 2, 28, 30);
                this.sprite = this.handler._getGameAssets().spr_small_sapphire;
                break;
            case TYPE.EXIT:
                this.trigger = this._ExitTrigger;
                this.bound = new Rect(38, 66, 20, 30);
                this.sprite = this.handler._getGameAssets().spr_exit;
                break;
            case TYPE.LAVA:
                if (length) this.length = length;
                this.trigger = this._LavaTrigger;
                this.bound = new Rect(0, 36, 64*this.length, 48);
                this.y -= 12;
                this.lavaAnimation = new OldAnimation(8, this.handler._getGameAssets().spr_lava);
                this.sprite = this.lavaAnimation._getFrame();
                break;
            case TYPE.CAMERA:
                this.trigger = this._CameraTrigger;
                this.bound = new Rect(0, 0, 64, 500);
                this.alarm0 = new Alarm(this.handler);
                var boss = this.handler._getMonsters()[0];
                if (boss.type == MONSTER.BOSS) this.boss = boss;
                break;
            default:
                break;
        }
    }
    
    this._CameraTrigger = function() {
        this.triggerActivated = true;
        var camera = this.handler._getCamera();
        camera._setTarget(this);
        this.handler._getPlayer().pausing = true;
        if (this.x < 900) {
            this.x += (920 - this.x)/70; 
        } else {
            this.boss._setState(this.boss._BossIdling);
            this.alarm0._init(10);
            this.trigger = this._tickAlarm;
        }
    }
    
    this._tickAlarm = function() {
        // alarm for boss
        if (!this.alarm0.activated) {
            if (this.x > 300) {
                this.x -= this.hspeed;
                this.hspeed += 0.04;
            } else {
                this.handler._getCamera()._setTarget(this.handler._getPlayer());                
                this.destroyed = true;
                this.handler._getPlayer().pausing = false;
                this.boss._setState(this.boss._BossRising);
            }
        } else {
            this.alarm0._tick();
        }
    }

    this._cameraSkip = function() {
        this.triggerActivated = false;
        this.handler._getCamera()._setTarget(this.handler._getPlayer());                
        this.destroyed = true;
        this.handler._getPlayer().pausing = false;
        this.boss._setState(this.boss._BossRising);
    }
    
    this._ExitTrigger = function() {
        // start alarm
        var alarm = this.handler._getPlayer().alarm0;
        if (alarm.activated) return;
        alarm._init(10);
        alarm._setScript(alarm._enterNewRoom);
        
    }
    
    this._SapphireTrigger = function() {
        this.destroyed = true;
        ++this.handler._getPlayer().sapphire;
        this.handler._getMusic().snd_tink.play();
    } 
    
    this._LavaTrigger = function() {
        this.handler._getPlayer()._damageTrigger(this.x+32*this.length);
    }

    
    this._tick = function() {
        if (this.triggerActivated) {
            this.trigger();
            return;
        }
        var player = this.handler._getPlayer(), bound1 = player.bound, bound2 = this.bound, co = 5; // collision offsets
        if (player.x+bound1.x+co <= this.x+bound2.x+bound2.width &&
            player.x+bound1.x+bound1.width-co >= this.x+bound2.x && 
            player.y+bound1.y+co <= this.y+bound2.y+bound2.height &&
            player.y+bound1.y+bound1.height-co >= this.y+bound2.y) {
            this.collided = true;
            // fire the trigger
            if (this.trigger) this.trigger();
        } else {
            this.collided = false;
        }
        
        if (this.type === TYPE.LAVA) {
            // check monsters
            var objs = this.handler._getMonsters();
            for (var i = 0; i < objs.length; ++i) {
                var monster = objs[i], bound1 = monster.bound, bound2 = this.bound, co = 5; // collision offsets
                if (monster.x+bound1.x+co <= this.x+bound2.x+bound2.width &&
                    monster.x+bound1.x+bound1.width-co >= this.x+bound2.x && 
                    monster.y+bound1.y+co <= this.y+bound2.y+bound2.height &&
                    monster.y+bound1.y+bound1.height-co >= this.y+bound2.y) {
                    if (objs[i].health && objs[i].takingDamage) {
                        --objs[i].health;
                        objs[i].takingDamage = false;
                        if (objs[i].type === MONSTER.BOSS && objs[i].health <= 0) {
                            objs[i].alarm2._init(90);
                        }
                    }
                }
            }    
            this.lavaAnimation._tick();
            this.sprite = this.lavaAnimation._getFrame();
        }
    }
    
    this._render = function(graphics) {
        if (!this.sprite) return;
        var xoffset = this.handler._getCamera()._getxoffset() - WIDTH/2,
            yoffset = this.handler._getCamera()._getyoffset() -HEIGHT/2 - YOFFSET;
        if (this.type !== TYPE.LAVA) {
            this.sprite.draw(graphics, this.x - xoffset, this.y - yoffset);
        } else {
            for (var i = 0; i < this.length; ++i) {
                this.sprite.draw(graphics, this.x+i*64-xoffset, this.y - yoffset);
            }
        }
    }
}
