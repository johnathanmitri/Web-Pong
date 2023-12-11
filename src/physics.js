// physics.js

// Handle Gameplay Physics Render Loop
var last_rendered_timestamp = 0;
    const refresh_rate = 60;

    function collides(rect1, rect2) {
        return rect1.xPos < rect2.xPos + rect2.width &&
            rect1.xPos + rect1.width > rect2.xPos &&
            rect1.yPos < rect2.yPos + rect2.height &&
            rect1.yPos + rect1.height > rect2.yPos;
    }

    //paddle_of_richochet: which paddle the ball has richocheted off
    //ball_x/y_vel_modifiers: optional modifiers to multiply to ball velocity after richocheting the ball
        //(defaults = 1)
    function handlePaddleBallCollision(paddle_of_richochet, ball_x_vel_modifier=1, ball_y_vel_modifier=1)
    {
    //Obtain richochet angle based on hit location on paddle
        var relativeIntersectY = (paddle_of_richochet.yPos+(paddleHeight/2)) - ball.yPos;
        var normalizedRelativeIntersectionY = (relativeIntersectY/(paddleHeight/2));
        var bounceAngle = normalizedRelativeIntersectionY * (MAXBOUNCEANGLE * (Math.PI / 180));

    //determine reflect "xVel" direction relative to which way it was originally going
        var xVel_ball_reflect_direction = 1; //sending ball in positive "x" direction
        if (Math.sign(ball.xVel) == 1){
            xVel_ball_reflect_direction = -1; //sending ball in negative "x" direction
        }
        ball.xVel = Math.abs(ballSpeed*Math.cos(bounceAngle)) * xVel_ball_reflect_direction;
        ball.yVel = -ballSpeed*Math.sin(bounceAngle);

    // move ball next to the paddle otherwise the collision will happen again in the next frame
        //use x-velocity to determine which direction to place the ball relative to the paddle
            //(positive => place to right, negative => place to left)
        ball.xPos = paddle_of_richochet.xPos;
        if (xVel_ball_reflect_direction == 1)
            ball.xPos = paddle_of_richochet.xPos + paddle_of_richochet.width*1.5;
        else if (xVel_ball_reflect_direction == -1)
            ball.xPos = paddle_of_richochet.xPos - paddle_of_richochet.width*0.5 - ball.width;
    
    //Lastly: apply optional ball velocity modifiers
        ball.xVel = ball.xVel * ball_x_vel_modifier;
        ball.yVel = ball.yVel * ball_y_vel_modifier;
    }


    

    
    function renderFrame(cur_time) {
        if (player_number == -1){
            return;
        }
           
        if (!pause_game_flag){
            requestAnimationFrame(renderFrame); //prepare render of next frame as soon as next refresh occurs
        }
        
         // Determine paddle color based on time elapsed
         var timeElapsed = Date.now() - gameStartTime;

    //New frame, any existing collision or scores has been resolved already 
        localplayer_paddle_collision_this_frame = false;
        opponent_scored = false;
        //Idenfity time scaling factor based on how much time has passed between frames
        //Ideal time between rendering frames should be 16.667ms or 60hz
        time_since_last_rendered = cur_time - last_rendered_timestamp
        time_scaling = (time_since_last_rendered) / (1000 * (1 / refresh_rate));

        last_rendered_timestamp = cur_time; //update timestamp of last rendered frame (this frame) ((would be more intuitive to put this line of code at the end of this function))

        
    //Compute Paddle Physics for Local Player Only

        if (keyStates.up)
            myPaddle.yPos -= paddleSpeed*time_scaling;
        if (keyStates.down)
            myPaddle.yPos += paddleSpeed*time_scaling;

        // prevent paddles from going through walls
        if (myPaddle.yPos < thickness) {
            myPaddle.yPos = thickness;
        }
        else if (myPaddle.yPos > maxPaddleY) {
            myPaddle.yPos = maxPaddleY;
        }


    //Handle Ball-Paddle Collision on this frame
        if (ball_in_localplayer_court && collides(ball, myPaddle))
        {
            console.log("collision occur");
            localplayer_paddle_collision_this_frame = true;
            handlePaddleBallCollision(myPaddle);
        }
        else if (!ball_in_localplayer_court && collides(ball, opponentPaddle))
        {
            console.log("saw collision on opponent paddle");
            handlePaddleBallCollision(opponentPaddle, .6, .6); //slow ball down after local opponent collision to reduce latency effect
        }


        // Handle Ball Movement only if 3 seconds have passed
        if (timeElapsed < 3000) {
            // Calculate remaining seconds for countdown
            var countdown = 3 - Math.floor(timeElapsed / 1000);

            // Get the element where you want to display the countdown
            var countdownElement = document.getElementById("countDownMessage");

            // Display the countdown message with the countdown value
            countdownElement.innerHTML = "Game Will Begin In: " + countdown;
            countdownElement.style.display = "block";
        }else {
            document.getElementById("countDownMessage").style.display = "none";
            // move ball by its velocity 
            ball.xPos += ball.xVel * time_scaling;
            ball.yPos += ball.yVel * time_scaling;

            // prevent ball from going through walls by changing its velocity
            if (ball.yPos < thickness) {
                ball.yPos = thickness;
                ball.yVel *= -1;
            }
            else if (ball.yPos + thickness > canvas.height - thickness) {
                ball.yPos = canvas.height - thickness * 2;
                ball.yVel *= -1;
            }

            //Check Scoring Condition
            // reset ball if it goes past paddle (but only if we haven't already done so)
            //Also ensure that we are the ones in control of the ball (otherwise it is the opponent's job to reset if they got scored on)
            if ((ball.xPos < 0 || ball.xPos > canvas.width) && !ball.resetting && ball_in_localplayer_court) {
                console.log("ball has passed scoreline somewhere and I had priority");
                ball.resetting = true;
                opponent_scored = true;
                score.opponent++;
                setTimeout(() => {
                    ball.resetting = false;
                    
                    ball_reset_complete = true; // gamestate that ball has repositioned and reset is complete

                    // Determine new ball trajectory
                    ball.xPos = canvas.width / 2;
                    ball.yPos = canvas.height / 2;
                }, 600);
            }
        }



        //Handle Component Visual Render
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        
       // Change color of paddle after 3 seconds 
        var paddleColor = timeElapsed >= 3000 ? 'white' : 'yellow';
        if (player_number === 0) {
            // If player controls the left paddle
            var paddleText = timeElapsed >= 3000 ? '' : '<=== You';
        } else {
            // If player controls the right paddle
            var paddleText = timeElapsed >= 3000 ? '' : 'You ===>';
        }
        

        // Draw paddles with the determined color
        if (leftPaddle === myPaddle) {
            context.fillStyle = paddleColor;
            context.fillRect(leftPaddle.xPos, leftPaddle.yPos, leftPaddle.width, leftPaddle.height);

            context.fillStyle = 'white';
            context.fillRect(rightPaddle.xPos, rightPaddle.yPos, rightPaddle.width, rightPaddle.height);
        }
        if (rightPaddle === myPaddle) {
            context.fillStyle = 'white';
            context.fillRect(leftPaddle.xPos, leftPaddle.yPos, leftPaddle.width, leftPaddle.height);

            context.fillStyle = paddleColor;
            context.fillRect(rightPaddle.xPos, rightPaddle.yPos, rightPaddle.width, rightPaddle.height);
        }
       
        context.fillStyle = 'white';
        
        // draw text next to the player-controlled paddle
        context.fillStyle = 'white'; // Set the text color
        context.font = "16px Arial";

        if (player_number === 0) {
            // If player controls the left paddle
            context.fillText(paddleText, leftPaddle.xPos + leftPaddle.width + 5, leftPaddle.yPos + leftPaddle.height / 2);
        } else {
            // If player controls the right paddle
            context.fillText(paddleText, rightPaddle.xPos - 70, rightPaddle.yPos + rightPaddle.height / 2);
        }
        
        // draw ball
        context.fillRect(ball.xPos, ball.yPos, ball.width, ball.height);

        // draw score
        context.font = "48px serif";

        var leftScore, rightScore;
        if (player_number == 0) {
            leftScore = score.me;
            rightScore = score.opponent;
        } else {
            leftScore = score.opponent;
            rightScore = score.me;
        }

        const leftTextWidth = context.measureText(leftScore.toString()).width;
        const rightTextWidth = context.measureText(rightScore.toString()).width;

        context.fillText(leftScore, canvas.width / 2 - thickness*5 - leftTextWidth/2, thickness*4);
        context.fillText(rightScore, canvas.width / 2 + thickness*5 - rightTextWidth/2, thickness*4);

        // draw roof and floor
        context.fillRect(0, 0, canvas.width, thickness);
        context.fillRect(0, canvas.height - thickness, canvas.width, canvas.height);

        // draw dotted line down the middle
        for (let i = thickness+1; i < canvas.height - thickness; i += thickness * 2) {
            context.fillRect(canvas.width / 2 - thickness / 4, i, thickness / 2, thickness);
        }



    //Send local updates (gamestate to opponent)
        if (ball_reset_complete == true) //send instance of the game with the updated ball reset position
        {
            local_gamestate = getGamestate(player_number);
            ball_reset_complete = false;
        }
        else{
            local_gamestate = getGamestate(player_number);
        }

        sendClientMessage({
            "trigger": "external_gamestate",
            "body": local_gamestate
        });

        if (localplayer_paddle_collision_this_frame) {
            ball_in_localplayer_court = false; //we just hit the ball, pass off ball control to opponent
        }
    }


