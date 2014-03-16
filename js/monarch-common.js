$(document).ready(function(){

    $('.search-box-position').hover(function() {
        $(this).find('.search-text-example').css({'display': 'block'});
    }, function(){
        $(this).find('.search-text-example').css({'display': 'none'});
    });

});
