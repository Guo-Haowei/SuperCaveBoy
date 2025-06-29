import { Game } from './game.js';

// @TODO: remove this global variable
var game = new Game();

function main() {

    const loop = () => {
        game.tick();
        game.render(ctx);

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
