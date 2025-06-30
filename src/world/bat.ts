import { Rect } from '../math';
import { ECSWorld, Entity } from '../ecs';
import { ComponentType, PositionComponent, ScriptBase, VelocityComponent } from '../components';

// @TODO: ai system?
// @TODO: animation system?
// @TODO: health system?

type EnemyState = "idle" | "chase" | "attack" | "die";

export class BatScript extends ScriptBase {
    target: any; // @TODO: entity id

    private speed: number;
    private state: 'idle' | 'chase' = 'idle';

    constructor(entity: Entity, world: ECSWorld) {
        super(entity, world);
        this.speed = 0.2;
    }

    private idle() {
        const player = this.target;
        const position = this.world.getComponent<PositionComponent>(this.entity, ComponentType.POSITION);
        const { x, y } = position;

        if (Math.abs(x - player.x) < 350 && y - 100 < player.y) {
            this.state = 'chase';
        }
    }

    private chase(dt: number) {
        const player = this.target;
        const position = this.world.getComponent<PositionComponent>(this.entity, ComponentType.POSITION);
        const { x, y } = position;
        const velocity = this.world.getComponent<VelocityComponent>(this.entity, ComponentType.VELOCITY);

        const xsign = x - player.x > 5 ? 1 :x-player.x >= -5 ? 0 : -1;
        const ysign = y-player.y>5?1:y-player.y>=-5?0:-1;

        // this.face = this.hspeed>0? DIRECTION.RIGHT:DIRECTION.LEFT;
        // @TODO: fix this hack
        if (velocity.vx == 0 || velocity.vy == 0) this.speed = 0.3;

        velocity.vx = -xsign * this.speed;
        velocity.vy = -ysign * this.speed;
    }

    onUpdate(dt: number) {
        switch (this.state) {
            case 'idle':
                this.idle();
                break;
            case 'chase':
                this.chase(dt);
                break;
            default:
                throw new Error(`Unknown state: ${this.state}`);
        }
    }
};

class Bat {
    x: number;
    y: number;
    destroyed = false;
    alpha = 1;
    sprite: SpriteComponent;
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

    _render(graphics) {
        const xoffset = this.handler._getCamera()._getxoffset()-WIDTH/2;
        const yoffset = this.handler._getCamera()._getyoffset()-HEIGHT/2 - YOFFSET;
        this.sprite.draw(graphics, this.x-xoffset, this.y-yoffset, this.alpha, (this.face===0?HORIZONTAL_FLIP:0));
    }
}
