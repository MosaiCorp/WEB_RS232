
'use strict';
var relCheking=-1;
const SerialPort = require('serialport');
// Initialize application constants

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const tcpPort = process.env.PORT || 3000;

var menAPuerto;
var menDePuerto;
var menToWeb={
	check:false,
	ports:[]
};
var openedPort=[];
var portOpen=false;
var puertos=[]
var contInit=0;
var menDeWeb={};
var cont=0;
var relayOK=false;
var checking;
var portList=[];
app.get('/', (req, res) => {
  res.sendfile('index.html');
});
http.listen(tcpPort, () => {
  console.log(`listening on http://localhost:${tcpPort}`);
});
io.on('connection', (socket) => {
	console.log('a user connected');

	socket.on('message', (menDeWeb) => {
		if(menDeWeb.check){
			console.log("Ports checking init.");
			checkPorts();
		}else if (menDeWeb.sendData){
			
			var placa=[0x00,0x00,0x00,0x00];
			var port=menDeWeb.portSel;
			var sect=menDeWeb.sect;
			var matrix=menDeWeb.msgPort;
			for (var n in matrix){
				var state=matrix[n].state;
					if(state==2){
						placa[Math.floor(n/8)]+=Math.pow(2,n%8);
					}
			}
			var buffer2=relSetWrite(sect,placa);
			console.log("Port send "+puertos[port].path,port);
			puertos[port].write(buffer2);
		}
	});
});
function mesWrite(num){
	var buffer=[0x34,0x30+num,0x3f];
	buffer=ckAdd(buffer);
	console.log(buffer);
	buffer=new Buffer(buffer);
	return buffer;
}

function checkPorts(){
	portList=[];
	SerialPort.list((err,ports)=>{
		if(err!=undefined)console.log("error ocurred: "+err);
		ports.forEach(function(port,index) {
			var relays=[];
			var relCheking=0;
			if (openedPort.indexOf(port.comName) == -1){
				console.log("puerto "+port.comName+" iniciado");
				openedPort.push(port.comName);
				puertos[index]=initPort(port.comName);
			}
			portList.push({	name:port.comName,rel:[]});
		});
		checking=setInterval(checkSect,200);
	});
}
function checkSect(){
	if (relCheking<4*puertos.length){
		relayOK=false;
		console.log(relCheking);
		var buffer1= mesWrite((relCheking)%4);
		console.log("send to Port "+puertos[parseInt(relCheking/4)].path,buffer1);
		puertos[parseInt(relCheking/4)].write(buffer1);
		relCheking++
	}else{
		menToWeb.check=true;
		menToWeb.ports=portList;
		sendDataWeb(menToWeb);
		menToWeb.check=false;
		relCheking=0;
		clearInterval(checking)
	}
}
function ckAdd(arreglo){
	var ck=0x00;
	for( var n in arreglo){
		ck+=arreglo[n]
	}
	arreglo.push(ck%256);
	return arreglo;
}
function relSetWrite(num,arrayRel){
	var buffer=[0x38,0x30+num,0x52].concat(arrayRel);
	buffer=ckAdd(buffer);
	buffer=new Buffer(buffer);
	console.log("Rel Set ",buffer);
	return buffer;
}
function sendDataWeb(data) {	  
	io.send(data);
	console.log("sended to Web",data);
  }
function initPort(str){
	var port = new SerialPort(str, {baudRate: 57600});
	port.on('error',(err)=>{console.log("Error in "+str+" couldn't conect. ",err);});
	port.on('open', () => {console.log('Port is open!');});
	port.on('data', (data) => {
		if (relCheking<=4*puertos.length&&relayOK===false){
			relayOK=true;
			portList[parseInt((relCheking-1)/4)].rel.push((relCheking-1)%4)
			console.log("rel "+(relCheking-1)+"is connected");
		}
		console.log('mesage of Port:'+data, data);
	});
	port.on('close', () => {console.log('Serial port disconnected.');});
	return port;
}

