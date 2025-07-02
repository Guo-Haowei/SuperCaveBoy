/* eslint-disable @typescript-eslint/no-extraneous-class */
import { ECSWorld, Entity } from './ecs';
import { AABB } from './engine/utils';

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
  repeat: number;

  constructor(sheetId: string, frameIndex = 0, zIndex = 0, repeat = 1) {
    this.sheetId = sheetId;
    this.frameIndex = frameIndex;
    this.zIndex = zIndex;
    this.repeat = repeat;
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

export class Facing {
  left: boolean;

  constructor(value: boolean) {
    this.left = value;
  }

  toggle() {
    this.left = !this.left;
  }
}

export class Player {}

export class Grounded {}

export class Rigid {
  static readonly PLAYER = 0b1;
  static readonly ENEMY = 0b10;
  static readonly OBSTACLE = 0b100;

  layer: number;
  mask: number;
  constructor(layer: number, mask: number) {
    this.layer = layer;
    this.mask = mask;
  }
}

export class Trigger {}

export class Team {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
}

export interface ColliderArea {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}

export class Collider {
  parent: Entity;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;

  constructor(parent: Entity, area: ColliderArea) {
    const { width, height, offsetX = 0, offsetY = 0 } = area;
    this.parent = parent;
    this.width = width;
    this.height = height;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
}

export abstract class ScriptBase {
  protected entity: Entity;
  protected world: ECSWorld;

  constructor(entity: Entity, world: ECSWorld) {
    this.entity = entity;
    this.world = world;
  }

  abstract onUpdate(dt: number): void;

  onHurt?(attacker: number): void;

  onHit?(victim: number): void;

  onDie?(): void;

  onCollision?(layer: number, selfBound: AABB, otherBound: AABB): void;
}

export class Instance {
  script: ScriptBase;

  constructor(script: ScriptBase) {
    this.script = script;
  }
}

export class PendingDelete {}

export class Hitbox {
  damage: number;

  constructor(damage = 1) {
    this.damage = damage;
  }
}

export class Hurtbox {}

export class Health {
  health: number;
  maxHealth: number;
  invulnerableTimeLeft: number;
  readonly invulnerableTime: number;

  constructor(maxHealth: number, invulnerableTime: number) {
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.invulnerableTime = invulnerableTime;
    this.invulnerableTimeLeft = 0;
  }

  isDead(): boolean {
    return this.health <= 0;
  }
}
