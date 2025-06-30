import { ECSWorld, Entity } from './ecs';

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

  constructor(vx = 0, vy = 0) {
    this.vx = vx;
    this.vy = vy;
  }
}

export class Sprite {
  sheetId: string;
  frameIndex: number;

  constructor(sheetId: string, frameIndex = 0) {
    this.sheetId = sheetId;
    this.frameIndex = frameIndex;
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

export enum ColliderLayer {
  PLAYER = 0b0001,
  ENEMY = 0b0010,
  OBSTACLE = 0b0100,
}

export class Collider {
  width: number;
  height: number;
  layer: number;
  mask: number;
  mass: number;
  offsetX: number;
  offsetY: number;

  constructor(
    width: number,
    height: number,
    layer: ColliderLayer,
    mask: ColliderLayer,
    mass: number,
    offsetX = 0,
    offsetY = 0,
  ) {
    this.width = width;
    this.height = height;
    this.layer = layer;
    this.mask = mask;
    this.mass = mass;
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

  onInit?(): void;
  onUpdate?(dt: number): void;
  onCollision?(other: Entity, layer: number): void;
  onDie?(): void;
}

export class Script {
  script: ScriptBase;

  constructor(script: ScriptBase) {
    this.script = script;
  }
}
