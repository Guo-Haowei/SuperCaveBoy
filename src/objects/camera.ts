// @TODO: move to utils
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

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

        this.offsetX = clamp(this.offsetX, halfWidth, WWIDTH - halfWidth);
        this.offsetY = clamp(this.offsetY, halfHeight + YOFFSET, WHEIGHT - halfHeight);
    }
}
