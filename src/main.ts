import { Game } from './game.js';
import { spriteManager } from './assets';

// @TODO: remove this global variable
// eslint-disable-next-line no-var
var game = new Game();

function main(imageAssets: Record<string, HTMLImageElement>) {
    spriteManager.init(imageAssets);

    game.init(imageAssets);

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
    Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
            img.onload = () => {
                resolve();
            };
            img.onerror = () => resolve();
        });
    })).then(() => {
        images.forEach(img => {
            let name = img.src.split('/').pop() || '';
            name = name.split('.').shift() || '';
            imageAssets[name] = img;
        });

        main(imageAssets);
    });
};
