import { TILE_SIZE } from '../constants';
import { Room } from '../world/room';

import { WORLD_DATA, LevelData } from '../world/data';

class RoomManager {
  private level: number;

  private currentRoom?: Room;

  init() {
    this.level = WORLD_DATA.startLevel;
    this.currentRoom = new Room(TILE_SIZE, WORLD_DATA.levels[this.level]);
  }

  loadRoom(name?: string) {
    const data = WORLD_DATA.levels[++this.level];
    this.currentRoom = new Room(TILE_SIZE, data);
  }

  getCurrentRoom() {
    return this.currentRoom as Room;
  }
}

export const roomManager = new RoomManager();
