import { ECSWorld } from '../engine/ecs';
import { Name, Position, Camera, Instance, ScriptBase } from '../engine/components';

// @TODO: camera controller script
class CameraFollowScript extends ScriptBase {
  private target: number;
  private xMin: number;
  private xMax: number;
  private yMin: number;
  private yMax: number;

  constructor(
    entity: number,
    world: ECSWorld,
    target: number,
    screenWidth: number,
    screenHeight: number,
    roomWidth: number,
    roomHeight: number,
  ) {
    super(entity, world);
    this.target = target;

    this.xMin = screenWidth / 2;
    this.xMax = roomWidth - screenWidth / 2;
    this.yMin = screenHeight / 2;
    this.yMax = roomHeight - screenHeight / 2;
  }

  clampPosition(pos: Position): void {
    pos.x = Math.max(this.xMin, Math.min(pos.x, this.xMax));
    pos.y = Math.max(this.yMin, Math.min(pos.y, this.yMax));
  }

  onUpdate(_dt: number) {
    if (this.target == null) return;

    const pos = this.world.getComponent<Position>(this.entity, Position.name);
    const targetPos = this.world.getComponent<Position>(this.target, Position.name);
    const objx = targetPos.x;
    const objy = targetPos.y;

    pos.x += (objx - pos.x) / 20.0;
    pos.y += (objy - pos.y) / 20.0;

    this.clampPosition(pos);
  }
}

export function createGameCamera(
  ecs: ECSWorld,
  x: number,
  y: number,
  screenWidth: number,
  screenHeight: number,
  target: number,
  roomWidth: number,
  roomHeight: number,
): number {
  const id = ecs.createEntity();
  const script = new CameraFollowScript(
    id,
    ecs,
    target,
    screenWidth,
    screenHeight,
    roomWidth,
    roomHeight,
  );

  const position = new Position(x, y);
  script.clampPosition(position);

  ecs.addComponent(id, new Name('Camera'));
  ecs.addComponent(id, new Camera(screenWidth, screenHeight));
  ecs.addComponent(id, position);
  ecs.addComponent(id, new Instance(script));
  return id;
}
