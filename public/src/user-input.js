// user-input.js

// Handle User Input
document.addEventListener('keydown', function (e) {
    if (!e.repeat) {
        let chatHasFocus = document.activeElement === document.getElementById("chatInput");
        // up arrow key
        if (e.which === Key.UP || (!chatHasFocus && e.which === Key.W)) {
            keyStates.up = true;
        }
        // down arrow key
        else if (e.which === Key.DOWN || (!chatHasFocus && e.which === Key.S)) {
            keyStates.down = true;
        }
        else if (!chatHasFocus && e.which === Key.P){
            console.log("toggle pause");
            togglePauseGame(notify_opponent = true);
        }
        // console.log("KEY DOWN !!");
    }
});

// Set Paddle Velocity == 0 if pressed key is let go
document.addEventListener('keyup', function (e) {
    if (!e.repeat) {
        if (e.which === Key.UP || e.which === Key.W) {
            keyStates.up = false;
        }
        // down arrow key
        else if (e.which === Key.DOWN || e.which == Key.S) {
            keyStates.down = false;
        }
        // console.log("KEY UP !!");
    }
});
