/* eslint-disable no-console */
import { IScene } from './scene';
import * as System from './systems';
import { roomManager } from './room-manager';
import { CountDown } from './utils';

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

    const { camera, pos } = room.getCameraAndPos();

    const world = { ecs };
    System.renderSystem(world, ctx, room, { camera, pos });

    const { loadingTime } = this;

    const ratio = Math.min(0.999, loadingTime.remaining / loadingTime.duration);
    const alpha = 1.4 - Math.abs(ratio - 0.5) * 2;

    ctx.save();

    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, camera.width, camera.height);

    ctx.restore();

    if (this.roomName && alpha > 0.99) {
      console.log(`Entering room: ${this.roomName}`);
      roomManager.loadRoom(this.roomName);
      this.roomName = null;
    }

    const ready = loadingTime.tick(dt);
    if (ready) {
      this.game.requestScene('GAME');
      this.loadingTime.reset();
    }
  }
}
