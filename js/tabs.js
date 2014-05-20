$(document).ready(function(){

    $('.tabcontainer').hover(function() {
        $(this).find('.tabhover').css({'display': 'block'});
    }, function(){
        $(this).find('.tabhover').css({'display': 'none'});
    });

    $('.contenttab').click(function() {
        $('.contenttab').css({'color': 'white', 'background-color': '#999', 'border-bottom': '1px solid black'});
        $(this).css({'color': 'black', 'background-color': 'white', 'border-bottom': '1px solid white'});
    });

    $('#categories a').click(function(event) {
        var panel_id = $(this).attr('href');
        event.preventDefault();
        $('.category').hide();
        $(panel_id).show();
    });

});
