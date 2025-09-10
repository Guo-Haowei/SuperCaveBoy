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

    tick(dt: number) {
        this.followTarget(dt);
    }

    setTarget(obj) {
        this.target = obj;
    }

    private followTarget(dt: number) {
        if (!this.target) {
            return;
        }

        const halfWidth = 0.5 * WIDTH;
        const halfHeight = 0.5 * HEIGHT;
        const speed = 1 / dt;

        const targetX = this.target.x;
        const targetY = this.target.y;
        this.offsetX += (targetX - this.offsetX) * speed;
        this.offsetY += (targetY - this.offsetY) * speed;

        this.offsetX = clamp(this.offsetX, halfWidth, WWIDTH - halfWidth);
        this.offsetY = clamp(this.offsetY, halfHeight + YOFFSET, WHEIGHT - halfHeight);
    }
}
