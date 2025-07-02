import { ECSWorld } from '../ecs';
import {
  Animation,
  Collider,
  ColliderArea,
  Grounded,
  Hitbox,
  Hurtbox,
  Rigid,
  Facing,
  PendingDelete,
  Position,
  ScriptBase,
  Velocity,
  Team,
  Health,
} from '../components';
import { TeamNumber } from './defines';
import { AABB } from '../engine/utils';

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
  layer: number,
  rigid: ColliderArea,
  hurtbox: ColliderArea,
  hitbox: ColliderArea,
) {
  const parent = ecs.createEntity();
  createRigid(ecs, parent, rigid, layer, Rigid.OBSTACLE);
  createHurtbox(ecs, parent, hurtbox);
  createHitbox(ecs, parent, hitbox);

  ecs.addComponent(parent, new Team(team));
  return parent;
}

export function createEnemyCommon(
  ecs: ECSWorld,
  x: number,
  y: number,
  rigid: ColliderArea,
  hurtbox: ColliderArea,
  hitbox: ColliderArea,
  health: Health = new Health(1, 0.5),
) {
  const id = createLifeform(ecs, TeamNumber.ENEMY, Rigid.ENEMY, rigid, hurtbox, hitbox);

  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Velocity());
  ecs.addComponent(id, new Facing(true));
  ecs.addComponent(id, health);
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

export class LifeformScript extends ScriptBase {
  protected fsm: StateMachine<string>;

  onUpdate(dt: number): void {
    this.fsm.update(dt);
  }

  onDie(): void {
    this.fsm.transition('die');
  }

  markDelete(): void {
    this.world.addComponent(this.entity, new PendingDelete());
  }

  playAnim(name: string) {
    const anim = this.world.getComponent<Animation>(this.entity, Animation.name);
    if (!anim || anim.current === name) return;
    anim.current = name;
    anim.elapsed = 0;
  }

  isGrounded(): boolean {
    return this.world.hasComponent(this.entity, Grounded.name);
  }
}

export abstract class TriggerScript extends ScriptBase {
  private triggered = false;

  onUpdate(_dt: number) {
    // intentionally left empty
  }

  onCollision(_layer: number, _selfBound: AABB, _otherBound: AABB) {
    if (this.triggered) return;
    this.triggered = true;
    this.fire();
  }

  abstract fire(): void;
}
