import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  ColliderArea,
  Health,
  Facing,
  Instance,
  Player,
  Position,
  Name,
  Rigid,
  Sprite,
  Team,
  Velocity,
} from '../components';
import {
  findGravityAndJumpVelocity,
  createLifeform,
  StateMachine,
  LifeformScript,
} from './lifeform';
import { CountDown } from '../engine/utils';
import { TeamNumber } from './defines';

import { SpriteSheets, assetManager } from '../engine/assets-manager';
import { inputManager } from '../engine/input-manager';

const { GRAVITY, JUMP_VELOCITY } = findGravityAndJumpVelocity(170, 0.4);

type PlayerStateName = 'idle' | 'walk' | 'jumping' | 'hurt' | 'sliding';

class PlayerScript extends LifeformScript {
  static readonly HURT_COOLDOWN = 0.8;
  static readonly MOVE_SPEED = 400;
  static readonly MAX_HEALTH = 10000;

  private damageCooldown = new CountDown(PlayerScript.HURT_COOLDOWN);

  private wall = 0;

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
        jumping: {
          name: 'jumping',
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
        sliding: {
          name: 'sliding',
          enter: () => {
            const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
            vel.vx = 0;
            vel.vy = 0;
            vel.gravity = 0.3 * GRAVITY;
            this.playAnim('hang');
          },
          exit: () => {
            const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
            vel.gravity = GRAVITY;
            this.wall = 0;
          },
          update: () => this.slide(),
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
      return leftDown ? -1 : 1;
    }
    return 0;
  }

  private tryJump(velocity: Velocity) {
    if (this.inputUp() && this.isGrounded()) {
      velocity.vy = -JUMP_VELOCITY;
      return true;
    }
    return false;
  }

  private checkSliding() {
    const info = this.getCollisionInfo();
    if (!info) {
      return 0;
    }
    if (info.leftWall) {
      return -1;
    }
    if (info.rightWall) {
      return 1;
    }
    return 0;
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
      this.fsm.transition('jumping');
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
      this.fsm.transition('jumping');
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
      this.wall = this.checkSliding();
      if (this.wall) {
        this.fsm.transition('sliding');
        return;
      }
      return;
    }

    assetManager.snd_step.play();
    this.fsm.transition(walking ? 'walk' : 'idle');
  }

  private slide() {
    if (this.isGrounded()) {
      this.fsm.transition('idle');
      return;
    }

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);

    const jumpPressed = this.inputUp();
    if (jumpPressed) {
      const walking = this.tryWalk(vel);
      if ((this.wall === -1 && walking === 1) || (this.wall === 1 && walking === -1)) {
        this.wall = 0; // reset wall state
        this.fsm.transition('jumping');
        vel.vy = -JUMP_VELOCITY;
        return;
      }
    }
  }

  private hurt(dt: number) {
    if (this.damageCooldown.tick(dt)) {
      this.fsm.transition('idle');
    }
  }

  onHurt(_attacker: number) {
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);

    velocity.vx = PlayerScript.MOVE_SPEED * (Math.sign(velocity.vx) || 1); // bounce back
    velocity.vy -= JUMP_VELOCITY * 0.2; // bounce up
    this.fsm.transition('hurt');
  }

  onHit(_victim: number): void {
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    velocity.vy = -JUMP_VELOCITY * 0.5; // bounce up
    assetManager.snd_step.play();
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
    width: 12,
    height: 12,
    offsetX: 26,
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
      hang: {
        sheetId: SpriteSheets.PLAYER_HANG,
        frames: 1,
        speed: 1,
        loop: true,
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
  ecs.addComponent(id, new Team(TeamNumber.PLAYER));
  ecs.addComponent(id, new Health(PlayerScript.MAX_HEALTH, PlayerScript.HURT_COOLDOWN));

  const script = new PlayerScript(id, ecs);
  ecs.addComponent(id, new Instance(script));
  return id;
}
