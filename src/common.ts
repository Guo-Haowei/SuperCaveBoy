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

export class AABB {
  private static readonly ERROR = 0.0001;

  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;

  constructor(xMin: number, yMin: number, xMax: number, yMax: number) {
    this.xMin = xMin;
    this.yMin = yMin;
    this.xMax = xMax;
    this.yMax = yMax;
  }

  slightlyAbove(other: AABB): boolean {
    const diff = this.yMin - other.yMax;
    return Math.abs(diff) < AABB.ERROR;
  }

  slightlyBelow(other: AABB): boolean {
    const diff = other.yMin - this.yMax;
    return Math.abs(diff) < AABB.ERROR;
  }
}

export interface Vec2 {
  x: number;
  y: number;
}
