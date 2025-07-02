import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  Collider,
  Name,
  Position,
  Instance,
  ScriptBase,
  Sprite,
  Velocity,
  Facing,
} from '../components';
import { SpriteSheets, assetManager } from '../engine/assets-manager';
import { inputManager } from '../engine/input-manager';
import { findGravityAndJumpVelocity, createLifeform, StateMachine } from './lifeform';
import { AABB } from '../engine/common';
import { CountDown } from '../engine/common';

const { GRAVITY, JUMP_VELOCITY } = findGravityAndJumpVelocity(180, 0.4);

type PlayerStateName = 'idle' | 'walk' | 'jump' | 'hurt';

class PlayerScript extends ScriptBase {
  static readonly MOVE_SPEED = 400;
  static readonly HURT_COOLDOWN = 0.5;

  private cooldown = new CountDown(PlayerScript.HURT_COOLDOWN);

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
            assetManager.snd_ouch.play();
            this.cooldown.reset();
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

    assetManager.snd_step.play();
    this.fsm.transition(walking ? 'walk' : 'idle');
  }

  private hurt(dt: number) {
    if (this.cooldown.tick(dt)) {
      this.fsm.transition('idle');
    }
  }

  onCollision(other: Entity, layer: number, selfBound: AABB, otherBound: AABB): void {
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);

    switch (layer) {
      case Collider.OBSTACLE:
        if (otherBound.above(selfBound)) {
          const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
          velocity.vy += JUMP_VELOCITY * 0.2;
          // @TODO: grab ledge
        }
        break;
      case Collider.ENEMY:
        if (selfBound.above(otherBound)) {
          // kill the enemy
          const script = this.world.getComponent<Instance>(other, Instance.name);
          script?.onDie();
          velocity.vy = -JUMP_VELOCITY * 0.5; // bounce up
        } else {
          const center = selfBound.center();
          const otherCenter = otherBound.center();

          const dx = center.x - otherCenter.x;
          velocity.vx = PlayerScript.MOVE_SPEED * (Math.sign(dx) || 1); // bounce back
          velocity.vy -= JUMP_VELOCITY * 0.2; // bounce up
          this.fsm.transition('hurt');
        }
        break;
      default:
        break;
    }
  }
}

