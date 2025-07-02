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
  ColliderArea,
} from '../components';
import { SpriteSheets, assetManager } from '../engine/assets-manager';
import { createEnemyCommon, StateMachine } from './lifeform';

type BatStateName = 'idle' | 'fly' | 'die';

class BatScript extends ScriptBase {
  private target: Entity;
  private speed: number;

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
        die: {
          name: 'die',
          update: () => {
            super.markDelete();
            assetManager.snd_bat.play();
          },
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
}

export function createBat(ecs: ECSWorld, x: number, y: number, target: Entity) {
  const area: ColliderArea = {
    width: 48,
    height: 35,
    offsetX: 10,
    offsetY: 15,
  };
  const id = createEnemyCommon(ecs, x, y, area, area, area);

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
  ecs.addComponent(id, new Instance(script));
  return id;
}
