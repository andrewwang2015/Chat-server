var net = require("net");

function ChatServer(port) {
  this.port = port;
  this.totalClients = 0;
  this.clients = {};
  this.server = net.createServer();

  this.attachListeners();

  this.server.listen(port, "localhost", function(){
    console.log("Server listening on port " + this.port.toString());
  }.bind(this));

}

// Broadcast the same message to each connected client.
ChatServer.prototype.broadcast = function(message) {
  for (var id in this.clients){
    this.clients[id].write(message);
  }
};

// This function is called whenever a new client connection is made.
ChatServer.prototype.onConnection = function(socket) {
  // Increment IDs
  this.totalClients++;
  console.log("CLIENT #" + this.totalClients.toString() + " connected!");

  // Add client to clients map
  this.clients[this.totalClients] = socket;

  // Log which client connected and send OK to client
  var new_client_info = {"type": "OK", "message": this.totalClients};
  this.clients[this.totalClients].write(JSON.stringify(new_client_info));
  
  // Use broadcast function to send a join JSON message
  var global_client_join = {"type": "JOIN", "clientId": this.totalClients};
  this.broadcast(JSON.stringify(global_client_join));

  var current_id = this.totalClients;

  // Broadcast msg message when "data" event comes from client
  this.clients[current_id].on("data", function(input){
    var stringified = input.toString();
    var message = {"type": "MSG", "clientId": current_id, "message": stringified};
    this.broadcast(JSON.stringify(message));
    console.log("RECV(" + current_id.toString() + "): " + stringified);
  }.bind(this));

  // Handle client closing when "close" event comes from client
  this.clients[current_id].on("close", function(err){
    if (!err)
    {
      var close = {"type": "LEAVE", "clientId": current_id};
      delete this.clients[current_id];
      this.broadcast(JSON.stringify(close));
      console.log("CLIENT #" + current_id.toString() + " closed its connection.");
    }
  }.bind(this));

};

// Attach listeners for "connection" and "error" events.
ChatServer.prototype.attachListeners = function() {
  // Handle connection and error events
  this.server.on("connection", this.onConnection.bind(this));

  this.server.on("error", function(){
    console.log("An error has occured!");
    });
};

var server = new ChatServer(4242);
