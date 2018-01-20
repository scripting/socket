const davesocket = require ("./davesocket.js");
const utils = require ("daveutils"); 
var debugCount = 0;

function random (lower, upper) {
	var range = upper - lower + 1;
	return (Math.floor ((Math.random () * range) + lower));
	}
function isAlpha (ch) {
	return (((ch >= 'a') && (ch <= 'z')) || ((ch >= 'A') && (ch <= 'Z')));
	}
function isNumeric (ch) {
	return ((ch >= '0') && (ch <= '9'));
	}
function getRandomPassword (ctchars) { //10/14/14 by DW
	var s= "", ch;
	while (s.length < ctchars)  {
		ch = String.fromCharCode (random (33, 122));
		if (isAlpha (ch) || isNumeric (ch)) {
			s += ch;
			}
		}
	return (s.toLowerCase ());
	}
function everyFiveSeconds () {
	var jstruct = {
		msg: "oh the buzzing",
		when: new Date (),
		snark: utils.getRandomSnarkySlogan (),
		password: getRandomPassword (random (20, 50)),
		ct: debugCount++
		}
	davesocket.notifySocketSubscribers ("debug", jstruct);
	}
davesocket.start (undefined, function (err) {
	setInterval (everyFiveSeconds, 5000); 
	});
