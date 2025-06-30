import { Rect } from '../common';

// @TODO: extract collider
export class GameObject {
  x: number;
  y: number;
  bound: Rect;

  constructor(x: number, y: number, rect: Rect) {
    this.x = x;
    this.y = y;
    this.bound = rect;
  }
}
