var net = require("net");
var readline = require("readline");

function ChatClient(port) {
  this.io = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // this.client is a socket connecting the client with the server
  this.client = new net.Socket();
  this.client.connect(port);/* Connects to the server on its port */
  this.clientId = null;

  this.attachIOListeners();
  this.attachChatListeners();
}

ChatClient.prototype.attachIOListeners = function() {
  this.io.on("line", function(user_input) {
    /* Handles user input */
  	this.client.write(user_input);
  }.bind(this));

  this.io.on("SIGINT", function() {
    console.log("Closing client...");
    /* Closes client connection and I/O listener */
    this.clientId = null;
    this.client.end();
    this.io.close();
  }.bind(this));
};

ChatClient.prototype.attachChatListeners = function() {
  // Handles JSON data when the client socket emits the "data" event
  this.client.on("data", function(data_read_in){
  	// Parse stringified input
  	var parsed_JSON = JSON.parse(data_read_in);
  	var type = parsed_JSON.type;
  	// When specific new client connects to server
  	if (type === "OK")
  	{
  		this.clientId = parsed_JSON.message;
  	} else if (type === "JOIN") // When some other client joins, every other client is notified
  	{
  		console.log("CLIENT #" + parsed_JSON.clientId.toString() + " has joined.");
  	} else if (type === "MSG") // When a client sends data/ global message through socket
  	{
  		if (parsed_JSON.clientId === this.clientId)
  		{
  			console.log("ME: " + parsed_JSON.message);
  		}
  		else
  		{
  			console.log ("CLIENT #" + parsed_JSON.clientId.toString() + ": " + parsed_JSON.message);
  		}
  	} else if (type === "LEAVE") // When a client leaves
  	{
  		console.log("CLIENT #" + parsed_JSON.clientId.toString() + " has left.");
  	}

  });
  this.client.on("end", function() {
    if(this.client) {
      // Handles a client exiting
      // If the client exists, that means the server closed the connection, so
      // we have to make sure we remove the client!
      this.clientId = null;
      this.client.end();
      this.io.close();
    }
  }.bind(this));

  this.client.on("error", function(e) {
    // Handles errors
    // Errors should only happen when something is wrong with the I/O or the
    // client, so close their connections.
    console.log("Server closed connection.");
    this.clientId = null;
    this.client.end();
    this.io.close();
  }.bind(this));
};

var client = new ChatClient(4242);
