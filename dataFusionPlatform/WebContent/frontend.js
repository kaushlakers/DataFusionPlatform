var radius = 20, rTable = 30, rDataset = 40;
var margin = {top: -5, right: -5, bottom: -5, left: -5};
var width = 1200 - margin.left - margin.right, height = 800 - margin.top - margin.bottom;


//Initially set the 2nd form to hidden
document.getElementById("pickNode").style.display="none";

var force = d3.layout.force()
    .charge(-500)
    .linkDistance(75)
    .size([width, height])
    .on("tick", tick);;
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

// these hold the raw data
var graphNodes = force.nodes();
var graphLinks = force.links();
// these will hold the graphical elements
var nodeContainer;
var linkContainer;

var state = false;
var last = null;
var current = null;


d3.json("/ty/datasets", function(error, data)
		{
			if(error) return;
			
			console.log(data);
			console.log(data.datasets);
			
			console.log("Inside of /datasets");
			
			
			
			
		});

console.log("outside of /dataset");
		
// this ID should be set via user input
var datasetID;

console.log("datasetID before method:" + datasetID); 

//Function takes the checked option from the user input form 
//and saves it into the datasetID variable.
function getDataSet() {

	//Refresh the D3 Graph
	d3.select("svg").remove();
	
	//Hide the first form
	document.getElementById("getDataForm").style.display="none";
	
	//Display the second form
	document.getElementById("pickNode").style.display="block";
	
	
	
    svg = d3.select("#graph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("pointer-events", "all")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
    .call(zoom);

    container = svg.append("g");
	
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
			console.log(dataset.nodes);
			console.log(dataset.links);
			
			// initialize data with query results
			force.nodes(dataset.nodes).links(dataset.links).start();
			
			// repopulate the data
			graphNodes = force.nodes();
			graphLinks = force.links();

			console.log("after force check");
			
		    linkContainer = container.append("g")
		    	.selectAll(".link")
		        .data(graphLinks).enter()
		        .append("line")
		        .attr("class", "link");
		
		    //Modified D3 nodes on 3/27/15 By Justin 
		    //Nodes are now a container that contains a circle graphic and its title
		    //Each node creates a "g" element container and appends:
		   	//	1: SVG Circle
		   	//	2: Text displaying title of node
		    nodeContainer = container.append("g")
		    	.selectAll(".node")
		    	.data(graphNodes)
		    	.enter().append("g")
		    	.attr("class", function (d) { return "node "+ d.type.toString(); })
		    	.style("fill", function(d) {return d.colr; })
		    	.call(drag);
		    
		    //Add a SVG circle element to the node container	
		    nodeContainer.append("circle")
		    	//Dynamically adjust the size of circles depending on its type
		    	.attr("r", getNodeSize)
		    	
		    //Add a Title element to display nodes title container
		    nodeContainer.append("text")
		    	//Adjust the placement of text on the X-AXIS for displaying the title
		    	.attr("dx", getNodeSize)
		    	.attr("dy", ".35em")
		        .text(function (d) { return d.name; })
			
			//Need to populate the select form
			populateForm();
			

		    nodeContainer.on("click", nodeOnClick);
		    
		});
    
}

//Function finds the current column nodes and populates the selection form
function populateForm() {
	var nodeType = "Column"
	var columnNodes = svg.selectAll(".node")
						.filter(function(d) { return d.type == nodeType })
						.style('fill', 'blue');
	
	console.log("columnNodes is:" + columnNodes);
	console.log(columnNodes[0]);
	

}

//Function to change from the second form back
//to the first form
function goBack() {
	//Refresh the D3 Graph
	d3.select("svg").remove();
	document.getElementById("pickNode").style.display="none";
	document.getElementById("getDataForm").style.display="block";
}

