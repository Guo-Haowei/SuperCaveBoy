import { Rect, Vec2 } from '../common';
import { createSpider } from './spider';
import { createSnake } from './snake';
import { createBat } from './bat';
import { SpecialObject } from './specialobject';
import { GameObject } from './gameobject';
import { SpriteSheets } from '../assets';
import { Collider, CollisionLayer, Position, Sprite } from '../components';
import { ECSWorld } from '../ecs';
import { createCamera } from '../camera';
import { createPlayer } from './player';

enum TileType {
  WALL = 0,
  DIRT = 1,
}

// @TODO: use constants for these
const TILE_SIZE = 64;

export class Room {
  level = WORLD.startLevel;
  world: number[][] = [];
  width: number;
  height: number;
  obstacles: GameObject[] = [];
  objects: SpecialObject[] = [];
  ecs: ECSWorld = new ECSWorld();
  playerId = ECSWorld.INVALID_ENTITY;
  cameraId = ECSWorld.INVALID_ENTITY;

  private clearRoom() {
    this.world = [];
    this.obstacles = [];
    this.objects = [];
    this.ecs = new ECSWorld();
  }

  public getCameraOffset(): Vec2 {
    const pos = this.ecs.getComponent<Position>(this.cameraId, Position.name);
    return { x: pos.x, y: pos.y };
  }

  private createTile(x: number, y: number, sheetId: string) {
    const id = this.ecs.createEntity();
    this.ecs.addComponent(id, new Position(x, y));
    this.ecs.addComponent(id, new Sprite(sheetId));
  }

  private createEntrance(x: number, y: number) {
    const id = this.ecs.createEntity();
    this.ecs.addComponent(id, new Position(x, y));
    this.ecs.addComponent(id, new Sprite(SpriteSheets.ENTRANCE));
  }

  private createCollider(x: number, y: number, width: number, height: number) {
    x = x * TILE_SIZE;
    y = y * TILE_SIZE;
    width = width * TILE_SIZE;
    height = height * TILE_SIZE;

    // TODO: remove GameObject
    this.obstacles.push(new GameObject(x, y, new Rect(0, 0, width, height)));

    const id = this.ecs.createEntity();
    const collider = new Collider(
      width,
      height,
      CollisionLayer.OBSTACLE,
      CollisionLayer.PLAYER | CollisionLayer.ENEMY,
      Number.MAX_SAFE_INTEGER,
    );

    this.ecs.addComponent(id, new Position(x, y));
    this.ecs.addComponent(id, collider);
  }

  _init() {
    this.clearRoom();

    ++this.level;
    const world = WORLD.levels[this.level].level;
    this.world = world;
    this.width = world[this.level].length;
    this.height = world.length;
    WWIDTH = this.width * 64;
    WHEIGHT = this.height * 64;
    YBOUND = WHEIGHT - 72 - 64 * 3;

    // tiles
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        const spriteId = this.world[y][x] === TileType.WALL ? SpriteSheets.WALL : SpriteSheets.DIRY;
        this.createTile(TILE_SIZE * x, TILE_SIZE * y, spriteId);
      }
    }

    // player
    const playerId = createPlayer(this.ecs, SpawningX, SpawningY);
    this.playerId = playerId;
    // camera
    this.cameraId = createCamera(this.ecs, 400, SpawningY, playerId);

    // entrance
    this.createEntrance(96, 608);

    // colliders
    const colliders = WORLD.levels[this.level].obstacles;
    for (const ele of colliders) {
      const collider = ele as [number, number, number, number];
      this.createCollider(...collider);
    }

    // WTF is this?
    if (this.level < 5) YOFFSET = 50;
    else if (this.level === 6 || this.level === 9) YOFFSET = 35;
    else YOFFSET = 0;

    // monsters
    const mons = WORLD.levels[this.level].monsters;
    for (const ele of mons) {
      const mon = ele as [number, number, number, number?, number?, number?];
      if (mon[2] === MONSTER.BAT) {
        createBat(this.ecs, mon[0], mon[1], playerId);
      } else if (mon[2] === MONSTER.SNAKE) {
        createSnake(this.ecs, mon[0], mon[1], mon[3] ?? 0, mon[4] ?? 0);
      } else if (mon[2] === MONSTER.SPIDER) {
        createSpider(this.ecs, mon[0], mon[1], playerId);
      }
    }

    // objects
    // const objs = WORLD.levels[this.level].objects;
    // for (let i = 0; i < objs.length; ++i) {
    //   const obj = objs[i];
    //   this.objects.push(new SpecialObject(this.handler, obj[0], obj[1], obj[2]));
    //   this.objects[i]._init();
    //   if (obj[3]) {
    //     this.objects[i]._init(obj[3]);
    //   } else {
    //     this.objects[i]._init();
    //   }
    // }

    // if (this.level === 9) {
    //     var music = handler._getMusic()
    //     music._setCurrent(music.snd_boss);
    // }
  }

  _tick() {
    for (let i = 0; i < this.objects.length; ++i) {
      this.objects[i]._tick();
      if (this.objects[i].destroyed) {
        this.objects.splice(i, 1);
      }
    }
  }

  _render(graphics) {
    // objects
    for (const obj of this.objects) {
      if (obj.type !== TYPE.LAVA) obj._render(graphics);
    }
    // monsters
    for (const obj of this.objects) {
      if (obj.type === TYPE.LAVA) obj._render(graphics);
    }
  }
}
