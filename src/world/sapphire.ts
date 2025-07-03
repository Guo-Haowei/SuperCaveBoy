import { Collider, Position, Instance, Sprite, Trigger } from '../components';
import { SpriteSheets } from '../engine/assets-manager';
import { Entity, ECSWorld } from '../ecs';
import { TriggerScript } from './lifeform';

class SapphireScript extends TriggerScript {
  fire(): void {
    console.log('Sapphire collected');
  }
}

export function createSapphire(world: ECSWorld, x: number, y: number): Entity {
  const entity = world.createEntity();

  const collider = world.createEntity();
  world.addComponent(
    collider,
    new Collider(entity, { width: 28, height: 30, offsetX: 6, offsetY: 2 }),
  );
  world.addComponent(collider, new Trigger());

  world.addComponent(entity, new Position(x, y));
  world.addComponent(entity, new Sprite(SpriteSheets.SAPPHIRE, 0, 5));
  const script = new SapphireScript(entity, world);
  world.addComponent(entity, new Instance(script));
  return entity;
}
