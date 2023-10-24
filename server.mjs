import WebSocket, { WebSocketServer } from 'ws';

const server = new WebSocketServer({ port: 8080 });
server.binaryType = "text";

// empty map 
const partners = new Map();

var latestClient = null;

server.on('connection', function connection(ws) {
	//ws.send("Hello from the server.");
	if (latestClient == null)
		latestClient = ws;
	else {
		partners.set(latestClient, ws);  // pair these two in the hashmap. 
		partners.set(ws, latestClient);
		//ws.send("You have been paired.");
		//latestClient.send("You have been paired.");
		//latestClient = null;
	}
	//clients.set(ws);

	ws.on('error', console.error);

	ws.on('message', function message(data) {
		//console.log(data);
		partners.get(ws).send(data.toString()); // just forward the data to its partner. For some reason. it breaks if toString() isnt run. 
	});


});
