// gamestate.js

// Gamemode Toggle Flags
var pause_game_flag = false;

//TODO: Pause game for both opponents
    //Currently pausing only halts frame rendering on the local player.
function togglePauseGame(){ 
    if (pause_game_flag){
        pause_game_flag = false;
        requestAnimationFrame(renderFrame);
    }
    else {
        pause_game_flag = true;
    }
}
 
// Package and Unpack Gamestate for networking purposes
//Gets current state of gameplay elements (local to player) and puts the information in an object
function getGamestate(player_num) {
    switch (player_num) {
        case 0:
            gamestate = {
                //paddle-ball collision occurred 
                opponent_paddle_ball_collision: localplayer_paddle_collision_this_frame, //opponent will see this local collision as collision from *their* opponent 
                //local player paddle y abs position
                left_paddle_y_pos: leftPaddle.yPos / canvas_scaling, //divide out canvas scaling so when we are using standardized values (two users with different canvas sizes will recieve/send similar values)
                //local player paddle y abs position
                left_paddle_y_vel: leftPaddle.yVel / canvas_scaling,
                //ball abs position
                ball_y_pos: ball.yPos / canvas_scaling,
                ball_x_pos: ball.xPos / canvas_scaling,
                //ball x,y abs velocity
                ball_y_vel: ball.yVel / canvas_scaling,
                ball_x_vel: ball.xVel / canvas_scaling,
                //ball was reset
                ball_has_reset: ball_reset_complete,
                //scoring event
                local_scored: opponent_scored,
            }
            break;
        case 1:
            gamestate = {
                //paddle-ball collision occurred 
                opponent_paddle_ball_collision: localplayer_paddle_collision_this_frame, //opponent will see this local collision as collision from *their* opponent 
                //local player paddle y abs position
                right_paddle_y_pos: rightPaddle.yPos/ canvas_scaling,
                //local player paddle y abs position
                right_paddle_x_vel: rightPaddle.yVel / canvas_scaling,
                //ball abs position
                ball_y_pos: ball.yPos / canvas_scaling,
                ball_x_pos: ball.xPos / canvas_scaling,
                //ball x,y abs velocity
                ball_y_vel: ball.yVel / canvas_scaling,
                ball_x_vel: ball.xVel / canvas_scaling,
                //ball was reset
                ball_has_reset: ball_reset_complete,
                //scoring event
                local_scored: opponent_scored,
            }
            break;
        default:
            console.log("Unknown player #, cannot get gamestate")
            return null;
    }


    return gamestate;
}

//Takes in a gamestate object and compares it to local gamestate
//Handles logic of deciding which gamestate will be rendered in the current frame. 
//Call this function whenever a new gamestate object arrives from network protocol
function handleExternalGamestate(external_gamestate) {
    //Only modify state of ball when a collision has occurred from opponent or ball is resetting on opponents side due to scoring on them
        //otherwise, render game logic as normal, but always update opponents paddle
    if (external_gamestate.opponent_paddle_ball_collision == true)
    {
        console.log("(opposing) collision occurred, render based on opponents gamestate");

        //Modify local gamestate to match incoming gamestate from opponent
        //(Remember to scale by local canvas size)
        //Ball
            //Attempts to compensate for latency by putting ball at midpoint between seen location and recieved location
                //Affirm that doing the above wont cause the ball to be put behind the score line
        if ((ball.xPos < 0 + thickness*3 || ball.xPos > canvas.width - thickness*3)){
            ball.xPos = external_gamestate.ball_x_pos * canvas_scaling;
            ball.yPos = external_gamestate.ball_y_pos * canvas_scaling;
            console.log("ball was locally past score line so lets not do that");
        }
        else { //latency compensation/mitigation
            ball.xPos = ((external_gamestate.ball_x_pos * canvas_scaling) + ball.xPos) /2;
            ball.yPos = ((external_gamestate.ball_y_pos * canvas_scaling) + ball.yPos) /2;
        }
        ball.xVel = external_gamestate.ball_x_vel * canvas_scaling;
        ball.yVel = external_gamestate.ball_y_vel * canvas_scaling;
        ball_in_localplayer_court = true; // Opponent hit ball towards local player
    }
    else if (external_gamestate.ball_has_reset == true)
    {
        console.log("Ball reset triggered; Most likely due to scoring"
        + "\nrender based on opponent's ball reset position; they still have control of ball"); 
        
        //Ball
        ball.xPos = (external_gamestate.ball_x_pos) * canvas_scaling;
        ball.yPos = external_gamestate.ball_y_pos * canvas_scaling;
        ball.xVel = external_gamestate.ball_x_vel * canvas_scaling;
        ball.yVel = external_gamestate.ball_y_vel * canvas_scaling;
        ball_in_localplayer_court = false; //Opponent still has ball
    }

    // console.log("retain gamestate, but update paddle always");

    //(Opponents) Paddle
    if (player_number == 0) //opponent is p1, their side is right
    {
        rightPaddle.yPos = (external_gamestate.right_paddle_y_pos) * canvas_scaling;
        right_paddle_y_vel = external_gamestate.right_paddle_y_vel * canvas_scaling;
    }
    else //opponent is p0, their side is left
    {
        leftPaddle.yPos = (external_gamestate.left_paddle_y_pos) * canvas_scaling;
        left_paddle_y_vel = external_gamestate.left_paddle_y_vel * canvas_scaling;
    }

    //TODO: HANDLE SCORING EVENT HERE
    if (external_gamestate.local_scored){ 
                                          //Triggered whenenever we score, not when we get scored on 
        console.log("We just scored on opponent; (track our score)");
        score.me++;
    }

}
