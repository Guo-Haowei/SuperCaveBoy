import { Room } from '../world/room';
import {
  Camera,
  Collider,
  Hitbox,
  Hurtbox,
  Rigid,
  Facing,
  Sprite,
  Trigger,
  Position,
} from '../components';
import { assetManager } from './assets-manager';
import { ECSWorld } from '../ecs';
import { EditorState } from '../editor-state';

export interface DebugRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  filled?: boolean;
}

class RenderSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private debugList: DebugRect[] = [];

  init(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  addDebugRect(rect: DebugRect) {
    this.debugList.push(rect);
  }

  render(ecs: ECSWorld, room: Room, cameraContext: { camera: Camera; pos: Position }) {
    const { camera, pos } = cameraContext;
    const { ctx } = this;

    ctx.clearRect(0, 0, camera.width, camera.height);

    ctx.fillStyle = `rgba(255, 255, 255, 1)`;
    ctx.fillRect(0, 0, camera.width, camera.height);

    const offset = camera.getOffset(pos);
    ctx.save();
    ctx.translate(-offset.x, -offset.y);
    ctx.scale(camera.zoom, camera.zoom);

    const renderables = ecs.queryEntities<Sprite, Position>(Sprite.name, Position.name);
    const sorted = renderables.sort((a, b) => b[1].zIndex - a[1].zIndex);

    for (const [id, sprite, pos] of sorted) {
      const { x, y } = pos as Position;
      const { sheetId, frameIndex } = sprite as Sprite;

      const renderable = assetManager.getFrame(sheetId, frameIndex);
      const { image, frame } = renderable;

      ctx.save();

      const facing = ecs.getComponent<Facing>(id, Facing.name);
      const flipLeft: number = facing && facing.left ? 1 : 0;

      ctx.translate(x + flipLeft * frame.width, y);
      ctx.scale(flipLeft ? -1 : 1, 1);

      for (let i = 0; i < sprite.repeat; ++i) {
        ctx.drawImage(
          image,
          frame.sourceX,
          frame.sourceY,
          frame.width,
          frame.height,
          i * frame.width,
          0,
          frame.width,
          frame.height,
        );
      }

      ctx.restore();
    }

    this.drawDebugShape();

    if (EditorState.debugCollisions) {
      this.drawDebugCollider(ecs);
    }

    if (EditorState.debugGrid) {
      this.drawDebugGrid(room);
    }

    ctx.restore();

    this.debugList = [];
  }

  private drawDebugGrid(room: Room) {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    const { width, height, gridSize } = room;

    for (let x = 0; x <= width; ++x) {
      const pixelX = x * gridSize;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, height * gridSize);
      ctx.stroke();
    }

    for (let y = 0; y <= height; ++y) {
      const pixelY = y * gridSize;
      ctx.beginPath();
      ctx.moveTo(0, pixelY);
      ctx.lineTo(width * gridSize, pixelY);
      ctx.stroke();
    }
  }

  private drawDebugCollider(ecs: ECSWorld) {
    const { ctx } = this;
    ctx.globalAlpha = 0.5;
    for (const [id, collider] of ecs.queryEntities<Collider>(Collider.name)) {
      const pos = ecs.getComponent<Position>(collider.parent, Position.name);
      if (!pos) {
        continue;
      }
      const { x, y } = pos;
      const { width, height, offsetX, offsetY } = collider;

      const rigid = ecs.getComponent<Rigid>(id, Rigid.name);
      const isHitbox = ecs.hasComponent(id, Hitbox.name);
      const isHurtbox = ecs.hasComponent(id, Hurtbox.name);
      const isTrigger = ecs.hasComponent(id, Trigger.name);

      if (Number(isHitbox) + Number(isHurtbox) + Number(isTrigger) > 1) {
        throw new Error(`Entity ${id} has multiple collision types: `);
      }

      const dx = x + offsetX;
      const dy = y + offsetY;

      let color = 'purple';
      if (rigid) {
        color = 'blue';
      } else if (isHitbox) {
        color = 'green';
      } else if (isHurtbox) {
        color = 'red';
      } else if (isTrigger) {
        color = 'orange';
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(dx, dy, width, height);
    }
  }

  private drawDebugShape() {
    const { ctx } = this;

    ctx.lineWidth = 2;

    this.debugList.forEach((rect) => {
      const { x, y, width, height, color = 'white', filled = false } = rect;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      if (filled) {
        ctx.fillRect(x, y, width, height);
      } else {
        ctx.strokeRect(x, y, width, height);
      }
    });
  }
}

export const renderSystem = new RenderSystem();
