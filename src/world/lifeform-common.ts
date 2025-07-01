import { ECSWorld } from '../ecs';
import { Collider, CollisionLayer, Dynamic, Facing, Position, Velocity } from '../components';

export function findGravityAndJumpVelocity(
  desiredJumpHeight: number,
  timeToApex: number,
): { GRAVITY: number; JUMP_VELOCITY: number } {
  const GRAVITY = (2 * desiredJumpHeight) / timeToApex ** 2;
  const JUMP_VELOCITY = GRAVITY * timeToApex;
  return { GRAVITY, JUMP_VELOCITY };
}

export function createLifeform(
  ecs: ECSWorld,
  hitWidth: number,
  hitHeight: number,
  layer: number,
  mask: number,
  hitOffsetX = 0,
  hitOffsetY = 0,
) {
  const id = ecs.createEntity();
  const collider = new Collider(hitWidth, hitHeight, layer, mask, hitOffsetX, hitOffsetY);

  ecs.addComponent(id, collider);
  ecs.addComponent(id, new Dynamic());
  return id;
}

export function createEnemyCommon(
  ecs: ECSWorld,
  x: number,
  y: number,
  hitWidth: number,
  hitHeight: number,
  hitOffsetX = 0,
  hitOffsetY = 0,
) {
  const id = createLifeform(
    ecs,
    hitWidth,
    hitHeight,
    CollisionLayer.ENEMY,
    CollisionLayer.PLAYER | CollisionLayer.OBSTACLE,
    hitOffsetX,
    hitOffsetY,
  );

  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Velocity());
  ecs.addComponent(id, new Facing(true));
  return id;
}

// Generic State interface
export interface State<T extends string> {
  name: T;
  enter?: () => void;
  update?: (dt: number) => void;
  exit?: () => void;
  handleEvent?: (event: string, payload?: unknown) => void;
}

// Generic FSM
export class StateMachine<T extends string> {
  private states: Record<T, State<T>>;
  private current: State<T>;

  constructor(states: Record<T, State<T>>, initial: T) {
    this.states = states;
    this.current = states[initial];
    this.current.enter?.();
  }

  update(dt: number) {
    this.current.update?.(dt);
  }

  transition(to: T) {
    if (this.current.name === to) return;
    this.current.exit?.();
    this.current = this.states[to];
    this.current.enter?.();
  }

  handleEvent(event: string, payload?: unknown) {
    this.current.handleEvent?.(event, payload);
  }

  get stateName(): T {
    return this.current.name;
  }
}

// export class OldMonster {
//   x: number;
//   y: number;
//   destroyed = false;
//   alpha = 1;
//   sprite: OldSprite;
//   leftBound?: number;
//   rightBound?: number;
//   face: number;
//   hspeed = 0;
//   vspeed = 0;
//   health = 1;

//   constructor(
//     handler,
//     x: number,
//     y: number,
//   ) {
//     this.x = x;
//     this.y = y;

//     this.handler = handler;

//     this.face = face || DIRECTION.LEFT;

//     this.move_animation;

//     this._move;

//     this.takingDamage = true;

//     this.bound;
//     this.music;
//     this.alarm0;
//     this.alarm1;
//     this.alarm2;

//     this.bound = new Rect(15, -5, 130, 193);
//     this.move_animation = new OldAnimation(10, this.handler._getGameAssets().spr_boss);
//     this.sprite = this.handler._getGameAssets().spr_boss[1];
//     this.health = 1;
//     // this.health = 3;
//     this.speed = 6;
//     this.alarm0 = new Alarm(this.handler);
//     this.alarm1 = new Alarm(this.handler);
//     this.alarm2 = new Alarm(this.handler);
//   }

//   _BossIdling() {}

//   _BossTransition() {
//     if (this.alarm1.activated) this.alarm1._tick();
//     this.sprite = this.handler._getGameAssets().spr_boss[1];
//     if (!this.alarm1.activated) {
//       this._move = this._BossRising;
//       this.hspeed = 0;
//       this.vspeed = 0;
//     }
//     if (!this.takingDamage) this.sprite = this.handler._getGameAssets().spr_boss_damaged;
//     if (this.health <= 0) {
//       this._move = this._BossDying;
//       const exit = new SpecialObject(this.handler, 992, 608, TYPE.EXIT);
//       exit._init();
//       this.handler._getLevel().objects.push(exit);
//     }
//   }

//   _BossDying() {
//     if (this.alarm2.activated) {
//       this.alarm2._tick();
//     }
//     this.sprite = handler._getGameAssets().spr_boss_damaged;
//     this.takingDamage = false;
//     if (this.alpha > 0.1) this.alpha -= 0.03;
//     else {
//       this.alarm2.activated = false;
//     }
//   }

//   _BossRising() {
//     if (this.y > 192) {
//       this.y -= (this.y - 180) / 30;
//       if (this.y < 192) this.y = 192;
//     } else {
//       this._move = this._BossChasing;
//       this.alarm0._init(120);
//       this.takingDamage = true;
//     }
//   }

//   _BossChasing() {
//     if (this.alarm0.activated) this.alarm0._tick();
//     const center = this.x + this.bound.x + this.bound.width / 2,
//       player = this.handler._getPlayer(),
//       pCenter = player.x + player.bound.x + player.bound.width / 2;
//     if (Math.abs(center - pCenter) > 40 && this.alarm0.activated) {
//       this.hspeed = this.x - player.x < 0 ? 1 : -1;
//     } else {
//       this._move = this._BossFalling;
//       this.hspeed = 0;
//     }
//   }

//   _BossFalling() {}

//   _setState(state) {
//     this._move = state;
//   }

//   _land() {
//     this._move = this._BossTransition;
//     this.alarm1._init(30);
//   }

//   _tick() {
//     if (this.health <= 0) {
//       this.destroyed = true;
//     }
//     if (this._move) {
//       this.move_animation._tick();
//       this.sprite = this.move_animation._getFrame();
//       if (this.health <= 0 && this.alarm2.activated) {
//         this.destroyed = false;
//       }
//     }
//     if (this._move) this._move();
//     const that = this;
//     if (player.alpha != 1) return;
//     // be destroyed
//     if (
//       downCollision(player, this, function () {
//         player.vspeed = -15;
//         --that.health;
//         if (that.music) that.music.play();
//       })
//     ) {
//     } else {
//       let bound1x = this.bound.x + this.x,
//         bound1y = this.bound.y + this.y,
//         bound2x = player.bound.x + player.x,
//         bound2y = player.bound.y + player.y,
//         xdiff,
//         ydiff;
//       if (bound1x > bound2x) {
//         xdiff = bound1x + this.bound.width - bound2x;
//       } else {
//         xdiff = bound2x + player.bound.width - bound1x;
//       }
//       if (bound1y > bound2y) {
//         ydiff = bound1y + this.bound.height - bound2y;
//       } else {
//         ydiff = bound2y + player.bound.height - bound1y;
//       }
//       if (
//         xdiff + 2 < this.bound.width + player.bound.width &&
//         ydiff + 2 < this.bound.height + player.bound.height
//       )
//         player._damageTrigger(that.x);
//     }

//     // check collision
//     // vertical
//     if (
//       !(this.vspeed < 0 && checkAllCollision(this, this.handler._getObstacles(), upCollision))
//     ) {
//       } else if (this._move === this._BossFalling) {
//         this.y += this.vspeed;
//         this.vspeed += GRAVITY;
//       }
//     }
//     // horizontal
//     if (!checkAllCollision(this, this.handler._getObstacles(), hCollision)) {
//       this.x += this.hspeed * this.speed;
//     }
//   }

// }
