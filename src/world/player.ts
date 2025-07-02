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
  getUpDownGrid,
} from './lifeform';
import { AABB } from '../engine/utils';
import { CountDown } from '../engine/utils';
import { TeamNumber } from './defines';
import { GridType } from './room';

import { SpriteSheets, assetManager } from '../engine/assets-manager';
import { inputManager } from '../engine/input-manager';
import { roomManager } from '../engine/room-manager';
import { renderSystem } from '../engine/renderSystem';

const { GRAVITY, JUMP_VELOCITY } = findGravityAndJumpVelocity(170, 0.4);

type PlayerStateName = 'idle' | 'walk' | 'jumping' | 'hurt' | 'hanging';

class PlayerScript extends LifeformScript {
  static readonly HURT_COOLDOWN = 0.8;
  static readonly MOVE_SPEED = 400;
  static readonly MAX_HEALTH = 10000;

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
            vel.gravity = 0; // disable gravity
            this.playAnim('hang');
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

  private checkHanging() {
    if (this.isGrounded()) {
      return false;
    }
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    if (vel.vy < 0) {
      return false;
    }
    // check if grab ledge
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const xMin = position.x + 16;
    const xMax = position.x + 16 + 32;

    const alignWithGrid = (value: number, tileSize: number, error = 2) => {
      const remainder = value % tileSize;
      return Math.abs(remainder) < error || Math.abs(remainder - tileSize) < error;
    };

    const room = roomManager.getCurrentRoom();
    const gridSize = room.gridSize;
    const y = position.y - gridSize;
    if (!alignWithGrid(position.y, gridSize, 10)) {
      return false;
    }
    if (alignWithGrid(xMin, gridSize)) {
      const [up, down] = getUpDownGrid(xMin, y, room);
      console.log('checkHanging', xMin, y, up, down);
      if (up !== GridType.SOLID && down === GridType.SOLID) {
        return true;
      }
    }
    if (alignWithGrid(xMax, gridSize)) {
      const gridX = Math.floor(xMax / room.gridSize);
      const gridY = Math.floor(y / room.gridSize);
      renderSystem.addDebugRect({
        x: gridX * gridSize,
        y: gridY * gridSize,
        width: 64,
        height: 64,
      });
      renderSystem.addDebugRect({
        x: gridX * gridSize,
        y: (gridY + 1) * gridSize,
        width: 64,
        height: 64,
      });

      const [up, down] = getUpDownGrid(xMax, y, room);
      console.log('checkHanging', xMax, y, up, down);
      if (up !== GridType.SOLID && down === GridType.SOLID) {
        return true;
      }
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
      if (this.checkHanging()) {
        this.fsm.transition('hanging');
        return;
      }
      return;
    }

    assetManager.snd_step.play();
    this.fsm.transition(walking ? 'walk' : 'idle');
  }

  private hang() {
    // disable movement
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    // this.tryWalk(velocity);
    if (this.inputUp()) {
      velocity.vy = -JUMP_VELOCITY; // jump off the ledge
      velocity.gravity = GRAVITY; // re-enable gravity
      this.fsm.transition('jumping');
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

  onCollision(_layer: number, _selfBound: AABB, _otherBound: AABB): void {
    // left
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
