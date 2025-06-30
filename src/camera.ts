import { ECSWorld } from './ecs';
import { Position, Script, ScriptBase } from './components';

class CameraScript extends ScriptBase {
  target: any; // @TODO: entity id

  constructor(entity: number, world: ECSWorld) {
    super(entity, world);
    this.target = null;
  }

  onUpdate(_dt: number) {
    if (this.target == null) return;

    const pos = this.world.getComponent<Position>(this.entity, Position.name);
    const objx = this.target.x;
    const objy = this.target.y;

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

export function createCamera(ecs: ECSWorld, x: number, y: number, player: any): number {
  const id = ecs.createEntity();

  const script = new CameraScript(id, ecs);
  script.target = player;

  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Script(script));
  // @TODO: script
  return id;
}
