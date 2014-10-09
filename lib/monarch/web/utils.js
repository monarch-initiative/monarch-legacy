exports.convChars = function(str) {

    // convert label.. modified from 
    //http://stackoverflow.com/questions/784586/convert-special-characters-to-
    //html-in-javascript 
    var converted = str;   
    if (typeof converted === 'string' && converted !== ""
            && converted !== undefined && converted !== null) {

        //first, change < > " ' #
        var c = {'<':'&lt;', '>':'&gt;',  '"':'&quot;', "'":'&#039;', '#':'&#035;' };
        converted =  str.replace( /[<>'"#]/g, function(s) { return c[s]; } );
    
        // now, we must convert &, but only if it is not found before any of those..
        // see http://fineonly.com/solutions/regex-exclude-a-string for a good eplantion of the 
        // use of ?! for "string to exclude..
        converted = converted.replace(/&(?!(lt;|gt;|quot;|#039;|#035;))/g,'&amp;');
        if (typeof converted == 'undefined') {
            converted = '';
        }
    }
    return converted;
};
