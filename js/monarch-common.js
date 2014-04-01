$(document).ready(function(){

    $('.search-box-position').hover(function() {
        $(this).find('.search-text-example').css({'display': 'block'});
    }, function() {
        $(this).find('.search-text-example').css({'display': 'none'});
    });

    $.fn.stars = function() {
        return this.each(function(i,e){$(e).html($('<span/>').width($(e).text()*16));});
    };
    $('.stars').stars();

    $('#annotationscore > span.annotatequestion').hover(function() {
        $('#annotationscore > span.annotatehelp').css({'display': 'block'});
    }, function() {
        $('#annotationscore > span.annotatehelp').css({'display': 'none'});
    });

});
