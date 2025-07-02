import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  Facing,
  Name,
  Position,
  ColliderArea,
  Instance,
  Sprite,
  Velocity,
} from '../components';
import { createEnemyCommon, StateMachine, LifeformScript, getUpDownGrid } from './lifeform';
import { SpriteSheets, assetManager } from '../engine/assets-manager';
import { roomManager } from '../engine/room-manager';
import { GridType } from './room';
// import { renderSystem } from '../engine/renderSystem';

type SnakeStateName = 'idle' | 'die';

class SnakeScript extends LifeformScript {
  private static readonly INITIAL_SPEED = 100;
  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);

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

    const room = roomManager.getCurrentRoom();
    const { gridSize } = room;

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const facing = this.world.getComponent<Facing>(this.entity, Facing.name);

    // left
    const offset = 10;
    const info = this.getCollisionInfo();
    {
      const [_, down] = getUpDownGrid(position.x - offset, position.y, room);
      if (down !== GridType.SOLID || info?.leftWall) {
        vel.vx = SnakeScript.INITIAL_SPEED;
        facing.left = false;
      }
    }
    {
      const [_, down] = getUpDownGrid(position.x + gridSize + offset, position.y, room);
      if (down !== GridType.SOLID || info?.rightWall) {
        vel.vx = -SnakeScript.INITIAL_SPEED;
        facing.left = true;
      }
    }
  }
}

export function createSnake(ecs: ECSWorld, x: number, y: number) {
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
        speed: 0.5,
        loop: true,
      },
    },
    'idle',
  );

  const script = new SnakeScript(id, ecs);

  ecs.addComponent(id, new Name('Snake'));
  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Sprite(SpriteSheets.SNAKE_MOVE));
  ecs.addComponent(id, anim);
  ecs.addComponent(id, new Instance(script));
  return id;
}
