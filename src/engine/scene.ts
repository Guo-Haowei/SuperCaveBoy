export interface IScene {
  enter?(): void;
  exit?(): void;

  tick(dt: number): void;
}
