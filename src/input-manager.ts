class KeyManager {
  private pressedKeys = new Set();
  private downKeys = new Set();

  private isDragging = false;
  private lastPos = { x: 0, y: 0 };
  private currPos = { x: 0, y: 0 };
  private delta = { x: 0, y: 0 };
  private scroll = 0;

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

    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastPos = { x: e.clientX, y: e.clientY };
      this.currPos = { ...this.lastPos };
      this.delta = { x: 0, y: 0 };
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.currPos = { x: e.clientX, y: e.clientY };
      }
    });

    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.delta = { x: 0, y: 0 };
    });

    canvas.addEventListener('wheel', (e) => {
      if (e.deltaY < 0) {
        this.scroll = -1;
      } else {
        this.scroll = 1;
      }

      e.preventDefault();
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

  preUpdate(_dt: number) {
    if (this.isDragging) {
      this.delta.x = this.currPos.x - this.lastPos.x;
      this.delta.y = this.currPos.y - this.lastPos.y;
      this.lastPos = { ...this.currPos };
    } else {
      this.delta = { x: 0, y: 0 };
    }
  }

  postUpdate(_dt: number) {
    this.scroll = 0;
  }

  getScroll(): number {
    return this.scroll;
  }

  getDragDelta(): { x: number; y: number } {
    return this.delta;
  }

  isMouseDragging(): boolean {
    return this.isDragging;
  }
}

export const inputManager = new KeyManager();
