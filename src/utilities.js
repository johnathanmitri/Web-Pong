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

//Utility Menu Logic
/* When the user clicks on the menu button,
toggle between hiding and showing the dropdown content */
function toggleUtilityMenu(e) {
    menu_item_container = document.getElementById("utilities-menu")
    
    //trigger came from event click, not directly menu button
    if (e != null)
    {
        //close if click came from outside menu
        if (e.target.parentElement == null){
            menu_item_container.classList.remove("show");
            window.removeEventListener("mouseup", toggleUtilityMenu);
        }
        //if click wasn't  on menu button and wasn't inside menu
        else if (!e.target.parentElement.matches(".utility-menu-btn, #utilities-container") && !e.target.parentElement.matches("#utilities-menu"))
        {
            //close the menu
            menu_item_container.classList.remove("show");
            window.removeEventListener("mouseup", toggleUtilityMenu);
            //otherwise, keep open
        }
    }
    else 
    {
        //display menu if it is hidden
        if (!menu_item_container.classList.contains("show")){
            menu_item_container.classList.toggle("show");
            window.addEventListener("mouseup", toggleUtilityMenu);
        }
        else
        {
            menu_item_container.classList.remove("show");
            window.removeEventListener("mouseup", toggleUtilityMenu);
        }
    }
}
