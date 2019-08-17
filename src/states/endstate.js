function EndState(handler) {
    // fields
    this.handler = handler;
    this.sprite = this.handler._getGameAssets().spr_dirt;

    // methods
    this._tick = function() {

    }

    this._drawText = function(graphics) {
        var content, diff = handler._getGame().end - handler._getGame().start;
        var x = Math.round(diff/1000);
        var seconds = (x%60).toString();
        var minutes = ((x-seconds)/60).toString();
        var s = seconds.length<=1?'0'+seconds:seconds;
        var m = minutes.length<=1?'0'+minutes:minutes;
        var time = "Your Time Was: "+m+" : "+s;
        if (this.handler._getPlayer().health <= 0) {
            content = "You lost!"
        } else {
            content = "You Won!"
        }

        graphics.fillStyle = "#ffffff";
        graphics.font = "64pt Arial";
        graphics.fillText(content, 290, 220);
        graphics.font = "36pt Arial";
        graphics.fillText(time, 240, 320);
        graphics.fillText("You Score was: "+this.handler._getPlayer().sapphire, 290, 400);


        var highest = document.cookie;
        var array = highest.split('=');
        var score;
        for (var i = 0; i < array.length; ++i) {
          if (array[i].includes('score')) {
            score = parseInt(array[i+1]);
            break;
          }
        }
        if ((score||0) < this.handler._getPlayer().sapphire ) {
          document.cookie = "score="+this.handler._getPlayer().sapphire;
        }
        highest = document.cookie;
        array = highest.split('=');
        for (var i = 0; i < array.length; ++i) {
          if (array[i].includes('score')) {
            score = parseInt(array[i+1]);
            break;
          }
        }
        if (typeof score !== 'number') score = this.handler._getPlayer().sapphire;
        graphics.fillText("High Score was: "+score, 290, 480);
    }

    this._render = function(graphics) {
        for (var h = 0; h < hTile; ++h) {
            for (var w = 0; w < wTile; ++w) {
                this.sprite.draw(graphics, w*64, h*64);
            }
        }
        this._drawText(graphics);
    }
}
