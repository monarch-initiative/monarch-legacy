
#About Phenogrid

Phenogrid is implemented as a jQuery UI widget. The phenogrid widget uses semantic similarity calculations provided by OWLSim (www.owlsim.org), as provided through APIs from the Monarch Initiative (www.monarchinitiative.org).

Given an input list of phenotypes (you will see the sample input below) and parameters specified in `config/phenogrid_config.js` indicating desired source of matching models (humans, model organisms, etc.), the phenogrid will call the Monarch API to get OWLSim results and render them in your web browser in data visualization. And you may use the visualized data for your research.

#How to use Phenogrid in your web page

All the javascript dependency files have been bundled into a single `js/phenogrid.js`, and all the external styling details are bundled into `css/phenogrid.css`. 

In the below sample code, you will see how to use phenogrid as an embeded widget in your HTML.

````html
<html>
<head>
<title>Monarch Phenotype Grid Widget</title>

<script src="config/phenogrid_config.js"></script>
<script src="js/phenogrid.js"></script>

<link rel="stylesheet" type="text/css" href="css/phenogrid.css">

<script>
var phenotypes = [
	{id:"HP:0000726", observed:"positive"},
	{id:"HP:0000746", observed:"positive"},
	{id:"HP:0001300", observed:"positive"},
	{id:"HP:0002367", observed:"positive"},
	{id:"HP:0000012", observed:"positive"},
	{id:"HP:0000716", observed:"positive"},
	{id:"HP:0000726", observed:"positive"},
	{id:"HP:0000739", observed:"positive"},
	{id:"HP:0001332", observed:"positive"},
	{id:"HP:0001347", observed:"positive"},
	{id:"HP:0002063", observed:"positive"},
	{id:"HP:0002067", observed:"positive"},
	{id:"HP:0002172", observed:"positive"},
	{id:"HP:0002322", observed:"positive"},
	{id:"HP:0007159", observed:"positive"}
];	

$(document).ready(function(){
	$("#phenogrid_container").phenogrid({
		serverURL :"http://beta.monarchinitiative.org", 
		phenotypeData: phenotypes,
		targetSpeciesName: "Mus musculus" 
	});
});

</script>

</head>

<body>

<div id="phenogrid_container"></div>

</body>
</html>
````

