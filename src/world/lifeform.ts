import { ECSWorld } from '../engine/ecs';
import {
  Animation,
  Collider,
  ColliderArea,
  CollisionInfo,
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
} from '../engine/components';
import { TeamNumber } from './defines';
import { AABB, toAABB } from '../engine/utils';
import { Room } from './room';

export function findGravityAndJumpVelocity(
  desiredJumpHeight: number,
  timeToApex: number,
): { GRAVITY: number; JUMP_VELOCITY: number } {
  const GRAVITY = (2 * desiredJumpHeight) / timeToApex ** 2;
  const JUMP_VELOCITY = GRAVITY * timeToApex;
  return { GRAVITY, JUMP_VELOCITY };
}

export function getUpDownGrid(x: number, y: number, room: Room): [number, number] {
  const gridSize = room.gridSize;
  const gridX = Math.floor(x / gridSize);
  const gridY = Math.floor(y / gridSize);
  const up = room.getGridAt(gridX, gridY);
  const down = room.getGridAt(gridX, gridY + 1);
  return [up, down];
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
export function createLifeform(
  ecs: ECSWorld,
  team: TeamNumber,
  layer: number,
  rigid: ColliderArea,
  hurtbox: ColliderArea,
  hitbox: ColliderArea,
) {
  const parent = ecs.createEntity();
  ecs.addComponent(parent, new Collider(parent, rigid));
  ecs.addComponent(parent, new Rigid(layer, Rigid.OBSTACLE));

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

  getCollisionInfo(): CollisionInfo | undefined {
    return this.world.getComponent<CollisionInfo>(this.entity, CollisionInfo.name);
  }

  isGrounded(): boolean {
    const info = this.getCollisionInfo();
    if (!info) return false;
    return info.grounded;
  }

  getAABB() {
    const pos = this.world.getComponent<Position>(this.entity, Position.name);
    const collider = this.world.getComponent<Collider>(this.entity, Collider.name);
    return toAABB(pos, collider);
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
