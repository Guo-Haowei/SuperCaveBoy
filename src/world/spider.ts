import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  CollisionLayer,
  Facing,
  Name,
  Position,
  Script,
  ScriptBase,
  Sprite,
  Velocity,
} from '../components';
import { Direction } from '../common';
import { SpriteSheets } from '../assets';
import { createEnemyCommon, findGravityAndJumpVelocity } from './lifeform-common';

const { GRAVITY, JUMP_VELOCITY } = findGravityAndJumpVelocity(170, 0.3);

class SpiderScript extends ScriptBase {
  private target: Entity;
  private state: 'idle' | 'jumping' | 'prepare' = 'idle';
  private cooldown: number;

  constructor(entity: Entity, world: ECSWorld, target: Entity) {
    super(entity, world);
    this.cooldown = 0;
    this.target = target;

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.gravity = GRAVITY;
  }

  private idle(dt: number) {
    const targetPos = this.world.getComponent<Position>(this.target, Position.name);
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;

    const dx = x - targetPos.x;
    const dy = y - targetPos.y;

    // always face the target
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.vx = 0;

    const absDx = Math.abs(dx);
    const face = this.world.getComponent<Facing>(this.entity, Facing.name);
    face.left = -Math.sign(dx) < 0;
    if (this.cooldown <= 0.0001 && absDx > 40 && absDx < 500 && dy < 300) {
      this.state = 'prepare';

      const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
      vel.vy = -JUMP_VELOCITY;
      vel.vx = absDx * -Math.sign(dx);
    }

    this.cooldown -= dt;
    this.cooldown = Math.max(this.cooldown, 0);
  }

  onUpdate(dt: number) {
    switch (this.state) {
      case 'idle':
        this.idle(dt);
        break;
      case 'prepare':
        break;
      case 'jumping':
        // physics system will handle the jump
        break;
      default:
        throw new Error(`Unknown state: ${this.state}`);
    }
  }

  onCollision(_other: Entity, layer: number, dir: number): void {
    if (this.state === 'prepare') {
      const anim = this.world.getComponent<Animation>(this.entity, Animation.name);
      anim.current = 'jump';
      anim.elapsed = 0;
      this.state = 'jumping';
      return;
    }

    if (layer === CollisionLayer.OBSTACLE && dir === Direction.UP) {
      const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
      vel.vy = 0;

      if (this.state === 'jumping') {
        this.state = 'idle';
        this.cooldown = 1.5;

        const anim = this.world.getComponent<Animation>(this.entity, Animation.name);
        anim.current = 'idle';
        anim.elapsed = 0;
      }
    }
  }
}

export function createSpider(ecs: ECSWorld, x: number, y: number, target: Entity) {
  const id = createEnemyCommon(ecs, x, y, 40, 52, 12, 12);

  const anim = new Animation(
    {
      idle: {
        sheetId: SpriteSheets.SPIDER_JUMP,
        frames: 1,
        speed: 1,
        loop: false,
      },
      jump: {
        sheetId: SpriteSheets.SPIDER_JUMP,
        frames: 5,
        speed: 0.5,
        loop: false,
      },
    },
    'idle',
  );

  ecs.addComponent(id, new Name('Spider'));
  ecs.addComponent(id, new Sprite(SpriteSheets.SPIDER_JUMP));
  ecs.addComponent(id, anim);
  const script = new SpiderScript(id, ecs, target);
  ecs.addComponent(id, new Script(script));
  return id;
}
