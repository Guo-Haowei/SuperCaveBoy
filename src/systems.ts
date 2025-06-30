import { ECSWorld } from './ecs';
import {
  Animation,
  Collider,
  ColliderLayer,
  Position,
  Sprite,
  Script,
  Velocity,
} from './components';
import { spriteManager } from './assets';
import { Rect, Vec2 } from './math';

import { Camera } from './camera';

// ------------------------------ Animation System -----------------------------
export function animationSystem(world: ECSWorld, dt: number) {
  for (const [_id, anim, sprite] of world.queryEntities<Animation, Sprite>(
    Animation.name,
    Sprite.name,
  )) {
    const clip = anim.animations[anim.current];
    if (!clip) continue;

    anim.elapsed += dt;
    const index = Math.floor((anim.elapsed / (clip.speed * 1000)) * clip.frames);

    sprite.sheetId = clip.sheetId;
    if (clip.loop) {
      sprite.frameIndex = index % clip.frames;
    } else {
      sprite.frameIndex = Math.min(index, clip.frames - 1);
    }
  }
}

// ------------------------------- Render System -------------------------------
export function renderSystem(world: ECSWorld, ctx: CanvasRenderingContext2D, camera: Camera) {
  const cameraX = camera.xoffset - 0.5 * WIDTH;
  const cameraY = camera.yoffset - 0.5 * HEIGHT - YOFFSET;

  // @TODO: culling
  for (const [id, sprite, pos] of world.queryEntities<Sprite, Position>(
    Sprite.name,
    Position.name,
  )) {
    const { x, y } = pos as Position;
    const { sheetId, frameIndex } = sprite as Sprite;

    const renderable = spriteManager.getFrame(sheetId, frameIndex);
    const { image, frame } = renderable;

    const dx = x - cameraX;
    const dy = y - cameraY;

    ctx.save();

    const vel = world.getComponent<Velocity>(id, Velocity.name);
    const flipLeft: number = vel && vel.vx < 0 ? 1 : 0;

    ctx.translate(dx + flipLeft * frame.width, dy);
    ctx.scale(flipLeft ? -1 : 1, 1);

    ctx.drawImage(
      image,
      frame.sourceX,
      frame.sourceY,
      frame.width,
      frame.height,
      0,
      0,
      frame.width,
      frame.height,
    );

    ctx.restore();
  }

  const DEBUG = true;
  if (DEBUG) {
    renderSystemDebug(world, ctx, camera);
  }
}

function renderSystemDebug(world: ECSWorld, ctx: CanvasRenderingContext2D, camera: Camera) {
  const cameraX = camera.xoffset - 0.5 * WIDTH;
  const cameraY = camera.yoffset - 0.5 * HEIGHT - YOFFSET;

  for (const [_, pos, collider] of world.queryEntities<Position, Collider>(
    Position.name,
    Collider.name,
  )) {
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
  for (const [_id, script] of world.queryEntities<Script>(Script.name)) {
    script.script.onUpdate?.(dt);
  }
}

// ------------------------------ Movement System ------------------------------
export function movementSystem(world: ECSWorld, dt: number) {
  for (const [_id, vel, pos] of world.queryEntities<Velocity, Position>(
    Velocity.name,
    Position.name,
  )) {
    pos.x += vel.vx * dt;
    pos.y += vel.vy * dt;
  }
}

// ------------------------------ Physics System -------------------------------
function canCollide(a: Collider, b: Collider): boolean {
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

function toRect(position: Position, collider: Collider): Rect {
  return {
    x: position.x + collider.offsetX,
    y: position.y + collider.offsetY,
    width: collider.width,
    height: collider.height,
  };
}

function resolveCollision(
  mtv: Vec2,
  posA: Position,
  posB: Position,
  colliderA: Collider,
  colliderB: Collider,
): void {
  if (colliderA.mass < colliderB.mass) {
    posA.x += mtv.x;
    posA.y += mtv.y;
  } else {
    posB.x -= mtv.x;
    posB.y -= mtv.y;
  }
}

export function physicsSystem(world: ECSWorld) {
  const entities = world.queryEntities<Collider, Position>(Collider.name, Position.name);

  for (let i = 0; i < entities.length - 1; ++i) {
    for (let j = i + 1; j < entities.length; ++j) {
      const [a, colliderA, posA] = entities[i];
      const [b, colliderB, posB] = entities[j];

      if (!canCollide(colliderA, colliderB)) {
        continue;
      }

      const mtv = getMTV(toRect(posA, colliderA), toRect(posB, colliderB));
      if (!mtv) {
        continue;
      }

      resolveCollision(mtv, posA, posB, colliderA, colliderB);

      const scriptA = world.getComponent<Script>(a, Script.name);
      scriptA?.script.onCollision?.(b, colliderB.layer);
      const scriptB = world.getComponent<Script>(b, Script.name);
      scriptB?.script.onCollision?.(a, colliderA.layer);
    }
  }
}
