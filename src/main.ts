import { Game } from './game.js';
import { spriteManager } from './assets';
import { WIDTH, HEIGHT } from './constants.js';

function main(imageAssets: Record<string, HTMLImageElement>) {
  spriteManager.init(imageAssets);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  document.body.appendChild(canvas);
  const game = new Game(ctx);

  const loop = () => {
    game.tick();
    game.render(ctx);

    requestAnimationFrame(loop);
  };

  loop();
}

window.onload = () => {
  const images = Array.from(document.querySelectorAll('img'));
  const imageAssets: Record<string, HTMLImageElement> = {};
  Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => {
          resolve();
        };
        img.onerror = () => resolve();
      });
    }),
  ).then(() => {
    images.forEach((img) => {
      let name = img.src.split('/').pop() || '';
      name = name.split('.').shift() || '';
      imageAssets[name] = img;
    });

    main(imageAssets);
  });
};
