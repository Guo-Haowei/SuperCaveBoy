class Audios {
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
}

export const audios = new Audios();
