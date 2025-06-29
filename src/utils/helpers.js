// define polygons

function grabbingCollision(obj1, obj2, func) {
    if (!obj1.vspeed || !obj2.bound || !obj1.bound) return false;
    var bound1 = obj1.bound, bound2 = obj2.bound;
    // obj1 is on the left
    if (obj1.y+bound1.y <= obj2.y+bound2.y && obj1.y+bound1.y+obj1.vspeed >= obj2.y+bound2.y) {
        if (obj1.x+bound1.x+bound1.width === obj2.x+bound2.x) { // obj1 is on the left
            obj1.face = 1;
            return true;
        } else if (obj1.x+bound1.x === obj2.x+bound2.x+bound2.width) { // obj1 is on the right
            obj1.face = 0;
            return true;
        }
    }
    return false;
}

function upCollision(obj1, obj2, func) {
    if (!obj1.vspeed || !obj2.bound || !obj1.bound) return false;
    var bound1 = obj1.bound, bound2 = obj2.bound;
    if (obj1.x+bound1.x+bound1.width-STEPOFFSET >= obj2.x+bound2.x && obj1.x+bound1.x+STEPOFFSET <= obj2.x+bound2.x+bound2.width) {
        var lowerBound = obj2.y+bound2.y+bound2.height;
        if (obj1.y+bound1.y >= lowerBound && obj1.y+bound1.y+obj1.vspeed <= lowerBound) {
            obj1.y = lowerBound-bound1.y;
            obj1.vspeed = 0;
            if (func) func();
            return true;
        }
    }
    return false;
}

function downCollision(obj1, obj2, func) {
    if (!obj1.vspeed || !obj2.bound || !obj1.bound) return false;
    var bound1 = obj1.bound, bound2 = obj2.bound;
    if (obj1.x+bound1.x+bound1.width-STEPOFFSET >= obj2.x+bound2.x && obj1.x+bound1.x+STEPOFFSET <= obj2.x+bound2.x+bound2.width) {
        var obj1bottom = obj1.y+bound1.y+bound1.height;
        if (obj1bottom <= obj2.y+bound2.y && obj1bottom + obj1.vspeed >= obj2.y+bound2.y) {
            if (func) {func();return;}
            var newY = obj2.y+bound2.y-bound1.height-bound1.y;
            if (newY !== obj1.y) {
                // land on new obj2
                obj1.y = newY;
                if (obj1._land)obj1._land();
            }
            return true;
        }
    }
    return false;
}

function hCollision(obj1, obj2, func) {
    if (!obj2.bound || !obj1.bound) return false;
    var speed2 = (obj2.hspeed&&obj2.speed)?obj2.speed*obj2.hspeed:0;
    var speed1 = obj1.hspeed*obj1.speed;
    var bound1 = obj1.bound, bound2 = obj2.bound;
    var vspeed = obj1.vspeed?obj1.vspeed:0;
    if (obj1.y+bound1.y+bound1.height+vspeed >= obj2.y+bound2.y && obj1.y+bound1.y+vspeed <= obj2.y+bound2.y+bound2.height) {
        if (obj1.hspeed < 0 && speed2 < 0) { // approach from left
            var rightBound = obj2.x+bound2.x+bound2.width;
            if (obj1.x+bound1.x >= rightBound && obj1.x+bound1.x+speed1 <= rightBound+speed2) {
                if (func) {func();return true;}
                obj1.x = obj2.x+bound2.x+bound2.width-bound1.x;
                return true;
            }
        } else if (obj1.hspeed > 0 || speed2 < 0) { // approach from left
            var rightSide = obj1.x+bound1.x+bound1.width;
            if (rightSide <= obj2.x+bound2.x && rightSide+speed1 >= obj2.x+bound2.x+speed2) {
                if (func) {func();return true;}
                obj1.x = obj2.x+bound2.x-bound1.width-bound1.x;
                return true;
            }
        } else if (obj1.hspeed < 0 || speed2 > 0) { // approach from right
            var rightBound = obj2.x+bound2.x+bound2.width;
            if (obj1.x+bound1.x >= rightBound && obj1.x+bound1.x+speed1 <= rightBound+speed2) {
                if (func) {func();return true;}
                obj1.x = obj2.x+bound2.x+bound2.width-bound1.x;
                return true;
            }
        }
    }
    return false;
}

function checkAllCollision(obj1, arr, colliDir, func) {
    for (var i = 0; i < arr.length; ++i) {
        if (colliDir(obj1, arr[i], func, func)) return true; 
    }
    return false;
}

// priority queue

function PriorityQueue() {
    this.data = [];
}

PriorityQueue.prototype.push = function(element, priority) {
    priority = +priority;
    var i = 0;
    for (; i < this.data.length && this.data[i][1] < priority; i++);
    this.data.splice(i, 0, [element, priority]);
}

PriorityQueue.prototype.pop = function() {
    return this.data.shift()[0];
}

PriorityQueue.prototype.size = function() {
    return this.data.length;
}
