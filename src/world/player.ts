import { ECSWorld, Entity } from '../engine/ecs';
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
} from '../engine/components';
import {
  findGravityAndJumpVelocity,
  createLifeform,
  StateMachine,
  LifeformScript,
  getUpDownGrid,
} from './lifeform';
import { CountDown } from '../engine/utils';
import { TeamNumber } from './defines';

import { SpriteSheets, assetManager } from '../engine/assets-manager';
import { inputManager } from '../engine/input-manager';
import { roomManager } from '../engine/room-manager';
import { GridType } from './room';

const { GRAVITY, JUMP_VELOCITY } = findGravityAndJumpVelocity(170, 0.4);

export const PlayerData = {
  health: 3,
  sapphire: 0,
};

type PlayerStateName = 'idle' | 'walk' | 'jumping' | 'hurt' | 'hanging';

class PlayerScript extends LifeformScript {
  static readonly HURT_COOLDOWN = 0.8;
  static readonly MOVE_SPEED = 400;
  static readonly MAX_HEALTH = 10000;

  private damageCooldown = new CountDown(PlayerScript.HURT_COOLDOWN);
  private hangingDirection = 0; // -1 for left, 1 for right, 0 for none

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
        hanging: {
          name: 'hanging',
          enter: () => {
            const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
            vel.vx = 0;
            vel.vy = 0;
            vel.gravity = 0;
            this.playAnim('hang');
          },
          exit: () => {
            const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
            this.hangingDirection = 0;
            vel.gravity = GRAVITY;
          },
          update: () => this.hang(),
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

  private checkHanging() {
    const info = this.getCollisionInfo();
    if (!(info && (info.leftWall || info.rightWall))) {
      return 0;
    }

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    if (vel.vy < 0) {
      return 0;
    }

    const room = roomManager.getCurrentRoom();
    const { gridSize } = room;
    const pos = this.world.getComponent<Position>(this.entity, Position.name);
    const gridY = Math.floor(pos.y / gridSize);
    const dy = pos.y - gridY * gridSize;

    if (gridSize - dy > 15) {
      return 0;
    }

    const aabb = this.getAABB();

    // @TODO: get AABB
    if (info.leftWall) {
      const x = aabb.xMin - 1;
      const y = pos.y;
      const [up, down] = getUpDownGrid(x, y, room);
      if (up !== GridType.SOLID && down === GridType.SOLID) {
        return -1;
      }
    }

    if (info.rightWall) {
      const x = aabb.xMax + 1;
      const y = pos.y;
      const [up, down] = getUpDownGrid(x, y, room);
      if (up !== GridType.SOLID && down === GridType.SOLID) {
        return 1;
      }
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
      const direction = this.checkHanging();
      if (direction) {
        this.hangingDirection = direction;
        this.fsm.transition('hanging');
        return;
      }
      return;
    }

    assetManager.snd_step.play();
    this.fsm.transition(walking ? 'walk' : 'idle');
  }

  private hang() {
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);

    const jumpPressed = this.inputUp();
    if (jumpPressed) {
      this.fsm.transition('jumping');
      vel.vy = -JUMP_VELOCITY;
      return;
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
