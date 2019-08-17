function Level(handler) {
    
    this.handler = handler;
    this.level = WORLD.startLevel;
    this.world = [];
    this.map;
    this.width;
    this.height;
    
    this.obstacles = [];
    this.objects = [];
    this.monsters = [];
    
    this.entrance = this.handler._getGameAssets().spr_entrance;
    
    this._init = function(bool) {
        if (bool) {}
        else {
            ++this.level;
            var world = WORLD.levels[this.level].level;
            this.width = world[this.level].length;
            this.height = world.length;
            this.map = new Array(this.height);
            for (var i = 0; i < this.height; ++i) {
                this.map[i] = new Array(this.width);
                for (var j = 0; j < this.width; ++j) {
                    this.map[i][j] = new Tile(j*64, i*64, world[i][j], this.handler);
                }
            }
            WWIDTH = this.width*64;
            WHEIGHT = this.height*64;
            YBOUND = WHEIGHT-72-64*3;
            var currentLevel = WORLD.levels[this.level].obstacles;
            this.obstacles = [];
            for (var i = 0; i < currentLevel.length; ++i) {
                var current = currentLevel[i];
                this.obstacles.push(new GameObject(current[0]*64,current[1]*64,new Rect(0,0,current[2]*64,current[3]*64)));
            }
            if (this.level < 5) YOFFSET = 50;
            else if (this.level === 6 || this.level === 9) YOFFSET = 35;
            else YOFFSET = 0;
        }
        
        var mons = WORLD.levels[this.level].monsters;
        this.monsters = [];
        for (var i = 0; i < mons.length; ++i) {
            var mon = mons[i];
            this.monsters.push(new Monster(this.handler, mon[0], mon[1], mon[2], mon[3], mon[4]));
            if (mon[5]) {this.monsters[i]._init(mon[5]);}
            this.monsters[i]._init();
        }
        
        var objs = WORLD.levels[this.level].objects;
        this.objects = [];
        for (var i = 0; i < objs.length; ++i) {
            var obj = objs[i];
            this.objects.push(new SpecialObject(this.handler, obj[0], obj[1], obj[2]));
            this.objects[i]._init();
            if (obj[3])
            {this.objects[i]._init(obj[3]);}
            else {this.objects[i]._init();}
        }
        
        if (this.level === 9) {
            var music = handler._getMusic()
            music._setCurrent(music.snd_boss);
        }
    }
    
    this._tick = function() {
        for (var i = 0; i < this.objects.length; ++i) {
            this.objects[i]._tick();
            if (this.objects[i].destroyed) {this.objects.splice(i, 1);}
        }
        for (var i = 0; i < this.monsters.length; ++i) {
            this.monsters[i]._tick();
            if (this.monsters[i].destroyed) {this.monsters.splice(i, 1);}
        }
    }
    
    this._getTile = function(x, y) {
        var result = this.map[y][x];
        if (!result)
            return null;
        return result;
    }
    
    this._render = function(graphics) {
        var xOffset = this.handler._getCamera().xoffset-WIDTH/2,
            yOffset = this.handler._getCamera().yoffset-HEIGHT/2;
        var xStart = Math.max(Math.floor(xOffset/64), 0),
            yStart = Math.max(Math.floor(yOffset/64)-1, 0),
            xLen = Math.min(xStart+wTile+1, this.width),
            yLen = Math.min(yStart+hTile+2, this.height);
        for (var y = yStart; y < yLen; ++y) {
            for (var x = xStart; x < xLen; ++x) {
                this.map[y][x]._render(graphics);
            }
        }
        
        // entrance
        this.entrance.draw(graphics, 96-xOffset, 608-yOffset+YOFFSET);
        // objects
        for (var i = 0; i < this.objects.length; ++i) {
            if(this.objects[i].type !== TYPE.LAVA) this.objects[i]._render(graphics);
        }
        // monsters
        for (var i = 0; i < this.monsters.length; ++i) {
            this.monsters[i]._render(graphics);
        }
        for (var i = 0; i < this.objects.length; ++i) {
            if(this.objects[i].type === TYPE.LAVA) this.objects[i]._render(graphics);
        }
        
        // temprory code for rects
        /*
        for (var i = 0; i < this.obstacles.length; ++i) {
            var obj = this.obstacles[i];
            graphics.fillStyle = "#fff"
            graphics.fillRect(obj.x-xOffset, obj.y-yOffset+YOFFSET, obj.bound.width, obj.bound.height);
        }*/
    }
    
}