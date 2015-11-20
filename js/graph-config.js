if (typeof bbop == 'undefined') { var bbop = {};}
if (typeof bbop.monarch == 'undefined') { bbop.monarch = {};}


//Graph for phenotypeLandingPage
bbop.monarch.phenotypeLandingConfig = {
        // Starting filters
        category_filter_list :['Human'],
        
        //override default
        arrowDim : "-19,-5, -10,0 -19,5",
        yOffset : "-1.3em",
        
        firstCr : "0,1 0,26 50,26 60,12.5 50,1",
        trailCrumbs : "0,1 10,12.5, 0,26 50,26 60,12.5 50,1",
        bread : {width:60, height: 25, offset:50, space: 1},
        
        //Chart margins    
        margin : {top: 35, right: 63, bottom: 5, left: 175},
        
        width : 250,
        height : 300,
        
        //X Axis Label
        xAxisLabel : "",
        xAxisPos : {dx:"15em",y:"-22"},
        xLabelFontSize : "12px",
        xFontSize : "9px",
        
        //Chart title and first breadcrumb
        chartTitle : "Number of Phenotype Gene Associations Per Species",
        
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
        
        maxLabelSize : 26,
        
        //Turn on/off legend
        useLegend : true,
        //Legend dimensions
        legend : {width:10,height:10},
        legendText : {height:".01em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
            bars : {
                human  : '#44A293',
                mouse : '#A4D6D4',
                zebrafish : '#44B985',
                fly : '#D4DB68',
                rat : '#A1C3FF',
                dog : '#ACB5DF',
                worm : '#B9FF82',
                pig : '#14E082',
                cow : '#3DB53C',
                cat : '#EDC44E',
                chicken : '#418BFF',
                monkey : '#14CF7C',
                other : '#B2E3AA'
            },
                   
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

/*
 * GOlr configurations for the graph widget
 */
bbop.monarch.phenotypeGeneGolrSettings = {
        id_field : 'object_closure',
        personality : 'dovechart',
        filter : [{ field: 'subject_category', value: 'gene' }],
        facet : 'subject_taxon'
};

bbop.monarch.diseaseGeneGolrSettings = {
        id_field : 'object_closure',
        personality : 'dovechart',
        filter : [
                  { field: 'subject_category', value: 'gene' },
                  { field: 'object_category', value: 'disease' }
        ],
        facet : 'subject_taxon'
};

bbop.monarch.phenotypeGenotypeGolrSettings = {
        id_field : 'object_closure',
        personality : 'dovechart',
        filter : [{ field: 'subject_category', value: 'genotype' }],
        facet : 'subject_taxon'
};

//Graph for phenotypeLandingPage
bbop.monarch.geneLandingConfig = {
        category_filter_list :['Human'],
        //override default
        arrowDim : "-19,-5, -10,0 -19,5",
        yOffset : "-1.3em",
        
        firstCr : "0,1 0,26 50,26 60,12.5 50,1",
        trailCrumbs : "0,1 10,12.5, 0,26 50,26 60,12.5 50,1",
        bread : {width:60, height: 25, offset:50, space: 1},
        
        //Chart margins    
        margin : {top: 35, right: 63, bottom: 5, left: 175},
        
        width : 250,
        height : 300,
        
        //X Axis Label
        xAxisLabel : "",
        xAxisPos : {dx:"15em",y:"-22"},
        xLabelFontSize : "12px",
        xFontSize : "9px",
        
        //Chart title and first breadcrumb
        chartTitle : "Number of Gene Disease Associations Per Species",
        
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
        yLabelBaseURL : "/disease/",
        
        //font sizes
        legendFontSize : 10,
        settingsFontSize : '11px',
        
        maxLabelSize : 26,
        
        //Turn on/off legend
        useLegend : true,
        //Legend dimensions
        legend : {width:10,height:10},
        legendText : {height:".01em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
                 bars : {
                     human  : '#44A293',
                     mouse : '#A4D6D4',
                     zebrafish : '#44B985',
                     fly : '#D4DB68',
                     rat : '#A1C3FF',
                     dog : '#ACB5DF',
                     worm : '#B9FF82',
                     pig : '#14E082',
                     cow : '#3DB53C',
                     cat : '#EDC44E',
                     chicken : '#418BFF',
                     monkey : '#14CF7C',
                     other : '#B2E3AA'
                 },
                   
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


//Graph for phenotypeLandingPage
bbop.monarch.genotypeLandingConfig = {
        category_filter_list :['Human'],
        //override default
        arrowDim : "-19,-5, -10,0 -19,5",
        yOffset : "-1.3em",
        
        firstCr : "0,1 0,26 50,26 60,12.5 50,1",
        trailCrumbs : "0,1 10,12.5, 0,26 50,26 60,12.5 50,1",
        bread : {width:60, height: 25, offset:50, space: 1},
        
        //Chart margins    
        margin : {top: 35, right: 63, bottom: 5, left: 175},
        
        width : 250,
        height : 300,
        
        //X Axis Label
        xAxisLabel : "",
        xAxisPos : {dx:"15em",y:"-22"},
        xLabelFontSize : "12px",
        xFontSize : "9px",
        
        //Chart title and first breadcrumb
        chartTitle : "Number of Phenotype Genotype Associations Per Species",
        
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
        
        maxLabelSize : 26,
        
        //Turn on/off legend
        useLegend : true,
        //Legend dimensions
        legend : {width:10,height:10},
        legendText : {height:".01em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
            bars : {
                human  : '#44A293',
                mouse : '#A4D6D4',
                zebrafish : '#44B985',
                fly : '#D4DB68',
                rat : '#A1C3FF',
                dog : '#ACB5DF',
                worm : '#B9FF82',
                pig : '#14E082',
                cow : '#3DB53C',
                cat : '#EDC44E',
                chicken : '#418BFF',
                monkey : '#14CF7C',
                other : '#B2E3AA'
            },
                   
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


//Graph for disease landing page
bbop.monarch.diseaseLandingConfig = {
      category_filter_list :['Human'],
      //override default
      arrowDim : "-19,-5, -10,0 -19,5",
      yOffset : "-1.3em",
      
      firstCr : "0,1 0,26 50,26 60,12.5 50,1",
      trailCrumbs : "0,1 10,12.5, 0,26 50,26 60,12.5 50,1",
      bread : {width:60, height: 25, offset:50, space: 1},
      
      //Chart margins    
      margin : {top: 35, right: 63, bottom: 5, left: 175},
      
      width : 250,
      height : 300,
      
      //X Axis Label
      xAxisLabel : "",
      xAxisPos : {dx:"15em",y:"-22"},
      xLabelFontSize : "12px",
      xFontSize : "9px",
      
      //Chart title and first breadcrumb
      chartTitle : "Number of Disease Phenotype Associations",
      
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
      yLabelBaseURL : "/disease/",
      
      //font sizes
      legendFontSize : 10,
      settingsFontSize : '11px',
      
      maxLabelSize : 26,
      
      //Turn on/off legend
      useLegend : false,
      //Legend dimensions
      legend : {width:10,height:10},
      legendText : {height:".01em"},
      
      //Colors set in the order they appear in the JSON object
      color : { 
          bars : {
              human  : '#44A293',
              mouse : '#A4D6D4',
              zebrafish : '#44B985',
              fly : '#D4DB68',
              rat : '#A1C3FF',
              dog : '#ACB5DF',
              worm : '#B9FF82',
              pig : '#14E082',
              cow : '#3DB53C',
              cat : '#EDC44E',
              chicken : '#418BFF',
              monkey : '#14CF7C',
              other : '#B2E3AA'
          },
                 
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

/*
 * GOlr configurations for the graph widget
 */
bbop.monarch.diseasePhenotypeGolrSettings = {
        id_field : 'subject_closure',
        personality : 'dovechart',
        filter : [{ field: 'object_category', value: 'phenotype' }],
        single_group : 'Human'
};

/*
 * The following were made for the legacy charts to deal with mutliple resizing
 */

//Graph for homepage
bbop.monarch.homePageConfig = {
        category_filter_list :['Human'],
        //override default
        arrowDim : "-19,-5, -10,0 -19,5",
        yOffset : "-1.3em",
        
        firstCr : "0,1 0,26 50,26 60,12.5 50,1",
        trailCrumbs : "0,1 10,12.5, 0,26 50,26 60,12.5 50,1",
        bread : {width:60, height: 25, offset:50, space: 1},
        
        //Chart margins    
        margin : {top: 35, right: 63, bottom: 5, left: 175},
        
        width : 250,
        height : 300,
        
        //X Axis Label
        xAxisLabel : "",
        xAxisPos : {dx:"15em",y:"-22"},
        xLabelFontSize : "12px",
        xFontSize : "9px",
        
        //Chart title and first breadcrumb
        chartTitle : "Number of Phenotype Gene Associations Per Species",
        
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
        yLabelBaseURL : "/labs/golr/",
        
        //font sizes
        legendFontSize : 10,
        settingsFontSize : '11px',
        
        maxLabelSize : 26,
        
        //Turn on/off legend
        useLegend : true,
        //Legend dimensions
        legend : {width:10,height:10},
        legendText : {height:".01em"},
        
        //Colors set in the order they appear in the JSON object
        color : { 
            bars : {
                human  : '#44A293',
                mouse : '#A4D6D4',
                zebrafish : '#44B985',
                fly : '#D4DB68',
                rat : '#A1C3FF',
                dog : '#ACB5DF',
                worm : '#B9FF82',
                pig : '#14E082',
                cow : '#3DB53C',
                cat : '#EDC44E',
                chicken : '#418BFF',
                monkey : '#14CF7C',
                other : '#B2E3AA'
            },
                   
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