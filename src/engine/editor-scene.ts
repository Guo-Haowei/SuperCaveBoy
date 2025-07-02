import { IScene } from './scene';
import * as System from './systems';
import { Camera, Position } from '../components';
import { inputManager } from './input-manager';
import { roomManager } from './room-manager';
import { Runtime } from './runtime';

export class EditorScene extends IScene {
  private camera: Camera;
  private cameraPos: Position;

  constructor(game: Runtime) {
    super(game);
    const { width, height } = game.canvas;
    this.camera = new Camera(width, height);
    this.cameraPos = new Position(width / 2, height / 2);
  }

  updateCamera() {
    if (inputManager.isMouseDragging()) {
      const delta = inputManager.getDragDelta();
      this.cameraPos.x -= delta.x;
      this.cameraPos.y -= delta.y;
    }

    const scroll = inputManager.getScroll();
    if (scroll !== 0) {
      this.camera.setZoom(scroll);
    }
  }

  tick(_dt: number) {
    this.updateCamera();

    const room = roomManager.getCurrentRoom();
    const { ctx } = this.game;
    const { ecs } = room;

    const world = { ecs };
    System.renderSystem(world, ctx, room, { camera: this.camera, pos: this.cameraPos });
  }
}
