import { ECSWorld } from './ecs';
import { Position, Script, ScriptBase } from './components';

class CameraScript extends ScriptBase {
  target: number;

  constructor(entity: number, world: ECSWorld, target: number) {
    super(entity, world);
    this.target = target;
  }

  onUpdate(_dt: number) {
    if (this.target == null) return;

    const pos = this.world.getComponent<Position>(this.entity, Position.name);
    const targetPos = this.world.getComponent<Position>(this.target, Position.name);
    const objx = targetPos.x;
    const objy = targetPos.y;

    pos.x += (objx - pos.x) / 20.0;
    pos.y += (objy - pos.y) / 20.0;
    if (pos.x <= WIDTH / 2) {
      pos.x = WIDTH / 2;
    } else if (pos.x >= WWIDTH - WIDTH / 2) {
      pos.x = WWIDTH - WIDTH / 2;
    }
    if (pos.y <= HEIGHT / 2 + YOFFSET) {
      pos.y = HEIGHT / 2 + YOFFSET;
    } else if (pos.y >= WHEIGHT - HEIGHT / 2) {
      pos.y = WHEIGHT - HEIGHT / 2;
    }
  }
}

export function createCamera(ecs: ECSWorld, x: number, y: number, target: number): number {
  const id = ecs.createEntity();
  const script = new CameraScript(id, ecs, target);

  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Script(script));
  return id;
}
