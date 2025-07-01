import { IScene } from './scene';
import { Runtime } from './runtime';
import * as System from '../systems';
import { Camera, Position } from '../components';

export class GameScene implements IScene {
  private game: Runtime;

  constructor(game: Runtime) {
    this.game = game;
  }

  tick(dt: number) {
    const { ctx, room } = this.game;
    const { ecs } = room;

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
