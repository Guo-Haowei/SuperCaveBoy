
import { Sprite } from './sprite';

export class Assets {
    spr_player_idle: Sprite;
    spr_player_walk: Sprite[] = new Array(8);
    spr_player_jump: Sprite[] = new Array(2);
    spr_player_grab: Sprite;
    spr_player_damage: Sprite;

    // map
    bg_menu: Sprite;
    spr_background: Sprite;
    spr_dirt: Sprite;
    spr_entrance: Sprite;
    spr_lava = new Array(2);
    spr_exit: Sprite;
    spr_small_sapphire: Sprite;
    // GUI
    spr_gui_sapphire: Sprite;
    spr_gui_heart: Sprite;
    // enemies
    spr_bat_fly: Sprite[] = new Array(5);
    spr_bat_idle: Sprite;
    spr_snake_slithe: Sprite[] = new Array(2);
    spr_spider_jump: Sprite[] = new Array(5);
    spr_boss: Sprite[] = new Array(2);
    spr_boss_damaged: Sprite;
    // effect
    spr_sapphire_chunk: Sprite[] = new Array(4);
    spr_fire_bubble: Sprite[] = new Array(4);

    constructor(images) {
        // player idle
        this.spr_player_idle = new Sprite(images.spr_player_idle, 0, 0, 64, 72);
        // player walk
        for (var i = 0; i < 8; ++i) {
            this.spr_player_walk[7-i] = new Sprite(images.spr_player_walk, (7-i)*64, 0, 64, 72);
        }
        //player jump
        this.spr_player_jump[0] = new Sprite(images.spr_player_jump, 0, 0, 64, 72);
        this.spr_player_jump[1] = new Sprite(images.spr_player_jump, 64, 0, 64, 72);
        // player grab
        this.spr_player_grab = new Sprite(images.spr_player_grab, 0, 0, 64, 72);

        // player damage
        this.spr_player_damage = new Sprite(images.spr_player_damage, 0, 0, 64, 72);

        // background
        this.bg_menu = new Sprite(images.bg_menu, 0, 0, WIDTH, HEIGHT);

        // map
        this.spr_background = new Sprite(images.bg_dirt, 0, 0, 64, 64);
        this.spr_dirt = new Sprite(images.spr_dirt, 0, 0, 64, 64);
        this.spr_entrance = new Sprite(images.spr_entrance, 0, 0, 96, 96);
        this.spr_exit = new Sprite(images.spr_exit, 0, 0, 96, 96);
        this.spr_small_sapphire = new Sprite(images.spr_sapphire, 0, 0, 40, 40);
        this.spr_lava[0] = new Sprite(images.spr_lava, 0, -20, 64, 84);
        this.spr_lava[1] = new Sprite(images.spr_lava, 64, -20, 64, 84);

        // gui
        this.spr_gui_sapphire = new Sprite(images.spr_gui_sapphire, 0, 0, 64, 64);
        this.spr_gui_heart = new Sprite(images.spr_gui_heart, 0, 0, 64, 64);

        // monsters
        this.spr_snake_slithe[0] = new Sprite(images.spr_snake_slithe, 0, 0, 64, 64);
        this.spr_snake_slithe[1] = new Sprite(images.spr_snake_slithe, 64, 0, 64, 64);

        this.spr_bat_idle = new Sprite(images.spr_bat_idle, 0, 0, 64, 64);
        for (var i = 0; i < 5; ++i) {
            this.spr_bat_fly[i] = new Sprite(images.spr_bat_fly, 64*i, 0, 64, 64);
            this.spr_spider_jump[i] = new Sprite(images.spr_spider_jump, 64*i, 0/*-6*/, 64, 68);
        }

        this.spr_boss[0] = new Sprite(images.spr_boss, 160, 0, 160, 188);
        this.spr_boss[1] = new Sprite(images.spr_boss, 0, 0, 160, 188);
        this.spr_boss_damaged = new Sprite(images.spr_boss_damaged, 0, 0, 160, 188);
        // effects
    }
};
