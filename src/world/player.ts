import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  Collider,
  ColliderArea,
  Name,
  Position,
  Instance,
  Player,
  ScriptBase,
  Sprite,
  Velocity,
  Facing,
  Rigid,
} from '../components';
import { SpriteSheets, assetManager } from '../engine/assets-manager';
import { inputManager } from '../engine/input-manager';
import { findGravityAndJumpVelocity, createLifeform, StateMachine } from './lifeform';
import { AABB } from '../engine/utils';
import { CountDown } from '../engine/utils';
import { TeamNumber } from './defines';

const { GRAVITY, JUMP_VELOCITY } = findGravityAndJumpVelocity(180, 0.4);

type PlayerStateName = 'idle' | 'walk' | 'jump' | 'hurt';

class PlayerScript extends ScriptBase {
  static readonly MOVE_SPEED = 400;
  static readonly HURT_COOLDOWN = 0.5;

  private damageCooldown = new CountDown(PlayerScript.HURT_COOLDOWN);

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
            this.damageCooldown.reset();
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
    if (this.damageCooldown.tick(dt)) {
      this.fsm.transition('idle');
    }
  }

  onHurt(selfBound: AABB, otherBound: AABB) {
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const center = selfBound.center();
    const otherCenter = otherBound.center();

    const dx = center.x - otherCenter.x;
    velocity.vx = PlayerScript.MOVE_SPEED * (Math.sign(dx) || 1); // bounce back
    velocity.vy -= JUMP_VELOCITY * 0.2; // bounce up
    this.fsm.transition('hurt');
  }

  onCollision(other: Entity, selfBound: AABB, otherBound: AABB): void {
    // switch (layer) {
    // case Collider.OBSTACLE:
    //   if (otherBound.above(selfBound)) {
    //     const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    //     velocity.vy += JUMP_VELOCITY * 0.2;
    //     // @TODO: grab ledge
    //   }
    //   break;
    // case Collider.ENEMY:
    //   // kill the enemy if above
    //   if (selfBound.above(otherBound)) {
    //     const script = this.world.getComponent<Instance>(other, Instance.name);
    //     script?.onDie();
    //     velocity.vy = -JUMP_VELOCITY * 0.5; // bounce up
    //   } else {
    //   }
    //   break;
    //   default:
    //     break;
    // }
  }
}

export function createPlayer(ecs: ECSWorld, x: number, y: number): Entity {
  const rigidArea: ColliderArea = {
    width: 32,
    height: 62,
    offsetX: 16,
    offsetY: 10,
  };

  const hurtArea: ColliderArea = {
    width: 32,
    height: 42,
    offsetX: 16,
    offsetY: 10,
  };

  const hitArea: ColliderArea = {
    width: 32,
    height: 12,
    offsetX: 16,
    offsetY: 60,
  };

  const id = createLifeform(ecs, TeamNumber.PLAYER, Rigid.PLAYER, rigidArea, hurtArea, hitArea);

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
  ecs.addComponent(id, new Player());

  const script = new PlayerScript(id, ecs);
  ecs.addComponent(id, new Instance(script));
  return id;
}

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

//   _GrabState = function () {
//     // grab state
//     this.currentFrame = this.handler._getGameAssets().spr_player_grab;
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
