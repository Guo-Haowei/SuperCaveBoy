export enum Direction {
  NONE = 0,
  UP = -1,
  DOWN = 1,
  LEFT = -2,
  RIGHT = 2,
}

export interface Vec2 {
  x: number;
  y: number;
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

  above(other: AABB): boolean {
    return this.yMax > other.yMin && this.yMax < other.yMax;
  }

  center(): Vec2 {
    return {
      x: (this.xMin + this.xMax) / 2,
      y: (this.yMin + this.yMax) / 2,
    };
  }
}

export class CountDown {
  public readonly duration: number;
  private _remaining: number;

  constructor(duration: number) {
    this.duration = duration;
    this._remaining = duration;
  }

  reset() {
    this._remaining = this.duration;
  }

  get remaining(): number {
    return this._remaining;
  }

  tick(dt: number): boolean {
    this._remaining -= dt;
    if (this._remaining <= 0) {
      this._remaining = 0;
      return true;
    }
    return false;
  }
}
