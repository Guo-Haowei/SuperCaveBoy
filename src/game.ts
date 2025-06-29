import { Player } from './objects/gameobjects/lifeforms/player.js';

export type GameState = 'MENU' | 'RUNNING' | 'END';

export class Game {
    start = 0;
    end = 0;

    private currentState: IGameState;
    private states = new Map<GameState, IGameState>();

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
        this.player;
        // camera
        this.camera;
        // music
        this.music = null;
        // level
        this.level;

        if (!this.music) {
            this.music = new Music();
            this.music._init();
        } else {
            // this.music._setCurrent(this.music.bgm);
        }

        // create assets
        this.assets = new Assets();
        this.assets._init();

        // level
        this.level = new Level(this.handler);
        this.level._init();

        // create entities
        this.player = new Player(SpawningX, SpawningY, 10, this.handler);
        this.player._init();
        this.camera = new Camera(480, SpawningY);
        this.camera._setTarget(this.player);

        // gui
        this.gui = new GUI(this.handler);

        this.states['MENU'] = new MenuState(this);
        this.states['RUNNING'] = new RunningState(this);
        this.states['END'] = new EndState(this);

        this.currentState = this.states['MENU'];
    }

    public changeState(newState: IGameState) {
        this.currentState?.exit();
        this.currentState = newState;
        this.currentState?.enter();
    }

    setState(name: GameState) {
        this.currentState = this.states[name];
    }

    tick() {
        // this.music._tick();
        this.currentState.tick();
    }

    render(graphics) {
        graphics.clearRect(0, 0, WIDTH, HEIGHT);
        graphics.fillStyle = '#1C0909';
        graphics.fillRect(0, 0, WIDTH, HEIGHT);
        this.currentState.render(graphics);
    }
}

interface IGameState {
    enter?(): void;
    exit?(): void;

    tick(): void;
    render(graphics: CanvasRenderingContext2D): void;
}

class MenuState implements IGameState {
    // fields
    private game: Game;

    constructor(game: Game) {
        this.game = game;
        this.handler = game.handler;
    }

    tick() {
        this.handler._getKeyManager()._tick();
        if (this.handler._getKeyManager().spaceKey === BOOL.TRUE) {
            this.game.setState('RUNNING');
            this.game.start = Date.now();
        }
    }

    render(graphics) {
        this.handler._getGameAssets().bg_menu.draw(graphics, 0, HEIGHT/2-270);
        this.drawText(graphics);
    }

    private drawText(graphics) {
        graphics.fillStyle = "#ffffff";
        graphics.font = "36pt Arial";
        graphics.fillText("Press [space] to start", 250, 480);
        graphics.font = "64pt Arial";
        graphics.fillText("Super Cave Boy", 190, 250);
    }
}

class RunningState implements IGameState {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
        this.handler = game.handler;
        this.room = [];
        this.currentRoom = 0;
    }

    tick() {
        this.handler._getCamera()._tick();
        this.handler._getPlayer()._tick();
        this.handler._getLevel()._tick();
    }

    render(graphics) {
        this.handler._getLevel()._render(graphics);
        this.handler._getPlayer()._render(graphics);
        this.handler._getGUI()._render(graphics);
    }
}

class EndState implements IGameState {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
        this.handler = game.handler;
        this.sprite = this.handler._getGameAssets().spr_dirt;
    }

    tick() {
        // do nothing
    }

    render(graphics) {
        for (var h = 0; h < hTile; ++h) {
            for (var w = 0; w < wTile; ++w) {
                this.sprite.draw(graphics, w*64, h*64);
            }
        }
        this.drawText(graphics);
    }

    private formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    private drawText(graphics) {
        const { handler } = this;
        const player = handler._getPlayer();

        const diff = this.game.end - this.game.start;
        const time = `Your Time Was: ${this.formatTime(diff)}`;
        const content = player.health <= 0 ?  'You lost!' : 'You Won!';

        graphics.fillStyle = '#ffffff';
        graphics.font = '64pt Arial';
        graphics.fillText(content, 290, 220);
        graphics.font = '36pt Arial';
        graphics.fillText(time, 240, 320);
        graphics.fillText("You Score was: " + player.sapphire, 290, 400);
    }
}
