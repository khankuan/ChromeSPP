$(document).ready(function(){
	$("#connectButton").click(deviceSelect);
	$("#sendButton").click(send);
	$("#sendButtonDelimiter").click(sendWithDelimiter);
	$("#sendByteButton").click(sendByte);
	init();
});


var status = "Connect";
var devices = {};
var deviceInterval;
var socket;
var profile = {"uuid": "00001101-0000-1000-8000-00805F9B34FB"};

function init(){
	chrome.bluetooth.getDevices(function(d) {
		for (var i in d){
	        $("#deviceSelection").append("<option value='"+d[i].address+"'>"+d[i].name+"</option>");
	        devices[d[i].address] = d[i];
	    }
	});
}

function deviceSelect(){
	if (status == "Connecting" || status == "Disconnecting")
		return;
	if (status == "Connect"){
		status = "Connecting";
		$("#connectButton").val(status);
		connect();
	}
	if (status == "Disconnect"){
		status = "Disconnecting";
		$("#connectButton").val(status);
		disconnect();
	}
}

function connectCallback(socket){
	connectedCallback(socket);
};
chrome.bluetooth.onConnection.addListener(connectCallback);

function connectedCallback(s){console.log(s);
	socket = s;
	$('#inputTextarea').val("");
	$('#outputTextarea').val("");
	$("#connectButton").html("Disconnect");
}

function receiveCallback(info){
  	var str = ab2str(info.data);console.log(str);
	if (str.length > 0)
		$("#outputTextarea").val($("#outputTextarea").val()+str);
};

chrome.bluetooth.onConnection.addListener(connectedCallback);
chrome.bluetooth.onReceive.addListener(receiveCallback);

function connect(){
	var address = $('#deviceSelection').val();
	chrome.bluetooth.addProfile(profile, function(){
	    chrome.bluetooth.connect({device: devices[address], profile: profile}, function(err){
         	if (chrome.runtime.lastError)
         		console.log(chrome.runtime.lastError.message);
			status = "Disconnect";
			$("#connectButton").html(status);
	    });
	});
}

function disconnect(){
	status = "Disconnecting";
	$("#connectButton").html(status);
	clearInterval(deviceInterval);
	var address = $('#deviceSelection').val();
	chrome.bluetooth.disconnect({socketId: socket}, function(err){
        if (chrome.runtime.lastError)
     		console.log(chrome.runtime.lastError.message);
		status = "Connect";
		$("#connectButton").html(status);
    });
}

function send(){
	var text = $("#inputString").val();
    if (text.length == 0)
    	return;
    sendString(text);
}

function sendWithDelimiter(){
	var text = $("#inputStringDelimiter").val();
	var delimiter = $("#delimiter").val();
    if (text.length == 0)
    	return;
    if (delimiter)
    	text += String.fromCharCode(parseInt(delimiter));
    sendString(text);
}

function sendString(str){

	chrome.bluetooth.send(socket.id, str2ab(msg), function(bytes) {
      	if (chrome.runtime.lastError) 
			console.log('Write error: ' + chrome.runtime.lastError.message);
		else {
			$("#inputString").val("");
			$("#inputStringDelimiter").val("");
			$("#inputTextarea").val($("#inputTextarea").val()+str);
		}
    });
}


function sendByte(){
	var ascii = $("#inputByte").val();
    if (ascii.length == 0)
    	return;

    var buf = new ArrayBuffer(1);
  	var bufView = new Uint8Array(buf);
  	bufView[0] = parseInt(ascii);

	chrome.bluetooth.send(socket.id, buf, function(bytes) {
		if (chrome.runtime.lastError) 
			console.log('Write error: ' + chrome.runtime.lastError.message);
		else {
			$("#inputByte").val("");
			$("#inputTextarea").val($("#inputTextarea").val()+String.fromCharCode(bufView[0]));
		}
	});
    if (chrome.runtime.lastError)
      console.error("Error writing.", chrome.runtime.lastError.message);
}


/*Helper functions */
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}