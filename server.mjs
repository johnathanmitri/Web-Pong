import WebSocket, { WebSocketServer } from 'ws';
import readline from 'readline';
import { randomUUID } from 'crypto';

//const server = new WebSocketServer({ port: 8080 });
//server.binaryType = "text";

const httpsServer = https.createServer({
    cert: fs.readFileSync('/etc/pki/tls/certs/webpong.net.chain.crt'),
    key: fs.readFileSync('/etc/pki/tls/private/webpong.net.key')
});
const server = new wsLibrary.WebSocketServer({ server: httpsServer });
server.binaryType = "text";

const MAX_LOBBY_NUMBERS = 1000;

const clients = new Map();

class Client {
	constructor(ws) {
		this.ws = ws;
		this.username = '';
		this.inGame = false;
		//this.lookingForGame = 
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



// empty map 
//const partners = new Map();

// const clients = new Set();

// key is lobby number, value is client

var latestClient = null;

function queuePlayer(client, options) // client is the player who is requesting to be paired
{
	//var lobby_number = options.lobby_num || null
	
	//skip queue is joining direct with lobby number
	if (options)
	{
		let lobby_number = null;
		if (options.lobby_num)
			lobby_number = parseInt(options.lobby_num);
		//match client with lobby number and connect if not in a match currently
		/*for (const host_client of clients)
		{
			if (host_client.lobby_number == lobby_number && host_client.inGame == false){
				console.log(host_client.lobby_number);
				connectClients(client, host_client);
				return;
			}
		}*/
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
			//partners.set(latestClient, ws);  // pair these two in the hashmap. 
			//partners.set(ws, latestClient);

			//Connect both players
			connectClients(client, latestClient);
			latestClient = null; //drop player from queue after making connection 

			// ws.send("You have been paired.");
			// latestClient.send("You have been paired.");
			//latestClient = null;
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
				//...additional default settings
			}
		}
	))
	
	//clients.set(ws);

	function closeOrError(error)
	{
		console.log("Client disconnected.");
		clients.delete(client.lobby_number);

		//if (partners.has(ws))
		if (client.partner != null)
		{
			//let partner = partners.get(ws);

			//partners.delete(ws);
			//partners.delete(partner);
			client.partner.send("s" + JSON.stringify( // "s" => message comes from server, not other client.
			{
				"trigger": "opponent_disconnected",
				"message": "Your opponent has disconnected",
				/*"body": {
					"player_num": 0
				}*/
			}));
			client.partner.partner = null;
			client.inGame = false;
			//latestClient = client.partner;
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


