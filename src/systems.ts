import { Direction } from './common';
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
import { Rect, Vec2 } from './math';

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

function canCollide(a: ColliderComponent, b: ColliderComponent): boolean {
    return (a.layer & b.mask) !== 0 || (b.layer & a.mask) !== 0;
}

function getMTV(a: Rect, b: Rect): Vec2 | null {
    const ax1 = a.x;
    const ay1 = a.y;
    const ax2 = a.x + a.width;
    const ay2 = a.y + a.height;

    const bx1 = b.x;
    const by1 = b.y;
    const bx2 = b.x + b.width;
    const by2 = b.y + b.height;

    // Check for no overlap
    if (ax2 <= bx1 || ax1 >= bx2 || ay2 <= by1 || ay1 >= by2) {
        return null; // No collision
    }

    const overlapX1 = ax2 - bx1; // from left
    const overlapX2 = bx2 - ax1; // from right
    const overlapY1 = ay2 - by1; // from top
    const overlapY2 = by2 - ay1; // from bottom

    const mtvX = overlapX1 < overlapX2 ? -overlapX1 : overlapX2;
    const mtvY = overlapY1 < overlapY2 ? -overlapY1 : overlapY2;

    // Return the smallest axis of resolution
    if (Math.abs(mtvX) < Math.abs(mtvY)) {
        return { x: mtvX, y: 0 };
    } else {
        return { x: 0, y: mtvY };
    }
}

function toRect(position: PositionComponent, collider: ColliderComponent): Rect {
    return {
        x: position.x + collider.offsetX,
        y: position.y + collider.offsetY,
        width: collider.width,
        height: collider.height,
    };
}

export function physicsSystem(world: ECSWorld, dt: number) {
    const entities = world.queryEntities(["Position", "Collider"]);
    for (let i = 0; i < entities.length - 1; ++i) {
        for (let j = i + 1; j < entities.length; ++j) {
            const a = entities[i];
            const b = entities[j];
            const colliderA = world.getComponent<ColliderComponent>(a, ComponentType.COLLIDER)!;
            const colliderB = world.getComponent<ColliderComponent>(b, ComponentType.COLLIDER)!;
            if (!canCollide(colliderA, colliderB)) {
                continue;
            }

            const posB = world.getComponent<PositionComponent>(b, ComponentType.POSITION)!;
            const posA = world.getComponent<PositionComponent>(a, ComponentType.POSITION)!;

            const mtv = getMTV(toRect(posA, colliderA), toRect(posB, colliderB));
            if (!mtv) {
                continue;
            }

            // @TODO: resolve collision
            resolveCollision(a, b, mtv);

            const scriptA = world.getComponent<ScriptComponent>(a, ComponentType.SCRIPT);
            scriptA?.script.onCollision?.(b, colliderB.layer);
            const scriptB = world.getComponent<ScriptComponent>(b, ComponentType.SCRIPT);
            scriptB?.script.onCollision?.(a, colliderA.layer);
        }
    }
}