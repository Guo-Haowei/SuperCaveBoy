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
import { createEnemyCommon, StateMachine, LifeformScript } from './lifeform';
import { SpriteSheets, assetManager } from '../engine/assets-manager';
import { roomManager } from '../engine/room-manager';
import { renderSystem } from '../engine/renderSystem';
import { GridType } from './room';

type SnakeStateName = 'idle' | 'die';

function positionToGrid(x: number, y: number, gridSize: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(x / gridSize),
    gridY: Math.floor(y / gridSize),
  };
}

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
    {
      const { gridX, gridY } = positionToGrid(position.x - offset, position.y, gridSize);
      const upperGrid = room.getGridAt(gridX, gridY);
      const lowerGrid = room.getGridAt(gridX, gridY + 1);
      if (upperGrid === GridType.SOLID || lowerGrid !== GridType.SOLID) {
        vel.vx = SnakeScript.INITIAL_SPEED;
        facing.left = false;
      }

      renderSystem.addDebugRect({
        x: gridX * gridSize,
        y: gridY * gridSize,
        width: 64,
        height: 64,
      });
      renderSystem.addDebugRect({
        x: gridX * gridSize,
        y: (gridY + 1) * gridSize,
        width: 64,
        height: 64,
      });
    }

    // right
    {
      const { gridX, gridY } = positionToGrid(position.x + gridSize + offset, position.y, gridSize);
      const upperGrid = room.getGridAt(gridX, gridY);
      const lowerGrid = room.getGridAt(gridX, gridY + 1);
      if (upperGrid === GridType.SOLID || lowerGrid !== GridType.SOLID) {
        vel.vx = -SnakeScript.INITIAL_SPEED;
        facing.left = true;
      }

      renderSystem.addDebugRect({
        x: gridX * gridSize,
        y: gridY * gridSize,
        width: 64,
        height: 64,
      });
      renderSystem.addDebugRect({
        x: gridX * gridSize,
        y: (gridY + 1) * gridSize,
        width: 64,
        height: 64,
      });
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
        speed: 1,
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
