import { IScene } from './scene';
import * as System from './systems';
import { Camera, Position } from '../components';
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

    const cameraId = room.cameraId;
    const camera = ecs.getComponent<Camera>(cameraId, Camera.name);
    const pos = ecs.getComponent<Position>(cameraId, Position.name);

    System.renderSystem(world, ctx, room, { camera, pos });
    System.deleteSystem(world);
  }
}
