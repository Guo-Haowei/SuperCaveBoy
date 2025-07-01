import { Room } from '../world/room';
import * as System from '../systems';
import { inputManager } from './input-manager';
import { assetManager } from './assets-manager';

export type Scene = 'MENU' | 'GAME' | 'END';

export class Runtime {
  start = 0;
  end = 0;

  private currentScene: IScene;
  private scenes = new Map<Scene, IScene>();
  private lastTick = 0;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  room: Room;

  public constructor(canvas: HTMLCanvasElement, imageAssets: Record<string, HTMLImageElement>) {
    const ctx = canvas.getContext('2d');
    this.canvas = canvas;
    this.ctx = ctx;

    this.room = new Room();
    this.room.init();

    this.scenes['GAME'] = new PlayScene(this);

    assetManager.init(imageAssets);
    inputManager.init(canvas);

    this.currentScene = this.scenes['GAME'];
  }

  public changeScene(newScene: IScene) {
    this.currentScene.exit?.();
    this.currentScene = newScene;
    this.currentScene.enter?.();
  }

  setScene(name: Scene) {
    this.changeScene(this.scenes[name]);
  }

  tick() {
    // update timer
    const timestamp = Date.now();
    let dt = 0;
    if (this.lastTick === 0) {
      this.lastTick = timestamp;
    } else {
      dt = timestamp - this.lastTick;
      this.lastTick = timestamp;
    }

    inputManager.preUpdate(dt);

    dt = Math.min(dt / 1000, 0.1);
    this.currentScene.tick(dt);

    inputManager.postUpdate(dt);
  }
}

interface IScene {
  enter?(): void;
  exit?(): void;

  tick(dt: number): void;
}

class PlayScene implements IScene {
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
    System.renderSystem(ecs, ctx, room);
    System.deleteSystem(ecs);
  }
}

// class MenuScene implements IScene {
//   // fields
//   private game: Runtime;

//   constructor(game: Runtime) {
//     this.game = game;
//   }

//   tick(_dt: number) {
//     if (inputManager.isKeyPressed('Space')) {
//       this.game.setScene('PLAY');
//       this.game.start = Date.now();
//     }
//   }

//   render(_ctx: CanvasRenderingContext2D) {
//     // this.handler._getGameAssets().bg_menu.draw(ctx, 0, HEIGHT / 2 - 270);
//     // this.drawText(ctx);
//   }

//   private drawText(ctx) {
//     ctx.fillStyle = '#ffffff';
//     ctx.font = '36pt Arial';
//     ctx.fillText('Press [space] to start', 250, 480);
//     ctx.font = '64pt Arial';
//     ctx.fillText('Super Cave Boy', 190, 250);
//   }
// }
// class EndScene implements IScene {
//   private game: Runtime;

//   constructor(game: Runtime) {
//     this.game = game;
//   }

//   tick(_dt: number) {
//     // do nothing
//   }

//   render(_ctx) {
//     // for (let h = 0; h < hTile; ++h) {
//     //   for (let w = 0; w < wTile; ++w) {
//     //     this.sprite.draw(ctx, w * 64, h * 64);
//     //   }
//     // }
//     // this.drawText(ctx);
//   }

//   // @TODO: utlity function to format time
//   private formatTime(_milliseconds) {
//     // const seconds = Math.floor(milliseconds / 1000);
//     // const minutes = Math.floor(seconds / 60);
//     // const remainingSeconds = seconds % 60;
//     // return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
//   }

//   private drawText(_ctx: CanvasRenderingContext2D) {
//     // const diff = this.game.end - this.game.start;
//     // const time = `Your Time Was: ${this.formatTime(diff)}`;
//     // const content = player.health <= 0 ? 'You lost!' : 'You Won!';
//     // ctx.fillStyle = '#ffffff';
//     // ctx.font = '64pt Arial';
//     // ctx.fillText(content, 290, 220);
//     // ctx.font = '36pt Arial';
//     // ctx.fillText(time, 240, 320);
//     // ctx.fillText('You Score was: ' + player.sapphire, 290, 400);
//   }
// }
