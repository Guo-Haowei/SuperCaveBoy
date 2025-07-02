import { IScene } from './scene';
import * as System from './systems';
import { Camera, Position } from '../components';
import { roomManager } from './room-manager';

export class CutsceneScene extends IScene {
  private pos: Position | null = null;
  private camera: Camera | null = null;
  private intialX = 0;
  private targetX = 800;
  private speed = 200;

  tick(dt: number) {
    const room = roomManager.getCurrentRoom();

    if (this.pos === null) {
      const { camera, pos } = room.getCameraAndPos();
      this.pos = new Position(pos.x, pos.y);
      this.intialX = pos.x;
      this.camera = camera;
    }

    const { ecs } = room;
    const { ctx } = this.game;

    const { pos, camera } = this;

    const world = { ecs };
    System.renderSystem(world, ctx, room, { camera, pos });

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
