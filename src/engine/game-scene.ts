import { IScene } from './scene';
import * as System from './systems';
import { roomManager } from './room-manager';

export class GameScene extends IScene {
  tick(dt: number) {
    const room = roomManager.getCurrentRoom();
    const { ecs } = room;
    const { ctx } = this.game;

    const world = { ecs };
    System.scriptSystem(world, dt);
    System.movementSystem(world, dt);
    System.physicsSystem(world, dt);

    System.damageSystem(world, dt);
    System.animationSystem(world, dt);

    const { camera, pos } = room.getCameraAndPos();

    System.renderSystem(world, ctx, room, { camera, pos });
    System.deleteSystem(world);
  }
}
