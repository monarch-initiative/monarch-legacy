var Plotly = {};    // require('plotly.js');

function loadClusterPlot(){

  Plotly.d3.json('https://data.monarchinitiative.org/analysis/patient-clustering/test-set/MDS/3d-coordinates-4min.json', function(err, data){

    // Get the number of clusters
    var clusterCount = d3.max(data, function(cluster) {
        return cluster.cluster_id;    
    });
    clusterCount++;
    var clusterIDList = Array.apply(null, Array(clusterCount)).map(function (_, i) {return i;});
    var colors = d3.schemeCategory10.concat(d3.schemeCategory20, d3.schemeCategory20b)

    var colorScale = d3.scaleOrdinal(colors).domain(clusterIDList);
    var clusterGroups = [];

    clusterIDList.forEach(function(clusterID) {
        var points = data.filter(function(cluster) {
            return cluster.cluster_id == clusterID;
        });
        var hover_list = points.map(function(point){
          return "ID: " + point.id + "<br>Label: " + point.label;
        });
        var scatter = {
            x: points.map(function(point){return point.x; }),
            y: points.map(function(point){return point.y; }),
            z: points.map(function(point){return point.z; }),
            name: "Cluster " + clusterID,
            text: hover_list,
            mode: 'markers',
            marker: {
                size: 3,
                color: colorScale(clusterID),
                line: {
                    color: "#262626",
                    width: 0.5
                },
                opacity: 0.8
            },
            type: 'scatter3d'
        };
        var cluster = {
                alphahull : .1,
                name : "Cluster " + clusterID,
                color: colorScale(clusterID),
                opacity : 0.1,
                type : "mesh3d",    
                x : points.map(function(point){return point.x; }),
                y : points.map(function(point){return point.y; }),
                z : points.map(function(point){return point.z; })
          };

        clusterGroups.push(scatter, cluster);
    });

    var patients = data.filter(function(cluster) {
            return cluster.cluster_id == -1 && /^MONARCH/.test(cluster.id);
    });
    var patient_labels = patients.map(function(point){
          return "ID: " + point.id + "<br>Label: " + point.label;
    });
    var scatter = {
            x: patients.map(function(point){return point.x; }),
            y: patients.map(function(point){return point.y; }),
            z: patients.map(function(point){return point.z; }),
            name: "Cases",
            text: patient_labels,
            mode: 'markers',
            marker: {
                size: 1,
                color: "black",
                line: {
                    color: "#262626",
                    width: 0.5
                },
                opacity: 0.8
            },
            type: 'scatter3d'
     };
     clusterGroups.push(scatter);
  
  
    var layout = {
        title : 'Example clustering with dbscan and MDS',
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 40
        }
    };
    Plotly.newPlot('chart', clusterGroups, layout);
  });
}

if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.loadClusterPlot = loadClusterPlot;
}
if (typeof(global) === 'object') {
    global.loadClusterPlot = loadClusterPlot;
}