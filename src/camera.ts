import { ECSWorld } from './ecs';
import { Name, Position, Camera, Instance, ScriptBase } from './components';

// @TODO: camera controller script
class CameraFollowScript extends ScriptBase {
  private target: number;
  private roomWidth: number;
  private roomHeight: number;

  constructor(
    entity: number,
    world: ECSWorld,
    target: number,
    roomWidth: number,
    roomHeight: number,
  ) {
    super(entity, world);
    this.target = target;
    this.roomWidth = roomWidth;
    this.roomHeight = roomHeight;
  }

  onUpdate(_dt: number) {
    if (this.target == null) return;

    const pos = this.world.getComponent<Position>(this.entity, Position.name);
    const targetPos = this.world.getComponent<Position>(this.target, Position.name);
    const objx = targetPos.x;
    const objy = targetPos.y;

    pos.x += (objx - pos.x) / 20.0;
    pos.y += (objy - pos.y) / 20.0;

    // const { roomWidth, roomHeight } = this;
    // if (pos.x <= WIDTH / 2) {
    //   pos.x = WIDTH / 2;
    // } else if (pos.x >= roomWidth - WIDTH / 2) {
    //   pos.x = roomWidth - WIDTH / 2;
    // }
    // if (pos.y <= HEIGHT / 2 + YOFFSET) {
    //   pos.y = HEIGHT / 2 + YOFFSET;
    // } else if (pos.y >= roomHeight - HEIGHT / 2) {
    //   pos.y = roomHeight - HEIGHT / 2;
    // }
  }
}

export function createGameCamera(
  ecs: ECSWorld,
  x: number,
  y: number,
  width: number,
  height: number,
  target: number,
  roomWidth: number,
  roomHeight: number,
): number {
  const id = ecs.createEntity();
  const script = new CameraFollowScript(id, ecs, target, roomWidth, roomHeight);

  ecs.addComponent(id, new Name('Camera'));
  ecs.addComponent(id, new Camera(width, height));
  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Instance(script));
  return id;
}
