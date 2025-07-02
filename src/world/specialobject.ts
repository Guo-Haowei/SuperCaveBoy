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
  _init(length?: number) {
    // switch (this.type) {
    //   case TYPE.SAPPHIRE:
    //     this.trigger = this._SapphireTrigger;
    //     this.bound = new Rect(6, 2, 28, 30);
    //     this.sprite = this.handler._getGameAssets().spr_small_sapphire;
    //     break;
    //   default:
    //     throw new Error(`Unknown special object type: ${this.type}`);
    // }
  }

  _SapphireTrigger() {
    // this.destroyed = true;
    // ++this.handler._getPlayer().sapphire;
    // assetManager.snd_tink.play();
  }
}
