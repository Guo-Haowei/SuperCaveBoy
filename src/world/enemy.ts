import { ECSWorld, Entity } from '../ecs';
import { Animation, Position, ScriptBase, Velocity } from '../components';

// @TODO: health system?
// @TODO: play sound on hit

export class BatScript extends ScriptBase {
  target: any; // @TODO: entity id

  private speed: number;
  private state: 'idle' | 'chase' = 'idle';

  constructor(entity: Entity, world: ECSWorld) {
    super(entity, world);
    this.speed = 0.07;
  }

  private idle() {
    const player = this.target;
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;

    const anim = this.world.getComponent<Animation>(this.entity, Animation.name);

    if (Math.abs(x - player.x) < 350 && y - 100 < player.y) {
      this.state = 'chase';
      anim.current = 'fly';
      anim.elapsed = 0;
    }
  }

  private chase() {
    const player = this.target;
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);

    const dx = x - player.x;
    const dy = y - player.y;
    const xsign = Math.abs(dx) > 5 ? Math.sign(dx) : 0;
    const ysign = Math.abs(dy) > 5 ? Math.sign(dy) : 0;

    if (velocity.vx == 0 || velocity.vy == 0) this.speed = 0.1;

    velocity.vx = -xsign * this.speed;
    velocity.vy = -ysign * this.speed;
  }

  onUpdate(_dt: number) {
    switch (this.state) {
      case 'idle':
        this.idle();
        break;
      case 'chase':
        this.chase();
        break;
      default:
        throw new Error(`Unknown state: ${this.state}`);
    }
  }
}

export class SnakeScript extends ScriptBase {
  static readonly INITIAL_SPEED = 0.1;

  private leftBound: number;
  private rightBound: number;

  constructor(entity: Entity, world: ECSWorld, leftBound: number, rightBound: number) {
    super(entity, world);
    this.leftBound = leftBound;
    this.rightBound = rightBound;
  }

  onUpdate(_dt: number) {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const { x } = position;
    if (x <= this.leftBound) {
      vel.vx = SnakeScript.INITIAL_SPEED;
    } else if (x >= this.rightBound) {
      vel.vx = -SnakeScript.INITIAL_SPEED;
    }
  }
}
