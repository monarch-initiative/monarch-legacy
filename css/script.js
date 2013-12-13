$(document).ready(function(){

    $('.tab').click(function() {
        $('.tab').css({'color': 'grey'});
        $(this).css({'color': 'white'});
    });

    $('#categories a').click(function() {
        var panel_id = $(this).attr('href');
        $('.category').hide();
        $(panel_id).show(400);
    });

    $('#navigation a').click(function() {
        var panel_id = $(this).attr('href');
        console.log(panel_id);
        $('.category').hide();
        $(panel_id).show(400);
    });

});
