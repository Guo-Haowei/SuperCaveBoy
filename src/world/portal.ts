import { Collider, Position, Instance, Sprite, Trigger } from '../engine/components';
import { SpriteSheets } from '../engine/assets-manager';
import { Entity, ECSWorld } from '../engine/ecs';
import { getRuntime } from '../engine/runtime';
import { TriggerScript } from './lifeform';

class PortalScript extends TriggerScript {
  private dest: string;

  constructor(entity: Entity, world: ECSWorld, dest: string) {
    super(entity, world);
    this.dest = dest;
  }

  fire(): void {
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
