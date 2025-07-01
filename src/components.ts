/* eslint-disable @typescript-eslint/no-extraneous-class */
import { ECSWorld, Entity } from './ecs';
import { StateMachine } from './world/lifeform-common';
import { AABB } from './engine/common';

export class Name {
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class Position {
  x: number;
  y: number;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export class Velocity {
  vx: number;
  vy: number;
  gravity?: number;

  constructor(vx = 0, vy = 0) {
    this.vx = vx;
    this.vy = vy;
  }
}

export class Sprite {
  sheetId: string;
  frameIndex: number;
  zIndex: number;

  constructor(sheetId: string, frameIndex = 0, zIndex = 0) {
    this.sheetId = sheetId;
    this.frameIndex = frameIndex;
    this.zIndex = zIndex;
  }
}

export class Facing {
  left: boolean;

  constructor(value: boolean) {
    this.left = value;
  }

  toggle() {
    this.left = !this.left;
  }
}

interface AnimationClip {
  sheetId: string;
  frames: number;
  speed: number;
  loop: boolean;
}

export class Animation {
  animations: Record<string, AnimationClip>;
  current: string;
  elapsed: number;

  constructor(animations: Record<string, AnimationClip>, current: string, elapsed = 0) {
    this.animations = animations;
    this.current = current;
    this.elapsed = elapsed;
  }
}

export class Grounded {}

export class Static {}

export class Dynamic {}

export class Collider {
  static readonly PLAYER = 0b1;
  static readonly ENEMY = 0b10;
  static readonly OBSTACLE = 0b100;
  static readonly EVENT = 0b1000;
  static readonly TRAP = 0b010000;
  static readonly PORTAL = 0b100000;

  width: number;
  height: number;
  layer: number;
  mask: number;
  offsetX: number;
  offsetY: number;

  constructor(
    width: number,
    height: number,
    layer: number,
    mask: number,
    offsetX = 0,
    offsetY = 0,
  ) {
    this.width = width;
    this.height = height;
    this.layer = layer;
    this.mask = mask;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
}

export abstract class ScriptBase {
  protected entity: Entity;
  protected world: ECSWorld;
  protected fsm?: StateMachine<string>;

  constructor(entity: Entity, world: ECSWorld) {
    this.entity = entity;
    this.world = world;
  }

  onInit?(): void;

  onUpdate(dt: number): void {
    this.fsm?.update(dt);
  }

  onCollision?(other: Entity, layer: number, selfBound: AABB, otherBound: AABB): void;

  onDie() {
    this.fsm?.transition('die');
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

export class Camera {
  width: number;
  height: number;
  zoom = 1;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  setZoom(delta: number) {
    const zoomFactor = 1.05;
    let zoom = this.zoom;
    zoom *= Math.pow(zoomFactor, -delta);
    zoom = Math.max(0.1, zoom);
    zoom = Math.min(10, zoom);
    this.zoom = zoom;
  }

  getOffset(pos: Position): { x: number; y: number } {
    return {
      x: pos.x - 0.5 * this.width,
      y: pos.y - 0.5 * this.height,
    };
  }
}

export class Instance {
  private script: ScriptBase;

  constructor(script: ScriptBase) {
    this.script = script;
  }

  onUpdate(dt: number) {
    this.script.onUpdate?.(dt);
  }

  onCollision(other: Entity, layer: number, selfBound: AABB, otherBound: AABB) {
    this.script.onCollision?.(other, layer, selfBound, otherBound);
  }

  onDie() {
    this.script.onDie?.();
  }
}

export class PendingDelete {}
