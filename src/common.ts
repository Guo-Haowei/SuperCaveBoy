export enum Direction {
  NONE = 0,
  UP = -1,
  DOWN = 1,
  LEFT = -2,
  RIGHT = 2,
}

export class Rect {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export interface Vec2 {
  x: number;
  y: number;
}
