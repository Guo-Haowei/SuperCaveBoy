import { ECSWorld, Entity } from '../ecs';
import { Collider, Position, Instance, ScriptBase, Dynamic } from '../components';
import { AABB } from '../engine/common';
import { getRuntime } from '../engine/runtime';

class TriggerScript extends ScriptBase {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCollision(other: Entity, layer: number, selfBound: AABB, otherBound: AABB): void {
    // @TODO: trigger event
  }
}

export function createTrigger(world: ECSWorld, x: number, y: number): Entity {
  const entity = world.createEntity();

  world.addComponent(entity, new Position(x, y));
  world.addComponent(entity, new Collider(64, 800, Collider.EVENT, Collider.PLAYER, 30, 30));
  world.addComponent(entity, new Dynamic());
  const script = new TriggerScript(entity, world);
  world.addComponent(entity, new Instance(script));
  return entity;
}
