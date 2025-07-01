import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  Facing,
  Name,
  Position,
  Instance,
  ScriptBase,
  Sprite,
  Velocity,
} from '../components';
import { SpriteSheets, assetManager } from '../engine/assets-manager';
import { createEnemyCommon, findGravityAndJumpVelocity, StateMachine } from './lifeform';
import { CountDown } from '../engine/common';

const { GRAVITY, JUMP_VELOCITY } = findGravityAndJumpVelocity(170, 0.3);

type SpiderStateName = 'idle' | 'jumping' | 'die';

class SpiderScript extends ScriptBase {
  private target: Entity;
  private cooldown = new CountDown(1.5);

  constructor(entity: Entity, world: ECSWorld, target: Entity) {
    super(entity, world);
    this.target = target;

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.gravity = GRAVITY;

    this.fsm = new StateMachine<SpiderStateName>(
      {
        idle: {
          name: 'idle',
          enter: () => {
            this.playAnim('idle');
            this.cooldown.reset();
          },
          update: (dt) => this.idle(dt),
        },
        jumping: {
          name: 'jumping',
          enter: () => {
            this.playAnim('jump');
          },
          update: (dt) => this.jumping(dt),
        },
        die: {
          name: 'die',
          update: () => {
            super.markDelete();
            assetManager.snd_spider.play();
          },
        },
      },
      'idle',
    );
  }

  private idle(dt: number) {
    const ready = this.cooldown.tick(dt);

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
    if (ready && absDx > 40 && absDx < 500 && dy < 300 && this.isGrounded()) {
      const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
      vel.vy = -JUMP_VELOCITY;
      vel.vx = absDx * -Math.sign(dx);

      this.fsm.transition('jumping');
    }
  }

  private jumping(_dt: number) {
    if (this.isGrounded()) {
      this.fsm.transition('idle');
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
  ecs.addComponent(id, new Instance(script));
  return id;
}
