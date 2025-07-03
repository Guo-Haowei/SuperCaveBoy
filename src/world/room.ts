import { createSpider } from './spider';
import { createSnake } from './snake';
import { createBat } from './bat';
import { SpriteSheets } from '../engine/assets-manager';
import { Animation, Camera, Collider, Hitbox, Position, Rigid, Sprite } from '../components';
import { ECSWorld } from '../ecs';
import { createGameCamera } from '../camera';
import { createPlayer } from './player';
import { WIDTH, HEIGHT, GRID_SIZE } from '../constants';
import { createPoartal } from './portal';
import { createGuardian } from './guardian';
import { createTrigger } from './cutscene-trigger';
import { createSapphire } from './sapphire';

import { RoomData, MONSTER, TYPE } from './data';

export enum GridType {
  NULL = -1,
  WALL = 0,
  SOLID = 1,
  LAVA = 2,
}

const SPAWNING_X = 192;
const SPAWNING_Y = 500;

export class Room {
  readonly width: number;
  readonly height: number;
  readonly gridSize: number;

  private grids: number[][];

  ecs: ECSWorld;
  private cameraId = ECSWorld.INVALID_ENTITY;

  // @TODO: reinit
  constructor(gridSize: number, levelData: RoomData) {
    const grids = levelData.grid;
    const width = grids[0].length;
    const height = grids.length;

    this.grids = grids;
    this.gridSize = gridSize;
    this.width = width;
    this.height = height;

    this.ecs = new ECSWorld();

    // player
    const playerId = createPlayer(this.ecs, SPAWNING_X, SPAWNING_Y);

    // camera
    this.cameraId = createGameCamera(
      this.ecs,
      400,
      SPAWNING_Y,
      WIDTH,
      HEIGHT,
      playerId,
      width * gridSize,
      height * gridSize,
    );

    // tiles
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const spriteId = grids[y][x] === GridType.SOLID ? SpriteSheets.DIRY : SpriteSheets.WALL;
        this.createTile(gridSize * x, gridSize * y, spriteId);
      }
    }

    // lava
    this.computeTile(levelData);

    // entrance
    this.createEntrance(96, 608);

    // colliders
    for (const ele of levelData.obstacles) {
      const collider = ele as [number, number, number, number];
      this.createCollider(...collider);
    }

    for (const ele of levelData.monsters) {
      const mon = ele as [number, number, number, number?, number?, number?];
      if (mon[2] === MONSTER.BAT) {
        createBat(this.ecs, mon[0], mon[1], playerId);
      } else if (mon[2] === MONSTER.SNAKE) {
        createSnake(this.ecs, mon[0], mon[1]);
      } else if (mon[2] === MONSTER.SPIDER) {
        createSpider(this.ecs, mon[0], mon[1], playerId);
      } else if (mon[2] === MONSTER.BOSS) {
        createGuardian(this.ecs, mon[0], mon[1], playerId);
      }
    }

    for (const obj of levelData.objects) {
      const type = obj[2];
      if (type === TYPE.EXIT) {
        createPoartal(this.ecs, obj[0] as number, obj[1] as number, obj[3] as string);
      } else if (type === TYPE.SAPPHIRE) {
        createSapphire(this.ecs, obj[0] as number, obj[1] as number);
      } else if (type === TYPE.CAMERA) {
        createTrigger(this.ecs, obj[0] as number, obj[1] as number);
      }
    }
  }

  getGridUnder(x: number, y: number): { gridType: GridType; gridX: number; gridY: number } {
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize) + 1;

    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return null;
    }

    return {
      gridType: this.grids[gridY][gridX],
      gridX,
      gridY,
    };
  }

  isGridLedge(gridX: number, gridY: number, dir: -1 | 1): boolean {
    const gridType = this.getGridAt(gridX, gridY);
    if (gridType !== GridType.SOLID) {
      return false;
    }

    const nextGridType = this.getGridAt(gridX + dir, gridY);
    if (nextGridType != GridType.SOLID) {
      return true;
    }

    return false;
  }

  getGridAt(gridX: number, gridY: number): GridType {
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return GridType.NULL;
    }

    return this.grids[gridY][gridX];
  }

  getCameraAndPos(): { camera: Camera; pos: Position } {
    const camera = this.ecs.getComponent<Camera>(this.cameraId, Camera.name);
    if (!camera) {
      throw new Error('Camera not found');
    }
    const pos = this.ecs.getComponent<Position>(this.cameraId, Position.name);
    if (!pos) {
      throw new Error('Camera position not found');
    }
    return { camera, pos };
  }

  private computeTile(levelData: RoomData) {
    const { gridSize } = this;
    const grid = levelData.grid;
    // const visited = grid.map((row) => row.map(() => false));
    const gridWidth = grid[0].length;
    const gridHeight = grid.length;
    for (let y = 0; y < gridHeight; ++y) {
      for (let x = 0; x < gridWidth; ++x) {
        if (grid[y][x] !== GridType.LAVA) continue;
        const lavaStart = x;
        let cursor = x + 1;
        for (; cursor < gridWidth; ++cursor) {
          const tileType = grid[y][cursor];
          if (tileType !== GridType.LAVA) {
            break;
          }
        }
        const lavaLength = cursor - lavaStart;
        this.createLava(lavaStart * gridSize, y * gridSize, lavaLength);

        x = cursor;
      }
    }
  }

  private createTile(x: number, y: number, sheetId: string) {
    const id = this.ecs.createEntity();
    this.ecs.addComponent(id, new Position(x, y));
    this.ecs.addComponent(id, new Sprite(sheetId, 0, 10));
  }

  private createLava(x: number, y: number, repeat: number) {
    const id = this.ecs.createEntity();
    this.ecs.addComponent(id, new Position(x, y));

    const anim = new Animation(
      {
        lava: {
          sheetId: SpriteSheets.LAVA,
          frames: 2,
          speed: 0.5,
          loop: true,
        },
      },
      'lava',
    );

    const collider = this.ecs.createEntity();
    this.ecs.addComponent(
      collider,
      new Collider(id, { width: GRID_SIZE * repeat, height: 30, offsetY: 30 }),
    );
    this.ecs.addComponent(collider, new Hitbox());

    this.ecs.addComponent(id, new Sprite(SpriteSheets.LAVA, 0, -1, repeat));
    this.ecs.addComponent(id, anim);
  }

  private createEntrance(x: number, y: number) {
    const id = this.ecs.createEntity();
    this.ecs.addComponent(id, new Position(x, y));
    this.ecs.addComponent(id, new Sprite(SpriteSheets.ENTRANCE, 0, 1));
  }

  private createCollider(x: number, y: number, width: number, height: number) {
    const { gridSize } = this;
    x = x * gridSize;
    y = y * gridSize;
    width = width * gridSize;
    height = height * gridSize;

    const id = this.ecs.createEntity();

    this.ecs.addComponent(id, new Collider(id, { width, height }));
    this.ecs.addComponent(id, new Rigid(Rigid.OBSTACLE, 0));
    this.ecs.addComponent(id, new Position(x, y));
  }
}
