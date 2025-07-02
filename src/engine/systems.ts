/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ECSWorld } from '../ecs';
import {
  Animation,
  Camera,
  Collider,
  Instance,
  Facing,
  Hitbox,
  Hurtbox,
  Grounded,
  Name,
  PendingDelete,
  Rigid,
  Position,
  Sprite,
  Team,
  Trigger,
  Velocity,
} from '../components';
import { Room } from '../world/room';
import { assetManager } from './assets-manager';
import { Direction, AABB, Vec2 } from './utils';
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
    drawDebugCollider(world, ctx);
  }

  if (EditorState.debugGrid) {
    drawDebugGrid(ctx, room);
  }

  ctx.restore();
}

function drawDebugGrid(ctx: CanvasRenderingContext2D, room: Room) {
  ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
  ctx.lineWidth = 1;
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

function drawDebugCollider(world: ECSWorld, ctx: CanvasRenderingContext2D) {
  for (const [id, collider] of world.queryEntities<Collider>(Collider.name)) {
    const pos = world.getComponent<Position>(collider.parent, Position.name);
    const { x, y } = pos;
    const { width, height, offsetX, offsetY } = collider;

    const rigid = world.getComponent<Rigid>(id, Rigid.name);
    const isHitbox = world.hasComponent(id, Hitbox.name);
    const isHurtbox = world.hasComponent(id, Hurtbox.name);
    const isTrigger = world.hasComponent(id, Trigger.name);

    const dx = x + offsetX;
    const dy = y + offsetY;

    let color = 'organge';
    if (rigid) {
      if (rigid.layer === Rigid.ENEMY) color = 'red';
      if (rigid.layer === Rigid.OBSTACLE) color = 'blue';
    }
    if (isHitbox) {
      color = 'green';
    }
    if (isHurtbox) {
      color = 'yellow';
    }
    if (isTrigger) {
      color = 'purple';
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
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

function isRigidPair(a?: Rigid, b?: Rigid): boolean {
  if (!a || !b) {
    return false;
  }
  return (a.layer & b.mask) !== 0 || (b.layer & a.mask) !== 0;
}

function isTriggerPair(
  world: ECSWorld,
  id1: number,
  id2: number,
  trigger1?: Trigger,
  trigger2?: Trigger,
): boolean {
  if (!trigger1 && !trigger2) {
    return false;
  }
  const team1 = world.getComponent<Team>(id1, Team.name);
  const team2 = world.getComponent<Team>(id2, Team.name);

  if (trigger1 && trigger1.filter & (team2 ? team2.value : 0)) {
    return true;
  }

  if (trigger2 && trigger2.filter & (team1 ? team1.value : 0)) {
    return true;
  }

  return false;
}

export function physicsSystem(world: ECSWorld, _dt: number) {
  const colliders = world.queryEntities<Collider>(Collider.name);
  world.removeAllComponents(Grounded.name);

  for (let i = 0; i < colliders.length - 1; ++i) {
    for (let j = i + 1; j < colliders.length; ++j) {
      const [id1, collider1] = colliders[i];
      const [id2, collider2] = colliders[j];
      const parent1 = collider1.parent;
      const parent2 = collider2.parent;
      const rigid1 = world.getComponent<Rigid>(id1, Rigid.name);
      const rigid2 = world.getComponent<Rigid>(id2, Rigid.name);
      const hitbox1 = world.getComponent<Hitbox>(id1, Hitbox.name);
      const hitbox2 = world.getComponent<Hitbox>(id2, Hitbox.name);
      const hurtbox1 = world.getComponent<Hurtbox>(id1, Hurtbox.name);
      const hurtbox2 = world.getComponent<Hurtbox>(id2, Hurtbox.name);
      const trigger1 = world.getComponent<Trigger>(id1, Trigger.name);
      const trigger2 = world.getComponent<Trigger>(id2, Trigger.name);

      const isRigid = isRigidPair(rigid1, rigid2);
      const isHitbox = (hitbox1 && hurtbox2) || (hitbox2 && hurtbox1);
      const isTrigger = isTriggerPair(world, id1, id2, trigger1, trigger2);

      // @TODO: make sure sum to 1
      const check = Number(isRigid) + Number(isHitbox) + Number(isTrigger);
      if (check === 0) {
        continue;
      }

      if (check > 1) throw new Error('Invalid collider pair');

      const pos1 = world.getComponent<Position>(parent1, Position.name)!;
      const pos2 = world.getComponent<Position>(parent2, Position.name)!;
      const aabb1 = toAABB(pos1, collider1);
      const aabb2 = toAABB(pos2, collider2);

      const mtv = getMTV(aabb1, aabb2);
      if (!mtv) {
        continue;
      }

      if (isRigid) {
        const direction = mtvToDirection(mtv);

        const isFirstObstacle = rigid1.layer === Rigid.OBSTACLE;
        const isSecondObstacle = rigid2.layer === Rigid.OBSTACLE;

        if (isFirstObstacle) {
          pos2.x -= mtv.x;
          pos2.y -= mtv.y;
        } else if (isSecondObstacle) {
          pos1.x += mtv.x;
          pos1.y += mtv.y;
        } else {
          throw new Error(
            'Invalid collision pair: ' +
              `${world.getComponent<Name>(parent1, Name.name)?.value}` +
              ' with ' +
              `${world.getComponent<Name>(parent2, Name.name)?.value}`,
          );
        }

        const parent = isFirstObstacle ? parent2 : parent1;

        if (
          (isFirstObstacle && direction === Direction.DOWN) ||
          (isSecondObstacle && direction === Direction.UP)
        ) {
          world.addComponent(parent, new Grounded());
          const vel = world.getComponent<Velocity>(parent, Velocity.name);
          if (vel) {
            vel.vy = 1;
          }
        }
      }

      world.getComponent<Instance>(parent1, Instance.name)?.onCollision(parent2, aabb1, aabb2);
      world.getComponent<Instance>(parent2, Instance.name)?.onCollision(parent1, aabb2, aabb1);
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
