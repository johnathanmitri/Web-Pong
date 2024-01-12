const WebSocketServer = require('ws').WebSocketServer;
const readline = require('readline');
const express = require('express');

const HTTP_PORT = 80;
const WS_PORT = 8080;

const app = express();
app.use(express.static(__dirname + '/public'));
app.listen(80, () => {
    console.log(`HTTP server listening on port ${HTTP_PORT}`);
});

const server = new WebSocketServer({ port: WS_PORT }, () => {
	console.log(`Websocket server listening on port ${WS_PORT}`)
});

server.binaryType = "text";

const MAX_LOBBY_NUMBERS = 1000;

const clients = new Map();

class Client {
	constructor(ws) {
		this.ws = ws;
		this.username = '';
		this.inGame = false;
		this.partner = null;
		do
		{
			this.lobby_number = Math.floor(Math.random() * MAX_LOBBY_NUMBERS);
		}
		while (clients.has(this.lobby_number));
		console.log(this.lobby_number);
	}
	
	send(msg)
	{
		this.ws.send(msg);
	}
}

// key is lobby number, value is client

var latestClient = null;

function queuePlayer(client, options) // client is the player who is requesting to be paired
{
	//skip queue is joining direct with lobby number
	if (options)
	{
		let lobby_number = null;
		if (options.lobby_num)
			lobby_number = parseInt(options.lobby_num);
		//match client with lobby number and connect if not in a match currently

		if (clients.has(lobby_number))
		{
			let opponent = clients.get(lobby_number);
			if (opponent.inGame == false)
			{
				console.log(opponent.lobby_number);
				connectClients(client, opponent);
				return;
			}
		}

		console.log("host is either in game or lobby couldn't be found");
		client.send("s" + JSON.stringify( // "s" => message comes from server, not other client.
		{
			"trigger": "opponent_disconnected",
			"message": "Could not find opponent",
		}));

	}
	//if not joining direct, put player in standard queue
	else 
	{
		if (latestClient == null)
			latestClient = client;
		else 
		{
			//Connect both players
			connectClients(client, latestClient);
			latestClient = null; //drop player from queue after making connection 
		}
	}
}

//connects two clients inside a single game lobby
function connectClients(p0_client, p1_client) 
{
	p0_client.partner = p1_client;
	p1_client.partner = p0_client;

	//joiner (player0) inherits lobby number of the host (player 1)
	p0_client.lobby_number = p1_client.lobby_number;

	//Set player position (left or right paddle)
	p0_client.send("s" + JSON.stringify( // "s" => message comes from server, not other client.
		// this allows the client to know that the server is deliberately sending it a message, and not just forwarding the other client message
		{
			"trigger": "connection_established",
			"message": "You are left paddle (P1)",
			"body": {
				"player_num": 0
			}
		}
	));
	p0_client.partner.send("s" + JSON.stringify(
		{
			"trigger": "connection_established",
			"message": "You are right paddle (P2)",
			"body": {
				"player_num": 1
			}
		}
	));
}



server.on('connection', function connection(ws) 
{
	console.log("New client connected.")

	var client = new Client(ws);
	
	clients.set(client.lobby_number, client);
	//ws.send("Hello from the server.");
	client.send("s" + JSON.stringify( //send initialization variables to client when first connecting to server
		{
			"trigger" : "client_initialization",
			"message" :"Welcome to WebPong",
			"body": {
				"lobby_num": client.lobby_number,
				"username": client.username,
			}
		}
	))
	
	//clients.set(ws);

	function closeOrError(error)
	{
		console.log("Client disconnected.");
		clients.delete(client.lobby_number);

		if (client.partner != null)
		{
			client.partner.send("s" + JSON.stringify( // "s" => message comes from server, not other client.
			{
				"trigger": "opponent_disconnected",
				"message": "Your opponent has disconnected",
			}));
			client.partner.partner = null;
			client.inGame = false;
		}
		else if (latestClient == client)
		{
			latestClient = null;
		}
	}

	ws.on('error', closeOrError);

	ws.on('close', closeOrError);

	ws.on('message', function message(data) 
	{
		let str = data.toString();
		if (str.charAt(0) == "c")
		{
			if (client.partner)
				client.partner.send(str);

		}
		else
		{ // this message is for the server.
			let msg = str.substring(1);
			console.log("We were sent a message: " + msg);

			let messageObj = JSON.parse(msg);

			if (messageObj["trigger"] == "find_opponent")
			{
				if (messageObj.hasOwnProperty('body')){
					var options = messageObj["body"];
					queuePlayer(client, options) // join specific lobby
					console.log("try to join lobby: " + options.lobby_num);
				}
				else {
					queuePlayer(client); // standard queue
					console.log("entering standard queue");
				}
			}
		}
		//console.log(data);
	});
});


const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function promptForCommand() {
	rl.question('', (command) => {
		if (command === 'exit') {
			process.exit()
		} 
		else {
			// Process the command
			console.log('You entered: ' + command);
			
			// Continue waiting for the next command
			promptForCommand();
		}
	});
}

// Start the loop by prompting for the first command
promptForCommand();


