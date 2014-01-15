$(document).ready(function(){
   
   // something with #search
   $("#search").autocomplete({
       position : {
       		my: "left top",
                at: "left bottom",
		collision: "none"},
       source: function(request,response) {
	   console.log("trying autocomplete on "+request.term);
	   $.ajax({
	       url:"http://nif-services.neuinfo.org/servicesv1/v1/vocabulary.jsonp",
	       dataType:"jsonp",
	       data: {
		   prefix: request.term,
	       },
	       success:  function(data) {
		   console.log("got a reponse..");
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
	      console.log("selected..."+ ui.item.label);
	      // redirect to "/search/+ui.item.label);
	      newurl = "http://"+window.location.host+"/search/"
	      	     +encodeURIComponent(ui.item.label);
	      console.log("searching for "+newurl);
	      window.location.replace(newurl);
	   } else {
	     console.log("Nothing selected, input was " +
	     	   this.value);
   	   }
	}
 });

 $("#search").change(function() {
 	console.log( $(this).text());
	});
});
   
