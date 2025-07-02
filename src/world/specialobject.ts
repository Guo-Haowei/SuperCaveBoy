import { Rect } from '../engine/utils';
import { assetManager } from '../assetManager';

export class SpecialObject {
  type: number;
  x: number;
  y: number;
  bound: Rect;
  destroyed = false;
  length = 1;
  hspeed = 5;

  handler: any; // @TODO: define Handler type

  constructor(handler, x, y, type) {
    this.handler = handler;
    this.x = x;
    this.y = y;
    this.bound;
    this.sprite;
    this.type = type;
    this.collided = false;
    this.trigger;
    this.lavaAnimation;
    this.alarm0;
    this.triggerActivated = false;
    this.boss;
  }

  _init(length?: number) {
    switch (this.type) {
      case TYPE.SAPPHIRE:
        this.trigger = this._SapphireTrigger;
        this.bound = new Rect(6, 2, 28, 30);
        this.sprite = this.handler._getGameAssets().spr_small_sapphire;
        break;
      case TYPE.LAVA:
        if (length) this.length = length;
        this.trigger = this._LavaTrigger;
        this.bound = new Rect(0, 36, 64 * this.length, 48);
        this.y -= 12;
        this.lavaAnimation = new OldAnimation(8, this.handler._getGameAssets().spr_lava);
        this.sprite = this.lavaAnimation._getFrame();
        break;

      default:
        throw new Error(`Unknown special object type: ${this.type}`);
    }
  }

  _SapphireTrigger() {
    this.destroyed = true;
    ++this.handler._getPlayer().sapphire;

    assetManager.snd_tink.play();
  }

  _LavaTrigger() {
    this.handler._getPlayer()._damageTrigger(this.x + 32 * this.length);
  }

  _tick() {
    if (this.triggerActivated) {
      this.trigger();
      return;
    }
    const player = this.handler._getPlayer(),
      bound1 = player.bound,
      bound2 = this.bound,
      co = 5; // collision offsets
    if (
      player.x + bound1.x + co <= this.x + bound2.x + bound2.width &&
      player.x + bound1.x + bound1.width - co >= this.x + bound2.x &&
      player.y + bound1.y + co <= this.y + bound2.y + bound2.height &&
      player.y + bound1.y + bound1.height - co >= this.y + bound2.y
    ) {
      this.collided = true;
      // fire the trigger
      if (this.trigger) this.trigger();
    } else {
      this.collided = false;
    }

    if (this.type === TYPE.LAVA) {
      // check monsters
      //   const objs = this.handler._getMonsters();
      //   for (let i = 0; i < objs.length; ++i) {
      //     var monster = objs[i],
      //       bound1 = monster.bound,
      //       bound2 = this.bound,
      //       co = 5; // collision offsets
      //     if (
      //       monster.x + bound1.x + co <= this.x + bound2.x + bound2.width &&
      //       monster.x + bound1.x + bound1.width - co >= this.x + bound2.x &&
      //       monster.y + bound1.y + co <= this.y + bound2.y + bound2.height &&
      //       monster.y + bound1.y + bound1.height - co >= this.y + bound2.y
      //     ) {
      //       if (objs[i].health && objs[i].takingDamage) {
      //         --objs[i].health;
      //         objs[i].takingDamage = false;
      //         if (objs[i].type === MONSTER.BOSS && objs[i].health <= 0) {
      //           objs[i].alarm2._init(90);
      //         }
      //       }
      //     }
      //   }
      this.lavaAnimation._tick();
      this.sprite = this.lavaAnimation._getFrame();
    }
  }

  _render(graphics) {
    // if (!this.sprite) return;
    // const xoffset = this.handler._getCamera()._getxoffset() - WIDTH / 2,
    //   yoffset = this.handler._getCamera()._getyoffset() - HEIGHT / 2 - YOFFSET;
    // if (this.type !== TYPE.LAVA) {
    //   this.sprite.draw(graphics, this.x - xoffset, this.y - yoffset);
    // } else {
    //   for (let i = 0; i < this.length; ++i) {
    //     this.sprite.draw(graphics, this.x + i * 64 - xoffset, this.y - yoffset);
    //   }
    // }
  }
}
