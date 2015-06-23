/* 
 * Package: tree.js
 * 
 * Namespace: monarch.dovegraph.model.tree
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.dovegraph == 'undefined') { monarch.dovegraph = {};}
if (typeof monarch.dovegraph.model == 'undefined') { monarch.dovegraph.model = {};}


monarch.dovegraph.model.tree = function(self.data){
    var self = this;
    self.data = self.data;
    self.checkData();
}

monarch.dovegraph.model.tree.getGroupMax = function(){
    var self = this;
    return d3.max(self.data, function(d) { 
        return d3.max(d.counts, function(d) { return d.value; });
    });
};

//get X Axis limit for stacked configuration
monarch.dovegraph.model.tree.getStackMax = function(){
    var self = this;
    return d3.max(self.data, function(d) { 
        return d3.max(d.counts, function(d) { return d.x1; });
    }); 
};

//get largest Y axis label for font resizing
monarch.dovegraph.model.tree.getYMax = function(){
    var self = this;
    return d3.max(self.data, function(d) { 
        return d.label.length;
    });
};

monarch.dovegraph.model.tree.checkForSubGraphs = function(){
    var self = this;
    for (i = 0;i < self.data.length; i++) {
        if ((Object.keys(self.data[i]).indexOf('subGraph') >= 0 ) &&
                ( typeof self.data[i]['subGraph'][0] != 'undefined' )){
            return true;
        } 
    }
    return false;
};

monarch.dovegraph.model.tree.getStackedStats = function(){
    var self = this;
    //Add x0,x1 values for stacked barchart
    self.data.forEach(function (r){
        var count = 0;
        r.counts.forEach(function (i){
             i["x0"] = count;
             i["x1"] = i.value+count;
             if (i.value > 0){
                 count = i["x1"];
             }
         });
    });
    return self;
};

monarch.dovegraph.model.tree.sortself.dataByGroupCount = function(groups){
    var self = this;
    //Check if total counts have been calculated via getStackedStats()
    if (self.data[0].counts[0].x1 == null){
        self.data = self.getStackedStats(self.data);
    }
  
    var lastElement = groups.length-1;
    self.data.sort(function(obj1, obj2) {
        if ((obj2.counts[lastElement])&&(obj1.counts[lastElement])){
            return obj2.counts[lastElement].x1 - obj1.counts[lastElement].x1;
        } else {
            return 0;
        }
    });
    return self;
};

monarch.dovegraph.model.tree.getGroups = function() {
    var self = this;
    var groups = [];
    var unique = {};
    for (var i=0, len=self.data.length; i<len; i++) { 
        for (var j=0, cLen=self.data[i].counts.length; j<cLen; j++) { 
            unique[ self.data[i].counts[j].name ] =1;
        }
    }
    groups = Object.keys(unique);
    return groups;
};

//TODO improve checking
monarch.dovegraph.model.tree.checkData = function(){
    var self = this;
    if (typeof self.data === 'undefined'){
        throw new Error ("tree object is undefined");
    }
  
    self.data.forEach(function (r){
        //Check ID
        if (r.id == null){
            throw new Error ("ID is not defined in self.data object");
        }
        if (r.label == null){
            r.label = r.id;
        }
        if (r.counts == null){
            throw new Error ("No statistics for "+r.id+" in self.data object");
        }
        r.counts.forEach(function (i){
            if (i.value == null){
                r.value = 0;
            }
        });
    });
    return self;
};

//remove zero length bars
monarch.dovegraph.model.tree.removeZeroCounts = function(){
    var self = this;
    trimmedGraph = [];
    self.data.forEach(function (r){
        var count = 0;
        r.counts.forEach(function (i){
             count += i.value;
         });
        if (count > 0){
            trimmedGraph.push(r);
        }
    });
    return trimmedGraph;
};

monarch.dovegraph.model.tree.addEllipsisToLabel = function(max){
    var self = this;
    var reg = new RegExp("(.{"+max+"})(.+)");
    var ellipsis = new RegExp('\\.\\.\\.$');
    self.data.forEach(function (r){
        if ((r.label.length > max) && (!ellipsis.test(r.label))){
            r.fullLabel = r.label;
            r.label = r.label.replace(reg,"$1...");      
        } else {
            r.fullLabel = r.label;
        }
    });
    return self;
};

monarch.dovegraph.model.tree.getFullLabel = function (label){
    var self = this;
    for (var i=0, len=self.data.length; i < len; i++){
        if (self.data[i].label === label){
            var fullLabel = self.data[i].fullLabel;
            return fullLabel;
        }
    }
};

monarch.dovegraph.model.tree.getGroupID = function (label){
    var self = this;
    for (var i=0, len=self.data.length; i < len; i++){
        if (self.data[i].label === label){
            monarchID = self.data[i].id;
            return monarchID;
        }
    }
};

monarch.dovegraph.model.tree.getIDLabel = function (id){
    var self = this;
    for (var i=0, len=self.data.length; i < len; i++){
        if (self.data[i].id === id){
            label = self.data[i].label;
            return label;
        }
    }
};