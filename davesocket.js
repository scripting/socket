var myProductName = "davesocket", myVersion = "0.4.0";  

exports.start = webSocketStartup; 
exports.notifySocketSubscribers = notifySocketSubscribers;
exports.countOpenSockets = countOpenSockets;
exports.getOpenSocketsArray = getOpenSocketsArray;

const websocket = require ("nodejs-websocket"); 
const utils = require ("daveutils"); 
const dns = require ("dns");
const os = require ("os");

var theWsServer;

var config = {
	thePort: 1401
	};

function getDomainName (clientIp, callback) { 
	if (clientIp === undefined) {
		if (callback !== undefined) {
			callback ("undefined");
			}
		}
	else {
		dns.reverse (clientIp, function (err, domains) {
			var name = clientIp;
			if (!err) {
				if (domains.length > 0) {
					name = domains [0];
					}
				}
			if (callback !== undefined) {
				callback (name);
				}
			});
		}
	}
function notifySocketSubscribers (verb, jstruct) {
	if (theWsServer !== undefined) {
		var ctUpdates = 0, now = new Date ();
		if (jstruct === undefined) {
			jstruct = {};
			}
		var jsontext = utils.jsonStringify (jstruct);
		for (var i = 0; i < theWsServer.connections.length; i++) {
			var conn = theWsServer.connections [i];
			if (conn.chatLogData !== undefined) { //it's one of ours
				try {
					conn.sendText (verb + "\r" + jsontext);
					conn.chatLogData.whenLastUpdate = now;
					conn.chatLogData.ctUpdates++;
					ctUpdates++;
					}
				catch (err) {
					console.log ("notifySocketSubscribers: socket #" + i + ": error updating");
					}
				}
			}
		}
	}
function countOpenSockets () {
	if (theWsServer === undefined) { //12/18/15 by DW
		return (0);
		}
	else {
		return (theWsServer.connections.length);
		}
	}
function getOpenSocketsArray () { //return an array with data about open sockets
	var theArray = new Array ();
	for (var i = 0; i < theWsServer.connections.length; i++) {
		var conn = theWsServer.connections [i];
		if (conn.chatLogData !== undefined) { //it's one of ours
			theArray [theArray.length] = {
				arrayIndex: i,
				lastVerb: conn.chatLogData.lastVerb,
				urlToWatch: conn.chatLogData.urlToWatch,
				domain: conn.chatLogData.domain,
				whenStarted: utils.viewDate (conn.chatLogData.whenStarted),
				whenLastUpdate: (conn.chatLogData.whenLastUpdate === undefined) ? "" : utils.viewDate (conn.chatLogData.whenLastUpdate),
				ctUpdates: conn.chatLogData.ctUpdates
				};
			}
		}
	return (theArray);
	}
function handleWebSocketConnection (conn) { 
	var now = new Date ();
	
	function logToConsole (conn, verb, value) {
		getDomainName (conn.socket.remoteAddress, function (theName) { //log the request
			var freemem = utils.gigabyteString (os.freemem ()), method = "WS:" + verb, now = new Date (); 
			if (theName === undefined) {
				theName = conn.socket.remoteAddress;
				}
			console.log (now.toLocaleTimeString () + " " + freemem + " " + method + " " + value + " " + theName);
			conn.chatLogData.domain = theName; 
			});
		}
	
	conn.chatLogData = {
		whenStarted: now,
		whenLastUpdate: undefined,
		ctUpdates: 0
		};
	conn.on ("text", function (s) {
		var words = s.split (" ");
		if (words.length > 1) { //new protocol as of 11/29/15 by DW
			conn.chatLogData.lastVerb = words [0];
			switch (words [0]) {
				case "watch":
					conn.chatLogData.urlToWatch = utils.trimWhitespace (words [1]);
					logToConsole (conn, conn.chatLogData.lastVerb, conn.chatLogData.urlToWatch);
					break;
				}
			}
		else {
			conn.close ();
			}
		});
	conn.on ("close", function () {
		});
	conn.on ("error", function (err) {
		});
	}
function webSocketStartup (myConfig, callback) {
	if (myConfig !== undefined) {
		for (var x in myConfig) {
			config [x] = myConfig [x];
			}
		}
	console.log ("webSocketStartup: config.thePort == " + config.thePort);
	try {
		theWsServer = websocket.createServer (handleWebSocketConnection);
		theWsServer.listen (config.thePort);
		callback (undefined);
		}
	catch (err) {
		console.log ("webSocketStartup: err.message == " + err.message);
		callback (err);
		}
	}
