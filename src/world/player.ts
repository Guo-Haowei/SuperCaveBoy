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
import { Direction } from '../common';
import { SpriteSheets } from '../assets';
import { inputManager } from '../input-manager';
import { findGravityAndJumpVelocity, createLifeform } from './lifeform-common';

const { GRAVITY, JUMP_VELOCITY } = findGravityAndJumpVelocity(180, 0.4);

class PlayerScript extends ScriptBase {
  static readonly MOVE_SPEED = 400;

  private state: 'walk' | 'jump';

  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);
    this.state = 'walk';

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.gravity = GRAVITY;
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

  private updateHorizonalMove(velocity: Velocity) {
    const leftDown = this.inputLeft();
    const rightDown = this.inputRight();
    const direction = Number(rightDown) - Number(leftDown);
    const facing = this.world.getComponent<Facing>(this.entity, Facing.name);

    velocity.vx = direction * PlayerScript.MOVE_SPEED;
    if (leftDown || rightDown) {
      facing.left = direction < 0;
    }
  }

  private startJump(velocity: Velocity) {
    velocity.vy = -JUMP_VELOCITY;
    this.state = 'jump';
  }

  private walk(_dt: number) {
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    this.updateHorizonalMove(velocity);

    if (this.inputUp() && this.isGrounded()) {
      this.startJump(velocity);
    }
  }

  private jump(_dt: number) {
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    this.updateHorizonalMove(velocity);
  }

  onUpdate(dt: number) {
    if (this.isGrounded()) {
      this.state = 'walk';
    }

    switch (this.state) {
      case 'walk':
        this.walk(dt);
        break;
      case 'jump':
        this.jump(dt);
        break;
      default:
        throw new Error(`Unknown state: ${this.state}`);
    }
  }

  onCollision(_other: Entity, layer: number, dir: number): void {
    if (layer === CollisionLayer.OBSTACLE) {
      if (dir === Direction.LEFT || dir === Direction.RIGHT) {
        // @TODO: grabbing
      } else if (dir === Direction.DOWN) {
        const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
        velocity.vy += JUMP_VELOCITY * 0.2;
      }
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
      walk: {
        sheetId: SpriteSheets.PLAYER_WALK,
        frames: 8,
        speed: 1,
        loop: true,
      },
    },
    'walk',
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
