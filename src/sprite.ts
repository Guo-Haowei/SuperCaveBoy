export class OldSprite {
    image: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(image, x, y, width, height) {
	    this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    // 00 no filp, 01 horizontol flip, 10 vertically flip
    draw(graphics: CanvasRenderingContext2D, x: number, y: number, Alpha?: number, Flip?: number) {
	    const alpha = (typeof Alpha === 'undefined')? 1 : Alpha;
	    const flip = (typeof Flip === 'undefined')? 0 : Flip;
        graphics.globalAlpha = alpha;

        var hFlip = flip & 1,
        vFlip = (flip & 2) >> 1;

        graphics.translate(x+hFlip*this.width,y+vFlip*this.height);

        graphics.scale((hFlip===1?-1:1), (vFlip===1?-1:1));


        graphics.drawImage(this.image, this.x, this.y, this.width, this.height, 0, 0, this.width, this.height);

        graphics.globalAlpha = 1;
        graphics.setTransform(1,0,0,1,0,0);
    };
};
