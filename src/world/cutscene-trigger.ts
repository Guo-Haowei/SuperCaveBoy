import { ECSWorld, Entity } from '../ecs';
import { Position, Instance, Collider, Trigger } from '../components';
import { getRuntime } from '../engine/runtime';
import { TriggerScript } from './lifeform';

class CussceneTriggerScript extends TriggerScript {
  fire(): void {
    getRuntime().requestScene('CUTSCENE');
  }
}

export function createTrigger(world: ECSWorld, x: number, y: number): Entity {
  const id = world.createEntity();

  const collider = world.createEntity();

  const area = {
    width: 64,
    height: 800,
    offsetX: 30,
    offsetY: 30,
  };

  world.addComponent(collider, new Collider(id, area));
  world.addComponent(collider, new Trigger());

  world.addComponent(id, new Position(x, y));
  const script = new CussceneTriggerScript(id, world);
  world.addComponent(id, new Instance(script));
  return id;
}
