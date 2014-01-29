$(document).ready(function(){
   
   // something with #search
   $("#search").autocomplete({
       position : {
       		my: "left top",
                at: "left bottom",
		collision: "none"},
       source: function(request,response) {
	   console.log("trying autocomplete on "+request.term);
	   var query = "/autocomplete/"+request.term+".json";
	   $.ajax({
	       url: query,
	       dataType:"json",
	       /*data: {
		   prefix: request.term,
	       },*/
	       success:  function(data) {
		   response($.map(data, function(item) {
		       return  {
			   label: item.term,
			   name: item.id
			}
		       }));
		   }
	   });
       },
       messages: {
               noResults: '',
	               results: function() {}
          },
       select: function(event,ui) {
       	   
	   if (ui.item !== null) { 
	      newurl = "http://"+window.location.host+"/search/"
	      	     +encodeURIComponent(ui.item.label);
	      window.location.replace(newurl);
	   } 
	}
 });

 $("#search").change(function() {	
 	console.log( $(this).text());
	});

});
   
