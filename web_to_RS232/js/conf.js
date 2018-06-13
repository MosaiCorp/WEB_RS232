var canvas=document.getElementById("canvas");
var ctx=canvas.getContext("2d");
ctx.canvas.height=100;
ctx.canvas.width=400;
var clusMatrix=[];
var pastMatrix;
var clus;
var clustNum;
var set;
var ports=[];
var menToNode={
	check:true,
	conectPort:false,
	sendData:false,
	port:"",
	msgPort:""
};
var menDeNode;
const socket = io.connect("http://localhost:3000");
var x,y;
$(document).ready(()=>setup());
function setup(){
	$("#aply").css({"visibility":"hidden"});
	sendCheck();
	$(document).mousemove((event)=>{
		x=event.clientX;
		y=event.clientY;
	});
	$("#set").click(()=>{
		setReset(0);	
	});
	$("#res").click(()=>{
		setReset(1);
	});
	$("#resAll").click(()=>{
		setReset(2);
	});
	$("select").change(()=>{
		if ($("#mod").text()=="Modify")refreshCTX();
		console.log("option");
	});
	$("input[value='1']").click();
	$("#aply").click(()=>{
		refresh();
		$("#mod").text("Modify");
		for (var m=0;m<clustNum;m++){
			var val=parseInt($(`#${(m+1)}COM`).val());
			menToNode.ini=true;
			menToNode.portIni=val;
			sendData(menToNode); 
			menToNode.ini=false;
		}
		$(".clust").prop('disabled', true);
		$("#mod").css({"visibility":"visible"});
		$("#aply").css({"visibility":"hidden"});
		clusMatrix=[];
		pastMatrix=[];
		for (var n=clustNum;n>0;n--){
			var setRel=[];
			for (var m=4;m>0;m--){
				var relblock=[];
				for (var p=32;p>0;p--){
					relblock.push({state:0});
				}
				setRel.push(relblock);
			}
			clusMatrix.push(setRel);
		}
		refreshCTX();
		$("#text").css({"visibility":"visible"});
	});
	$("#mod").click(()=>{//$('input:radio[name=edad]:checked').val());
		if ($("#mod").text()=="Modify"){
			$(".clust").prop('disabled', false);
			$("#aply").css({"visibility":"visible"});
			$("#mod").text("Test");
			$("#text").css({"visibility":"hidden"});
			menToNode.close=true;
			sendData(menToNode);
			menToNode.close=false;
		}else{
			$("#mod").css({"visibility":"hidden"});
			sendCheck();
		}
	});
	$("#canvas").click(()=>{
		var position=$("#canvas").position();
		var posx =parseInt((x-position.left)*16/canvas.width+1);
		var posy =parseInt((y-position.top)*2/canvas.height);
		console.log(posx,posy);
		console.log("positionC: ",position);
		switch(clusMatrix[clus][set][(posx+posy*16)-1].state){
			case 0:
				clusMatrix[clus][set][(posx+posy*16)-1].state=1;
				break;
			case 1:
				clusMatrix[clus][set][(posx+posy*16)-1].state=0;
				break;
			case 2:
				clusMatrix[clus][set][(posx+posy*16)-1].state=3;
				break;
			case 3:
				clusMatrix[clus][set][(posx+posy*16)-1].state=2;
				break;
		}
		refreshCTX();
	});
}
function refreshRelay(m){
		$("#section").text("");
		$("#relays").text("Relay cantity "+ports[m].rel.length*32);
		for (var n in ports[m].rel){
			rel=ports[m].rel[n];
			 n=parseInt(n);
			$("#section").append(`<option value="${rel}">Section ${rel} Relay 1-32</option>`);
		}	
		set= parseInt($("#section").val());
}
function refreshCheck(menDeNode){
	clustNum=menDeNode.ports.length;
	$("#clusters").text("");
    $("#cluster").text("");
	if(menDeNode.ports.length>0){
		ports=menDeNode.ports;
		for (var n=0;n<ports.length&&n<3;n++)$("#clusters").append(`Cluster ${n+1} <select class="clust" id="clust${n}"></select><br> `);
		for (var n in ports){
			port=ports[n];
			$(".clust").append(`<option value="${n}">${port.name}</option>`);
			 n=parseInt(n);
			$("#cluster").append(`<option value="${n}">Cluster ${n+1}`);
		}
		refreshRelay(0);
		
	}else {
		$("#clusters").text("Not devices found...");
		$("#relays").text("Not devices found...");
	}

	
	$("#cluster").change(()=>{
		refresh();
		menToNode.conectPort=true;
		menToNode.port=clus;
		sendData(menToNode); 
		menToNode.conectPort=false;
		if ($("#mod").text()=="Modify")refreshCTX();
	});
	
	$("#mod").css({"visibility":"visible"});
	$("#aply").css({"visibility":"visible"});
}
socket.on('message',(menDeNode) => {	
	if (menDeNode.check){
		refreshCheck(menDeNode);
	}

});
socket.on('close', () => {
	console.log('Lost connection to device.');
});
function sendCheck(){
	console.log("Is checking the hardware");
	menToNode.check=true;
	sendData(menToNode);
	menToNode.check=false;
}
function sendData(data) {	  
	socket.send(data);
	console.log("Send to Node",data);
}
function copy(a){
	var b=[];
	
	for (var m in a){
		var col=[];
		for(var n in a[m]){
			var caja=[];
				for(var p in a[m][n]){
				var val = a[m][n][p].state;
				caja.push({state:val});
				
			}
			col.push(caja);
		}
		b.push(col);
	}
	console.log("B",b);
	return b;
}
function setReset(setRes){
	console.log("SetRes",setRes);
	if(setRes!==1){
		var past=[];
		
		pastMatrix.unshift(copy(clusMatrix));
		for (var m=0;m<2;m++){
			for(var n=0;n<16;n++){
				var state=clusMatrix[clus][set][n+m*16].state;
				if((state==3||state==1)&&setRes===0){
					state=2;	
				}else if(setRes===2){
					pastMatrix=[];
					state=0;
				}
				clusMatrix[clus][set][n+m*16].state=state;
			}
		}
	}else if(pastMatrix.length>0){
		clusMatrix=copy(pastMatrix[0]);
		pastMatrix.shift();
	}
	console.log(pastMatrix);
	$("#res").text("Reset "+pastMatrix.length);
	menToNode.sendData=true;
	menToNode.port=clus;
	menToNode.sect=set;
	menToNode.msgPort=clusMatrix[clus][set];
	sendData(menToNode);
	menToNode.sendData=false;
	refreshCTX();
}
function refreshCTX(){
	ctx.save();
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var width=canvas.width/17;
	var height=canvas.height/2;
	console.log(clusMatrix);
	for (var m=0;m<2;m++){
		for(var n=0;n<16;n++){
			var state=clusMatrix[clus][set][n+m*16].state;
			if		(state==1)ctx.fillStyle='rgba(80,100,50,0.9)';
			else if	(state==3)ctx.fillStyle='rgba(80,150,50,0.9)';
			else if	(state==2)ctx.fillStyle='rgba(50,220,0,0.9)';
			else ctx.fillStyle='rgba(100,100,100,0.6)';
			
			ctx.fillRect(n*width+width*Math.floor(n/4)/4,m*height,width-1,height-1);
			ctx.font = "bold 16px sans-serif";
			ctx.fillStyle='rgba(0,0,0,0.6)';
			if (n+m*16+1<10)text="0"+(n+m*16+1);
			else text=(n+m*16+1);
			ctx.fillText(text,n*width+width*Math.floor(n/4)/4+2,m*height+height/2);
		}
	}
	ctx.restore();
}
function refresh(){
	clus= parseInt($("#cluster").val());
	clus=parseInt($(`#clust${clus}`).val());
	refreshRelay(clus);
	set= parseInt($("#section").val());
	menToNode.portSel=clus;
	$("#info").text(`The cluster ${clus+1}, in section ${set}, range of relay 1-32`);
}
