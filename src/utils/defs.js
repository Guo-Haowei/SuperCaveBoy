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
