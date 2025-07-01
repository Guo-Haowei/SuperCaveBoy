import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  Facing,
  Name,
  Position,
  Script,
  ScriptBase,
  Sprite,
  Velocity,
} from '../components';
import { SpriteSheets } from '../assets';
import { createEnemyCommon, StateMachine } from './lifeform-common';

type BatStateName = 'idle' | 'fly';

class BatScript extends ScriptBase {
  private target: Entity;
  private speed: number;
  private fsm: StateMachine<BatStateName>;

  constructor(entity: Entity, world: ECSWorld, target: Entity) {
    super(entity, world);

    this.speed = 70;
    this.target = target;

    this.fsm = new StateMachine<BatStateName>(
      {
        idle: {
          name: 'idle',
          enter: () => this.playAnim('idle'),
          update: () => this.idle(),
        },
        fly: {
          name: 'fly',
          enter: () => this.playAnim('fly'),
          update: () => this.fly(),
        },
      },
      'idle',
    );
  }

  private idle() {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;

    const target = this.world.getComponent<Position>(this.target, Position.name);

    if (Math.abs(x - target.x) < 350 && y - 100 < target.y) {
      this.fsm.transition('fly');
    }
  }

  private fly() {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);

    const target = this.world.getComponent<Position>(this.target, Position.name);

    const dx = x - target.x;
    const dy = y - target.y;
    const xsign = Math.abs(dx) > 5 ? Math.sign(dx) : 0;
    const ysign = Math.abs(dy) > 5 ? Math.sign(dy) : 0;

    if (velocity.vx == 0 || velocity.vy == 0) this.speed = 100;

    velocity.vx = -xsign * this.speed;
    velocity.vy = -ysign * this.speed;

    const face = this.world.getComponent<Facing>(this.entity, Facing.name);
    face.left = velocity.vx < 0;
  }

  onUpdate(dt: number) {
    this.fsm.update(dt);
  }
}

export function createBat(ecs: ECSWorld, x: number, y: number, target: Entity) {
  const id = createEnemyCommon(ecs, x, y, 48, 35, 10, 15);

  const anim = new Animation(
    {
      idle: {
        sheetId: SpriteSheets.BAT_IDLE,
        frames: 1,
        speed: 1,
        loop: true,
      },
      fly: {
        sheetId: SpriteSheets.BAT_FLY,
        frames: 5,
        speed: 0.5,
        loop: true,
      },
    },
    'idle',
  );

  ecs.addComponent(id, new Name('Bat'));
  ecs.addComponent(id, new Sprite(SpriteSheets.BAT_IDLE));
  ecs.addComponent(id, anim);

  const script = new BatScript(id, ecs, target);
  ecs.addComponent(id, new Script(script));
  return id;
}
