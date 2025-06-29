import { Rect } from '../math';
import { Sprite } from '../sprite';

// @TODO: script system
// @TODO: ai system?
// @TODO: animation system?
// @TODO: health system?

// class ScriptBase {
//     onUpdate?(world: World, id: EntityId, dt: number): void;
//     onCollide?(world: World, self: EntityId, other: EntityId): void;
//     onDamaged?(world: World, id: EntityId, damage: number): void;
//     onDie?(world: World, id: EntityId): void;
// };

// class ChasingEnemyScript extends ScriptBase {
//     onUpdate(world: World, id: EntityId, dt: number) {
//         // move toward player
//     }

//     onCollide(world: World, self: EntityId, other: EntityId) {
//         if (world.hasComponent(other, "Player")) {
//             // attack or damage player
//         }
//     }

//     onDie(world: World, id: EntityId) {
//         console.log("chasing enemy died");
//         // maybe spawn explosion, play sound, etc.
//     }
// };

export class Bat {
    x: number;
    y: number;
    destroyed = false;
    alpha = 1;
    sprite: Sprite;
    leftBound?: number;
    rightBound?: number;
    face: number;
    hspeed = 0;
    vspeed = 0;
    health = 1;

    constructor(handler, x: number, y: number) {
        this.x = x;
        this.y = y;

        this.handler = handler;

        this.face = DIRECTION.LEFT;

        this.move_animation;

        this._move;

        this.takingDamage = true;

        this.music;

        this.bound = new Rect(10, 15, 48, 35);
        this.sprite = this.handler._getGameAssets().spr_bat_idle;

        this.move_animation = new OldAnimation(3, this.handler._getGameAssets().spr_bat_fly);
        this._move = this._BatIdle;
        this.music = this.handler._getMusic().snd_bat;
        this.speed = 2;
    }

    _setState(state) {
        this._move = state;
    }

    _BatIdle() {
        var player = this.handler._getPlayer();
        if (Math.abs(this.x - player.x) < 350 && this.y-100 < player.y) {
            this._move = this._BatMove;
            this.move_animation._reset();
        }
    }

    _BatMove() {
        this.sprite = this.move_animation._getFrame();
        this.move_animation._tick();
        var player = this.handler._getPlayer();
        var xsign = this.x-player.x>5?1:this.x-player.x>=-5?0:-1,
            ysign = this.y-player.y>5?1:this.y-player.y>=-5?0:-1;
        this.hspeed = -xsign;
        this.vspeed = -ysign;
        this.face = this.hspeed>0? DIRECTION.RIGHT:DIRECTION.LEFT;
        if (this.hspeed == 0 || this.vspeed == 0) this.speed = 3;
    }

    _tick() {
        if (this.health <= 0) {
            this.destroyed = true;
        }
        if (this._move) this._move();
        var player = this.handler._getPlayer();
        var that = this;
        if (player.alpha != 1) return;
        // be destroyed
        if (downCollision(player, this, function() {
            player.vspeed = -15;
            --that.health;
            if (that.music) that.music.play();
        })){}
        else {
            var bound1x = this.bound.x+this.x,
                bound1y = this.bound.y+this.y,
                bound2x = player.bound.x+player.x,
                bound2y = player.bound.y+player.y,
                xdiff, ydiff;
            if (bound1x > bound2x) {
                xdiff = bound1x+this.bound.width-bound2x;
            } else {
                xdiff = bound2x+player.bound.width-bound1x;
            }
            if (bound1y > bound2y) {
                ydiff = bound1y+this.bound.height-bound2y;
            } else {
                ydiff = bound2y+player.bound.height-bound1y;
            }
            if (xdiff+2 < this.bound.width+player.bound.width && ydiff+2 < this.bound.height+player.bound.height)
            player._damageTrigger(that.x);
        }

        // check collision
        if (this.type !== MONSTER.SNAKE) {
            // vertical
            if (!(this.vspeed > 0 && checkAllCollision(this, this.handler._getObstacles(), downCollision)) &&
                !(this.vspeed < 0 && checkAllCollision(this, this.handler._getObstacles(), upCollision))) {
                this.y += this.vspeed*this.speed;
            }
            // horizontal
            if (!checkAllCollision(this, this.handler._getObstacles(), hCollision)){
                this.x += this.hspeed*this.speed;
            }
        }
    }

    _render(graphics) {
        const xoffset = this.handler._getCamera()._getxoffset()-WIDTH/2;
        const yoffset = this.handler._getCamera()._getyoffset()-HEIGHT/2 - YOFFSET;
        this.sprite.draw(graphics, this.x-xoffset, this.y-yoffset, this.alpha, (this.face===0?HORIZONTAL_FLIP:0));
    }
}
