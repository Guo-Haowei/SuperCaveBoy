import { Game } from './game.js';

// @TODO: remove this global variable
var game = new Game();

function main(imageAssets: { [key: string]: HTMLImageElement }) {
    game.init(imageAssets);

    let ticks = 0;
    let current = 0;
    let past = Date.now();

    const loop = () => {
        let lastTime = now;
        now = Date.now();
        delta += now - lastTime;
        if (delta >= 1000.0 / fps) {
            delta = 0;
            ++ticks;
            game.tick();
            game.render(ctx);
        }

        current = Date.now();
        // fps check
        if (current - past >= 1000) {
            console.log('fps is '+ticks);
            ticks = 0;
            past = current;
        }

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
