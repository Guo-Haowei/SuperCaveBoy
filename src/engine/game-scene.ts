import { IScene } from './scene';
import * as System from './systems';
import { Camera, Position } from '../components';
import { roomManager } from './room-manager';

export class GameScene extends IScene {
  tick(dt: number) {
    const room = roomManager.getCurrentRoom();
    const { ecs } = room;
    const { ctx } = this.game;

    System.scriptSystem(ecs, dt);
    System.movementSystem(ecs, dt);
    System.physicsSystem(ecs, dt);
    System.animationSystem(ecs, dt);

    const cameraId = room.cameraId;
    const camera = ecs.getComponent<Camera>(cameraId, Camera.name);
    const pos = ecs.getComponent<Position>(cameraId, Position.name);

    System.renderSystem(ecs, ctx, room, { camera, pos });
    System.deleteSystem(ecs);
  }
}
