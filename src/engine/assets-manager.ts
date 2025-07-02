export const SpriteSheets = {
  DIRY: 'dirt',
  WALL: 'wall',
  LAVA: 'lava',
  ENTRANCE: 'entrance',
  PORTAL: 'portal',

  PLAYER_IDLE: 'player_idle',
  PLAYER_WALK: 'player_walk',
  PLAYER_JUMP: 'player_jump',
  PLAYER_GRAB: 'player_grab',
  PLAYER_DAMAGE: 'player_damage',

  BAT_IDLE: 'bat_idle',
  BAT_FLY: 'bat_fly',
  SNAKE_MOVE: 'snake_move',
  SPIDER_JUMP: 'spider_jump',

  BOSS_IDLE: 'boss_idle',
  BOSS_DAMAGE: 'boss_damage',
} as const;

interface SpriteFrame {
  sourceX: number;
  sourceY: number;
  width: number;
  height: number;
}

export interface SpriteSheet {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frames: SpriteFrame[];
}

export interface Renderable {
  image: HTMLImageElement;
  frame: SpriteFrame;
}

class AssetManager {
  private sheets: Record<string, SpriteSheet> = {};

  // @TODO: refactor
  snd_bat: HTMLAudioElement;
  snd_boss: HTMLAudioElement;
  snd_ouch: HTMLAudioElement;
  snd_snake: HTMLAudioElement;
  snd_spider: HTMLAudioElement;
  snd_step: HTMLAudioElement;
  snd_tink: HTMLAudioElement;

  constructor() {
    this.snd_bat = new Audio('resources/sounds/snd_bat.wav');
    this.snd_boss = new Audio('resources/sounds/snd_boss_music.mp3');
    this.snd_ouch = new Audio('resources/sounds/snd_ouch.wav');
    this.snd_snake = new Audio('resources/sounds/snd_snake.wav');
    this.snd_spider = new Audio('resources/sounds/snd_spider.wav');
    this.snd_step = new Audio('resources/sounds/snd_step.wav');
    this.snd_tink = new Audio('resources/sounds/snd_tink.wav');
  }

  init(images: Record<string, HTMLImageElement>) {
    const TILE_SIZE = 64;
    this.loadSheet(SpriteSheets.DIRY, images.spr_dirt, TILE_SIZE, TILE_SIZE);
    this.loadSheet(SpriteSheets.WALL, images.bg_dirt, TILE_SIZE, TILE_SIZE);
    this.loadSheet(SpriteSheets.ENTRANCE, images.spr_entrance, 96, 96);
    this.loadSheet(SpriteSheets.PORTAL, images.spr_exit, 96, 96);

    this.loadSheet(SpriteSheets.PLAYER_IDLE, images.spr_player_idle, 64, 72);
    this.loadSheet(SpriteSheets.PLAYER_WALK, images.spr_player_walk, 64, 72);
    this.loadSheet(SpriteSheets.PLAYER_JUMP, images.spr_player_jump, 64, 72);
    this.loadSheet(SpriteSheets.PLAYER_GRAB, images.spr_player_grab, 64, 72);
    this.loadSheet(SpriteSheets.PLAYER_DAMAGE, images.spr_player_damage, 64, 72);

    this.loadSheet(SpriteSheets.BAT_IDLE, images.spr_bat_idle, TILE_SIZE, TILE_SIZE);
    this.loadSheet(SpriteSheets.BAT_FLY, images.spr_bat_fly, TILE_SIZE, TILE_SIZE);

    this.loadSheet(SpriteSheets.SNAKE_MOVE, images.spr_snake_slithe, TILE_SIZE, TILE_SIZE);
    this.loadSheet(SpriteSheets.SPIDER_JUMP, images.spr_spider_jump, TILE_SIZE, TILE_SIZE);

    this.loadSheet(SpriteSheets.BOSS_IDLE, images.spr_boss, 160, 188);
    this.loadSheet(SpriteSheets.BOSS_DAMAGE, images.spr_boss_damaged, 160, 188);

    this.loadSheet(SpriteSheets.LAVA, images.spr_lava, 64, 64);

    //     this.bg_menu = new OldSprite(images.bg_menu, 0, 0, WIDTH, HEIGHT);
    //     this.spr_small_sapphire = new OldSprite(images.spr_sapphire, 0, 0, 40, 40);
    //     this.spr_gui_sapphire = new OldSprite(images.spr_gui_sapphire, 0, 0, 64, 64);
    //     this.spr_gui_heart = new OldSprite(images.spr_gui_heart, 0, 0, 64, 64);
  }

  private loadSheet(
    name: string,
    image: HTMLImageElement,
    frameWidth: number,
    frameHeight: number,
  ) {
    const columns = Math.floor(image.width / frameWidth);
    const rows = Math.floor(image.height / frameHeight);
    if (rows !== 1) {
      throw new Error(`Sprite sheet '${name}' must have only one row of frames.`);
    }

    const frames: SpriteFrame[] = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        frames.push({
          sourceX: x * frameWidth,
          sourceY: y * frameHeight,
          width: frameWidth,
          height: frameHeight,
        });
      }
    }

    this.sheets[name] = { image, frameWidth, frameHeight, frames };
  }

  getFrame(sheetName: string, frameIndex = 0): Renderable {
    const sheet = this.sheets[sheetName];
    return {
      image: sheet.image,
      frame: sheet.frames[frameIndex],
    };
  }
}

export const assetManager = new AssetManager();
