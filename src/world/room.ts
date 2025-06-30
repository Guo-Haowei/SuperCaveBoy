import { Rect } from '../math'
import { OldMonster } from './monster';
import { BatScript, SnakeScript } from './enemy';
import { SpecialObject } from './specialobject';
import { GameObject } from './gameobject';
import { SpriteSheets } from '../assets';
import { ColliderComponent, ComponentType, ColliderLayer, AnimationComponent } from '../components';
import { ECSWorld, Entity } from '../ecs';

enum TileType {
    WALL = 0,
    DIRT = 1,
};

// @TODO: use constants for these
const TILE_SIZE = 64;

export class Room {
    level = WORLD.startLevel;
    world: number[][] = [];
    width: number;
    height: number;
    obstacles: GameObject[] = [];
    monsters: OldMonster[] = [];
    objects: SpecialObject[] = [];
    ecs: ECSWorld = new ECSWorld();

    entities: Entity[] = [];

    // @TODO: get rid of handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: any;

    constructor(handler) {
        this.handler = handler;
    }

    private clearRoom() {
        this.world = [];
        this.obstacles = [];
        this.monsters = [];
        this.objects = [];
        this.ecs = new ECSWorld();
        this.entities = [];
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

    private createCollider(x: number, y: number, width: number, height: number) {
        x = x * TILE_SIZE;
        y = y * TILE_SIZE;
        width = width * TILE_SIZE;
        height = height * TILE_SIZE;

        // TODO: remove GameObject
        this.obstacles.push(new GameObject(x, y, new Rect(0, 0, width, height)));

        const id = this.ecs.createEntity();
        const collider: ColliderComponent = {
            width,
            height,
            offsetX: 0,
            offsetY: 0,
            layer: ColliderLayer.OBSTACLE,
            mask: ColliderLayer.PLAYER | ColliderLayer.ENEMY,
            mass: Number.MAX_SAFE_INTEGER,
        };

        this.ecs.addComponent(id, ComponentType.POSITION, { x, y });
        this.ecs.addComponent(id, ComponentType.COLLIDER, collider);
        this.entities.push(id);
    }

    private createBat(x: number, y: number) {
        const id = this.ecs.createEntity();
        const collider: ColliderComponent = {
            width: 48,
            height: 35,
            offsetX: 10,
            offsetY: 15,
            layer: ColliderLayer.ENEMY,
            mask: ColliderLayer.PLAYER | ColliderLayer.OBSTACLE,
            mass: 10,
        };

        const script = new BatScript(id, this.ecs);
        script.target = this.handler._getPlayer();
        const sprite = { sheetId: SpriteSheets.BAT_IDLE, frameIndex: 0 };
        const animation: AnimationComponent = {
            animations: {
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
            current: 'idle',
            elapsed: 0,
        };

        this.ecs.addComponent(id, ComponentType.POSITION, { x, y });
        this.ecs.addComponent(id, ComponentType.VELOCITY, { vx: 0, vy: 0 });
        this.ecs.addComponent(id, ComponentType.SPRITE, sprite);
        this.ecs.addComponent(id, ComponentType.ANIMATION, animation);
        this.ecs.addComponent(id, ComponentType.COLLIDER, collider);
        this.ecs.addComponent(id, ComponentType.SCRIPT, { script });
        this.entities.push(id);
    }

    private createSnake(x: number, y: number, leftBound: number, rightBound: number) {
        const id = this.ecs.createEntity();
        const collider: ColliderComponent = {
            width: 62,
            height: 42,
            offsetX: 0,
            offsetY: 22,
            layer: ColliderLayer.ENEMY,
            mask: ColliderLayer.PLAYER | ColliderLayer.OBSTACLE,
            mass: 10,
        };

        const sprite = { sheetId: SpriteSheets.SNAKE_MOVE, frameIndex: 0 };
        const animation: AnimationComponent = {
            animations: {
                idle: {
                    sheetId: SpriteSheets.SNAKE_MOVE,
                    frames: 2,
                    speed: 1,
                    loop: true,
                },
            },
            current: 'idle',
            elapsed: 0,
        };

        const script = new SnakeScript(id, this.ecs, leftBound, rightBound);

        this.ecs.addComponent(id, ComponentType.POSITION, { x, y });
        this.ecs.addComponent(id, ComponentType.VELOCITY, { vx: SnakeScript.INITIAL_SPEED, vy: 0 });
        this.ecs.addComponent(id, ComponentType.SPRITE, sprite);
        this.ecs.addComponent(id, ComponentType.ANIMATION, animation);
        this.ecs.addComponent(id, ComponentType.COLLIDER, collider);
        this.ecs.addComponent(id, ComponentType.SCRIPT, { script });
        this.entities.push(id);
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
                this.createBat(mon[0], mon[1]);
            } else if (mon[2] === MONSTER.SNAKE) {
                this.createSnake(mon[0], mon[1], mon[3] ?? 0, mon[4] ?? 0);
            } else {
                const monster = new OldMonster(this.handler, ...mon);
                this.monsters.push(monster);
            }
        }

        // objects
        const objs = WORLD.levels[this.level].objects;
        for (let i = 0; i < objs.length; ++i) {
            const obj = objs[i];
            this.objects.push(new SpecialObject(this.handler, obj[0], obj[1], obj[2]));
            this.objects[i]._init();
            if (obj[3]) { this.objects[i]._init(obj[3]); }
            else { this.objects[i]._init(); }
        }

        // if (this.level === 9) {
        //     var music = handler._getMusic()
        //     music._setCurrent(music.snd_boss);
        // }
    }

    _tick() {
        for (let i = 0; i < this.objects.length; ++i) {
            this.objects[i]._tick();
            if (this.objects[i].destroyed) { this.objects.splice(i, 1); }
        }
        for (let i = 0; i < this.monsters.length; ++i) {
            this.monsters[i]._tick();
            if (this.monsters[i].destroyed) { this.monsters.splice(i, 1); }
        }
    }

    _render(graphics) {
        // objects
        for (const obj of this.objects) {
            if (obj.type !== TYPE.LAVA) obj._render(graphics);
        }
        // monsters
        for (const monster of this.monsters) {
            monster._render(graphics);
        }
        for (const obj of this.objects) {
            if (obj.type === TYPE.LAVA) obj._render(graphics);
        }
    }
};
