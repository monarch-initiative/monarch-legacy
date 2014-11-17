if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}

bbop.monarch.phenotypeAnnotationConfig = {
               
  //Chart margins    
  margin : {top: 40, right: 140, bottom: 5, left: 255},
  
  width : 375,
  height : 400,
  
  //X Axis Label
  xAxisLabel : "Number Of Annotations",
  
  //Chart title and first breadcrumb
  chartTitle : "Phenotype Annotation Distribution",
  firstCrumb : "Phenotypic Abnormality",
  
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
           },
           crumbText : '#FFFFFF'
  },

  useCrumb : false,
  useLegend : true,
  useCrumbShape : true
};

bbop.monarch.diseaseGeneConfig = {
        
        //Chart margins    
        margin : {top: 40, right: 40, bottom: 5, left: 255},
        
        width : 375,
        height : 240,
        
        //X Axis Label
        xAxisLabel : "Number Of Associations",
        
        //Chart title and first breadcrumb
        chartTitle : "Gene Disease Distribution",
        firstCrumb : "Anatomical Entity",
        
        //Title size/font settings
        title : {
                  'margin-left' : '0px',
                  'font-size' : '20px',
                  'font-weight': 'bold'
        },
        
        //Yaxis links
        yFontSize : 'default',
        isYLabelURL : true,
        yLabelBaseURL : "/disease/",
        
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

        useCrumb : false,
        useLegend : false,
        useCrumbShape : true
};

bbop.monarch.diseasePhenotypeConfig = {
        
        //Chart margins    
        margin : {top: 40, right: 40, bottom: 5, left: 255},
        
        width : 375,
        height : 240,
        
        //X Axis Label
        xAxisLabel : "Number Of Associations",
        
        //Chart title and first breadcrumb
        chartTitle : "Disease Phenotype Distribution",
        firstCrumb : "Anatomical Entity",
        
        //Title size/font settings
        title : {
                  'margin-left' : '0px',
                  'font-size' : '20px',
                  'font-weight': 'bold'
        },
        
        //Yaxis links
        yFontSize : 'default',
        isYLabelURL : true,
        yLabelBaseURL : "/disease/",
        
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
        
        useCrumb : false,
        useLegend : false,
        useCrumbShape : true
};

bbop.monarch.genotypePhenotypeConfig = {
        
        //Chart margins    
        margin : {top: 40, right: 80, bottom: 5, left: 255},
        
        width : 375,
        height : 340,
        
        //X Axis Label
        xAxisLabel : "Number Of Associations",
        
        //Chart title and first breadcrumb
        chartTitle : "Phentotype Genotype Distribution",
        firstCrumb : "Phenotypic Abnormality",
        
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
                 first  : '#A4D6D4',
                 second : '#44A293',
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
        
        useCrumb : false,
        useLegend : true,
        useCrumbShape : true
};