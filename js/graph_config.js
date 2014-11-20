if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

//Graph for homepage
bbop.monarch.homePageConfig = {
        
        //override default
        arrowDim : "-19,-5, -10,0 -19,5",
        yOffset : "-1.3em",
        
        firstCr : "0,1 0,26 50,26 60,12.5 50,1",
        trailCrumbs : "0,1 10,12.5, 0,26 50,26 60,12.5 50,1",
        bread : {width:60, height: 25, offset:50, space: 1},
        
        //Chart margins    
        margin : {top: 40, right: 63, bottom: 5, left: 152},
        
        width : 250,
        height : 300,
        
        //X Axis Label
        xAxisLabel : "Number Of Annotations",
        xAxisPos : "15em",
        xLabelFontSize : "12px",
        xFontSize : "9px",
        
        //Chart title and first breadcrumb
        chartTitle : "Phenotype Annotation Distribution",
        firstCrumb : "Phenotypic Abnormality",
        
        //Title size/font settings
        title : {
                  'text-align': 'none',
                  'text-indent' : '20px',
                  'font-size' : '18px',
                  'font-weight': 'none',
                  'background-color' : '#f5f5f5',
                  'border-bottom-color' : '#ddd'
        },
        
        //Yaxis links
        yFontSize : 11,
        isYLabelURL : true,
        yLabelBaseURL : "/phenotype/",
        
        //font sizes
        legendFontSize : 10,
        settingsFontSize : '11px',
        
        maxLabelSize : 20,
        
        //Turn on/off legend
        useLegend : true,
        //Legend dimensions
        legend : {width:10,height:10},
        legendText : {height:".01em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
                 first  : '#44A293',
                 second : '#A4D6D4',
                   
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

        useCrumb : false,
        crumbFontSize : 8.5,
        useCrumbShape : true
 };

bbop.monarch.phenotypeAnnotationConfig = {
               
  //Chart margins    
  margin : {top: 40, right: 140, bottom: 5, left: 255},
  
  width : 375,
  height : 400,
  
  //X Axis Label
  xAxisLabel : "Number Of Annotations",
  xAxisPos : "20em",
  xLabelFontSize : "14px",
  xFontSize : "14px",
  
  //Chart title and first breadcrumb
  chartTitle : "Phenotype Annotation Distribution",
  firstCrumb : "Phenotypic Abnormality",
  
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
  legendFontSize : 14,
  settingsFontSize : '14px',
  
  maxLabelSize : 31,
  
  //Turn on/off legend
  useLegend : true,
  //Legend dimensions
  legend : {width:18,height:18},
  legendText : {height:".35em"},
  
  //Colors set in the order they appear in the JSON object
  color : { 
           first  : '#44A293',
           second : '#A4D6D4',
             
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

  useCrumb : false,
  crumbFontSize : 10,
  useCrumbShape : true
};

bbop.monarch.diseaseGeneConfig = {
        
        //Chart margins    
        margin : {top: 40, right: 40, bottom: 5, left: 255},
        
        width : 375,
        height : 240,
        
        //X Axis Label
        xAxisLabel : "Number Of Associations",
        xAxisPos : "20em",
        xLabelFontSize : "14px",
        xFontSize : "14px",
        
        //Chart title and first breadcrumb
        chartTitle : "Gene Disease Distribution",
        firstCrumb : "Anatomical Entity",
        
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
        yLabelBaseURL : "/disease/",
        
        //font sizes
        legendFontSize : 14,
        settingsFontSize : '14px',
        
        maxLabelSize : 31,
        
        //Turn on/off legend
        useLegend : false,
        //Legend dimensions
        legend : {width:18,height:18},
        legendText : {height:".35em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
                 first  : '#44A293',
                 second : '#A4D6D4',
                   
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

        useCrumb : false,
        crumbFontSize : 10,
        useCrumbShape : true
};

bbop.monarch.diseasePhenotypeConfig = {
        
        //Chart margins    
        margin : {top: 40, right: 40, bottom: 5, left: 255},
        
        width : 375,
        height : 240,
        
        //X Axis Label
        xAxisLabel : "Number Of Associations",
        xAxisPos : "20em",
        xLabelFontSize : "14px",
        xFontSize : "14px",
        
        //Chart title and first breadcrumb
        chartTitle : "Disease Phenotype Distribution",
        firstCrumb : "Anatomical Entity",
        
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
        yLabelBaseURL : "/disease/",
        
        //font sizes
        legendFontSize : 14,
        settingsFontSize : '14px',
        
        maxLabelSize : 31,
        
        //Turn on/off legend
        useLegend : false,
        //Legend dimensions
        legend : {width:18,height:18},
        legendText : {height:".35em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
                 first  : '#44A293',
                 second : '#A4D6D4',
                   
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
        
        useCrumb : true,
        crumbFontSize : 10,
        useCrumbShape : true
};

bbop.monarch.genotypePhenotypeConfig = {
        
        //Chart margins    
        margin : {top: 40, right: 80, bottom: 5, left: 255},
        
        width : 375,
        height : 340,
        
        //X Axis Label
        xAxisLabel : "Number Of Associations",
        xAxisPos : "20em",
        xLabelFontSize : "14px",
        xFontSize : "14px",
        
        //Chart title and first breadcrumb
        chartTitle : "Phentotype Genotype Distribution",
        firstCrumb : "Phenotypic Abnormality",
        
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
        legendFontSize : 14,
        settingsFontSize : '14px',
        
        maxLabelSize : 31,
        
        //Turn on/off legend
        useLegend : true,
        //Legend dimensions
        legend : {width:18,height:18},
        legendText : {height:".35em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
                 first  : '#A4D6D4',
                 second : '#44A293',
                   
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
        
        useCrumb : true,
        crumbFontSize : 10,
        useCrumbShape : true
};

//////////////////////////////////////////////////////////////////
//
//Configuration for smaller res screens
//TODO remove in favor of fully dynamic graphs
//////////////////////////////////////////////////////////////////

bbop.monarch.diseaseGeneConfigSmall = {
        
        
        //override default
        arrowDim : "-19,-5, -10,0 -19,5",
        yOffset : "-1.3em",
        
        firstCr : "0,1 0,26 50,26 60,12.5 50,1",
        trailCrumbs : "0,1 10,12.5, 0,26 50,26 60,12.5 50,1",
        bread : {width:60, height: 25, offset:50, space: 1},
        
        //Chart margins    
        margin : {top: 40, right: 40, bottom: 5, left: 152},
        
        width : 250,
        height : 240,
        
        //X Axis Label
        xAxisLabel : "Number Of Associations",
        xAxisPos : "15em",
        xLabelFontSize : "12px",
        xFontSize : "9px",
        
        //Chart title and first breadcrumb
        chartTitle : "Gene Disease Distribution",
        firstCrumb : "Anatomical Entity",
        
        //Title size/font settings
        title : {
                  'text-align': 'center',
                  'text-indent' : '0px',
                  'font-size' : '18px',
                  'font-weight': 'bold',
                  'background-color' : '#E8E8E8',
                  'border-bottom-color' : '#000000'
        },
        
        //Yaxis links
        yFontSize : 11,
        isYLabelURL : true,
        yLabelBaseURL : "/disease/",
        
        //font sizes
        legendFontSize : 10,
        settingsFontSize : '11px',
        
        maxLabelSize : 20,
        
        //Turn on/off legend
        useLegend : false,
        //Legend dimensions
        legend : {width:18,height:18},
        legendText : {height:".35em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
                 first  : '#44A293',
                 second : '#A4D6D4',
                   
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

        useCrumb : true,
        crumbFontSize : 8.5,
        useCrumbShape : true
};

bbop.monarch.diseasePhenotypeConfigSmall = {
        
        //override default
        arrowDim : "-19,-5, -10,0 -19,5",
        yOffset : "-1.3em",
        
        firstCr : "0,1 0,26 50,26 60,12.5 50,1",
        trailCrumbs : "0,1 10,12.5, 0,26 50,26 60,12.5 50,1",
        bread : {width:60, height: 25, offset:50, space: 1},
        
        //Chart margins    
        margin : {top: 40, right: 40, bottom: 5, left: 152},
        
        width : 250,
        height : 240,
        
        //X Axis Label
        xAxisLabel : "Number Of Associations",
        xAxisPos : "15em",
        xLabelFontSize : "12px",
        xFontSize : "9px",
        
        //Chart title and first breadcrumb
        chartTitle : "Disease Phenotype Distribution",
        firstCrumb : "Anatomical Entity",
        
        //Title size/font settings
        title : {
                  'text-align': 'center',
                  'text-indent' : '0px',
                  'font-size' : '18px',
                  'font-weight': 'bold',
                  'background-color' : '#E8E8E8',
                  'border-bottom-color' : '#000000'
        },
        
        //Yaxis links
        yFontSize : 11,
        isYLabelURL : true,
        yLabelBaseURL : "/disease/",
        
        //font sizes
        legendFontSize : 14,
        settingsFontSize : '11px',
        
        maxLabelSize : 20,
        
        //Turn on/off legend
        useLegend : false,
        //Legend dimensions
        legend : {width:18,height:18},
        legendText : {height:".35em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
                 first  : '#44A293',
                 second : '#A4D6D4',
                   
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
        
        useCrumb : true,
        crumbFontSize : 8.5,
        useCrumbShape : true
};

bbop.monarch.genotypePhenotypeConfigSmall = {
        
        //override default
        arrowDim : "-19,-5, -10,0 -19,5",
        yOffset : "-1.3em",
        
        firstCr : "0,1 0,26 50,26 60,12.5 50,1",
        trailCrumbs : "0,1 10,12.5, 0,26 50,26 60,12.5 50,1",
        bread : {width:60, height: 25, offset:50, space: 1},
        
        //Chart margins    
        margin : {top: 40, right: 63, bottom: 5, left: 152},
        
        width : 250,
        height : 340,
        
        //X Axis Label
        xAxisLabel : "Number Of Associations",
        xAxisPos : "15em",
        xLabelFontSize : "12px",
        xFontSize : "9px",
        
        //Chart title and first breadcrumb
        chartTitle : "Phentotype Genotype Distribution",
        firstCrumb : "Phenotypic Abnormality",
        
        //Title size/font settings
        title : {
                  'text-align': 'center',
                  'text-indent' : '0px',
                  'font-size' : '18px',
                  'font-weight': 'bold',
                  'background-color' : '#E8E8E8',
                  'border-bottom-color' : '#000000'
        },
        
        //Yaxis links
        yFontSize : 11,
        isYLabelURL : true,
        yLabelBaseURL : "/phenotype/",
        
        //font sizes
        legendFontSize : 10,
        settingsFontSize : '11px',
        
        maxLabelSize : 20,
        
        //Turn on/off legend
        useLegend : true,
        //Legend dimensions
        legend : {width:10,height:10},
        legendText : {height:".01em"},

        color : { 
                 first  : '#A4D6D4',
                 second : '#44A293',
                   
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
        
        useCrumb : true,
        crumbFontSize : 8.5,
        useCrumbShape : true
};

//Graph for homepage
bbop.monarch.homePageConfigSmall = {
        
        //override default
        arrowDim : "-18,-5, -10,0 -18,5",
        yOffset : "-1.5em",
        
        firstCr : "0,4 0,22 37,22 47,13 37,4",
        trailCrumbs : "0,4 10,13, 0,22 37,22 47,13 37,4",
        bread : {width:30, height: 25, offset:25, space: 0},
        
        //Chart margins    
        margin : {top: 40, right: 55, bottom: 5, left: 97},
        
        width : 130,
        height : 220,
        
        //X Axis Label
        xAxisLabel : "Number Of Annotations",
        xAxisPos : "12em",
        xLabelFontSize : "9px",
        xFontSize : "8px",
        
        //Chart title and first breadcrumb
        chartTitle : "Phenotype Annotation Distribution",
        firstCrumb : "Phenotypic Abnormality",
        
        //Title size/font settings
        title : {
                  'text-align': 'none',
                  'text-indent' : '20px',
                  'font-size' : '16px',
                  'font-weight': 'none',
                  'background-color' : '#f5f5f5',
                  'border-bottom-color' : '#ddd'
        },
        
        //Yaxis links
        yFontSize : 8,
        isYLabelURL : true,
        yLabelBaseURL : "/phenotype/",
        
        //font sizes
        legendFontSize : 9,
        settingsFontSize : '7.5px',
        
        maxLabelSize : 15,
        
        //Turn on/off legend
        useLegend : true,
        //Legend dimensions
        legend : {width:9,height:9},
        legendText : {height:"0em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
                 first  : '#44A293',
                 second : '#A4D6D4',
                   
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
                 crumbText : 'black'
        },

        useCrumb : true,
        crumbFontSize : 5,
        useCrumbShape : false
 };