$(document).ready(function(){

    /* Show Footer on Hover */
    $('#footer').hover(function() {
        $(this).css({'color': 'black'});
    }, function() {
        $(this).css({'color': 'white'});
    });

    /* Annotation Score Stars */
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
