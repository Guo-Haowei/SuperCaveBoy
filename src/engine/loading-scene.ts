import { IScene } from './scene';
import * as System from './systems';
import { Camera, Position } from '../components';
import { roomManager } from './room-manager';
import { CountDown } from './common';

export class LoadingScene extends IScene {
  static readonly LOADING_TIME = 1.2;
  private loadingTime: CountDown = new CountDown(LoadingScene.LOADING_TIME);
  private roomName: string | null = null;

  requestRoom(roomName: string) {
    this.roomName = roomName;
  }

  tick(dt: number) {
    const room = roomManager.getCurrentRoom();
    if (!room) {
      return;
    }

    const { ecs } = room;
    const { ctx } = this.game;

    const cameraId = room.cameraId;
    const camera = ecs.getComponent<Camera>(cameraId, Camera.name);
    const pos = ecs.getComponent<Position>(cameraId, Position.name);

    System.renderSystem(ecs, ctx, room, { camera, pos });

    const { loadingTime } = this;

    const ratio = Math.min(0.999, loadingTime.remaining / loadingTime.duration);
    const alpha = 1.4 - Math.abs(ratio - 0.5) * 2;

    ctx.save(); // Save current state

    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`; // black with 50% transparency
    ctx.fillRect(0, 0, camera.width, camera.height);

    ctx.restore(); // Restore previous state

    if (this.roomName && alpha > 0.99) {
      roomManager.loadRoom(this.roomName);
      this.roomName = null;
    }

    const ready = loadingTime.tick(dt);
    if (ready) {
      this.game.setScene('GAME');
      this.loadingTime.reset();
    }
  }
}
