/* This script document contains functions relating to general Monarch pages. */

$(document).ready(function(){

    /* Annotation Score Stars */

    /* This displays the stars used to denote annotation sufficiency. For example,
     * annotation sufficiency scores are currently located on the phenotype tab
     * of the disease page. */
    $.fn.stars = function() {
        return this.each(function(i,e){$(e).html($('<span/>').width($(e).text()*16));});
    };
    $('.stars').stars();

    /* This displays the help text about the annotation sufficiency score upon
     * hovering over the blue question mark box. */
    $('#annotationscore > span.annotatequestion').hover(function() {
        $('#annotationscore > span.annotatehelp').css({'display': 'block'});
    }, function() {
        $('#annotationscore > span.annotatehelp').css({'display': 'none'});
    });


    /* Annotate Marked Up Text */

    /* This displays the box of found terms upon hovering over a highlighted/linked
     * term. An example is located in the Text Annotater (found on the Annotate Text
     * tab of the main drop-down navigation menu). */
    $('.linkedspan').hover(function() {
        $(this).find('.linkedterms').css({'display': 'block'});
    }, function() {
        $(this).find('.linkedterms').css({'display': 'none'});
    });

});
