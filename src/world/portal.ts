import { Collider, Position, Instance, ScriptBase, Sprite, Trigger } from '../components';
import { SpriteSheets } from '../engine/assets-manager';
import { Entity, ECSWorld } from '../ecs';
import { AABB } from '../engine/utils';
import { getRuntime } from '../engine/runtime';
import { TeamNumber } from './defines';

class PortalScript extends ScriptBase {
  private dest: string;

  constructor(entity: Entity, world: ECSWorld, dest: string) {
    super(entity, world);
    this.dest = dest;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCollision(layer: number, selfBound: AABB, otherBound: AABB): void {
    getRuntime().requestRoom(this.dest);
  }
}

export function createPoartal(world: ECSWorld, x: number, y: number, dest: string): Entity {
  const entity = world.createEntity();

  const collider = world.createEntity();
  world.addComponent(
    collider,
    new Collider(entity, { width: 28, height: 66, offsetX: 30, offsetY: 30 }),
  );
  world.addComponent(collider, new Trigger());

  world.addComponent(entity, new Position(x, y));
  world.addComponent(entity, new Sprite(SpriteSheets.PORTAL, 0, 5));
  const script = new PortalScript(entity, world, dest);
  world.addComponent(entity, new Instance(script));
  return entity;
}
