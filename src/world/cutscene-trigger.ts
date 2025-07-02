import { ECSWorld, Entity } from '../ecs';
import { Collider, Position, Instance, ScriptBase } from '../components';
import { AABB } from '../engine/common';
import { getRuntime } from '../engine/runtime';

class CussceneTriggerScript extends ScriptBase {
  private disabled = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCollision(other: Entity, layer: number, selfBound: AABB, otherBound: AABB): void {
    if (this.disabled) return;
    getRuntime().requestScene('CUTSCENE');
    this.disabled = true;
  }
}

export function createTrigger(world: ECSWorld, x: number, y: number): Entity {
  const entity = world.createEntity();

  world.addComponent(entity, new Position(x, y));
  // world.addComponent(entity, new Collider(64, 800, Collider.EVENT, Collider.PLAYER, 30, 30));
  // world.addComponent(entity, new Dynamic());
  const script = new CussceneTriggerScript(entity, world);
  world.addComponent(entity, new Instance(script));
  return entity;
}
