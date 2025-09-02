export class Camera {
    private offsetX: number;
    private offsetY: number;
    private target: any = null;

    constructor(x, y) {
        this.offsetX = x;
        this.offsetY = y;
    }

    getOffsetX() {
        return this.offsetX;
    }

    getOffsetY() {
        return this.offsetY;
    }

    setOffset(x: number, y: number) {
        this.offsetX = x;
        this.offsetY = y;
    }

    tick() {
        this.followTarget();
    }

    setTarget(obj) {
        this.target = obj;
    }

    private followTarget() {
        if (!this.target) {
            return;
        }

        const halfWidth = 0.5 * WIDTH;
        const halfHeight = 0.5 * HEIGHT;

        const objx = this.target.x;
        const objy = this.target.y;
        this.offsetX += (objx - this.offsetX) / 20.0;
        this.offsetY += (objy - this.offsetY) / 20.0;
        if (this.offsetX <= halfWidth) {
            this.offsetX = halfWidth;
        } else if (this.offsetX >= WWIDTH - halfWidth) {
            this.offsetX = WWIDTH - halfWidth;
        }
        if (this.offsetY <= halfHeight + YOFFSET) {
            this.offsetY = halfHeight + YOFFSET;
        } else if (this.offsetY >= WHEIGHT - halfHeight) {
            this.offsetY = WHEIGHT - halfHeight;
        }
    }
}
