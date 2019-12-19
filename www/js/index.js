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
    }
};

app.initialize();
