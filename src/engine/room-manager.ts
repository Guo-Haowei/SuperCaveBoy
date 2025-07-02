import { TILE_SIZE } from '../constants';
import { Room } from '../world/room';

import { WORLD_DATA, LevelData } from '../world/data';

class RoomManager {
  private roooms = new Map<string, LevelData>();

  private currentRoom?: Room;

  init() {
    WORLD_DATA.forEach((data) => {
      this.roooms.set(data.name, data);
    });

    this.loadRoom('Level 10');
  }

  loadRoom(name: string) {
    const data = this.roooms.get(name);
    this.currentRoom = new Room(TILE_SIZE, data);
  }

  getCurrentRoom() {
    return this.currentRoom as Room;
  }
}

export const roomManager = new RoomManager();
