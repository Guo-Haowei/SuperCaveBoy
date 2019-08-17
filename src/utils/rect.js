function Rect(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

function Polygon(arr) {
    this.points = arr;
    
    this._render = function(graphics ,xOffset, yOffset) {
        var size = this.points.length;
        var lastPoint = this.points[size-1];
        graphics.fillStyle = '#fff';
        graphics.beginPath();
        graphics.moveTo(lastPoint[0]+xOffset, lastPoint[1]+yOffset);
        for (var i = 0; i < size; ++i) {
            graphics.lineTo(this.points[i][0]+xOffset, this.points[i][1]+yOffset);
        }
        graphics.stroke();
    }
}
