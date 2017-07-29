<!DOCTYPE html>
<html>
<head>
  <title>peer</title>
  <link rel='stylesheet' href='/stylesheets/style.css'>
</head>
<body>
  <div><h1 class="aliasname" id="alias_id" onclick="change_name()"></h1></div>
  <video id="myVideo" class="myVideo"></video>
  <div class="dropdown">
    <h2 style="color:white; text-align: center;">Alias List</h2>
    <div class="dropdown-content">
      <table style="border-collapse: collapse; width:100%;" id="alias_list">
        <tr><th id = "peers" class="aliaslist">Peer Name</th> <th id = "attrCell">Attributes</th></tr>

      </table>
    </div>
  </div>
  <div class="videos"> 
    <table id="video_table" class="videos">

    </table>
  </div>
  <div>
    <label class="switch">
  <input type="checkbox" value = 'on' id ='blocker' onclick = 'blockMedia()'>
  <span class="slider round"></span>
</label>
</div>
</body>
</html>

<script src="/javascripts/peer.js"></script>
<script src="/socket.io/socket.io.js"></script>
<script src="/javascripts/DetectRTC.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script >

/*

Trying to crreate slie button to block calls
*/
//get the host (server) ip address
var host= <%- JSON.stringify(host) %>
//make a new peer on the peerjs server vs port 9000
var peer = new Peer({host: host, port: 9000, path: '/', debug: 3});

//socket functions
var socket = io.connect();
//var peer_id;  //i dont think we need this?

//////////////////////my video section
//fix later to getusermedia.js for all devices to work if they do not support webrtc
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia ||    
navigator.mediaDevices.webkitGetUserMedia ||
navigator.mediaDevices.mozGetUserMedia;
var constraints = { audio: true, video:{ facingMode: "environment" }} ; //send only video, not audio. will be fixed later to be options for user to send one or both.
var myHeight;
var myWidth;
var myClient;
/*  navigator.mediaDevices.getUserMedia(constraints)
.then(function(stream) {
var video= document.getElementById("myVideo");
video.srcObject  = stream;
video.onloadedmetadata = function(e) {
myHeight=video.videoHeight;
myWidth=video.videoWidth;
};
})
.catch(function(err) { console.log(err.name + ": " + err.message); });*/
var myCamera;
var myMicrophone;
var myOs;
var myBrowser;
var DeviceCharacteristics={};
var attributeRowId;
var myClient;
var blocking= false;

var id_of_caller; //must fix this later. horrible solution
//////////////////////

//when new device connects, add it to the alias list, which is in the form of a table. The function receive an object called client and has the value {"peername":new_client_name, "peerid":new_client_id}
socket.on('add',function(client){
  var table = document.getElementById("alias_list");
  var row = table.insertRow(table.rows.length);
  myClient = client;
  var atrow = table.insertRow(table.rows.length);
  attributeRowId = client['peerid']+"at";
  client['AttributeRow']=attributeRowId;
  atrow.setAttribute("id", client['peerid']+"at")
  atrow.setAttribute("class", "attributeRow");
  row.setAttribute("id",client['peerid']) 
  row.setAttribute("class","aliaslist")     
/*var cell1 = row.insertCell(0);
cell1.innerHTML = client['peername'];
cell1.onclick = function() { //when the cell in the table with this peername is clicked, run this function
  //here we send the peerid of the peer we want a stream from to the server, and the server tells that remote device to send its stream to my peerid.*/
  
  var peernameCell = row.insertCell(0);
  var attributeToggle =row.insertCell(1);
  attributeToggle.innerHTML = "+";
  var cameraCell= atrow.insertCell(0);
  var micCell= atrow.insertCell(1);
  var browserCell= atrow.insertCell(2);
  var osCell= atrow.insertCell(3);
  peernameCell.innerHTML = client['peername'];
  cameraCell.innerHTML =client['Camera'];
  micCell.innerHTML =client['Microphone'];
  browserCell.innerHTML =client['Browser'];
  osCell.innerHTML =client['OS'];

  
  peernameCell.onclick = function() {
    if(client['Blocking']==false){
      socket.emit('give_me_resolution',client['peerid']);//get video resolution of the peer clicked
      id_of_caller=client['peerid'];
      //console.log("wuuhh: "+myClient["Camera"]);
    }
    else
      alert('Peer is refusing calls');
};
attributeToggle.onclick = function(){
  console.log("Here:"+attributeRowId);
  $("#"+client['AttributeRow']).toggle();
  if(attributeToggle.innerHTML == "-")
    attributeToggle.innerHTML = "+";
  else
    attributeToggle.innerHTML = "-"
}
cameraCell.onclick = function(){
// Add Code to Only do video call
}
}); 

