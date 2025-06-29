// canvas
var WIDTH = 960, HEIGHT = 600, // Canvas size
    WWIDTH, WHEIGHT,
    YBOUND;

var wTile = 15, hTile = 10;
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = WIDTH;
canvas.height = HEIGHT;
document.body.appendChild(canvas);

// game loop
var lastTime, now = Date.now(), fps = 60, delta = 0;

var DIRECTION = {LEFT: 0, RIGHT: 1, UP: 2, DOWN: 3};

var KEYEVENT = {SPACE: 32, VK_LEFT: 37, VK_UP: 38, VK_RIGHT: 39};

var BOOL = {TRUE: 1, FALSE: 0};

var ENTITY_STATES = {IDLING: 0, MOVING: 1, JUMPING: 2, CHASING: 3};

var SpawningX = 192, SpawningY = 600;

// physics
var GRAVITY = 1.5, YOFFSET = 50, STEPOFFSET = 4, JUMPFORCE = -23;

// Flip
var HORIZONTAL_FLIP = 1, VERTICAL_FLIP = 2, NO_FLIP = 0;

// images

// @TODO: get rid of PxLoader

// player
var loader = new PxLoader();

// map
var img_dirt =          loader.addImage('resources/sprites/level/spr_dirt.png'),
    img_heart = loader.addImage('resources/sprites/guiicons/spr_gui_heart.png'),
    img_sapphire = loader.addImage('resources/sprites/guiicons/spr_gui_sapphire.png'),
    img_entrance = loader.addImage('resources/sprites/level/spr_entrance.png'),
    img_exit = loader.addImage('resources/sprites/level/spr_exit.png'),
    img_small_sapphire = loader.addImage('resources/sprites/level/spr_sapphire.png'),
    img_lava = loader.addImage('resources/sprites/level/spr_lava.png'),
    img_background = loader.addImage('resources/sprites/level/bg_dirt.png');
// monsters
var img_snake = loader.addImage('resources/sprites/enemies/spr_snake_slithe.png'), img_bat_fly = loader.addImage('resources/sprites/enemies/spr_bat_fly.png'),
    img_bat_idle = loader.addImage('resources/sprites/enemies/spr_bat_idle.png'),
    img_spider_jump = loader.addImage('resources/sprites/enemies/spr_spider_jump.png'),
    img_boss = loader.addImage('resources/sprites/enemies/spr_boss.png'),
    img_boss_damaged = loader.addImage('resources/sprites/enemies/spr_boss_damaged.png');