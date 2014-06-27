$(document).ready(function(){

    $('.tabcontainer').hover(function() {
        $(this).on('mousemove', function(e) {
            $(this).find('.tabhover').css({'top': e.pageY - 20, 'left': e.pageX});
            $(this).find('.tabhover').show();
        });
    }, function(){
        $(document).off('mousemove');
        $(this).find('.tabhover').hide();
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

    /* Literature Tab */
    $('.etal').click(function(event) {
        $(this).hide();
        $(this).parent().find('.moreauthors').show();
        $(this).parent().find('.hideauthors').show();
    });

    $('.hideauthors').click(function(event) {
        $(this).parent().find('.moreauthors').hide();
        $(this).hide();
        $(this).parent().find('.etal').show();
    });

});
