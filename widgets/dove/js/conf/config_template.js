bbop.monarch.exampleConfig = {
                
    //Chart margins    
    margin : {top: 40, right: 140, bottom: 5, left: 255},
                
    width : 375,
    height : 400,
                
    //X Axis Label
    xAxisLabel : "Some Metric",
    //Horizontal positioning of x Axis Label
    xAxisPos : {dx:"20em",y:"-29"},
    xLabelFontSize : "14px",
    xFontSize : "14px",
                
    //Chart title
    chartTitle : "Chart Title",
                
    //Title size/font settings
    title : {
        'text-align': 'center',
        'text-indent' : '0px',
        'font-size' : '20px',
        'font-weight': 'bold',
        'background-color' : '#E8E8E8',
        'border-bottom-color' : '#000000'
        
    },
                
    //Yaxis links
    yFontSize : 'default',
    isYLabelURL : true,
    yLabelBaseURL : "/phenotype/",
    
    //font sizes
    settingsFontSize : '14px',
    
    //Maximum label length before adding an ellipse
    maxLabelSize : 31,
    
    //Turn on/off legend
    useLegend : true,
    //legend font size
    legendFontSize : 14,
    //Legend dimensions
    legend : {width:18,height:18},
    legendText : {height:".35em"},
                
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
        },
        crumbText : '#FFFFFF'
    },
                
    //Turn on/off breadcrumbs
    useCrumb : false,
    crumbFontSize : 10,
    
    //Turn on/off breadcrumb shapes
    useCrumbShape : true
};