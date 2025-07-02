import { IScene } from './scene';
import * as System from './systems';
import { Camera, Position } from '../components';
import { roomManager } from './room-manager';

export class CutsceneScene extends IScene {
  private pos: Position | null = null;
  private intialX = 0;
  private targetX = 860;
  private speed = 2000;

  tick(dt: number) {
    const room = roomManager.getCurrentRoom();
    const cameraId = room.cameraId;

    if (this.pos === null) {
      const pos = room.ecs.getComponent<Position>(cameraId, Position.name);
      this.pos = new Position(pos.x, pos.y);
      this.intialX = pos.x;
    }

    const { ecs } = room;
    const { ctx } = this.game;

    const camera = ecs.getComponent<Camera>(cameraId, Camera.name);
    const { pos } = this;
    System.renderSystem(ecs, ctx, room, { camera, pos });

    pos.x += dt * this.speed;
    if (pos.x >= this.targetX) {
      pos.x = this.targetX;
      this.speed = -this.speed;
    }

    if (pos.x < this.intialX) {
      this.game.requestScene('GAME');
    }
  }
}
