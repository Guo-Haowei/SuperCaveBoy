import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  CollisionLayer,
  Collider,
  Position,
  Script,
  ScriptBase,
  Sprite,
  Velocity,
} from '../components';
import { Direction } from '../common';
import { SpriteSheets } from '../assets';
import { inputManager } from '../input-manager';

class PlayerScript extends ScriptBase {
  static readonly MOVE_SPEED = 300;

  private state: 'walk' | 'jump';

  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);
    this.state = 'walk';
  }

  private walk(_dt: number) {
    // Get the player position
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const leftDown = inputManager.isKeyDown('KeyA');
    const rightDown = inputManager.isKeyDown('KeyD');
    const direction = Number(rightDown) - Number(leftDown);
    velocity.vx = direction * PlayerScript.MOVE_SPEED;

    // const position = this.world.getComponent<Position>(this.entity, Position.name);
  }

  private jump() {
    // todo
  }

  onUpdate(dt: number) {
    switch (this.state) {
      case 'walk':
        this.walk(dt);
        break;
      case 'jump':
        this.jump();
        break;
      default:
        throw new Error(`Unknown state: ${this.state}`);
    }
  }

  onCollision(_other: Entity, layer: number, dir: number): void {
    if (layer === CollisionLayer.OBSTACLE) {
      if (dir === Direction.LEFT || dir === Direction.RIGHT) {
        // @TODO: grabbing
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
  const script = new PlayerScript(id, ecs);
  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Velocity());
  ecs.addComponent(id, collider);
  ecs.addComponent(id, new Sprite(SpriteSheets.PLAYER_IDLE));
  ecs.addComponent(id, new Script(script));
  ecs.addComponent(id, anim);
  return id;
}
