import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  Collider,
  Instance,
  Health,
  Hitbox,
  Hurtbox,
  Grounded,
  Name,
  PendingDelete,
  Player,
  Rigid,
  Position,
  Sprite,
  Team,
  Trigger,
  Velocity,
} from '../components';
import { Direction, AABB, Vec2 } from './utils';
import { toAABB } from './utils';

export interface SystemContext {
  ecs: ECSWorld;
  damageCollision?: [Entity, Entity, Hitbox][];
  rigidCollision?: [Entity, Entity, Vec2][];
}

// ------------------------------ Animation System -----------------------------
export function animationSystem(world: SystemContext, dt: number) {
  const { ecs } = world;

  for (const [_id, anim, sprite] of ecs.queryEntities<Animation, Sprite>(
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

// ------------------------------- Script System -------------------------------
export function scriptSystem(world: SystemContext, dt: number) {
  for (const [_id, instance] of world.ecs.queryEntities<Instance>(Instance.name)) {
    instance.script.onUpdate?.(dt);
  }
}

// ------------------------------ Movement System ------------------------------
export function movementSystem(world: SystemContext, dt: number) {
  for (const [_id, vel, pos] of world.ecs.queryEntities<Velocity, Position>(
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

function isRigidPair(a?: Rigid, b?: Rigid): boolean {
  if (!a || !b) {
    return false;
  }
  return (a.layer & b.mask) !== 0 || (b.layer & a.mask) !== 0;
}

export function collisionSystem(world: SystemContext, _dt: number) {
  world.damageCollision = [];
  world.rigidCollision = [];

  const { ecs, damageCollision, rigidCollision } = world;
  const colliders = ecs.queryEntities<Collider>(Collider.name);
  ecs.removeAllComponents(Grounded.name);

  for (let i = 0; i < colliders.length - 1; ++i) {
    for (let j = i + 1; j < colliders.length; ++j) {
      const [id1, collider1] = colliders[i];
      const [id2, collider2] = colliders[j];
      const parent1 = collider1.parent;
      const parent2 = collider2.parent;
      const rigid1 = ecs.getComponent<Rigid>(id1, Rigid.name);
      const rigid2 = ecs.getComponent<Rigid>(id2, Rigid.name);
      const hitbox1 = ecs.getComponent<Hitbox>(id1, Hitbox.name);
      const hitbox2 = ecs.getComponent<Hitbox>(id2, Hitbox.name);
      const hurtbox1 = ecs.getComponent<Hurtbox>(id1, Hurtbox.name);
      const hurtbox2 = ecs.getComponent<Hurtbox>(id2, Hurtbox.name);
      const trigger1 = ecs.getComponent<Trigger>(id1, Trigger.name);
      const trigger2 = ecs.getComponent<Trigger>(id2, Trigger.name);

      const player1 = ecs.hasComponent(parent1, Player.name);
      const player2 = ecs.hasComponent(parent2, Player.name);
      const team1 = ecs.getComponent<Team>(parent1, Team.name);
      const team2 = ecs.getComponent<Team>(parent2, Team.name);

      const isRigid = isRigidPair(rigid1, rigid2);
      const twoHitOne = hurtbox1 && hitbox2 && team1?.value !== team2?.value;
      const oneHitTwo = hurtbox2 && hitbox1 && team1?.value !== team2?.value;
      const is1Trigger = trigger1 && player2;
      const is2Trigger = trigger2 && player1;

      // @TODO: make sure sum to 1
      const check =
        Number(isRigid) +
        Number(twoHitOne) +
        Number(oneHitTwo) +
        Number(is1Trigger) +
        Number(is2Trigger);
      if (check === 0) {
        continue;
      }

      if (check > 1) throw new Error('Invalid collider pair');

      const pos1 = ecs.getComponent<Position>(parent1, Position.name);
      const pos2 = ecs.getComponent<Position>(parent2, Position.name);
      if (!pos1 || !pos2) {
        // it's possible that the parent entity has been deleted
        continue;
      }
      const aabb1 = toAABB(pos1, collider1);
      const aabb2 = toAABB(pos2, collider2);

      const mtv = getMTV(aabb1, aabb2);
      if (!mtv) {
        continue;
      }

      if (twoHitOne) {
        damageCollision.push([parent2, parent1, hitbox2]);
        continue;
      } else if (oneHitTwo) {
        damageCollision.push([parent1, parent2, hitbox1]);
        continue;
      }

      if (isRigid) {
        const isFirstObstacle = rigid1.layer === Rigid.OBSTACLE;
        if (isFirstObstacle) {
          rigidCollision.push([parent1, parent2, mtv]);
        } else {
          rigidCollision.push([parent2, parent1, { x: -mtv.x, y: -mtv.y }]);
        }
        continue;
      }

      const instance1 = ecs.getComponent<Instance>(parent1, Instance.name);
      const instance2 = ecs.getComponent<Instance>(parent2, Instance.name);

      if (is1Trigger) {
        instance1?.script.onCollision(0, null, null);
      } else if (is2Trigger) {
        instance2?.script.onCollision(0, null, null);
      }
    }
  }
}

export function rigidCollisionSystem(world: SystemContext, _dt: number) {
  const { ecs, rigidCollision } = world;

  for (const [obstacle, obj, mtv] of rigidCollision) {
    const posA = ecs.getComponent<Position>(obstacle, Position.name);
    const posB = ecs.getComponent<Position>(obj, Position.name);
    if (!posA || !posB) {
      continue;
    }

    posB.x -= mtv.x;
    posB.y -= mtv.y;

    const direction = mtvToDirection(mtv);
    if (direction === Direction.DOWN) {
      ecs.addComponent(obj, new Grounded());
      const vel = ecs.getComponent<Velocity>(obj, Velocity.name);
      if (vel) {
        vel.vy = 1;
      }
    }

    const instanceA = ecs.getComponent<Instance>(obstacle, Instance.name);
    const instanceB = ecs.getComponent<Instance>(obj, Instance.name);

    instanceA?.script.onCollision?.(0, null, null);
    instanceB?.script.onCollision?.(0, null, null);
  }
}

export function damageSystem(world: SystemContext, dt: number) {
  const { ecs, damageCollision } = world;

  for (const [attacker, victim, hitbox] of damageCollision) {
    const health = ecs.getComponent<Health>(victim, Health.name);
    if (!hitbox || !health) {
      continue;
    }

    if (health.invulnerableTimeLeft <= 0) {
      health.health -= hitbox.damage;
      health.invulnerableTimeLeft = health.invulnerableTime;
    } else {
      health.invulnerableTimeLeft -= dt;
    }

    const instanceVictim = ecs.getComponent<Instance>(victim, Instance.name);
    const instanceAttacker = ecs.getComponent<Instance>(attacker, Instance.name);

    instanceVictim?.script.onHurt?.(attacker);
    instanceAttacker?.script.onHit?.(victim);
    // @TODO: if dead, onDie
    if (health.isDead()) {
      instanceVictim?.script.onDie?.();
    }
  }
}

export function deleteSystem(world: SystemContext) {
  const { ecs } = world;
  const pendingDeletes = ecs.queryEntities<PendingDelete>(PendingDelete.name);
  for (const [id] of pendingDeletes) {
    ecs.removeEntity(id);
  }
  ecs.removeAllComponents(PendingDelete.name);
}
