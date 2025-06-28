import { Game } from './game.js';
var game = new Game();

function main() {
    game._init();

    const loop = () => {
        game._tick();
        game._render(ctx);

        requestAnimationFrame(loop);
    };

    loop();
}

// callback that will be run once images are ready
loader.addCompletionListener(function() {
    main();
});

// begin downloading images
loader.start();
