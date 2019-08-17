var game = new Game();

function main() {
    game._init();

    var ticks = 0, past = Date.now(), current;

    var loop = function() {
        lastTime = now;
        now = Date.now();
        delta += now - lastTime;
        if (delta >= 1000.0/fps) {
            delta = 0;
            ++ticks;
            game._tick();
            game._render(ctx);
        }
        current = Date.now();
        // fps check
        if (current - past >= 1000) {
            console.log('fps is '+ticks);
            ticks = 0;
            past = current;
        }
        window.requestAnimationFrame(loop, canvas);
    }
    window.requestAnimationFrame(loop, canvas);
}

// callback that will be run once images are ready
loader.addCompletionListener(function() {
    main();
});

// begin downloading images
loader.start();
