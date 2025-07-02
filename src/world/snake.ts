import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  Facing,
  Name,
  Position,
  ColliderArea,
  Instance,
  ScriptBase,
  Sprite,
  Velocity,
} from '../components';
import { createEnemyCommon, StateMachine } from './lifeform';
import { SpriteSheets, assetManager } from '../engine/assets-manager';

type SnakeStateName = 'idle' | 'die';

class SnakeScript extends ScriptBase {
  private static readonly INITIAL_SPEED = 100;

  private leftBound: number;
  private rightBound: number;

  constructor(entity: Entity, world: ECSWorld, leftBound: number, rightBound: number) {
    super(entity, world);
    this.leftBound = leftBound;
    this.rightBound = rightBound;

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.vx = -SnakeScript.INITIAL_SPEED;

    this.fsm = new StateMachine<SnakeStateName>(
      {
        idle: {
          name: 'idle',
          enter: () => this.playAnim('idle'),
          update: () => this.idle(),
        },
        die: {
          name: 'die',
          update: () => {
            super.markDelete();
            assetManager.snd_snake.play();
          },
        },
      },
      'idle',
    );
  }

  idle() {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const { x } = position;
    const facing = this.world.getComponent<Facing>(this.entity, Facing.name);
    if (x <= this.leftBound) {
      vel.vx = SnakeScript.INITIAL_SPEED;
      facing.toggle();
    } else if (x >= this.rightBound) {
      vel.vx = -SnakeScript.INITIAL_SPEED;
      facing.toggle();
    }
  }
}

export function createSnake(
  ecs: ECSWorld,
  x: number,
  y: number,
  leftBound: number,
  rightBound: number,
) {
  const area: ColliderArea = {
    width: 62,
    height: 32,
    offsetY: 32,
  };

  const hurtArea: ColliderArea = {
    width: 22,
    height: 22,
    offsetX: 22,
    offsetY: 10,
  };

  const id = createEnemyCommon(ecs, x, y, area, hurtArea, area);

  const anim = new Animation(
    {
      idle: {
        sheetId: SpriteSheets.SNAKE_MOVE,
        frames: 2,
        speed: 1,
        loop: true,
      },
    },
    'idle',
  );

  const script = new SnakeScript(id, ecs, leftBound, rightBound);

  ecs.addComponent(id, new Name('Snake'));
  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Sprite(SpriteSheets.SNAKE_MOVE));
  ecs.addComponent(id, anim);
  ecs.addComponent(id, new Instance(script));
  return id;
}
