function Sprite(img, x, y, width, height) {
	this.img = img;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;

    // 00 no filp, 01 horizontol flip, 10 vertically flip
    this.draw = function(graphics, x, y, Alpha, Flip)
    {
	var alpha = (typeof Alpha === 'undefined')?1:Alpha;
	var flip = (typeof Flip === 'undefined')?0:Flip;
        graphics.globalAlpha = alpha;

        var hFlip = flip & 1,
        vFlip = (flip & 2) >> 1;

        graphics.translate(x+hFlip*this.width,y+vFlip*this.height);

        graphics.scale((hFlip===1?-1:1), (vFlip===1?-1:1));


        graphics.drawImage(this.img, this.x, this.y, this.width, this.height, 0, 0, this.width, this.height);

        graphics.globalAlpha = 1;
        graphics.setTransform(1,0,0,1,0,0);
    };
};
