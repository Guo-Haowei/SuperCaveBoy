import { ECSWorld, Entity } from '../ecs';
import { Animation, Position, ScriptBase, Velocity } from '../components';

// @TODO: health system?
// @TODO: play sound on hit

export class BatScript extends ScriptBase {
  target: any; // @TODO: entity id

  private speed: number;
  private state: 'idle' | 'chase' = 'idle';

  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);
    this.speed = 0.07;
  }

  private idle() {
    const player = this.target;
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;

    const anim = this.world.getComponent<Animation>(this.entity, Animation.name);

    if (Math.abs(x - player.x) < 350 && y - 100 < player.y) {
      this.state = 'chase';
      anim.current = 'fly';
      anim.elapsed = 0;
    }
  }

  private chase() {
    const player = this.target;
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);

    const dx = x - player.x;
    const dy = y - player.y;
    const xsign = Math.abs(dx) > 5 ? Math.sign(dx) : 0;
    const ysign = Math.abs(dy) > 5 ? Math.sign(dy) : 0;

    if (velocity.vx == 0 || velocity.vy == 0) this.speed = 0.1;

    velocity.vx = -xsign * this.speed;
    velocity.vy = -ysign * this.speed;
  }

  onUpdate(_dt: number) {
    switch (this.state) {
      case 'idle':
        this.idle();
        break;
      case 'chase':
        this.chase();
        break;
      default:
        throw new Error(`Unknown state: ${this.state}`);
    }
  }
}

export class SpiderScript extends ScriptBase {
  target: any; // @TODO: entity id

  private state: 'idle' | 'attack' | 'cooldown' = 'idle';

  jumpCooldown: number;

  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);

    this.jumpCooldown = 0;
  }

  onUpdate(_dt: number) {
    // if (this.jumpCooldown > 0) {
    //   this.jumpCooldown -= dt;
    //   return;
    // }
    // if (this.state === 'idle') {
    //   this.state = 'jump';
    //   this.jumpCooldown = 1.5; // Cooldown before next jump
    //   // Logic to jump towards the target
    // } else if (this.state === 'jump') {
    //   // Logic for jumping behavior
    //   this.state = 'idle'; // Reset state after jump
    // }
  }
}

//   this.hspeed = 0;
//   this.vspeed = 0;
//   this._move = this._SpiderWait;
//   this.sprite = this.handler._getGameAssets().spr_spider_jump[0]; // this.move_animation[0];
//   this.alarm0._init(60);

//   _SpiderAttack() {
//     this.move_animation._tick();
//     this.sprite = this.move_animation._getFrame();
//     if (this.hspeed !== 0) return;
//     this.move_animation._reset();
//     const player = this.handler._getPlayer();
//     const leftDiff = this.x + this.bound.x - (player.x + player.bound.x + player.bound.width);
//     const rightDiff = player.x + player.bound.x - (this.x + this.bound.x + this.bound.width);
//     if (player.x < this.x && leftDiff < 400 && player.y + 168 >= this.y) {
//       this.vspeed = -18;
//       this.hspeed = -1;
//     } else if (player.x > this.x && rightDiff < 400 && player.y + 168 >= this.y) {
//       this.vspeed = -18;
//       this.hspeed = 1;
//     }
//     this.speed =
//       Math.abs(
//         this.x +
//           this.bound.x +
//           this.bound.width / 2 -
//           (player.x + player.bound.x + player.bound.width),
//       ) /
//         30 +
//       2;
//     if (this.hspeed > 0) {
//       this.face = DIRECTION.RIGHT;
//     } else if (this.hspeed < 0) {
//       this.face = DIRECTION.LEFT;
//     } else {
//       this._move = this._SpiderIdle;
//       return;
//     }
//     // reset animation
//     this.move_animation._tick();
//     this.sprite = this.move_animation._getFrame();
//   }

//   _SpiderWait() {
//     this.alarm0._tick();
//     if (!this.alarm0.activated) {
//       this._move = this._SpiderIdle;
//     }
//   }

//   _SpiderIdle() {
//     const player = this.handler._getPlayer();
//     if (
//       Math.abs(this.x - player.x) < 350 &&
//       Math.abs(this.x - player.x) < 550 &&
//       this.y < player.y + 300
//     ) {
//       this._move = this._SpiderAttack;
//     }
//   }

export class SnakeScript extends ScriptBase {
  static readonly INITIAL_SPEED = 0.1;

  private leftBound: number;
  private rightBound: number;

  constructor(entity: Entity, world: ECSWorld, leftBound: number, rightBound: number) {
    super(entity, world);
    this.leftBound = leftBound;
    this.rightBound = rightBound;

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.vx = SnakeScript.INITIAL_SPEED;
  }

  onUpdate(_dt: number) {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const { x } = position;
    if (x <= this.leftBound) {
      vel.vx = SnakeScript.INITIAL_SPEED;
    } else if (x >= this.rightBound) {
      vel.vx = -SnakeScript.INITIAL_SPEED;
    }
  }
}
