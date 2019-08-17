function Assets() {
    // sprites
    // player
    this.spr_player_idle;
    this.spr_player_walk = new Array(8);
    this.spr_player_jump = new Array(2);
    this.spr_player_grab;
    this.spr_player_damage;
    // map
    this.spr_background;
    this.spr_dirt;
    this.spr_entrance;
    this.spr_exit;
    this.spr_lava = new Array(2);
    this.spr_small_sapphire;
    // GUI
    this.spr_gui_sapphire;
    this.spr_gui_heart;
    // enemies
    this.spr_bat_fly = new Array(5);
    this.spr_bat_idle;
    this.spr_snake_slithe = new Array(2);
    this.spr_spider_jump = new Array(5);
    this.spr_boss = new Array(2);
    this.spr_boss_damaged;
    // effect
    this.spr_blood = new Array(4);
    this.spr_sapphire_chunk = new Array(4);
    this.spr_fire_bubble = new Array(4);
    
    
    // initialize assets
    
    this._init = function() {
        // player idle
        this.spr_player_idle = new Sprite(img_player_idle, 0, 0, 64, 72);
        // player walk
        for (var i = 0; i < 8; ++i) {
            this.spr_player_walk[7-i] = new Sprite(img_player_walk, (7-i)*64, 0, 64, 72);
        }
        //player jump
        this.spr_player_jump[0] = new Sprite(img_player_jump, 0, 0, 64, 72);
        this.spr_player_jump[1] = new Sprite(img_player_jump, 64, 0, 64, 72);
        // player grab
        this.spr_player_grab = new Sprite(img_player_grab, 0, 0, 64, 72);
        
        // player damage
        this.spr_player_damage = new Sprite(img_player_damage, 0, 0, 64, 72);
        
        // background
        this.bg_menu = new Sprite(img_menu, 0, 0, WIDTH, HEIGHT);
        
        // map
        this.spr_background = new Sprite(img_background, 0, 0, 64, 64);
        this.spr_dirt = new Sprite(img_dirt, 0, 0, 64, 64);
        this.spr_entrance = new Sprite(img_entrance, 0, 0, 96, 96);
        this.spr_exit = new Sprite(img_exit, 0, 0, 96, 96);
        this.spr_small_sapphire = new Sprite(img_small_sapphire, 0, 0, 40, 40);
        this.spr_lava[0] = new Sprite(img_lava, 0, -20, 64, 84);
        this.spr_lava[1] = new Sprite(img_lava, 64, -20, 64, 84);
        
        // gui
        this.spr_gui_sapphire = new Sprite(img_sapphire, 0, 0, 64, 64);
        this.spr_gui_heart = new Sprite(img_heart, 0, 0, 64, 64);
        
        // monsters
        this.spr_snake_slithe[0] = new Sprite(img_snake, 0, 0, 64, 64);
        this.spr_snake_slithe[1] = new Sprite(img_snake, 64, 0, 64, 64);
        
        this.spr_bat_idle = new Sprite(img_bat_idle, 0, 0, 64, 64);
        for (var i = 0; i < 5; ++i) {
            this.spr_bat_fly[i] = new Sprite(img_bat_fly, 64*i, 0, 64, 64);
            this.spr_spider_jump[i] = new Sprite(img_spider_jump, 64*i, 0/*-6*/, 64, 68);
        }
        
        this.spr_boss[0] = new Sprite(img_boss, 160, 0, 160, 188);
        this.spr_boss[1] = new Sprite(img_boss, 0, 0, 160, 188);
        this.spr_boss_damaged = new Sprite(img_boss_damaged, 0, 0, 160, 188);
        // effects
                
    }
}