import { Player } from './world/player';
import { Room } from './world/room';
import * as System from './systems';
import { Assets } from './assets';

export type Scene = 'MENU' | 'PLAY' | 'END';

export class Game {
    start = 0;
    end = 0;

    private player: Player;
    private currentScene: IScene;
    private scenes = new Map<Scene, IScene>();
    private lastTick = 0;
    room: Room;

    camera: any; // @TODO: define Camera type
    handler: any; // @TODO: define Handler type

    constructor() {
        // assets
        this.assets;
        // handler
        this.handler = new Handler(this);
        // key manager
        this.keyManager = keyManager;
        this.keyManager._setTakeInput(true);
        this.keyManager._init();
        // game objects
        // camera
        // music
        this.music = null;
        // level
        this.room;
    }

    public init(images: { [key: string]: HTMLImageElement }) {
        if (!this.music) {
            this.music = new Music();
            this.music._init();
        } else {
            // this.music._setCurrent(this.music.bgm);
        }

        // create assets
        this.assets = new Assets(images);


        this.player = new Player(SpawningX, SpawningY, 10, this.handler);

        // level
        this.room = new Room(this.handler);
        this.room._init();

        // create entities
        this.camera = new Camera(480, SpawningY);
        this.camera._setTarget(this.player);

        // gui
        this.gui = new GUI(this.handler);

        this.scenes['MENU'] = new MenuScene(this);
        this.scenes['PLAY'] = new PlayScene(this);
        this.scenes['END'] = new EndScene(this);

        this.currentScene = this.scenes['MENU'];
    }

    public changeScene(newScene: IScene) {
        this.currentScene.exit?.();
        this.currentScene = newScene;
        this.currentScene.enter?.();
    }

    setScene(name: Scene) {
        this.changeScene(this.scenes[name]);
    }

    tick() {
        const timestamp = Date.now();
        let dt = 0;
        if (this.lastTick === 0) {
            this.lastTick = timestamp;
        } else {
            dt = timestamp - this.lastTick;
            this.lastTick = timestamp;
        }

        this.currentScene.tick(dt);

        System.followSystem(this.room.ecs, dt);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = '#1C0909';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        System.renderSystem(this.room.ecs, ctx, this.camera);

        this.currentScene.render(ctx);
    }
}

interface IScene {
    enter?(): void;
    exit?(): void;

    tick(dt: number): void;
    render(ctx: CanvasRenderingContext2D): void;
}

class MenuScene implements IScene {
    // fields
    private game: Game;

    constructor(game: Game) {
        this.game = game;
        this.handler = game.handler;
    }

    tick(dt: number) {
        this.handler._getKeyManager()._tick();
        if (this.handler._getKeyManager().spaceKey === BOOL.TRUE) {
            this.game.setScene('PLAY');
            this.game.start = Date.now();
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        this.handler._getGameAssets().bg_menu.draw(ctx, 0, HEIGHT/2-270);
        this.drawText(ctx);
    }

    private drawText(ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "36pt Arial";
        ctx.fillText("Press [space] to start", 250, 480);
        ctx.font = "64pt Arial";
        ctx.fillText("Super Cave Boy", 190, 250);
    }
}

class PlayScene implements IScene {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
        this.handler = game.handler;
        this.room = [];
        this.currentRoom = 0;
    }

    tick(dt: number) {
        this.handler._getCamera()._tick();
        this.handler._getPlayer()._tick();
        this.game.room._tick();
    }

    render(ctx) {
        this.game.room._render(ctx);
        this.handler._getPlayer()._render(ctx);
        this.handler._getGUI()._render(ctx);
    }
}

class EndScene implements IScene {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
        this.handler = game.handler;
        this.sprite = this.handler._getGameAssets().spr_dirt;
    }

    tick(dt: number) {
        // do nothing
    }

    render(ctx) {
        for (var h = 0; h < hTile; ++h) {
            for (var w = 0; w < wTile; ++w) {
                this.sprite.draw(ctx, w*64, h*64);
            }
        }
        this.drawText(ctx);
    }

    // @TODO: utlity function to format time
    private formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    private drawText(ctx: CanvasRenderingContext2D) {
        const { handler } = this;
        const player = handler._getPlayer();

        const diff = this.game.end - this.game.start;
        const time = `Your Time Was: ${this.formatTime(diff)}`;
        const content = player.health <= 0 ?  'You lost!' : 'You Won!';

        ctx.fillStyle = '#ffffff';
        ctx.font = '64pt Arial';
        ctx.fillText(content, 290, 220);
        ctx.font = '36pt Arial';
        ctx.fillText(time, 240, 320);
        ctx.fillText("You Score was: " + player.sapphire, 290, 400);
    }
}
