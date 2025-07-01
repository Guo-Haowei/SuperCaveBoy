import { Runtime } from './runtime';

export abstract class IScene {
  protected game: Runtime;

  constructor(game: Runtime) {
    this.game = game;
  }

  enter?(): void;
  exit?(): void;

  abstract tick(dt: number): void;
}
