import { ECSWorld } from './ecs';
import {
  Animation,
  Collider,
  CollisionLayer,
  Dynamic,
  Facing,
  Position,
  Sprite,
  Script,
  Static,
  Velocity,
  Grounded,
} from './components';
import { spriteManager } from './assets';
import { Direction, Rect, Vec2 } from './common';

// ------------------------------ Animation System -----------------------------
export function animationSystem(world: ECSWorld, dt: number) {
  for (const [_id, anim, sprite] of world.queryEntities<Animation, Sprite>(
    Animation.name,
    Sprite.name,
  )) {
    const clip = anim.animations[anim.current];
    if (!clip) continue;

    anim.elapsed += dt;
    const index = Math.floor((anim.elapsed / clip.speed) * clip.frames);

    sprite.sheetId = clip.sheetId;
    if (clip.loop) {
      sprite.frameIndex = index % clip.frames;
    } else {
      sprite.frameIndex = Math.min(index, clip.frames - 1);
    }
  }
}

// ------------------------------- Render System -------------------------------
export function renderSystem(world: ECSWorld, ctx: CanvasRenderingContext2D, offset: Vec2) {
  // @TODO: camera culling
  const cameraX = offset.x - 0.5 * WIDTH;
  const cameraY = offset.y - 0.5 * HEIGHT - YOFFSET;

  const renderables = world.queryEntities<Sprite, Position>(Sprite.name, Position.name);
  const sorted = renderables.sort((a, b) => b[1].zIndex - a[1].zIndex);

  for (const [id, sprite, pos] of sorted) {
    const { x, y } = pos as Position;
    const { sheetId, frameIndex } = sprite as Sprite;

    const renderable = spriteManager.getFrame(sheetId, frameIndex);
    const { image, frame } = renderable;

    const dx = x - cameraX;
    const dy = y - cameraY;

    ctx.save();

    const facing = world.getComponent<Facing>(id, Facing.name);
    const flipLeft: number = facing && facing.left ? 1 : 0;

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
    renderSystemDebug(world, ctx, offset);
  }
}

function renderSystemDebug(world: ECSWorld, ctx: CanvasRenderingContext2D, offset: Vec2) {
  const cameraX = offset.x - 0.5 * WIDTH;
  const cameraY = offset.y - 0.5 * HEIGHT - YOFFSET;

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
      case CollisionLayer.PLAYER:
        color = 'green';
        break;
      case CollisionLayer.ENEMY:
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
    script.onUpdate(dt);
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
    if (vel.gravity) {
      vel.vy += vel.gravity * dt;
    }
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

function toRect(pos: Position, collider: Collider): Rect {
  const { offsetX, offsetY, width, height } = collider;
  const rect = { x: pos.x + offsetX, y: pos.y + offsetY, width, height };
  return rect;
}

export function physicsSystem(world: ECSWorld, _dt: number) {
  const staticColliders = world.queryEntities<Static, Collider, Position>(
    Static.name,
    Collider.name,
    Position.name,
  );
  const dynamicColliders = world.queryEntities<Dynamic, Collider, Position>(
    Dynamic.name,
    Collider.name,
    Position.name,
  );

  world.removeAllComponents(Grounded.name);

  // test static dynamic collisions
  for (const [s, _static, staticCollider, staticPos] of staticColliders) {
    for (const [d, _dynamic, dynamicCollider, dynamicPos] of dynamicColliders) {
      if (!canCollide(staticCollider, dynamicCollider)) {
        continue;
      }

      const mtv = getMTV(toRect(staticPos, staticCollider), toRect(dynamicPos, dynamicCollider));
      if (!mtv) {
        continue;
      }

      // push the dynamic collider out of the static one
      dynamicPos.x -= mtv.x;
      dynamicPos.y -= mtv.y;

      let direction = Direction.NONE;
      if (mtv.x) {
        direction = mtv.x < 0 ? Direction.LEFT : Direction.RIGHT;
      } else {
        direction = mtv.y < 0 ? Direction.UP : Direction.DOWN;
      }

      world.getComponent<Script>(s, Script.name)?.onCollision(d, dynamicCollider.layer, direction);
      world.getComponent<Script>(d, Script.name)?.onCollision(s, staticCollider.layer, -direction);

      if (direction === Direction.DOWN && staticCollider.layer === CollisionLayer.OBSTACLE) {
        world.addComponent(d, new Grounded());
        const vel = world.getComponent<Velocity>(d, Velocity.name);
        if (vel) {
          vel.vy = 1;
        }
      }
    }
  }

  // test dynamic dynamic collisions
}
