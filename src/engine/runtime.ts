import { inputManager } from './input-manager';
import { assetManager } from './assets-manager';
import { roomManager } from './room-manager';
import { IScene } from './scene';
import { GameScene } from './game-scene';
import { EditorScene } from './editor-scene';
import { LoadingScene } from './loading-scene';

export type Scene = 'MENU' | 'GAME' | 'EDITOR' | 'LOADING' | 'END';

export class Runtime {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  private current: string;
  private scenes = new Map<Scene, IScene>();
  private lastTick = 0;

  start = 0;
  end = 0;

  public constructor(canvas: HTMLCanvasElement, imageAssets: Record<string, HTMLImageElement>) {
    const ctx = canvas.getContext('2d');
    this.canvas = canvas;
    this.ctx = ctx;

    this.scenes['GAME'] = new GameScene(this);
    this.scenes['EDITOR'] = new EditorScene(this);
    this.scenes['LOADING'] = new LoadingScene(this);
    this.current = 'EDITOR';

    assetManager.init(imageAssets);
    inputManager.init(canvas);
    roomManager.init();
  }

  setScene(newScene: Scene) {
    if (this.current === newScene) return;
    const prevScene = this.scenes[this.current];
    const currentScene = this.scenes[newScene];

    this.current = newScene;

    prevScene.exit?.();
    currentScene.enter?.();
    return currentScene;
  }

  requestRoom(roomName: string) {
    const loadingScene = this.setScene('LOADING');
    loadingScene.requestRoom(roomName);
  }

  getCurrentScene() {
    return this.current;
  }

  tick() {
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

    this.scenes[this.current].tick(dt);

    inputManager.postUpdate(dt);
  }
}

let gRuntime: Runtime | null = null;

export function createRuntime(
  canvas: HTMLCanvasElement,
  imageAssets: Record<string, HTMLImageElement>,
): Runtime {
  if (gRuntime) {
    throw new Error('Runtime already created. Use getRuntime() instead.');
  }
  const runtime = new Runtime(canvas, imageAssets);
  gRuntime = runtime;
  return runtime;
}

export function getRuntime(): Runtime {
  if (!gRuntime) {
    throw new Error('Runtime not created yet. Call createRuntime() first.');
  }
  return gRuntime;
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
