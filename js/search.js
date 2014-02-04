$(document).ready(
    function(){

	// TODO: 
	jQuery('#search_form').submit(
	    function(event){
		event.preventDefault();

		var val = jQuery('#search').val();
		var newurl = "http://"+window.location.host+"/search/"
		    +encodeURIComponent(val);
		window.location.replace(newurl);
	    });
   
   // something with #search
   $("#search").autocomplete({
       position : {
       	   my: "right top",
           at: "right bottom",
	   collision: "none"
       },
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
			};
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
	       var newurl = "http://"+window.location.host+"/search/"
	      	   +encodeURIComponent(ui.item.label);
	       window.location.replace(newurl);
	   }
	}
 });

});
   
