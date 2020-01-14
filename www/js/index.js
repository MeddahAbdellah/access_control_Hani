Number.prototype.padLeft = function(base,chr){
   var  len = (String(base || 10).length - String(this).length)+1;
   return len > 0? new Array(len).join(chr || '0')+this : this;
}
Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});
var app = {
    // Application Constructor
    mqttClient:null,
    serverUrl:'http://18.222.196.11/',
    page:1,
    initialize: function() {
      document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
      //this.onDeviceReady();
    },

    onDeviceReady: function() {
      this.root(1);
      this.initButtons();
      this.startMqtt();
    },
    startMqtt:function(){
      app.mqttClient  = mqtt.connect('ws://18.222.196.11:9000/')
      app.mqttClient.on('connect', function () {
        app.mqttClient.subscribe('addCardStatus', function (err) {});
        app.mqttClient.subscribe('newEntry', function (err) {});
      })
      app.mqttClient.on('message', function (topic, message) {
        console.log("topic: "+topic.toString()+" Message:"+message.toString())
        if(topic.toString().includes("addCardStatus")){
          app.addCardToDb($('input[name="newCardName"]').val(),$('input[name="newCardSurname"]').val(),message.toString())
        }
        else if(topic.toString().includes("newEntry")){
          var data=message.toString().split(',');
          console.log(data);
          if(app.page==1)app.addInfo(data[0] == null ? "Unknown":data[0],data[1] == null ? "Unknown":data[1],data[2],new Date(data[3]),data[4]=="false"?0:1);
        }
      });
    },
    initButtons:function(){
      $(".headerNav button").on("click",function(e){
        $(".headerNav button").removeClass("selected");
        $(this).addClass("selected");
        app.root($('.headerNav button').index(this)+1 );
      });
    },
    root:function(id){
      app.page=id;
      switch(id){
        case 1:
          this.loadServerData(new Date().toDateInputValue());
        break;
        case 2:
          $(".container").html('<div class="addCardWrapper"><h2>Place The Card On the RFID Reader Then Press "Add Card"</h2><i class="fas fa-id-card"></i> <input type="text" name="newCardName" Placeholder="First Name"> <input type="text" name="newCardSurname" Placeholder="last Name"><button type="button" name="addCard">Add Card</button></div>');
          $("button[name='addCard']").on("click",function(){
            if($('input[name="newCardSurname"]').val().length >0 && $('input[name="newCardName"]').val().length ){
              console.log("add card requested");
              app.mqttClient.publish('addCard', 'newCard');
              // send a message to the ESP, then the ESP responds with the Key then add the key to the database with the name and surname
            }
            else alert("Please enter Name and Surname");
          })
        break;
        case 3:
        $(".container").html('<div class="infoDate"></div><div class="info"><h4>Name</h4><h4>Surname</h4><h4>Key</h4><h4 class="date">Date</h4><div class="circle"></div></div>');
        app.writeSerial("getData*");
        break;
      }
    },
    loadServerData:function(date){
      $(".container").html('<div class="infoDate"><label for="startDate">Day</label><input type="date" name="startDate"></div><div class="info"><h4>Name</h4><h4>Surname</h4><h4>Key</h4><h4 class="date">Date</h4><div class="circle"></div></div>');
      $('input[name="startDate"]').val(date);

      $('input[type="date"]').on("change",function(){
        app.loadServerData($('input[name="startDate"]').val());
      });
      $.ajax({
        type:'GET',
        data:{selectDate:$('input[name="startDate"]').val()},
        url:app.serverUrl+'getControlData',
        success:function(data){
          console.log(data);
          for(var i=0 ;i<data.length;i++){
            app.addInfo(data[i].name == null ? "Unknown":data[i].name,data[i].surname == null ? "Unknown":data[i].surname,data[i].key,new Date(data[i].date),data[i].valid);
          }
        }
      });
    },
    addInfo:function(name,surname,key,d,valid){
      date = [      d.getDate().padLeft(),
                    (d.getMonth()+1).padLeft(),
                    d.getFullYear()].join('/')+
                    ' ' +
                  [ d.getHours().padLeft(),
                    d.getMinutes().padLeft(),
                    d.getSeconds().padLeft()].join(':');
      $('<div class="info"><h4>'+name+'</h4><h4>'+surname+'</h4><h4>'+key+'</h4><h4 class="date">'+date+'</h4><div class="circle '+(valid?'green':'red')+'"></div></div>').hide().appendTo(".container").fadeIn(200);
    },
    addCardToDb:function(name,surname,key){
      $.ajax({
        type:'POST',
        data:{name:name,surname:surname,key:key},
        url:app.serverUrl+'addCard',
        success:function(data){
          alert("Card Added Successfully")
        }
      });
    },
    startSerial : function(){
      serial.requestPermission(
      function(successMessage) {
        serial.open(
            {baudRate: 500000},
              function(successMessage) {
                app.serialState=true;
                serial.registerReadCallback(
                function success(data){
                  var view = new Uint8Array(data);
                  app.serialToString(view);
                },
                function error(){
                  new Error("Failed to register read callback");
                });
            },
            app.SerialErrorCallback
          );
        },
        app.SerialErrorCallback
        );
      },
      SerialErrorCallback : function(message) {
        alert('Error: Could not connect to device ' + message +"Reconnecting");
        app.startSerial();
      },
      serialToString : function(view){
         if(view.length >= 1) {
           for(var i=0; i < view.length; i++) {
               // if we received a \n, the message is complete, display it
               if(view[i] === 13) {// check if the read rate correspond to the ESP serial print rate
                  var now = new Date();
                  app.serialDataCallback(app.serialReg);
                  lastRead = now;
                  app.serialReg= '';
               }// if not, concatenate with the begening of the message
               else {
                   var temp_str = String.fromCharCode(view[i]);
                   app.serialReg+= temp_str;
               }
           }
          }
       },
       serialDataCallback : function(rawData){
        console.log(rawData);
        alert(rawData);
        var data = rawData.split(',');
        if(data.length>=5 && data.length<=6)app.addInfo(data[0],data[1],data[2],data[3],data[4]);
       },
       writeSerial : function(data){
         serial.write(data, function(){}, function(){alert("couldn't send");app.startSerial();});
       }
};

app.initialize();
