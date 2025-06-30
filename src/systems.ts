import { ECSWorld } from './ecs';
import {
    ComponentType,
    ColliderComponent,
    ColliderLayer,
    PositionComponent,
    SpriteComponent,
    ScriptComponent,
    VelocityComponent,
} from './components';
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

export function scriptSystem(world: ECSWorld, dt: number) {
    for (const entity of world.queryEntities([ComponentType.SCRIPT, ComponentType.POSITION])) {
        const script = world.getComponent<ScriptComponent>(entity, ComponentType.SCRIPT)!;
        const pos = world.getComponent<PositionComponent>(entity, ComponentType.POSITION)!;

        script.script.onUpdate?.(dt);
    }
}

export function movementSystem(world: ECSWorld, dt: number) {
    for (const entity of world.queryEntities([ComponentType.POSITION, ComponentType.VELOCITY])) {
        const pos = world.getComponent<PositionComponent>(entity, ComponentType.POSITION)!;
        const vel = world.getComponent<VelocityComponent>(entity, ComponentType.VELOCITY)!;

        pos.x += vel.vx * dt;
        pos.y += vel.vy * dt;
    }
}