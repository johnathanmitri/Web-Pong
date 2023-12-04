// pong-basics.js

// Define Basic Pong Elements
function chatKeyPressed(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline in textarea
      sendChatMessage();
    }
}

function appendMessage(name, message)
{
    var nameElement = document.createElement("strong");
    nameElement.textContent = name + ": ";
    var messageNode = document.createTextNode(message);
    var lineBreak = document.createElement("br");
    var chatMessages = document.getElementById("chatMessages");
    chatMessages.appendChild(nameElement);
    chatMessages.appendChild(messageNode);
    chatMessages.appendChild(lineBreak);
    // auto scroll
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage()
{
    //console.log("Send msg");
    msg = document.getElementById("chatInput").value;
    if (msg == "")
        return;
    document.getElementById("chatInput").value = "";

    appendMessage("Me", msg);


    sendClientMessage({
        "trigger": "chat_message_recieved",
        "msg": msg
    });

    

}

function openModal(first_join=false, new_lobby_num=null) {
    document.getElementById("modal").style.display = "block";
    document.getElementById("findOpponentBtn").style.display = "initial";
    document.getElementById("searchingMsg").style.display = "none";
    document.getElementById("pre-game-lobby-menu-group").style.display = "block"
    if (!first_join){
        document.getElementById("opponentMessage").style.display = "block";
    }
    if (new_lobby_num != null)
    {
        lobby_code_elms = document.getElementsByClassName("lobby-code-label");
        for (i = 0; i < lobby_code_elms.length; i++) {
            lobby_code_elms[i].dataset.lobbynum = new_lobby_num;
            lobby_code_elms[i].innerHTML = "Your Lobby Code: " + new_lobby_num;
        }
    }
}
function findOpponent(lobby_num = null) {
    document.getElementById("modal").style.display = "block";
    document.getElementById("pre-game-lobby-menu-group").style.display = "none"
    document.getElementById("searchingMsg").style.display = "initial";

    score.me = 0;
    score.opponent = 0;
    leftPaddle.yPos = (canvas.height / 2) - (paddleHeight / 2);
    rightPaddle.yPos = (canvas.height / 2) - (paddleHeight / 2);

    if (lobby_num != null){
        sendServerMessage({
            "trigger": "find_opponent",
            "body": {
                "lobby_num": lobby_num
            }
        });
    }
    else{
        sendServerMessage({
            "trigger": "find_opponent",
        });
    }
}
function findLobby(){ 
    lobby_to_search_for = document.getElementById("lobby-num-input").value;
    findOpponent(lobby_to_search_for);
}
function foundOpponent() {
    document.getElementById("modal").style.display = "none";
    document.getElementById("chatMessages").innerHTML = "";
    document.getElementById("chat").style.visibility = "visible";
}
const Key = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    P: 80
};
const keyStates = 
{
    up: false,
    down: false
    /*UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false,
    W: false,
    A: false,
    S: false,
    D: false*/
}

const score =
{
    me: 0,
    opponent: 0
};

//Initialize Canvas proportional to loaded screensize
//Scale components by canvas size (relative to default height 996px)
canvas_scaling = window.innerHeight / 996;
const canvas_container = document.getElementById("canvas-container");
canvas_container.innerHTML = `<canvas width="${window.innerHeight * 1}" height="${window.innerHeight * 0.8}" id="game"></canvas> `;
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

//Initialize component attributes
const thickness = 15 * canvas_scaling;
const paddleHeight = thickness * 7; // 5 is default 
const maxPaddleY = canvas.height - thickness - paddleHeight;
const MAXBOUNCEANGLE = 50;

var paddleSpeed = 6 * canvas_scaling; // 6 is default
var ballSpeed = 9 * canvas_scaling; // 6 is default

//Information about gameplay elements from opponent(s)
var most_recent_external_gamestate = null;

const ball = {
    xPos: canvas.width / 2, // middle of the board
    yPos: canvas.height / 2,
    xVel: Math.cos(45 * Math.PI / 180) * ballSpeed,
    yVel: Math.sin(45 * Math.PI / 180) * ballSpeed,
    width: thickness,
    height: thickness,
    
    // keep track of when need to reset the ball position
    resetting: false,
};

const leftPaddle = {
    xPos: thickness * 2, // offset from left side of the screen
    yPos: (canvas.height / 2) - (paddleHeight / 2), // start at middle of the screen vertically
    yVel: 0,
    width: thickness,
    height: paddleHeight,
    color: 'white',
};

const rightPaddle = {
    xPos: canvas.width - (thickness * 3), // offset from right side of the screen
    yPos: (canvas.height / 2) - (paddleHeight / 2), // start at middle of the screen vertically
    yVel: 0,
    width: thickness,
    height: paddleHeight,
    color: 'white',
};

//Gamestate Flags
var player_number = -1;
var ball_in_localplayer_court = false;
var localplayer_paddle_collision_this_frame = false;
var opponent_scored = false;
var ball_reset_complete = false;
var myPaddle = null;
var opponentPaddle = null;

//Gamestate Utility Flags
var pause_game_flag = false;