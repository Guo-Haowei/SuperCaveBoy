import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  CollisionLayer,
  Collider,
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

const DESIRED_JUMP_HEIGHT = 200;
const TIME_TO_APEX = 0.4;

const GRAVITY = (2 * DESIRED_JUMP_HEIGHT) / TIME_TO_APEX ** 2;
const JUMP_VELOCITY = GRAVITY * TIME_TO_APEX;

class PlayerScript extends ScriptBase {
  static readonly MOVE_SPEED = 400;

  private state: 'walk' | 'jump';
  private grounded = false;
  private lastY: number;

  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);
    this.state = 'walk';

    const pos = this.world.getComponent<Position>(this.entity, Position.name);
    this.lastY = pos.y;
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.gravity = GRAVITY;
  }

  private updateHorizonalMove(velocity: Velocity) {
    const leftDown = inputManager.isKeyDown('KeyA');
    const rightDown = inputManager.isKeyDown('KeyD');
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

    if (inputManager.isKeyPressed('KeyW') && this.grounded) {
      this.startJump(velocity);
    }
    // const position = this.world.getComponent<Position>(this.entity, Position.name);
  }

  private jump(_dt: number) {
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    this.updateHorizonalMove(velocity);
  }

  onUpdate(dt: number) {
    const pos = this.world.getComponent<Position>(this.entity, Position.name);
    if (Math.abs(pos.y - this.lastY) < 0.00000001) {
      this.grounded = true;
    } else {
      this.grounded = false;
      this.lastY = pos.y;
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
      } else if (dir === Direction.UP) {
        const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
        vel.vy = 0;
      }
    }
  }
}

export function createPlayer(ecs: ECSWorld, x: number, y: number): Entity {
  const id = ecs.createEntity();

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

  const collider = new Collider(
    32,
    62,
    CollisionLayer.PLAYER,
    CollisionLayer.ENEMY | CollisionLayer.OBSTACLE | CollisionLayer.EVENT | CollisionLayer.TRAP,
    1, // mass
    16,
    10,
  );

  ecs.addComponent(id, new Name('Player'));
  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Velocity());
  ecs.addComponent(id, new Facing(false));
  ecs.addComponent(id, collider);
  ecs.addComponent(id, new Sprite(SpriteSheets.PLAYER_IDLE));
  const script = new PlayerScript(id, ecs);
  ecs.addComponent(id, new Script(script));
  ecs.addComponent(id, anim);
  return id;
}
