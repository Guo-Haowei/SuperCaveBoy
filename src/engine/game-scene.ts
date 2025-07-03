import { IScene } from './scene';
import * as System from './systems';
import { roomManager } from './room-manager';
import { renderSystem } from './render-system';
import { assetManager, SpriteSheets } from './assets-manager';
import { PlayerData } from '../world/player';

export class GameScene extends IScene {
  tick(dt: number) {
    const room = roomManager.getCurrentRoom();
    const { ecs } = room;

    const world = { ecs };
    System.scriptSystem(world, dt);
    System.movementSystem(world, dt);
    System.collisionSystem(world, dt);
    System.rigidCollisionSystem(world, dt);

    System.damageSystem(world, dt);
    System.animationSystem(world, dt);

    const { camera, pos } = room.getCameraAndPos();

    renderSystem.render(ecs, room, { camera, pos });

    // Draw UI overlay

    System.deleteSystem(world);

    const { ctx } = renderSystem;

    // @TODO: draw hearts
    // ctx.fillStyle = '#000';
    // ctx.fillRect(30, 520, 90, 54);
    // ctx.fillRect(840, 520, 90, 54);

    // for (let i = 0; i < heal; ++i) {
    //   this.heart.draw(graphics, 15 + 74 * i, 15);
    // }

    const { sapphire } = PlayerData;
    ctx.drawImage(assetManager.sheets[SpriteSheets.SAPPHIRE_GUI].image, 800, 15, 64, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = '36pt Arial';
    ctx.fillText('x ' + sapphire, 870, 64);
  }
}
