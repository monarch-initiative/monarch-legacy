$(document).ready(function(){
   
   // something with #search
   $("#search").autocomplete({
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
       select: function(event,ui) {
	   console.log( ui.item ?"Selected: " + ui.item.label :
			     "Nothing selected, input was " + this.value);
	}
 });
});
   
