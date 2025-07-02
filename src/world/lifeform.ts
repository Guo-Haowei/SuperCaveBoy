import { ECSWorld } from '../ecs';
import {
  Collider,
  ColliderArea,
  Hitbox,
  Hurtbox,
  Rigid,
  Facing,
  Position,
  Velocity,
  Team,
} from '../components';
import { TeamNumber } from './defines';

export function findGravityAndJumpVelocity(
  desiredJumpHeight: number,
  timeToApex: number,
): { GRAVITY: number; JUMP_VELOCITY: number } {
  const GRAVITY = (2 * desiredJumpHeight) / timeToApex ** 2;
  const JUMP_VELOCITY = GRAVITY * timeToApex;
  return { GRAVITY, JUMP_VELOCITY };
}

export function createRigid(
  ecs: ECSWorld,
  parent: number,
  area: ColliderArea,
  layer: number,
  mask: number,
) {
  const id = ecs.createEntity();
  ecs.addComponent(id, new Collider(parent, area));
  ecs.addComponent(id, new Rigid(layer, mask));
  return id;
}

export function createHurtbox(ecs: ECSWorld, parent: number, area: ColliderArea) {
  const id = ecs.createEntity();
  ecs.addComponent(id, new Collider(parent, area));
  ecs.addComponent(id, new Hurtbox());
  return id;
}

export function createHitbox(ecs: ECSWorld, parent: number, area: ColliderArea, damage = 1) {
  const id = ecs.createEntity();
  ecs.addComponent(id, new Collider(parent, area));
  ecs.addComponent(id, new Hitbox(damage));
  return id;
}

export function createLifeform(
  ecs: ECSWorld,
  team: TeamNumber,
  rigidArea: ColliderArea,
  hurtboxArea: ColliderArea,
) {
  const parent = ecs.createEntity();
  createRigid(ecs, parent, rigidArea, 0, Rigid.OBSTACLE);
  createHurtbox(ecs, parent, hurtboxArea);

  ecs.addComponent(parent, new Team(team));
  return parent;
}

export function createEnemyCommon(
  ecs: ECSWorld,
  x: number,
  y: number,
  rigid: ColliderArea,
  hurtbox: ColliderArea,
) {
  const id = createLifeform(ecs, TeamNumber.ENEMY, rigid, hurtbox);

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
