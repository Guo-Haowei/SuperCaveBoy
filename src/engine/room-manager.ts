import { GRID_SIZE } from '../constants';
import { Room } from '../world/room';

import { ROOM_DATA, RoomData } from '../world/data';

class RoomManager {
  private roooms = new Map<string, RoomData>();

  private currentRoom?: Room;

  init() {
    ROOM_DATA.forEach((data) => {
      this.roooms.set(data.name, data);
    });

    this.loadRoom('Level 1');
    // this.loadRoom('Level 10');
  }

  loadRoom(name: string) {
    const data = this.roooms.get(name);
    this.currentRoom = new Room(GRID_SIZE, data);
  }

  getCurrentRoom() {
    return this.currentRoom as Room;
  }
}

export const roomManager = new RoomManager();
