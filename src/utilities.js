//utilities.js

//Toggle game rendering
    //notify_opponent should be set to true if toggle was caused by local player
function togglePauseGame(notify_opponent=false){ 
    if (pause_game_flag){
        pause_game_flag = false;
        //unpause game locally
        last_rendered_timestamp = document.timeline.currentTime; //update timestamp to now so next frame render won't jump to future
        requestAnimationFrame(renderFrame);
    }
    else {
        pause_game_flag = true;
    }
    
//notify opponent that pause has been toggled
    if (notify_opponent){
        sendClientMessage({
            "trigger": "utility_update",
            "body": [{
                utility: "pause_game_flag",
                action: pause_game_flag,
            }]
        });
    }
}