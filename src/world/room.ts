import { Rect } from '../math'
import { Monster } from './monster';
import { SpecialObject } from './specialobject';
import { GameObject } from './gameobject';
import { SpriteSheets } from '../assets';
import { ComponentType } from '../components';
import { ECSWorld, Entity } from '../ecs';

enum TileType {
    WALL = 0,
    DIRT = 1,
};

// @TODO: use constants for these
const TILE_SIZE = 64;

export class Room {
    level = WORLD.startLevel;
    world: Array<Array<number>> = [];
    width: number;
    height: number;
    obstacles: GameObject[] = [];
    monsters: Monster[] = [];
    objects: SpecialObject[] = [];
    ecs: ECSWorld = new ECSWorld();

    entities: Entity[] = [];

    constructor(handler) {
        this.handler = handler;
    }

    private createTile(x: number, y: number, sheetId: string) {
        const id = this.ecs.createEntity();
        this.ecs.addComponent(id, ComponentType.POSITION, { x, y });
        this.ecs.addComponent(id, ComponentType.SPRITE, { sheetId, frameIndex: 0 });
        this.entities.push(id);
    }

    private createEntrance(x: number, y: number) {
        const id = this.ecs.createEntity();
        this.ecs.addComponent(id, ComponentType.POSITION, { x, y });
        this.ecs.addComponent(id, ComponentType.SPRITE, { sheetId: SpriteSheets.ENTRANCE, frameIndex: 0 });
        this.entities.push(id);
    }

    _init(bool) {
        if (bool) {
            // this is when the player dies and the level is reset
        }
        else {
            ++this.level;
            const world = WORLD.levels[this.level].level;
            this.world = world;
            this.width = world[this.level].length;
            this.height = world.length;
            WWIDTH = this.width*64;
            WHEIGHT = this.height*64;
            YBOUND = WHEIGHT-72-64*3;
            const currentLevel = WORLD.levels[this.level].obstacles;

            // tiles
            for (let y = 0; y < this.height; ++y) {
                for (let x = 0; x < this.width; ++x) {
                    const spriteId = this.world[y][x] === TileType.WALL ? SpriteSheets.WALL : SpriteSheets.DIRY;
                    this.createTile(TILE_SIZE * x, TILE_SIZE * y, spriteId);
                }
            }

            // entrance
            this.createEntrance(96, 608);

            for (let i = 0; i < currentLevel.length; ++i) {
                var current = currentLevel[i];
                this.obstacles.push(new GameObject(current[0]*64,current[1]*64,new Rect(0,0,current[2]*64,current[3]*64)));
            }
            if (this.level < 5) YOFFSET = 50;
            else if (this.level === 6 || this.level === 9) YOFFSET = 35;
            else YOFFSET = 0;
        }

        const mons = WORLD.levels[this.level].monsters;
        for (var i = 0; i < mons.length; ++i) {
            const mon = mons[i];
            const monster = new Monster(this.handler, ...mon);
            this.monsters.push(monster);
        }

        const objs = WORLD.levels[this.level].objects;
        for (var i = 0; i < objs.length; ++i) {
            var obj = objs[i];
            this.objects.push(new SpecialObject(this.handler, obj[0], obj[1], obj[2]));
            this.objects[i]._init();
            if (obj[3])
            {this.objects[i]._init(obj[3]);}
            else {this.objects[i]._init();}
        }

        // if (this.level === 9) {
        //     var music = handler._getMusic()
        //     music._setCurrent(music.snd_boss);
        // }
    }

    _tick() {
        for (var i = 0; i < this.objects.length; ++i) {
            this.objects[i]._tick();
            if (this.objects[i].destroyed) {this.objects.splice(i, 1);}
        }
        for (var i = 0; i < this.monsters.length; ++i) {
            this.monsters[i]._tick();
            if (this.monsters[i].destroyed) {this.monsters.splice(i, 1);}
        }
    }

    _render(graphics) {
        // objects
        for (var i = 0; i < this.objects.length; ++i) {
            if(this.objects[i].type !== TYPE.LAVA) this.objects[i]._render(graphics);
        }
        // monsters
        for (var i = 0; i < this.monsters.length; ++i) {
            this.monsters[i]._render(graphics);
        }
        for (var i = 0; i < this.objects.length; ++i) {
            if(this.objects[i].type === TYPE.LAVA) this.objects[i]._render(graphics);
        }
    }
};
