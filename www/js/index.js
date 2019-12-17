Number.prototype.padLeft = function(base,chr){
   var  len = (String(base || 10).length - String(this).length)+1;
   return len > 0? new Array(len).join(chr || '0')+this : this;
}
var app = {
    // Application Constructor
    initialize: function() {
      //  document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
      this.onDeviceReady();
    },

    onDeviceReady: function() {
      $(".headerNav button").on("click",function(e){
        $(".headerNav button").removeClass("selected");
        $(this).addClass("selected");
      })
      this.addInfo("mouloud","fateh","F7S89AQ",new Date(),true);
    }
    ,addInfo:function(name,surname,key,d,valid){
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
