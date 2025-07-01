import { Collider, Dynamic, Position, Sprite } from '../components';
import { SpriteSheets } from '../engine/assets-manager';
import { Entity, ECSWorld } from '../ecs';

export function createPoartal(world: ECSWorld, x: number, y: number): Entity {
  const entity = world.createEntity();

  world.addComponent(entity, new Position(x, y));
  world.addComponent(entity, new Sprite(SpriteSheets.PORTAL, 0, 5));
  world.addComponent(entity, new Collider(28, 66, Collider.PORTAL, Collider.PLAYER, 30, 30));
  world.addComponent(entity, new Dynamic());
  return entity;
}
