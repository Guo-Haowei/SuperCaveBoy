import { ECSWorld } from './ecs';
import { ComponentType, Collider, Position, Sprite } from './components';
import { spriteManager } from './assets';

// @TODO: use camera
export function renderSystem(world: ECSWorld, ctx: CanvasRenderingContext2D, camera: any) {
    const cameraX = camera.xoffset - 0.5 * WIDTH;
    const cameraY = camera.yoffset - 0.5 * HEIGHT - YOFFSET;

    // @TODO: culling
    for (const entity of world.queryEntities([ComponentType.POSITION, ComponentType.SPRITE])) {
        const pos = world.getComponent<Position>(entity, ComponentType.POSITION)!;
        const sprite = world.getComponent<Sprite>(entity, ComponentType.SPRITE)!;

        const { x, y } = pos;
        const { sheetId, frameIndex } = sprite;
        const renderable = spriteManager.getFrame(sheetId, frameIndex);
        const { image, frame } = renderable;

        const dx = x + frame.sourceX - cameraX;
        const dy = y + frame.sourceX - cameraY;

        ctx.drawImage(image, dx, dy, frame.width, frame.height);
    }

    const DEBUG = true;
    if (!DEBUG) {
        return;
    }

    // Render debug rectangles
    for (const entity of world.queryEntities([ComponentType.POSITION, ComponentType.COLLIDER])) {
        const pos = world.getComponent<Position>(entity, ComponentType.POSITION)!;
        const collider = world.getComponent<Collider>(entity, ComponentType.COLLIDER)!;

        const { x, y } = pos;
        const { width, height, offsetX, offsetY, layer } = collider;

        const dx = x + offsetX - cameraX;
        const dy = y + offsetY - cameraY;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        ctx.strokeRect(dx, dy, width, height);
    }
}
