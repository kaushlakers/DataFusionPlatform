
var radius = 20, rTable = 30, rDataset = 40;
var margin = {top: -5, right: -5, bottom: -5, left: -5};
var width = 1200 - margin.left - margin.right, height = 800 - margin.top - margin.bottom;

var force = d3.layout.force()
    .charge(-1000)
    .linkDistance(100)
    .size([width, height]);
//[width, height] [width + margin.left + margin.right, height + margin.top + margin.bottom]

//Test zoom functionality
// create the zoom listener
var zoom = d3.behavior.zoom()
    .scaleExtent([1, 15])
    .on("zoom", zoomed);

var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);

var svg = d3.select("#graph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("pointer-events", "all")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
    .call(zoom);

var container = svg.append("g");

console.log("Before entering route");

d3.json("/ty/datasets", function(error, data)
		{
			if(error) return;
			
			console.log(data);
			console.log(data.datasets);
			
			console.log("Inside of route");
		});

console.log("outside of route");
		
// this ID should be set via user input
var datasetID;

console.log("datasetID before method:" + datasetID); 

//Function takes the checked option from the user input form 
//and saves it into the datasetID variable.
function getDataSet() {

	d3.select("svg").remove();
	
    var svg = d3.select("#graph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("pointer-events", "all")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
    .call(zoom);

    var container = svg.append("g");
	
	//Jquery function gets the "VALUE" field from each checked option in the form
    var checkedData = $('input[name="dataSet"]:checked').map(function () {
        return this.value;
    }).get();
    
    console.log(checkedData);
    datasetID = checkedData;
    console.log("datasetID inside getDataSets function:" + datasetID); 
    
    //Call the route to dynamically add the dataset to the webapp
    d3.json("/ty/getDataset/" + datasetID, function(error, dataset)
		{
			if(error) return;
			
			console.log("Dataset value inside getDataset is:" + dataset);
			console.log(dataset);
			
			force.nodes(dataset.nodes).links(dataset.links).start();

			console.log("after force check");
			
		    var link = container.append("g")
		    	.selectAll(".link")
		        .data(dataset.links).enter()
		        .append("line")
		        .attr("class", "link");
		
		    //Modified D3 nodes on 3/27/15 By Justin 
		    //Nodes are now a container that contains a circle graphic and its title
		    //Each node creates a "g" element container and appends:
		   	//	1: SVG Circle
		   	//	2: Text displaying title of node
		    var node = container.append("g")
		    	.selectAll(".node")
		    	.data(dataset.nodes)
		    	.enter().append("g")
		    	.attr("class", function (d) { return "node "+ d.type.toString(); })
		    	.style("fill", function(d) {return d.colr; })
		    	.call(drag);
		    
		    //Add a SVG circle element to the node container	
		    node.append("circle")
		    	//Dynamically adjust the size of circles depending on its type
		    	.attr("r", function (d) {
		    		switch (d.type.toString()) {
		    			case "Dataset":		return 40;
		    			case "Table":		return 30;
		    			case "JoinTable":	return 30;
		    			default:			return 20;
		    		}
		    	})
		    	
		    //Add a Title element to display nodes title container
		    node.append("text")
		    	//Adjust the placement of text on the X-AXIS for displaying the title
		    	.attr("dx", function (d) {
		    		switch (d.type.toString()) {
		    			case "Dataset":		return 40;
		    			case "Table":		return 30;
		    			case "JoinTable":	return 30;
		    			default:			return 20;
		    		}
		    	})
		    	.attr("dy", ".35em")
		        .text(function (d) { return d.name; })
			
			
			// force feed algo ticks
		    force.on("tick", function() {
		        node.attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
		        .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
		        
		        link.attr("x1", function(d) { return d.source.x; })
		            .attr("y1", function(d) { return d.source.y; })
		            .attr("x2", function(d) { return d.target.x; })
		            .attr("y2", function(d) { return d.target.y; });
		
		        node.attr("cx", function(d) { return d.x; })
		            .attr("cy", function(d) { return d.y; });
		        
		        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		    });
				
		});
    
}

console.log("datasetID after method:" + datasetID); 

function search() {
    var arr = [];
    var checks = document.getElementsByClassName("check");
    for (i = 0; i < checks.length; i++) {
        if (checks[i].checked) {
            arr.push(checks[i].name);
        }
    }

    // var arr = ["title", "represents", "columntype", "semanticrelation"];
    for (i = 0; i < arr.length; i++) {
        att = arr[i];
        var userinput = document.getElementById("searchbox").value;
        "string".toLowerCase();
        d3.selectAll(".node")
            .filter(function(d) {
                if (d.properties[att] != null) {
                    return d.properties[att].toLowerCase().indexOf(userinput.toLowerCase()) > -1;
                }
                else {
                    return false;
                }
            })
            .style('fill', "teal");
    }
}

// function for handling zoom event
function zoomed() {
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
    force.start();
}

function dragged(d) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function dragended(d) {
    d3.select(this).classed("dragging", false);
}

function find(att, match, color) {
    svg.selectAll(".node").style("fill", function(d) { return d.colr; });
    //Filter through all nodes to find matches, color them appropriately
    svg.selectAll(".node")
    .transition()
    .filter(function(d) { return d.properties[att] == match; })
    .style('fill', color);
}

function findTitle()   { find("title", getTitle, "yellow"); }
function findRep()     { find("represents", getRepresents, "blue"); }
function findColType() { find("columntype", getColumnType, "green"); }
function findSemRel()  { find("semanticrelation", getSemanticRelation, "orange"); }
