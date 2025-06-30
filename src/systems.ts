import { Entity, ECSWorld } from './ecs';
import {
    ComponentType,
    AnimationComponent,
    ColliderComponent,
    ColliderLayer,
    PositionComponent,
    SpriteComponent,
    ScriptComponent,
    VelocityComponent,
} from './components';
import { spriteManager } from './assets';
import { Rect, Vec2 } from './math';

// ------------------------------ Animation System -----------------------------
export function animationSystem(world: ECSWorld, dt: number) {
    for (const entity of world.queryEntities([ComponentType.ANIMATION, ComponentType.SPRITE])) {
        const anim = world.getComponent<AnimationComponent>(entity, ComponentType.ANIMATION);
        const sprite = world.getComponent<SpriteComponent>(entity, ComponentType.SPRITE);

        const clip = anim.animations[anim.current];
        if (!clip) continue;

        anim.elapsed += dt;
        const index = Math.floor(anim.elapsed / (clip.speed * 1000) * clip.frames);

        sprite.sheetId = clip.sheetId;
        if (clip.loop) {
            sprite.frameIndex = index % clip.frames;
        } else {
            sprite.frameIndex = Math.min(index, clip.frames - 1);
        }
    }
}

// ------------------------------- Render System -------------------------------
export function renderSystem(world: ECSWorld, ctx: CanvasRenderingContext2D, camera: any) {
    const cameraX = camera.xoffset - 0.5 * WIDTH;
    const cameraY = camera.yoffset - 0.5 * HEIGHT - YOFFSET;

    // @TODO: culling
    for (const entity of world.queryEntities([ComponentType.POSITION, ComponentType.SPRITE])) {
        const pos = world.getComponent<PositionComponent>(entity, ComponentType.POSITION);
        const sprite = world.getComponent<SpriteComponent>(entity, ComponentType.SPRITE);
        const animation = world.getComponent<AnimationComponent>(entity, ComponentType.ANIMATION);

        const { x, y } = pos;
        let { sheetId, frameIndex } = sprite;

        const renderable = spriteManager.getFrame(sheetId, frameIndex);
        const { image, frame } = renderable;

        const dx = x - cameraX;
        const dy = y - cameraY;

        ctx.save();

        const vel = world.getComponent<VelocityComponent>(entity, ComponentType.VELOCITY);
        const flipLeft: number = vel && vel.vx < 0 ? 1 : 0;

        ctx.translate(dx + flipLeft * frame.width, dy);
        ctx.scale(flipLeft ? -1: 1, 1);

        ctx.drawImage(image, frame.sourceX, frame.sourceY, frame.width, frame.height, 0, 0, frame.width, frame.height);

        ctx.restore();
    }

    const DEBUG = true;
    if (DEBUG) {
        renderSystemDebug(world, ctx, camera);
    }
}

function renderSystemDebug(world: ECSWorld, ctx: CanvasRenderingContext2D, camera: any) {
    const cameraX = camera.xoffset - 0.5 * WIDTH;
    const cameraY = camera.yoffset - 0.5 * HEIGHT - YOFFSET;

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

// ------------------------------- Script System -------------------------------
export function scriptSystem(world: ECSWorld, dt: number) {
    for (const entity of world.queryEntities([ComponentType.SCRIPT, ComponentType.POSITION])) {
        const script = world.getComponent<ScriptComponent>(entity, ComponentType.SCRIPT)!;
        const pos = world.getComponent<PositionComponent>(entity, ComponentType.POSITION)!;

        script.script.onUpdate?.(dt);
    }
}

// ------------------------------ Movement System ------------------------------
export function movementSystem(world: ECSWorld, dt: number) {
    for (const entity of world.queryEntities([ComponentType.POSITION, ComponentType.VELOCITY])) {
        const pos = world.getComponent<PositionComponent>(entity, ComponentType.POSITION)!;
        const vel = world.getComponent<VelocityComponent>(entity, ComponentType.VELOCITY)!;

        pos.x += vel.vx * dt;
        pos.y += vel.vy * dt;
    }
}

// ------------------------------ Physics System -------------------------------
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

    if (ax2 <= bx1 || ax1 >= bx2 || ay2 <= by1 || ay1 >= by2) {
        return null;
    }

    const overlapX1 = ax2 - bx1; // from left
    const overlapX2 = bx2 - ax1; // from right
    const overlapY1 = ay2 - by1; // from top
    const overlapY2 = by2 - ay1; // from bottom

    const mtvX = overlapX1 < overlapX2 ? -overlapX1 : overlapX2;
    const mtvY = overlapY1 < overlapY2 ? -overlapY1 : overlapY2;

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

function resolveCollision(
    mtv: Vec2,
    posA: PositionComponent,
    posB: PositionComponent,
    colliderA: ColliderComponent,
    colliderB: ColliderComponent
): void {
    if (colliderA.mass < colliderB.mass) {
        posA.x += mtv.x;
        posA.y += mtv.y;
    } else {
        posB.x -= mtv.x;
        posB.y -= mtv.y;
    }
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

            resolveCollision(mtv, posA, posB, colliderA, colliderB);

            const scriptA = world.getComponent<ScriptComponent>(a, ComponentType.SCRIPT);
            scriptA?.script.onCollision?.(b, colliderB.layer);
            const scriptB = world.getComponent<ScriptComponent>(b, ComponentType.SCRIPT);
            scriptB?.script.onCollision?.(a, colliderA.layer);
        }
    }
}