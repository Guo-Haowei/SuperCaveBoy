import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  CollisionLayer,
  Name,
  Position,
  Script,
  ScriptBase,
  Sprite,
  Velocity,
  Facing,
} from '../components';
import { SpriteSheets } from '../assets';
import { inputManager } from '../input-manager';
import { findGravityAndJumpVelocity, createLifeform, StateMachine } from './lifeform-common';
import { AABB } from '../common';

const { GRAVITY, JUMP_VELOCITY } = findGravityAndJumpVelocity(180, 0.4);

type PlayerStateName = 'idle' | 'walk' | 'jump' | 'hurt';

class PlayerScript extends ScriptBase {
  static readonly MOVE_SPEED = 400;
  static readonly HURT_COOLDOWN = 0.5;

  private cooldown: number;

  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.gravity = GRAVITY;

    this.fsm = new StateMachine<PlayerStateName>(
      {
        idle: {
          name: 'idle',
          enter: () => this.playAnim('idle'),
          update: () => this.idle(),
        },
        walk: {
          name: 'walk',
          enter: () => this.playAnim('walk'),
          update: () => this.walk(),
        },
        jump: {
          name: 'jump',
          update: () => this.jump(),
        },
        hurt: {
          name: 'hurt',
          enter: () => {
            this.playAnim('hurt');
            this.cooldown = PlayerScript.HURT_COOLDOWN;
          },
          update: (dt) => this.hurt(dt),
        },
      },
      'walk',
    );
  }

  private inputLeft() {
    return inputManager.isKeyDown('ArrowLeft') || inputManager.isKeyDown('KeyA');
  }

  private inputRight() {
    return inputManager.isKeyDown('ArrowRight') || inputManager.isKeyDown('KeyD');
  }

  private inputUp() {
    return inputManager.isKeyPressed('ArrowUp') || inputManager.isKeyPressed('KeyW');
  }

  private tryWalk(velocity: Velocity) {
    const leftDown = this.inputLeft();
    const rightDown = this.inputRight();
    const direction = Number(rightDown) - Number(leftDown);

    velocity.vx = direction * PlayerScript.MOVE_SPEED;
    if (leftDown || rightDown) {
      const facing = this.world.getComponent<Facing>(this.entity, Facing.name);
      facing.left = direction < 0;
      return true;
    }
    return false;
  }

  private tryJump(velocity: Velocity) {
    if (this.inputUp() && this.isGrounded()) {
      velocity.vy = -JUMP_VELOCITY;
      return true;
    }
    return false;
  }

  private checkFalling(velocity: Velocity) {
    if (this.isGrounded()) {
      return false;
    }
    const anim = this.world.getComponent<Animation>(this.entity, Animation.name);
    anim.current = 'jump';
    if (velocity.vy < 0) {
      anim.elapsed = 0.1;
    } else {
      anim.elapsed = 5.1;
    }
    return true;
  }

  private idle() {
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const walking = this.tryWalk(vel);
    this.tryJump(vel);
    if (!this.isGrounded()) {
      this.fsm.transition('jump');
      return;
    }
    if (walking) {
      this.fsm.transition('walk');
    }
  }

  private walk() {
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const walking = this.tryWalk(vel);
    this.tryJump(vel);
    if (!this.isGrounded()) {
      this.fsm.transition('jump');
      return;
    }
    if (!walking) {
      this.fsm.transition('idle');
    }
  }

  private jump() {
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const walking = this.tryWalk(velocity);
    const jumping = this.checkFalling(velocity);
    if (jumping) {
      return;
    }
    this.fsm.transition(walking ? 'walk' : 'idle');
  }

  private hurt(dt: number) {
    this.cooldown -= dt;
    this.cooldown = Math.max(this.cooldown, 0);
    if (this.cooldown == 0) {
      this.fsm.transition('idle');
    }
  }

  onCollision(other: Entity, layer: number, selfBound: AABB, otherBound: AABB): void {
    if (layer === CollisionLayer.OBSTACLE) {
      if (otherBound.above(selfBound)) {
        const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
        velocity.vy += JUMP_VELOCITY * 0.2;
        // @TODO: grab ledge
      }
      return;
    }
    if (layer === CollisionLayer.ENEMY) {
      if (selfBound.above(otherBound)) {
        // kill the enemy
        const script = this.world.getComponent<Script>(other, Script.name);
        script?.onDie();
      } else {
        const center = selfBound.center();
        const otherCenter = otherBound.center();

        const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
        const dx = center.x - otherCenter.x;
        velocity.vx = PlayerScript.MOVE_SPEED * (Math.sign(dx) || 1); // bounce back
        velocity.vy -= JUMP_VELOCITY * 0.05; // bounce up
        this.fsm.transition('hurt');
      }
      return;
    }
  }
}

export function createPlayer(ecs: ECSWorld, x: number, y: number): Entity {
  const id = createLifeform(
    ecs,
    32,
    62,
    CollisionLayer.PLAYER,
    CollisionLayer.ENEMY | CollisionLayer.OBSTACLE | CollisionLayer.EVENT | CollisionLayer.TRAP,
    16,
    10,
  );

  const anim = new Animation(
    {
      idle: {
        sheetId: SpriteSheets.PLAYER_IDLE,
        frames: 1,
        speed: 1,
        loop: true,
      },
      walk: {
        sheetId: SpriteSheets.PLAYER_WALK,
        frames: 8,
        speed: 1,
        loop: true,
      },
      jump: {
        sheetId: SpriteSheets.PLAYER_JUMP,
        frames: 2,
        speed: 10.0,
        loop: false,
      },
      hurt: {
        sheetId: SpriteSheets.PLAYER_DAMAGE,
        frames: 1,
        speed: 1,
        loop: false,
      },
    },
    'idle',
  );

  ecs.addComponent(id, new Name('Player'));
  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Velocity());
  ecs.addComponent(id, new Facing(false));
  ecs.addComponent(id, new Sprite(SpriteSheets.PLAYER_IDLE));
  ecs.addComponent(id, anim);

  const script = new PlayerScript(id, ecs);
  ecs.addComponent(id, new Script(script));
  return id;
}
