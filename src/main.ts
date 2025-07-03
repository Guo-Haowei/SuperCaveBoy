import { createRuntime } from './engine/runtime';
import { EditorState } from './world/data';

const imageAssets: Record<string, HTMLImageElement> = {};
let isPlaying = false;

function bindDebugButton(name, callback: (checked: boolean) => void) {
  const button = document.getElementById(name) as HTMLInputElement;
  if (button) {
    button.addEventListener('change', () => {
      callback(button.checked);
    });
  } else {
    // eslint-disable-next-line no-console
    console.warn(`Button with id "${name}" not found.`);
  }
}

function main() {
  bindDebugButton('debugGrid', (checked) => {
    EditorState.debugGrid = checked;
  });
  bindDebugButton('debugCollisions', (checked) => {
    EditorState.debugCollisions = checked;
  });

  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const game = createRuntime(canvas, imageAssets);

  const playButton = document.getElementById('playButton') as HTMLButtonElement;
  playButton.addEventListener('click', () => {
    const currentScene = game.getCurrentScene();
    if (currentScene === 'EDITOR') {
      game.requestScene('GAME');
    } else {
      game.requestScene('EDITOR');
    }

    isPlaying = !isPlaying;
    playButton.classList.toggle('active', isPlaying);
    playButton.textContent = isPlaying ? '■ Stop' : '▶ Play';
  });

  const loop = () => {
    game.tick();

    requestAnimationFrame(loop);
  };

  loop();
}

function loadImages(urls) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            let name = img.src.split('/').pop() || '';
            name = name.split('.').shift() || '';
            imageAssets[name] = img;
            resolve(img);
          };
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
          img.src = url;
        }),
    ),
  );
}

const urls = [
  './img/bg_menu.png',
  './img/player/spr_player_walk.png',
  './img/player/spr_player_idle.png',
  './img/player/spr_player_jump.png',
  './img/player/spr_player_grab.png',
  './img/player/spr_player_damage.png',
  './img/level/spr_dirt.png',
  './img/guiicons/spr_gui_heart.png',
  './img/guiicons/spr_gui_sapphire.png',
  './img/level/spr_entrance.png',
  './img/level/spr_exit.png',
  './img/level/spr_sapphire.png',
  './img/level/spr_lava.png',
  './img/level/bg_dirt.png',
  './img/enemies/spr_snake_slithe.png',
  './img/enemies/spr_bat_fly.png',
  './img/enemies/spr_bat_idle.png',
  './img/enemies/spr_spider_jump.png',
  './img/enemies/spr_boss.png',
  './img/enemies/spr_boss_damaged.png',
];

window.onload = () => {
  loadImages(urls).then(() => {
    // eslint-disable-next-line no-console
    console.log('✅ All assets loaded');

    main();
  });
};
