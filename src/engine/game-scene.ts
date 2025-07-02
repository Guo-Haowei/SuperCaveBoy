import { IScene } from './scene';
import * as System from './systems';
import { roomManager } from './room-manager';
import { renderSystem } from './renderSystem';

export class GameScene extends IScene {
  tick(dt: number) {
    const room = roomManager.getCurrentRoom();
    const { ecs } = room;

    const world = { ecs };
    System.scriptSystem(world, dt);
    System.movementSystem(world, dt);
    System.collisionSystem(world, dt);
    System.rigidCollisionSystem(world, dt);

    System.damageSystem(world, dt);
    System.animationSystem(world, dt);

    const { camera, pos } = room.getCameraAndPos();

    renderSystem.render(ecs, room, { camera, pos });
    System.deleteSystem(world);
  }
}
