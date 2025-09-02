import { Game } from './game.js';

// @TODO: remove this global variable
var game = new Game();

function main(imageAssets: { [key: string]: HTMLImageElement }) {
    game.init(imageAssets);

    let lastTime = Date.now();

    const loop = () => {
        const now = Date.now();
        const dt = now - lastTime;
        lastTime = now;

        game.tick(dt);
        game.render(ctx);

        requestAnimationFrame(loop);
    };

    loop();
}

window.onload = () => {
    const images = Array.from(document.querySelectorAll('img'));
    const imageAssets: { [key: string]: HTMLImageElement } = {};
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

        console.log(imageAssets);

        main(imageAssets);
    });
};
