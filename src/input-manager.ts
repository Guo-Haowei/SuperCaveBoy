class KeyManager {
  pressedKeys = new Set();
  downKeys = new Set();

  constructor() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.downKeys.add(e.code);
      if (!e.repeat) {
        this.pressedKeys.add(e.code);
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.pressedKeys.delete(e.code);
      this.downKeys.delete(e.code);
    });
  }

  isKeyPressed(key: string): boolean {
    if (this.pressedKeys.has(key)) {
      this.pressedKeys.delete(key);
      return true;
    }
    return false;
  }

  isKeyDown(key: string): boolean {
    return this.downKeys.has(key);
  }
}

export const inputManager = new KeyManager();
