import { ECSWorld } from './ecs';
import { ComponentType, Position, Sprite } from './components';
import { spriteManager } from './assets';

// @TODO: use camera
export function renderSystem(world: ECSWorld, ctx: CanvasRenderingContext2D, camera: any) {
    const xOffset = camera.xoffset - 0.5 * WIDTH;
    const yOffset = camera.yoffset - 0.5 * HEIGHT - YOFFSET;

    // @TODO: culling
    for (const entity of world.queryEntities([ComponentType.POSITION, ComponentType.SPRITE])) {
        const pos = world.getComponent<Position>(entity, ComponentType.POSITION)!;
        const sprite = world.getComponent<Sprite>(entity, ComponentType.SPRITE)!;

        const { x, y } = pos;
        const { sheetId, frameIndex } = sprite;
        const renderable = spriteManager.getFrame(sheetId, frameIndex);
        const { image, frame } = renderable;

        const dx = x + frame.sourceX - xOffset;
        const dy = y + frame.sourceX - yOffset;

        ctx.drawImage(image, dx, dy, frame.width, frame.height);
    }
}
