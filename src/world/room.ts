import { createSpider } from './spider';
import { createSnake } from './snake';
import { createBat } from './bat';
import { SpriteSheets } from '../engine/assets-manager';
import { Animation, Collider, Hitbox, Position, Rigid, Sprite } from '../components';
import { ECSWorld } from '../ecs';
import { createGameCamera } from '../camera';
import { createPlayer } from './player';
import { WIDTH, HEIGHT, TILE_SIZE } from '../constants';
import { createPoartal } from './portal';
import { createGuardian } from './guardian';
import { createTrigger } from './cutscene-trigger';

import { LevelData, MONSTER, TYPE } from './data';

enum TileType {
  WALL = 0,
  DIRT = 1,
  LAVA = 2,
}

const SPAWNING_X = 192;
const SPAWNING_Y = 500;

export class Room {
  width: number;
  height: number;
  ecs: ECSWorld;
  playerId = ECSWorld.INVALID_ENTITY;

  tileSize: number;

  cameraId = ECSWorld.INVALID_ENTITY;

  constructor(tileSize: number, levelData: LevelData) {
    const tiles = levelData.level;
    const width = tiles[0].length;
    const height = tiles.length;

    this.tileSize = tileSize;
    this.width = width;
    this.height = height;

    this.ecs = new ECSWorld();

    // player
    const playerId = createPlayer(this.ecs, SPAWNING_X, SPAWNING_Y);
    this.playerId = playerId;

    // camera
    this.cameraId = createGameCamera(
      this.ecs,
      400,
      SPAWNING_Y,
      WIDTH,
      HEIGHT,
      playerId,
      width * tileSize,
      height * tileSize,
    );

    // tiles
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const spriteId = tiles[y][x] === TileType.DIRT ? SpriteSheets.DIRY : SpriteSheets.WALL;
        this.createTile(tileSize * x, tileSize * y, spriteId);
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
        createSnake(this.ecs, mon[0], mon[1], mon[3] ?? 0, mon[4] ?? 0);
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
      } else if (type === TYPE.CAMERA) {
        createTrigger(this.ecs, obj[0] as number, obj[1] as number);
      }
    }
  }

  private computeTile(levelData: LevelData) {
    const { tileSize } = this;
    const grid = levelData.level;
    // const visited = grid.map((row) => row.map(() => false));
    const gridWidth = grid[0].length;
    const gridHeight = grid.length;
    for (let y = 0; y < gridHeight; ++y) {
      for (let x = 0; x < gridWidth; ++x) {
        if (grid[y][x] !== TileType.LAVA) continue;
        const lavaStart = x;
        let cursor = x + 1;
        for (; cursor < gridWidth; ++cursor) {
          const tileType = grid[y][cursor];
          if (tileType !== TileType.LAVA) {
            break;
          }
        }
        const lavaLength = cursor - lavaStart;
        this.createLava(lavaStart * tileSize, y * tileSize, lavaLength);

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
      new Collider(id, { width: TILE_SIZE * repeat, height: 30, offsetY: 30 }),
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
    const { tileSize } = this;
    x = x * tileSize;
    y = y * tileSize;
    width = width * tileSize;
    height = height * tileSize;

    const id = this.ecs.createEntity();
    const collider = this.ecs.createEntity();
    this.ecs.addComponent(collider, new Collider(id, { width, height }));
    this.ecs.addComponent(collider, new Rigid(Rigid.OBSTACLE, 0));

    this.ecs.addComponent(id, new Position(x, y));
    this.ecs.addComponent(id, collider);
  }
}
