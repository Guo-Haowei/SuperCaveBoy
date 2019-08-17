var tempLeft = KEYEVENT.VK_LEFT, tempRight = KEYEVENT.VK_RIGHT, tempUp = KEYEVENT.VK_UP;

function my_open() {
    document.getElementById("mySidenav").style.display = "block";
    document.getElementById("menu").style.display = "none";
}
 
function my_close() {
    document.getElementById("mySidenav").style.display = "none";
    document.getElementById("menu").style.display = "block";
}

function customize() {
    var myfps = document.getElementById("fps").value;
    var fpsint = parseInt(myfps);
    if (typeof fpsint === "number") {
        if (fpsint >= 5 && fpsint <= 80) {fps = fpsint;}
        else fps = 60;
        document.getElementById("fps").value = "";
        document.getElementById("fps").placeholder = fps.toString();
    }
    KEYEVENT.VK_LEFT = tempLeft;
    KEYEVENT.VK_RIGHT = tempRight;
    KEYEVENT.VK_UP = tempUp;
    my_close();
}

var leftKey = document.getElementById('leftkey')
leftKey.addEventListener('keydown', function(e) {
    var keycode = e.keyCode;
    if (typeof keycode === 'number') {
        tempLeft = keycode;
        leftKey.value = keycode;
    }
});

var rightKey = document.getElementById('rightkey')
rightKey.addEventListener('keydown', function(e) {
    var keycode = e.keyCode;
    if (typeof keycode === 'number') {
        tempRight = keycode;
        rightKey.value = keycode;
    }
});

var upKey = document.getElementById('jumpkey')
upKey.addEventListener('keydown', function(e) {
    var keycode = e.keyCode;
    if (typeof keycode === 'number') {
        tempUp = keycode;
        upKey.value = keycode;
    }
});


function reStart() {
    try {
        game._init();
    } catch (err) {
        console.log(err)
    }
}

function skip() {
    try {
        var obs = game.level.objects;
        if (obs.length === 2 && obs[1].type === TYPE.CAMERA) {
            obs[1]._cameraSkip();
        }
    } catch (err) {
        console.log(err)
    }
}

canvas.addEventListener("mousedown", getPosition, false);

function getPosition(event) {
    var x = event.x;
    var y = event.y;

    var c = document.getElementsByTagName("canvas")[0];
    x -= c.offsetLeft;
    y -= c.offsetTop;

    if (x > 30 && x < 120 && y > 520 && y < 564) {
        reStart();
    }
    if (x > 840 && x < 930 && y > 520 && y < 564) {
        skip();
    }
}
