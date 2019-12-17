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
    initialize: function() {
      //  document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
      this.onDeviceReady();
    },

    onDeviceReady: function() {
      this.root(1);
      this.initButtons();
      sartMqtt();
    },
    startMqtt:function(){
      mqttClient  = mqtt.connect('mqtt://test.mosquitto.org')
      client.on('connect', function () {
        client.subscribe('addCardSatatus', function (err) {});
      })
      client.on('message', function (topic, message) {
        console.log("topic: "+topic.toString()+" Message:"+message.toString())
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
      switch(id){
        case 1:
          this.loadServerData();
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
    loadServerData:function(){
      $(".container").html('<div class="infoDate"><label for="startDate">Day</label><input type="date" name="startDate"></div><div class="info"><h4>Name</h4><h4>Surname</h4><h4>Key</h4><h4 class="date">Date</h4><div class="circle"></div></div>');
      $('input[name="startDate"]').val(new Date().toDateInputValue());

      $('input[type="date"]').on("change",function(){
        console.log($('input[name="startDate"]').val());
      });
      for(var i=0 ;i<10;i++){
        this.addInfo("mouloud","fateh","F7S89AQ",new Date(),true);
      }

    },
    addInfo:function(name,surname,key,d,valid){
      date = [ (d.getMonth()+1).padLeft(),
                    d.getDate().padLeft(),
                    d.getFullYear()].join('/')+
                    ' ' +
                  [ d.getHours().padLeft(),
                    d.getMinutes().padLeft(),
                    d.getSeconds().padLeft()].join(':');
      $(".container").append('<div class="info"><h4>'+name+'</h4><h4>'+surname+'</h4><h4>'+key+'</h4><h4 class="date">'+date+'</h4><div class="circle '+(valid?'green':'red')+'"></div></div>')
    }
};

app.initialize();