//updating name of existing peer in the table
socket.on('update',function(client){

  atRow = document.getElementById(client['peerid']+"at");
  document.getElementById(client['peerid']).cells[0].innerHTML=client['peername'];
  document.getElementById(client['peerid']+"at").cells[0].innerHTML=client['Camera'];
  document.getElementById(client['peerid']+"at").cells[1].innerHTML=client['Microphone']
  document.getElementById(client['peerid']+"at").cells[2].innerHTML=client['Browser'];
  document.getElementById(client['peerid']+"at").cells[3].innerHTML=client['OS'];
  $(".attributeRow").hide();
  //myClient = client;
}); 

//removing peer alias list table when the device leaves the website and is removed from server
socket.on('remove',function(client){
  var rowIndex = document.getElementById(client['peerid']).rowIndex;
  var table = document.getElementById("alias_list");
  table.deleteRow(rowIndex);
});

//after the server checks if an enterered alias name is valid or not, this function obtains the result. Result = {'name':alias_name_entered_by_user, 'exists':true_or_false}. If alias name already exists for another connected device, server returns true, otherwise false.
socket.on('name_result',function(result){
if(result['exists']==false) //if alias name is not taken by another device
{
socket.emit('editname', result['name']); //change the display name in the alias table
document.getElementById("alias_id").innerHTML ="Alias Name: "+result['name'];    //change displayed name on page
}
else    //if aliass name is taken
{
  alert("Alias name exists.");
change_name();  //ask user to pick a new alias name
}
});

//function to change alias name
function change_name (){
    var exists=true; //boolean variable to keep loop repeating until valid input is read.
    while(exists==true){
      var name = prompt("Please enter an Alias Name for this device:", peer.id);
      if (name==null||/^\s/.test(name)==true||name=="") {               
    //checks if name entered is valid. No spaces before, and no blank entries are allowed           
    alert("Alias name cannot be blank or have spaces in front");
    }
    else {
    //if valid input is read, stop the loop and send the name to the server to be checked if it is taken by another device already or not.
    exists=false;
    socket.emit('check_peer_name',name);
    }
  }
}
function blockMedia()
{
  //alert('Blocking Connections');
  //$('#blocker').value = 'off';
  //document.getElementById('blocker').value='off';
  //myClient['Blocking']= true;
  if(blocking == false)
  {
    alert('Blocking Connections');
      blocking = true;
  }
  else
  {
      alert("Connections Open");
      blocking = false;
  }
  socket.emit('blockingRequest', blocking);
  
  //$('#').disabled;
}

//this runs right when a peer connects to the webpage
peer.on('open', function(){
socket.emit('getClientList');    //get all devices connected to server 
socket.emit('addnewpeer',peer.id);   //add this device to the server client list
document.getElementById("alias_id").innerHTML ="Alias Name: "+peer.id; //display peer.id on page
change_name();  //ask user to change alias name of this device

DetectRTC.load(loadDetectRTC);   //Load DetectRTC to find device characteristics
});