export function createPlayer(ecs: ECSWorld, x: number, y: number): Entity {
  const id = createLifeform(
    ecs,
    32,
    62,
    Collider.PLAYER,
    Collider.ENEMY | Collider.OBSTACLE | Collider.EVENT | Collider.TRAP,
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
  ecs.addComponent(id, new Instance(script));
  return id;
}

// import { Rect } from '../common';
// import { assetManager } from '../assetManager';
// import { inputManager } from '../input-manager';

// export class Player {
//   constructor(x, y, speed, handler) {
//     this.x = x;
//     this.y = y;
//     this.speed = speed;

//     this.handler = handler;
//     this.face = DIRECTION.RIGHT;

//     this.jump_animation;
//     this.walk_animation;

//     this.currentState;
//     this.currentFrame;

//     this.grabbing = false;
//     this.hurt = false;

//     this.alpha = 1;

//     this.pausing = false;

//     this.alarm0 = new Alarm(this.handler);

//     this.alarm1 = new Alarm(this.handler);
//     this.walk_animation = new OldAnimation(2, handler._getGameAssets().spr_player_walk);
//     this.jump_animation = handler._getGameAssets().spr_player_jump;
//     this.currentFrame = this.jump_animation[1];
//     this.currentState = this._JumpingState;
//   }

//   _move() {
//     if (this.hspeed === 1) this.face = 1;
//     else if (this.hspeed === -1) this.face = 0;
//     if (this.x <= 60) {
//       this.x = 60;
//       this.state = ENTITY_STATES.IDLING;
//     } else if (this.x >= WWIDTH - 125) {
//       this.x = WWIDTH - 125;
//       this.state = ENTITY_STATES.IDLING;
//     }
//     // check collision with walls
//     if (!checkAllCollision(this, this.handler._getObstacles(), hCollision)) {
//       this.x += this.hspeed * this.speed;
//     }
//     this.grabbing = false;
//   }

//   _damageTrigger(x) {
//     this.grabbing = false;
//     this.alarm1._init(20);
//     this.alarm1._setScript(this.alarm1._quitDamangePlayer);
//     this._setState(this._DamagedState);
//     this.vspeed = -15;
//     if (this.x > x) {
//       this.hspeed = 1;
//     } else {
//       this.hspeed = -1;
//     }
//     assetManager.snd_ouch.play();
//   }

//   _DamagedState() {
//     // damaged state
//     this.hurt = true;
//     this._move();
//     this.currentFrame = this.handler._getGameAssets().spr_player_damage;
//   }

//   _GrabState = function () {
//     // grab state
//     this.currentFrame = this.handler._getGameAssets().spr_player_grab;
//   };

//   _IdlingState = function () {
//     // idling state
//     this.currentFrame = this.handler._getGameAssets().spr_player_idle;
//     if (this.hspeed !== 0) this.currentState = this._MovingState;
//   };

//   _MovingState = function () {
//     // moving state
//     if (this.hspeed === 0) {
//       this.currentState == this._IdlingState;
//       this.currentFrame = this.handler._getGameAssets().spr_player_idle;
//       return;
//     }
//     this._move();
//     this.currentFrame = this.walk_animation._getFrame();
//     this.walk_animation._tick();
//   };

//   _JumpingState = function () {
//     // jumping state
//     this.currentFrame = this.jump_animation[this.vspeed < 0 ? 0 : 1];
//     if (this.hspeed !== 0) this._move();
//   };

//   _revive = function () {
//     this.alarm0.activated = false;
//     this.alarm1.activated = false;
//     this.hspeed = 0;
//     this.vspeed = 0;
//     this.face = DIRECTION.RIGHT;
//     this.takingJump = false;
//     this.grabbing = false;
//     this.health = 3;
//     this.sapphire = 0;
//     this._setPos(SpawningX, SpawningY);
//     this._setState(this._JumpingState);
//     // reset camara pos
//     // Camera()._setoffset(480, SpawningY);
//     this.handler._getLevel()._init(true);
//   };

//   _tick() {
//     this.hurt = false;
//     if (this.pausing) {
//       return;
//     }
//     if (this.health <= 0) {
//       this._revive();
//     }
//     if (this.alarm0.activated) {
//       this.alarm0._tick();
//       if (this.alarm0.activated && this.alpha >= 0.1) this.alpha -= 0.1;
//       return;
//     }

//     // hspeed
//     if (!this.alarm1.activated && this.currentState != this._DamagedState) {
//       const leftDown = inputManager.isKeyDown('KeyA');
//       const rightDown = inputManager.isKeyDown('KeyD');
//       const direction = Number(rightDown) - Number(leftDown);
//       this.hspeed = direction;
//     }
//     // vspeed
//     const jumpPressed = inputManager.isKeyPressed('KeyW');
//     if (
//       jumpPressed &&
//       !this.alarm1.activated &&
//       this.currentState != this._DamagedState &&
//       ((this.takingJump && this.vspeed === 1.5) || this.grabbing)
//     ) {
//       if (!this.grabbing) {
//         this.vspeed = JUMPFORCE;
//       } else {
//         this.vspeed = -20;
//       }
//       this.currentState = this._JumpingState;
//       this.takingJump = false;
//       this.grabbing = false;
//     }
//     // check grabbing state
//     if (checkAllCollision(this, this.handler._getObstacles(), grabbingCollision)) {
//       this.grabbing = true;
//     }

//     if (this.alarm1.activated) {
//       this.alarm1._tick();
//     }
//     // vertical
//     if (this.grabbing && !this.hurt) {
//       this.currentState = this._GrabState;
//     } else {
//       if (checkAllCollision(this, this.handler._getObstacles(), downCollision)) {
//       } else {
//         this.y += this.vspeed;
//         this.vspeed += GRAVITY;
//       }
//       checkAllCollision(this, this.handler._getObstacles(), upCollision);
//     }
//     // tick state
//     this.currentState();
//     // tick handler
//   }

//   _land() {
//     if (this.vspeed === 0) return;
//     this.takingJump = true;
//     this.currentState = this._IdlingState;

//     assetManager.snd_step.play();

//     this.vspeed = 0;
//   }

//   _render(graphics) {
//     // this.currentFrame.draw(
//     //   graphics,
//     //   this.x - xoffset,
//     //   this.y - yoffset,
//     //   this.alpha,
//     //   this.face === 0 ? HORIZONTAL_FLIP : 0,
//     // );
//   }

//   _setState(state) {
//     this.currentState = state;
//   }

//   _setPos(x, y) {
//     this.x = x;
//     this.y = y;
//   }
// }
