import { Rect } from '../common';
import { createSpider } from './spider';
import { createSnake } from './snake';
import { createBat } from './bat';
import { SpecialObject } from './specialobject';
import { GameObject } from './gameobject';
import { SpriteSheets } from '../engine/assets-manager';
import { Collider, CollisionLayer, Position, Sprite, Static } from '../components';
import { ECSWorld } from '../ecs';
import { createGameCamera, createEditorCamera } from '../camera';
import { createPlayer } from './player';
import { WIDTH, HEIGHT, TILE_SIZE } from '../constants';

enum TileType {
  WALL = 0,
  DIRT = 1,
}

const SPAWNING_X = 192;
const SPAWNING_Y = 600;

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
  editorCameraId = ECSWorld.INVALID_ENTITY;
  tileSize = TILE_SIZE;

  private clearRoom() {
    this.world = [];
    this.obstacles = [];
    this.objects = [];
    this.ecs = new ECSWorld();
  }

  private createTile(x: number, y: number, sheetId: string) {
    const id = this.ecs.createEntity();
    this.ecs.addComponent(id, new Position(x, y));
    this.ecs.addComponent(id, new Sprite(sheetId, 0, 2));
  }

  private createEntrance(x: number, y: number) {
    const id = this.ecs.createEntity();
    this.ecs.addComponent(id, new Position(x, y));
    this.ecs.addComponent(id, new Sprite(SpriteSheets.ENTRANCE, 0, 1));
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
    );

    this.ecs.addComponent(id, new Static());
    this.ecs.addComponent(id, new Position(x, y));
    this.ecs.addComponent(id, collider);
  }

  init() {
    this.clearRoom();

    ++this.level;
    const world = WORLD.levels[this.level].level;
    this.world = world;
    this.width = world[this.level].length;
    this.height = world.length;

    // tiles
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        const spriteId = this.world[y][x] === TileType.WALL ? SpriteSheets.WALL : SpriteSheets.DIRY;
        this.createTile(TILE_SIZE * x, TILE_SIZE * y, spriteId);
      }
    }

    // player
    const mapWidth = this.width * TILE_SIZE;
    const mapHeight = this.height * TILE_SIZE;
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
      mapWidth,
      mapHeight,
    );

    this.editorCameraId = createEditorCamera(
      this.ecs,
      0.5 * mapWidth,
      0.5 * mapHeight,
      WIDTH,
      HEIGHT,
    );

    // entrance
    this.createEntrance(96, 608);

    // colliders
    const colliders = WORLD.levels[this.level].obstacles;
    for (const ele of colliders) {
      const collider = ele as [number, number, number, number];
      this.createCollider(...collider);
    }

    // // WTF is this?
    // if (this.level < 5) YOFFSET = 50;
    // else if (this.level === 6 || this.level === 9) YOFFSET = 35;
    // else YOFFSET = 0;

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
}
