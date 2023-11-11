import WebSocket, { WebSocketServer } from 'ws';
import readline from 'readline';

const server = new WebSocketServer({ port: 8080 });
server.binaryType = "text";


class Client {
	constructor(ws) {
		this.ws = ws;
		this.username = '';
		this.inGame = false;
		//this.lookingForGame = 
		this.partner = null;
	}
	
	send(msg)
	{
		this.ws.send(msg);
	}
}



// empty map 
//const partners = new Map();

const clients = new Set();

var latestClient = null;

function queuePlayer(client) // client is the player who is requesting to be paired
{
	if (latestClient == null)
		latestClient = client;
	else {
		//partners.set(latestClient, ws);  // pair these two in the hashmap. 
		//partners.set(ws, latestClient);
		client.partner = latestClient;
		latestClient.partner = client;


		latestClient = null;

		//Set player position (left or right paddle)
		client.send("s" + JSON.stringify( // "s" => message comes from server, not other client.
			// this allows the client to know that the server is deliberately sending it a message, and not just forwarding the other client message
			{
				"trigger": "connection_established",
				"message": "You are left paddle (P1)",
				"body": {
					"player_num": 0
				}
			}
		));
		client.partner.send("s" + JSON.stringify(
			{
				"trigger": "connection_established",
				"message": "You are right paddle (P2)",
				"body": {
					"player_num": 1
				}
			}
		));


		// ws.send("You have been paired.");
		// latestClient.send("You have been paired.");
		//latestClient = null;
	}
}



server.on('connection', function connection(ws) 
{
	console.log("New client connected.")

	var client = new Client(ws);

	clients.add(ws);
	//ws.send("Hello from the server.");
	
	//clients.set(ws);

	function closeOrError(error)
	{
		console.log("Client disconnected.");
		clients.delete(client);

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
				queuePlayer(client);
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


