export class Camera {
    xoffset: number;
    yoffset: number;
    target = null;

    constructor(x, y) {
        this.xoffset = x;
        this.yoffset = y;
    }

    _getxoffset() {
        return this.xoffset;
    }

    _getyoffset() {
        return this.yoffset;
    }

    _setoffset(x, y) {
        this.xoffset = x;
        this.yoffset = y;
    }

    _tick() {
        this._followTarget();
    }

    _setTarget(obj) {
        this.target = obj;
    }

    _followTarget() {
        if (this.target == null) return;
        const objx = this.target.x, objy = this.target.y;
        this.xoffset += (objx - this.xoffset) / 20.0;
        this.yoffset += (objy - this.yoffset) / 20.0;
        if (this.xoffset <= WIDTH / 2) {
            this.xoffset = WIDTH / 2;
        } else if (this.xoffset >= WWIDTH - WIDTH / 2) {
            this.xoffset = WWIDTH - WIDTH / 2;
        }
        if (this.yoffset <= HEIGHT / 2 + YOFFSET) {
            this.yoffset = HEIGHT / 2 + YOFFSET;
        } else if (this.yoffset >= WHEIGHT - HEIGHT / 2) {
            this.yoffset = WHEIGHT - HEIGHT / 2;
        }
    }
}
