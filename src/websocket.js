// websocket.js

var fake_lag = 0; // (20 frames of fake latency between opponents)
var gamestate_lag_queue = [];

var hostname = window.location.hostname;
if (hostname === "") hostname = "localhost";

const ws = new WebSocket(`wss://${hostname}:8080`);
ws.addEventListener("open", (event) => {
  ws.binaryType = "arraybuffer";
});

// Listening for messages coming through this websocket
ws.addEventListener("message", async (event) => {
  message_obj = JSON.parse(event.data.substring(1));

  // If message is from opponents newest gamestate
  if (message_obj["trigger"] == "external_gamestate") {
    gamestate_lag_queue.push(message_obj["body"]);
    if (gamestate_lag_queue.length >= fake_lag) {
      most_recent_external_gamestate = gamestate_lag_queue.shift();
    }
    if (message_obj["debug_message"]) {
      console.log(message_obj["debug_message"]);
    }

    // Handle external gamestate (gamestate from opponent)
    if (most_recent_external_gamestate != null) {
      handleExternalGamestate(most_recent_external_gamestate);
      most_recent_external_gamestate = null;
    }
  }
  // If message if from opponent triggering a gamestate utility. ie. pausing
  else if (message_obj["trigger"] == "utility_update") 
  {
    if (message_obj["debug_message"]) {
      console.log(message_obj["debug_message"]);
    }
    handleExternalUtilityUpdates(message_obj["body"]);
  }
  // If message is connection established
  else if (message_obj["trigger"] == "connection_established") {
    foundOpponent();
    console.log("connection established");
    console.log(message_obj);
    player_number = message_obj["body"]["player_num"];
    if (player_number == 1) {
      // ball starts off going to the right side
      ball_in_localplayer_court = true;

      myPaddle = rightPaddle; // player 1 gets the right paddle
      opponentPaddle = leftPaddle;
    } else {
      myPaddle = leftPaddle; // player 0 gets the left paddle
      opponentPaddle = rightPaddle;
    }
    // start the game now
    last_rendered_timestamp = document.timeline.currentTime; 
    requestAnimationFrame(renderFrame); //generates pong visuals
    gameStartTime = Date.now();

  } else if (message_obj["trigger"] == "opponent_disconnected") {
    document.getElementById("opponentMessage").innerHTML = message_obj["message"];
    console.log("opponent disconnected");
    console.log(message_obj);
    player_number = -1;
    openModal();
  } else if (message_obj["trigger"] == "client_initialization") {
    initialization_params = message_obj["body"];
    console.log(initialization_params);
    openModal(first_join = true, new_lobby_num = initialization_params["lobby_num"]);
  } else if (message_obj["trigger"] == "chat_message_recieved") {
    console.log("Message received: " + message_obj["msg"]);
    appendMessage("Opponent", message_obj["msg"]);
  }
});

// Functions for sending messages to websocket
// Call if data needs to be sent to the connected client
function sendClientMessage(msg) {
  ws.send("c" + JSON.stringify(msg));
}

// Call if data needs to be sent to the server
function sendServerMessage(msg) {
  ws.send("s" + JSON.stringify(msg));
}
