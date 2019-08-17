function Music() {
    this.currentMusic;
    this.defaultMusic;
    this.bgm;
    this.snd_bat;
    this.snd_boss;
    this.snd_ouch;
    this.snd_snake;
    this.snd_spider;
    this.snd_step;
    this.snd_tink;
        
    this._setDefault = function(def) {
        this.defaultMusic = def;
    }
    
    this._setCurrent = function(current) {
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
        this.currentMusic = current;
        this.currentMusic.play();
    }
    
    this._init = function() {
        this.bgm = new Audio("resources/sounds/snd_music.mp3");
        this.snd_bat = new Audio("resources/sounds/snd_bat.wav");
        this.snd_boss = new Audio("resources/sounds/snd_boss_music.mp3");
        this.snd_ouch = new Audio("resources/sounds/snd_ouch.wav");
        this.snd_snake = new Audio("resources/sounds/snd_snake.wav");
        this.snd_spider = new Audio("resources/sounds/snd_spider.wav");
        this.snd_step = new Audio("resources/sounds/snd_step.wav");
        this.snd_tink = new Audio("resources/sounds/snd_tink.wav");
        
        this._setDefault(this.bgm);
        this.currentMusic = this.defaultMusic;
        this.currentMusic.play();
    }
    
    this._tick = function() {
        if (this.currentMusic.ended) {
            this.currentMusic = this.defaultMusic;
            this.currentMusic.play();
        }
    }
    
}