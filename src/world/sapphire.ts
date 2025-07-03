import { Collider, Position, Instance, PendingDelete, Sprite, Trigger } from '../components';
import { assetManager, SpriteSheets } from '../engine/assets-manager';
import { Entity, ECSWorld } from '../ecs';
import { TriggerScript } from './lifeform';

class SapphireScript extends TriggerScript {
  fire(): void {
    assetManager.snd_tink.play();
    this.world.addComponent(this.entity, new PendingDelete());
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
