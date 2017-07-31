var httpUtils = require('./httputils-dw');

var host = 'https://api.drivewealth.net';
var loginEndpoint = '/v1/userSessions';
var instrumentEndpoint = '/v1/instruments';

function login(username, password){
	return httpUtils.performPost(host, loginEndpoint, {},
	  {
	    "Content-Type": "application/json"
	  },
	  {
	    "appTypeID":"2026",
	    "appVersion":"1.1.9",   
	    "emailAddress":username,
	    "ipAddress":"1.1.1.1",
	    "languageID":"es_ES",
	    "osType":"Windows",
	    "osVersion":"NT 10.0",
	    "password":password,
	    "scrRes":"1366x768",
	    "username":username
	  } 
	);
}

function getInstruments(sessionKey){
	return httpUtils.performGet(host, instrumentEndpoint, {},
	  {
	    "x-mysolomeo-session-key": sessionKey
	  }
	);
}

module.exports = {
  login : login,
  getInstruments : getInstruments
};