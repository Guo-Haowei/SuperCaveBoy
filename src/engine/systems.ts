import { ECSWorld } from '../ecs';
import {
  Animation,
  Camera,
  Collider,
  Dynamic,
  Facing,
  PendingDelete,
  Position,
  Sprite,
  Instance,
  Static,
  Velocity,
  Grounded,
} from '../components';
import { Room } from '../world/room';
import { assetManager } from './assets-manager';
import { Direction, AABB, Vec2 } from './common';
import { EditorState } from '../editor-state';

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
export function renderSystem(
  world: ECSWorld,
  ctx: CanvasRenderingContext2D,
  room: Room,
  cameraContext: { camera: Camera; pos: Position },
) {
  const { camera, pos } = cameraContext;

  ctx.clearRect(0, 0, camera.width, camera.height);

  const offset = camera.getOffset(pos);
  ctx.save();
  ctx.translate(-offset.x, -offset.y);
  ctx.scale(camera.zoom, camera.zoom);

  const renderables = world.queryEntities<Sprite, Position>(Sprite.name, Position.name);
  const sorted = renderables.sort((a, b) => b[1].zIndex - a[1].zIndex);

  for (const [id, sprite, pos] of sorted) {
    const { x, y } = pos as Position;
    const { sheetId, frameIndex } = sprite as Sprite;

    const renderable = assetManager.getFrame(sheetId, frameIndex);
    const { image, frame } = renderable;

    ctx.save();

    const facing = world.getComponent<Facing>(id, Facing.name);
    const flipLeft: number = facing && facing.left ? 1 : 0;

    ctx.translate(x + flipLeft * frame.width, y);
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

  if (EditorState.debugCollisions) {
    renderSystemDebug(world, ctx);
  }

  if (EditorState.debugGrid) {
    drawDebugGrid(ctx, room);
  }

  ctx.restore();
}

function drawDebugGrid(ctx: CanvasRenderingContext2D, room: Room) {
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  const { width, height, tileSize } = room;

  for (let x = 0; x <= width; ++x) {
    const pixelX = x * tileSize;
    ctx.beginPath();
    ctx.moveTo(pixelX, 0);
    ctx.lineTo(pixelX, height * tileSize);
    ctx.stroke();
  }

  for (let y = 0; y <= height; ++y) {
    const pixelY = y * tileSize;
    ctx.beginPath();
    ctx.moveTo(0, pixelY);
    ctx.lineTo(width * tileSize, pixelY);
    ctx.stroke();
  }
}

function renderSystemDebug(world: ECSWorld, ctx: CanvasRenderingContext2D) {
  for (const [_, pos, collider] of world.queryEntities<Position, Collider>(
    Position.name,
    Collider.name,
  )) {
    const { x, y } = pos;
    const { width, height, offsetX, offsetY, layer } = collider;

    const dx = x + offsetX;
    const dy = y + offsetY;

    let color: string;
    switch (layer) {
      case Collider.PLAYER:
        color = 'green';
        break;
      case Collider.ENEMY:
        color = 'red';
        break;
      case Collider.PORTAL:
        color = 'purple';
        break;
      case Collider.EVENT:
        color = 'orange';
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
  for (const [_id, script] of world.queryEntities<Instance>(Instance.name)) {
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

function getMTV(a: AABB, b: AABB): Vec2 | null {
  const ax1 = a.xMin;
  const ay1 = a.yMin;
  const ax2 = a.xMax;
  const ay2 = a.yMax;

  const bx1 = b.xMin;
  const by1 = b.yMin;
  const bx2 = b.xMax;
  const by2 = b.yMax;

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

function mtvToDirection(mtv: Vec2): Direction {
  if (mtv.x) {
    return mtv.x < 0 ? Direction.LEFT : Direction.RIGHT;
  } else {
    return mtv.y < 0 ? Direction.UP : Direction.DOWN;
  }
}

function toAABB(pos: Position, collider: Collider): AABB {
  const { offsetX, offsetY, width, height } = collider;
  return new AABB(
    pos.x + offsetX,
    pos.y + offsetY,
    pos.x + offsetX + width,
    pos.y + offsetY + height,
  );
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

      const aabb1 = toAABB(staticPos, staticCollider);
      const aabb2 = toAABB(dynamicPos, dynamicCollider);
      const mtv = getMTV(aabb1, aabb2);
      if (!mtv) {
        continue;
      }

      // push the dynamic collider out of the static one
      dynamicPos.x -= mtv.x;
      dynamicPos.y -= mtv.y;

      const direction = mtvToDirection(mtv);

      world
        .getComponent<Instance>(s, Instance.name)
        ?.onCollision(d, dynamicCollider.layer, aabb1, aabb2);
      world
        .getComponent<Instance>(d, Instance.name)
        ?.onCollision(s, staticCollider.layer, aabb2, aabb1);

      if (direction === Direction.DOWN && staticCollider.layer === Collider.OBSTACLE) {
        world.addComponent(d, new Grounded());
        const vel = world.getComponent<Velocity>(d, Velocity.name);
        if (vel) {
          vel.vy = 1;
        }
      }
    }
  }

  for (let i = 0; i < dynamicColliders.length - 1; ++i) {
    for (let j = i + 1; j < dynamicColliders.length; ++j) {
      const [d1, _dynamic1, collider1, pos1] = dynamicColliders[i];
      const [d2, _dynamic2, collider2, pos2] = dynamicColliders[j];

      if (!canCollide(collider1, collider2)) {
        continue;
      }

      const aabb1 = toAABB(pos1, collider1);
      const aabb2 = toAABB(pos2, collider2);
      const mtv = getMTV(aabb1, aabb2);
      if (!mtv) {
        continue;
      }

      world
        .getComponent<Instance>(d1, Instance.name)
        ?.onCollision(d2, collider2.layer, aabb1, aabb2);
      world
        .getComponent<Instance>(d2, Instance.name)
        ?.onCollision(d1, collider1.layer, aabb2, aabb1);
    }
  }
}

export function deleteSystem(world: ECSWorld) {
  const pendingDeletes = world.queryEntities<PendingDelete>(PendingDelete.name);
  for (const [id] of pendingDeletes) {
    world.removeEntity(id);
  }
  world.removeAllComponents(PendingDelete.name);
}
