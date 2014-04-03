$(document).ready(function(){

    $('.arrow').hover(function() {
        $(this).find('.hovertext').css({'display': 'block'});
    }, function() {
        $(this).find('.hovertext').css({'display': 'none'});
    });

});
