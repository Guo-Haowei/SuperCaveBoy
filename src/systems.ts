import { ECSWorld } from './ecs';
import { ComponentType, ColliderComponent, PositionComponent, SpriteComponent, ColliderLayer, FollowComponent } from './components';
import { spriteManager } from './assets';

// @TODO: use camera
export function renderSystem(world: ECSWorld, ctx: CanvasRenderingContext2D, camera: any) {
    const cameraX = camera.xoffset - 0.5 * WIDTH;
    const cameraY = camera.yoffset - 0.5 * HEIGHT - YOFFSET;

    // @TODO: culling
    for (const entity of world.queryEntities([ComponentType.POSITION, ComponentType.SPRITE])) {
        const pos = world.getComponent<PositionComponent>(entity, ComponentType.POSITION)!;
        const sprite = world.getComponent<SpriteComponent>(entity, ComponentType.SPRITE)!;

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
        const pos = world.getComponent<PositionComponent>(entity, ComponentType.POSITION)!;
        const collider = world.getComponent<ColliderComponent>(entity, ComponentType.COLLIDER)!;

        const { x, y } = pos;
        const { width, height, offsetX, offsetY, layer } = collider;

        const dx = x + offsetX - cameraX;
        const dy = y + offsetY - cameraY;

        let color: string;
        switch (layer) {
            case ColliderLayer.PLAYER:
                color = 'green';
                break;
            case ColliderLayer.ENEMY:
                color = 'red';
                break;
            default:
                color = 'blue';
                break;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(dx, dy, width, height);
    }
}

export function followSystem(world: ECSWorld, dt: number) {
    for (const entity of world.queryEntities([ComponentType.FOLLOW, ComponentType.POSITION])) {
        const follow = world.getComponent<FollowComponent>(entity, ComponentType.FOLLOW)!;
        const pos = world.getComponent<PositionComponent>(entity, ComponentType.POSITION)!;

        const { target } = follow;
        if (!target) continue;

        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const speed = follow.speed * dt;

        if (distance > 0) {
            pos.x += (dx / distance) * speed;
            pos.y += (dy / distance) * speed;
        }
    }
}
