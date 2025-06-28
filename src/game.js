import { Player } from './objects/gameobjects/lifeforms/player.js';

export function Game() {
    // fields
    this.running = true;
    this.currentState;
    this.states = new Array(5);
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

    this.start;
    this.end;

    // methods
    this._init = function() {
        this.currentState = GAMESTATES.MENU;
        // create music

        if (!this.music) {
            this.music = new Music();
            this.music._init();
        } else {
            this.music._setCurrent(this.music.bgm);
        }

        // create assets
        this.assets = new Assets();
        this.assets._init();

        // create game states
        this.states[GAMESTATES.MENU] = new MenuState(this.handler);
        this.states[GAMESTATES.RUNNING] = new GameState(this.handler);
        this.states[GAMESTATES.END] = new EndState(this.handler);

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

    }

    this._setState = function(index) {
        this.currentState = index;
    }

    this._tick = function() {
        this.music._tick();
        this.states[this.currentState]._tick();
    }

    this._render = function(graphics) {
        graphics.clearRect(0, 0, WIDTH, HEIGHT);
        graphics.fillStyle = '#1C0909';
        graphics.fillRect(0, 0, WIDTH, HEIGHT);
        this.states[this.currentState]._render(graphics);
    }
}
