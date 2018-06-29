var myProductName = "davesocket", myVersion = "0.4.6";  

exports.start = webSocketStartup; 
exports.notifySocketSubscribers = notifySocketSubscribers;
exports.notifyOneSubscriber = notifyOneSubscriber;
exports.countOpenSockets = countOpenSockets;
exports.getOpenSocketsArray = getOpenSocketsArray;

const websocket = require ("nodejs-websocket"); 
const utils = require ("daveutils"); 
const dns = require ("dns");
const os = require ("os");

var theWsServer;

var config = {
	websocketPort: 1401,
	newConnectionCallback: function (theConnection) {
		},
	msgReceivedCallback: function (theConnection, theText) {
		}
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
function notifyOneSubscriber (conn, verb, jstruct) {
	conn.sendText (verb + "\r" + utils.jsonStringify (jstruct));
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
			if (conn.appData !== undefined) { //it's one of ours
				try {
					conn.sendText (verb + "\r" + jsontext);
					conn.appData.whenLastUpdate = now;
					conn.appData.ctUpdates++;
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
		if (conn.appData !== undefined) { //it's one of ours
			theArray [theArray.length] = {
				arrayIndex: i,
				lastVerb: conn.appData.lastVerb,
				urlToWatch: conn.appData.urlToWatch,
				domain: conn.appData.domain,
				whenStarted: utils.viewDate (conn.appData.whenStarted),
				whenLastUpdate: (conn.appData.whenLastUpdate === undefined) ? "" : utils.viewDate (conn.appData.whenLastUpdate),
				ctUpdates: conn.appData.ctUpdates
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
			conn.appData.domain = theName; 
			});
		}
	
	conn.appData = {
		whenStarted: now,
		whenLastUpdate: undefined,
		ctUpdates: 0
		};
	
	config.newConnectionCallback (conn);
	
	conn.on ("text", function (s) {
		config.msgReceivedCallback (conn, s);
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
	console.log (myProductName + " v" + myVersion + ": config.websocketPort == " + config.websocketPort);
	try {
		theWsServer = websocket.createServer (handleWebSocketConnection);
		theWsServer.listen (config.websocketPort);
		if (callback !== undefined) {
			callback (undefined);
			}
		}
	catch (err) {
		console.log ("webSocketStartup: err.message == " + err.message);
		if (callback !== undefined) {
			callback (err);
			}
		}
	}