/*justin*/
//grabs device characteristics and sends to server.
function getDeviceCharacteristics()
{
  if(DetectRTC.hasWebcam){
    myCamera= "Has Camera\n"+myWidth+"x"+myHeight;
    DeviceCharacteristics['Camera']=myCamera;
  }
  else{DeviceCharacteristics['Camera']="No Camera"; }
  if(DetectRTC.hasMicrophone){
    myMicrophone ="Has Microphone";
    DeviceCharacteristics['Microphone']= myMicrophone;
  }
  else{DeviceCharacteristics['Camera']="No Microphone"; }
  myOs = DetectRTC.osName + ": " + DetectRTC.osVersion;
  DeviceCharacteristics['OS']= myOs;
  myBrowser =  DetectRTC.browser.name + ": " + DetectRTC.browser.version;
  DeviceCharacteristics['Browser']= myBrowser;
  socket.emit("gotDeviceInfo",DeviceCharacteristics);
  console.log (myOs+" "+myBrowser + " "+ myMicrophone +" "+myCamera);
}

//DetectRTC must be loaded before methods can be called, getUserMedia must also be called once, before DetectRTC can work
function loadDetectRTC()
{
  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    var video= document.getElementById("myVideo");
    video.srcObject  = stream;
    video.onloadedmetadata = function(e) {
      myHeight=video.videoHeight;
      myWidth=video.videoWidth;
    };

//Wait a second while height and video is grabbed from the html video object, then close the stream and grab device characteristics
setTimeout(function e(){
  if (stream) {
    stream.getTracks().forEach(function (track) {
      track.stop();
    })
  }; 
  getDeviceCharacteristics();
}, 1000);
})
  .catch(function(err) { console.log(err.name + ": " + err.message); });
}

/*justin*/

socket.on('get_resolution',function(peerid){
//send my resoltuion to the peer with peerid
socket.emit('my_resolution',{'peerid':peerid,'height':myHeight,'width':myWidth});
});
socket.on('here_is_resolution',function(data){
  var table=document.getElementById("video_table");
  var rows=table.rows;
//if(rows.length>0)
// var maxwidth=rows[0].offsetWidth;
var videoboxid="vb_"+data['peerid'];
//iterate through all rows. see if any have empty space
var inserted=false;

for(var x=0;x<rows.length;x++)
{ 
    var num_of_cells=rows[x].cells.length;
  //find an empty cell, checks its size and see if stream can be placed in that cell
  for( var y=0;y<num_of_cells;y++){
    if(rows[x].cells[y].innerHTML===''&&rows[x].cells[y].offsetWidth>=(data['width']/2)&&rows[x].cells[y].offsetHeight>=(data['height']/2)){
      rows[x].cells[y].innerHTML="<video id='"+videoboxid+"' class='peerVideo'></video>";
      inserted=true;
      break;
    }

    }
}
  if(inserted==false)
  {
    var newRow=table.insertRow(rows.length);
    var newCell=newRow.insertCell(0);          
    newCell.setAttribute("width",(data['width']/2));
    newCell.innerHTML="<video id='"+videoboxid+"' class='peerVideo'></video>";
  }
  socket.emit('force_call',data['peerid']);

//<video id="videobox" class="peerVideo"></video>
});
//this is run when the server gets a notification that a device is requesting this devices stream. The server sends a 'make_call' signal to this device. The 'peer_id' received in the function below is the peer.id of the device that made the request for this peers stream.
socket.on('make_call',function(peer_id){

  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    var video= document.getElementById("myVideo");
    video.srcObject  = stream;
    video.onloadedmetadata = function(e) {
      console.log(video.videoHeight)
    };
    peer.call(peer_id, stream);
  })
  .catch(function(err) { console.log(err.name + ": " + err.message); });
//make a call to the peer that requested this devices stream, and send the stream to them.

});


//this event is run when a stream is being sent to this device by another peer on the network.
peer.on('call', function(call) {
  var video= document.getElementById("vb_"+id_of_caller);

call.answer(); // Answer the call with an A/V stream. 
call.on('stream', function(mediaConnection) {

//place the stream on to the page and once its meta data is loaded, play the stream

video.srcObject  = mediaConnection;

video.onloadedmetadata = function(e) {
  video.play();
  };
}); 

call.on('close',function(){
  var cell=video.parentNode;
  var row=cell.parentNode;
  var tableBody=row.parentNode;
  tableBody.removeChild(row);       
//parent.removeChild(video);

  })
});


</script>
