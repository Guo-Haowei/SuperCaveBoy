import { Rect } from '../math'
import { Monster } from './monster';
import { SpecialObject } from './specialobject';
import { GameObject } from './gameobject';
import { renderQueue } from '../renderer';
import { Sprite } from '../sprite';

enum TileType {
    WALL = 0,
    DIRT = 1,
}

// @TODO: rename to room
export class Level {
    level = WORLD.startLevel;
    world: Array<Array<number>> = [];
    width: number;
    height: number;
    obstacles: GameObject[] = [];
    monsters: Monster[] = [];
    spr_dirt: Sprite;
    spr_wall: Sprite;
    entrance: Sprite;
    objects: SpecialObject[] = [];

    constructor(handler) {
        this.handler = handler;

        this.entrance = this.handler._getGameAssets().spr_entrance;

        this.spr_dirt = this.handler._getGameAssets().spr_dirt;
        this.spr_wall = this.handler._getGameAssets().spr_background;
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

        if (this.level === 9) {
            var music = handler._getMusic()
            music._setCurrent(music.snd_boss);
        }
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
        // @TODO: do culling in renderSystem
        const xOffset = this.handler._getCamera().xoffset-WIDTH / 2;
        const yOffset = this.handler._getCamera().yoffset-HEIGHT / 2;
        const xStart = Math.max(Math.floor(xOffset/64), 0);
        const yStart = Math.max(Math.floor(yOffset/64)-1, 0);
        const xLen = Math.min(xStart+wTile+1, this.width);
        const yLen = Math.min(yStart+hTile+2, this.height);

        for (let y = yStart; y < yLen; ++y) {
            for (let x = xStart; x < xLen; ++x) {
                const sprite = this.world[y][x] === TileType.WALL ? this.spr_wall : this.spr_dirt;
                const { image, width, height } = sprite;
                const command = {
                    image,
                    x: x * 64,
                    y: y * 64,
                    width,
                    height,
                };
                renderQueue.submit(command);
            }
        }

        // entrance
        this.entrance.draw(graphics, 96-xOffset, 608-yOffset+YOFFSET);
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
