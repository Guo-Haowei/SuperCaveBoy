import { ECSWorld, Entity } from '../ecs';
import { Animation, CollisionLayer, Position, ScriptBase, Velocity } from '../components';
import { Direction } from '../common';

// @TODO: health system?
// @TODO: play sound on hit

export class BatScript extends ScriptBase {
  target: any; // @TODO: entity id

  private speed: number;
  private state: 'idle' | 'chase' = 'idle';

  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);
    this.speed = 70;
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

    if (velocity.vx == 0 || velocity.vy == 0) this.speed = 100;

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

  private state: 'idle' | 'attack' = 'idle';
  private cooldown: number;

  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);
    this.cooldown = 0;
  }

  private idle(dt: number) {
    const player = this.target;
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;

    const anim = this.world.getComponent<Animation>(this.entity, Animation.name);

    const dx = x - player.x;
    const dy = y - player.y;

    // always face the target
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.vx = -Math.sign(dx) * Number.EPSILON;
    if (this.cooldown === 0 && Math.abs(dx) > 100 && Math.abs(dx) < 500 && dy < 300) {
      this.state = 'attack';
      anim.current = 'jump';
      anim.elapsed = 0;

      const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
      vel.vy = -300;
      vel.vx = 250 * -Math.sign(dx);
    }

    this.cooldown -= dt;
    this.cooldown = Math.max(this.cooldown, 0);
  }

  private attack(dt: number) {
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const GRAVITY = 500;

    // @TODO: move to gravity
    vel.vy += GRAVITY * dt;
  }

  onUpdate(dt: number) {
    switch (this.state) {
      case 'idle':
        this.idle(dt);
        break;
      case 'attack':
        this.attack(dt);
        break;
      default:
        throw new Error(`Unknown state: ${this.state}`);
    }
  }

  onCollision(_other: Entity, layer: number, dir: number): void {
    if (this.state === 'attack') {
      if (layer === CollisionLayer.OBSTACLE && dir === Direction.UP) {
        this.state = 'idle';
        this.cooldown = 1.5;

        const anim = this.world.getComponent<Animation>(this.entity, Animation.name);
        anim.current = 'idle';
        anim.elapsed = 0;
      }
    }
  }
}

export class SnakeScript extends ScriptBase {
  static readonly INITIAL_SPEED = 100;

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
