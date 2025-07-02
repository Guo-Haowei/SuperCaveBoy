import { Collider, Position, Instance, ScriptBase, Sprite } from '../components';
import { SpriteSheets } from '../engine/assets-manager';
import { Entity, ECSWorld } from '../ecs';
import { AABB } from '../engine/common';
import { getRuntime } from '../engine/runtime';

class PortalScript extends ScriptBase {
  private dest: string;

  constructor(entity: Entity, world: ECSWorld, dest: string) {
    super(entity, world);
    this.dest = dest;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCollision(other: Entity, layer: number, selfBound: AABB, otherBound: AABB): void {
    getRuntime().requestRoom(this.dest);
  }
}

export function createPoartal(world: ECSWorld, x: number, y: number, dest: string): Entity {
  const entity = world.createEntity();

  world.addComponent(entity, new Position(x, y));
  world.addComponent(entity, new Sprite(SpriteSheets.PORTAL, 0, 5));
  // world.addComponent(entity, new Collider(28, 66, Collider.PORTAL, Collider.PLAYER, 30, 30));
  const script = new PortalScript(entity, world, dest);
  world.addComponent(entity, new Instance(script));
  return entity;
}
