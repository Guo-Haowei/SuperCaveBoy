window.addEventListener( "keypress", this.keyPressed);
window.addEventListener( "keyreleased", this.keyDown, true);

window.addEventListener( "keyup", this.keyUp, true);
window.addEventListener( "keydown", this.keyDown, true);

function KeyManager() {
    // fields
    this.keys = new Array(256);
    
    this.upKey = BOOL.FALSE;
    this.leftKey = BOOL.FALSE;
    this.rightKey = BOOL.FALSE;
    this.spaceKey = BOOL.FALSE;
    
    this.pressed = false; 
    this.takeInput = false;
    
    this._init = function () {
        for (var i = 0; i < 256; ++i) {
            this.keys[i] = BOOL.FALSE;
        }
    }
    // methods
    this._tick = function() {
        this.upKey = this.keys[KEYEVENT.VK_UP];
        this.leftKey = this.keys[KEYEVENT.VK_LEFT];
        this.rightKey = this.keys[KEYEVENT.VK_RIGHT];
        this.spaceKey = this.keys[KEYEVENT.SPACE];
    }
    
    this._setTakeInput = function(bool) {
        this.takeInput = bool;
    }
    
}

var keyManager = new KeyManager();
keyManager._init();

function keyDown(e) {
    if (!keyManager.takeInput) return;
    keyManager.keys[e.keyCode] = BOOL.TRUE;
    // key pressed
    if (e.keyCode == KEYEVENT.VK_UP) {
        if (keyManager.pressed) keyManager.keys[e.keyCode] = BOOL.FALSE;
        keyManager.pressed = true;
    }
}

function keyUp(e) {
    if (!keyManager.takeInput) return;
    keyManager.keys[e.keyCode] = BOOL.FALSE;
    if (e.keyCode == KEYEVENT.VK_UP) {keyManager.pressed = false;}
}
