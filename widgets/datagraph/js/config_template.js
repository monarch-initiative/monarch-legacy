bbop.monarch.exampleConfig = {
                
    //Chart margins    
    margin : {top: 40, right: 140, bottom: 5, left: 255},
                
    width : 375,
    height : 400,
                
    //X Axis Label
    xAxisLabel : "Some Metric",
                
    //Chart title and first breadcrumb
    chartTitle : "Chart Title",
    firstCrumb : "first bread crumb",
                
    //Title size/font settings
    title : {
        'margin-left' : '0px',
        'font-size' : '20px',
        'font-weight': 'bold'
    },
                
    //Yaxis links
    yFontSize : 'default',
    isYLabelURL : true,
    yLabelBaseURL : "/phenotype/",
                
    //Colors set in the order they appear in the JSON object
    color : { 
        first  : '#44A293',
        second : '#A4D6D4',
        third  : '#EA763B',
        fourth : '#496265',
        fifth  : '#44A293',
        sixth  : '#A4D6D4',
                           
        yLabel : { 
            fill  : '#000000',
            hover : '#EA763B'
        },
        arrow : {
            fill  : "#496265",
            hover : "#EA763B"
        },
        bar : {
            fill  : '#EA763B'
        },
        crumb : {
            top   : '#496265',
            bottom: '#3D6FB7',
            hover : '#EA763B'
        }
    },
                
    //Turn on/off breadcrumbs
    useCrumb : false,
                
    //Turn on/off legend
    useLegend : true
};