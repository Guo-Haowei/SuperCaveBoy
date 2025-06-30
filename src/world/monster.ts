import { Rect } from '../math';
import { OldSprite } from '../sprite';

export class OldMonster {
    type: number;
    x: number;
    y: number;
    destroyed = false;
    alpha = 1;
    sprite: OldSprite;
    leftBound?: number;
    rightBound?: number;
    face: number;
    hspeed = 0;
    vspeed = 0;
    health = 1;

    constructor(handler, x: number, y: number, type: number, leftBound?: number, rightBound?: number, face?: number) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.leftBound = leftBound;
        this.rightBound = rightBound;

        this.handler = handler;

        this.face = face || DIRECTION.LEFT;

        this.move_animation;

        this._move;

        this.takingDamage = true;

        this.bound;
        this.music;
        this.alarm0;
        this.alarm1;
        this.alarm2;

        switch (this.type) {
            case MONSTER.SPIDER:
                this.bound = new Rect(12, 12, 40, 52);
                this.sprite = this.handler._getGameAssets().spr_spider_jump[0];
                this.move_animation = new OldAnimation(5, this.handler._getGameAssets().spr_spider_jump);
                this._move = this._SpiderIdle;
                this.music = this.handler._getMusic().snd_spider;
                this.alarm0 = new Alarm(this.handler);
                this.speed = 10;
                break;
            case MONSTER.BOSS:
                this.bound = new Rect(15, -5, 130, 193);
                this.move_animation = new OldAnimation(10, this.handler._getGameAssets().spr_boss);
                this.sprite = this.handler._getGameAssets().spr_boss[1];
                this.health = 1;
                // this.health = 3;
                this.speed = 6;
                this.alarm0 = new Alarm(this.handler);
                this.alarm1 = new Alarm(this.handler);
                this.alarm2 = new Alarm(this.handler);
                break;
            default:
                break;
        }
    }

    _BossIdling() { }

    _BossTransition() {
        if (this.alarm1.activated) this.alarm1._tick();
        this.sprite = this.handler._getGameAssets().spr_boss[1];
        if (!this.alarm1.activated) {
            this._move = this._BossRising;
            this.hspeed = 0;
            this.vspeed = 0;
        }
        if (!this.takingDamage) this.sprite = this.handler._getGameAssets().spr_boss_damaged;
        if (this.health <= 0) {
            this._move = this._BossDying;
            const exit = new SpecialObject(this.handler, 992, 608, TYPE.EXIT);
            exit._init();
            this.handler._getLevel().objects.push(exit);
        }
    }

    _BossDying() {
        if (this.alarm2.activated) { this.alarm2._tick(); }
        this.sprite = handler._getGameAssets().spr_boss_damaged;
        this.takingDamage = false;
        if (this.alpha > 0.1) this.alpha -= 0.03;
        else { this.alarm2.activated = false; }
    }

    _BossRising() {
        if (this.y > 192) {
            this.y -= (this.y - 180) / 30;
            if (this.y < 192) this.y = 192;
        } else {
            this._move = this._BossChasing;
            this.alarm0._init(120);
            this.takingDamage = true;
        }
    }

    _BossChasing() {
        if (this.alarm0.activated) this.alarm0._tick();
        const center = this.x + this.bound.x + this.bound.width / 2,
            player = this.handler._getPlayer(),
            pCenter = player.x + player.bound.x + player.bound.width / 2;
        if (Math.abs(center - pCenter) > 40 && this.alarm0.activated) {
            this.hspeed = (this.x - player.x) < 0 ? 1 : -1;
        } else {
            this._move = this._BossFalling;
            this.hspeed = 0;
        }
    }

    _BossFalling() { }

    _setState(state) {
        this._move = state;
    }

    _land() {
        if (this.type === MONSTER.SPIDER) {
            this.hspeed = 0;
            this.vspeed = 0;
            this._move = this._SpiderWait;
            this.sprite = this.handler._getGameAssets().spr_spider_jump[0] // this.move_animation[0];
            this.alarm0._init(60);
        } else if (this.type === MONSTER.BOSS) {
            this._move = this._BossTransition;
            this.alarm1._init(30);
        } else {
            throw new Error(`Unknown monster type: ${this.type}`);
        }
    }

    _SpiderWait() {
        this.alarm0._tick();
        if (!this.alarm0.activated) { this._move = this._SpiderIdle; }
    }

    _SpiderIdle() {
        const player = this.handler._getPlayer();
        if (Math.abs(this.x - player.x) < 350 && Math.abs(this.x - player.x) < 550 && this.y < player.y + 300) {
            this._move = this._SpiderAttack;
        }
    }

    _SpiderAttack() {
        this.move_animation._tick();
        this.sprite = this.move_animation._getFrame();
        if (this.hspeed !== 0) return;
        this.move_animation._reset();
        const player = this.handler._getPlayer();
        const leftDiff = (this.x + this.bound.x) - (player.x + player.bound.x + player.bound.width);
        const rightDiff = (player.x + player.bound.x) - (this.x + this.bound.x + this.bound.width);
        if (player.x < this.x && leftDiff < 400 && player.y + 168 >= this.y) {
            this.vspeed = -18;
            this.hspeed = -1;
        } else if (player.x > this.x && rightDiff < 400 && player.y + 168 >= this.y) {
            this.vspeed = -18;
            this.hspeed = 1;
        }
        this.speed = Math.abs((this.x + this.bound.x + this.bound.width / 2) - (player.x + player.bound.x + player.bound.width)) / 30 + 2;
        if (this.hspeed > 0) { this.face = DIRECTION.RIGHT; }
        else if (this.hspeed < 0) { this.face = DIRECTION.LEFT; }
        else { this._move = this._SpiderIdle; return; }
        // reset animation
        this.move_animation._tick();
        this.sprite = this.move_animation._getFrame();
    }


    _tick() {
        if (this.health <= 0) {
            this.destroyed = true;
        }
        if (this.type === MONSTER.BOSS && this._move) {
            this.move_animation._tick();
            this.sprite = this.move_animation._getFrame();
            if (this.health <= 0 && this.alarm2.activated) {
                this.destroyed = false;
            }
        }
        if (this._move) this._move();
        const player = this.handler._getPlayer();
        const that = this;
        if (player.alpha != 1) return;
        // be destroyed
        if (downCollision(player, this, function () {
            player.vspeed = -15;
            --that.health;
            if (that.music) that.music.play();
        })) { }
        else {
            let bound1x = this.bound.x + this.x,
                bound1y = this.bound.y + this.y,
                bound2x = player.bound.x + player.x,
                bound2y = player.bound.y + player.y,
                xdiff, ydiff;
            if (bound1x > bound2x) {
                xdiff = bound1x + this.bound.width - bound2x;
            } else {
                xdiff = bound2x + player.bound.width - bound1x;
            }
            if (bound1y > bound2y) {
                ydiff = bound1y + this.bound.height - bound2y;
            } else {
                ydiff = bound2y + player.bound.height - bound1y;
            }
            if (xdiff + 2 < this.bound.width + player.bound.width && ydiff + 2 < this.bound.height + player.bound.height)
                player._damageTrigger(that.x);
        }

        // check collision
        // vertical
        if (!(this.vspeed > 0 && checkAllCollision(this, this.handler._getObstacles(), downCollision)) &&
            !(this.vspeed < 0 && checkAllCollision(this, this.handler._getObstacles(), upCollision))) {
            if (this.type === MONSTER.BAT) { this.y += this.vspeed * this.speed; }
            else if ((this.type === MONSTER.SPIDER && this._move === this._SpiderAttack) || (this.type === MONSTER.BOSS && this._move === this._BossFalling)) {
                this.y += this.vspeed;
                this.vspeed += GRAVITY;
            }
        }
        // horizontal
        if (!checkAllCollision(this, this.handler._getObstacles(), hCollision)) {
            this.x += this.hspeed * this.speed;
        }
    }

    _render(graphics) {
        const xoffset = this.handler._getCamera()._getxoffset() - WIDTH / 2;
        const yoffset = this.handler._getCamera()._getyoffset() - HEIGHT / 2 - YOFFSET;
        this.sprite.draw(graphics, this.x - xoffset, this.y - yoffset, this.alpha, (this.face === 0 ? HORIZONTAL_FLIP : 0));
    }
}