function getNode() {
	console.log("GOT INSIDE getNODE");
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

function nodeOnClick(n) {
    //Return color of nodes back to normal
    svg.selectAll(".node").style("fill", function(d) { return d.colr; });
    
    var getOptionsDiv = document.getElementById("displayOptions");
    while (getOptionsDiv.hasChildNodes()) { 
        getOptionsDiv.removeChild(getOptionsDiv.lastChild);
    }
    
    //Get Represents property from currently selected node
    currRepresents = n.properties.represents;
    
    var info = [n.name, n.type, n.properties.represents, n.properties.columntype, n.properties.semanticrelation];
    cells = document.getElementsByClassName("infocell");
    console.log(cells);
    console.log(info);
    cells[0].innerHTML = n.name;
    cells[1].innerHTML = n.type;
    cells[2].innerHTML = n.properties.represents;
    cells[3].innerHTML = n.properties.columntype;
    cells[4].innerHTML = n.properties.semanticrelation;

    //Add data to meta info div
    // var metainf = "";
    // metainf = metainf.concat("Title: ", n.name, "<br/>Label: ", n.type, "<br/>Represents: ", n.properties.represents, 
    // "<br/>Column Type: ", n.properties.columntype, "<br/>Semantic Relation: ", n.properties.semanticrelation);
    // console.log(metainf);
    // d3.select("#metainfo")
    //     .html(metainf);
    
    last = current;
    current = d3.select(this);
    current.style('fill', 'red');
    last.style('fill', function(d) { return d.colr; });

    getTitle = n.properties.title;
    getRepresents = n.properties.represents;
    getColumnType = n.properties.columntype;
    getSemanticRelation = n.properties.semanticrelation;

    function createButton(label, functionCall) {
        var btn = document.createElement("BUTTON"); //Create the button element
        var title = document.createTextNode(label); //Create the button label, and add it to the button
        btn.className = "btn btn-default btn-block"
        btn.appendChild(title);
        btn.onclick = functionCall; //Call function when button is clicked
        document.getElementById("displayOptions").appendChild(btn); //Add button to the 'displayOptions' div inside the console
    }
    
    //Dynamically create button for finding related Titles, Represents, Column Types, Relations
    if (getTitle !== undefined)            { createButton("Find Related Titles", findTitle); }
    if (getRepresents !== undefined)       { createButton("Find Related Represents", findRep); }
    if (getColumnType !== undefined)       { createButton("Find Related Column Types", findColType); }
    if (getSemanticRelation !== undefined) { createButton("Find Related Semantic Relations", findSemRel); }
}

// force feed algo ticks
function tick() {
    nodeContainer.attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
    .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
    
    linkContainer.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    nodeContainer.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    
    nodeContainer.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });	
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

function getNodeSize(d) {
	switch (d.type.toString()) {
		case "Dataset":		return 25;
		case "Table":		return 20;
		case "JoinTable":	return 20;
		default:			return 15;
	}
}

function match(prop, propVal, color) {
    //svg.selectAll(".node").style("fill", function(d) { return d.colr; });
    //Filter through all nodes to find matches, color them appropriately
    //svg.selectAll(".node")
    //.transition()
    //.filter(function(d) { return d.properties[att] == match; })
    //.style('fill', color);
	
	d3.json("/ty/matchProperty/" + prop + "/" + propVal, function(error, data)
		{
			if(error) return;
			
			console.log(data.resultingNodes);
			
			data.resultingNodes.forEach(function(node) {
			    graphNodes.push(node);
			});
			
			// update the data sourced by the graphical containers
			linkContainer = linkContainer.data(graphLinks);
			nodeContainer = nodeContainer.data(graphNodes);
			
			// any new data must be entered into its new graphical container
			linkContainer.enter()
				.append("line")
				.attr("class", "link");
			
			nodeContainer.enter()
				.append("g")
				.attr("class", function (d) { return "node "+ d.type.toString(); })
				.style("fill", function(d) {return d.colr; })
				.call(drag);
	    
			//Add a SVG circle element to the node container	
			nodeContainer.append("circle")
	    	//Dynamically adjust the size of circles depending on its type
	    		.attr("r", getNodeSize)
	    	
	    	//Add a Title element to display nodes title container
	    	nodeContainer.append("text")
	    	//Adjust the placement of text on the X-AXIS for displaying the title
	    		.attr("dx", getNodeSize)
	    		.attr("dy", ".35em")
	    		.text(function (d) { return d.name; })

	    	// add on click function to nodes
	    	nodeContainer.on("click", nodeOnClick);
				
			// begin simulation with updated data
			force.start();			
		});

	
	
}

function findTitle()   { match("title", getTitle, "yellow"); }
function findRep()     { match("represents", getRepresents, "blue"); }
function findColType() { match("columntype", getColumnType, "green"); }
function findSemRel()  { match("semanticrelation", getSemanticRelation, "orange"); }
