export type RenderCommand = {
    image: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
    flipX?: boolean;
    flipY?: boolean;
};

export class RenderQueue {
    commands: RenderCommand[] = []

    submit(cmd: RenderCommand) {
        this.commands.push(cmd);
    }

    clear() {
        this.commands.length = 0;
    }

    getCommands(): RenderCommand[] {
        return this.commands;
    }
};

// @TODO: use camera
export function renderSystem(ctx: CanvasRenderingContext2D, camera: any, queue: RenderQueue) {
    const commands = queue.getCommands();

    const xOffset = camera.xoffset - 0.5 * WIDTH;
    const yOffset = camera.yoffset - 0.5 * HEIGHT - YOFFSET;


    for (const cmd of commands) {
        ctx.save();
        ctx.translate(cmd.x - xOffset, cmd.y - yOffset)

        ctx.drawImage(
            cmd.image,
            0,
            0,
            cmd.width,
            cmd.height
        );

        ctx.restore();
    }

    queue.clear();
}

export const renderQueue = new RenderQueue();