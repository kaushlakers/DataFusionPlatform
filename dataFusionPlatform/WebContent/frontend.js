

var radius = 20, rTable = 30, rDataset = 40;
var margin = {top: -5, right: -5, bottom: -5, left: -5};
var width = 1200 - margin.left - margin.right, height = 800 - margin.top - margin.bottom;


//Initially set the 2nd, 3rd, and 4th form to hidden
document.getElementById("pickNode").style.display="none";
document.getElementById("findMatches").style.display="none";
document.getElementById("createEdges").style.display="none";


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


// these hold the raw data
var graphNodes = force.nodes();
var graphLinks = force.links();
//these will hold the unique ids of each node/link to enusre there are no doubles
var uniqueNodes = [];
var uniqueLinks = [];
// these will hold the graphical elements
var nodeContainer;
var linkContainer;

var newContainer;
//this will be a map with keys - tableNodeId, values - metadata
var tableInfo = [];

var queryNodes = [];

//Hold data on the node for which we find additional matches for
var nodeForMatches;

//Temp array for holding new nodes that could be added to a dataset
var newNodes = [];

//Array for creating dashed edges
//var connectNodes = [];

//Array for holding dashed edge objects
var listOfNodeMatches = [];

var state = false;
var last = null;
var current = null;


d3.json("/Justin/datasets", function(error, data)
		{
			//Get the Form to insert radio buttons for chosing a dataset		
			var form1 = document.getElementById("fieldSet");

			//Retrieve the datasets from Neo4j
			dSets = data.datasets;
			
			//Create a radio button for each dataset to display 
			for (var d in dSets) {
				var name = dSets[d].datasetNode.title;
				var id = dSets[d].id;
				var radioInput = document.createElement('input');
				radioInput.setAttribute('type', 'radio');
				radioInput.setAttribute('name', 'dataSet');
				radioInput.setAttribute('value', id);
				radioInput.setAttribute('class', 'list');
				
				//Add button to the form
				form1.appendChild(radioInput);
				form1.appendChild(document.createTextNode(" " + name));
				form1.appendChild(document.createElement('br'));

			}						
		});

		
// this ID should be set via user input
var datasetID;

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
        return this.value; }).get();
    
    //console.log(checkedData);
    datasetID = checkedData;
    //log("datasetID inside getDataSets function:" + datasetID); 
    
    //Call the route to dynamically add the dataset to the webapp
    d3.json("/Justin/getDataset/" + datasetID, function(error, dataset)
		{
			if(error) return;
			
			//console.log("Dataset value inside getDataset is:" + dataset);
			//console.log(dataset);
			//console.log(dataset.nodes);
			//console.log("Dataset links:");
			//console.log(dataset.links);
			
			uniqueNodes = []; 
	 		uniqueLinks = []; 
			
			// initialize data with query results
			force.nodes(dataset.nodes).links(dataset.links).start();
			
			// repopulate the data
			graphNodes = force.nodes();
			graphLinks = force.links();
			
			graphNodes.forEach(function(node) { 
				// check if the node's id is already in the graph
				// if it's not in there, add it to unique id list
				var nodeId = node.id; 
			    var nodeIndex = uniqueNodes.indexOf(nodeId); 
			    if (nodeIndex == -1) 
			    	uniqueNodes.push(nodeId); 
				});
			
			//console.log("inside getDataSet");
			//console.log("graphLinks is:");
			//console.log(graphLinks);
		    linkContainer = container.append("g")
		    	.selectAll(".link")
		        .data(graphLinks).enter()
		        .append("line")
		        .attr("id", "line")
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
		    
			//Add on click function to nodes
			nodeContainer.on("click", getNode);

		});
    
}

//Function finds the current column nodes and populates the selection form
function populateForm() {
	var nodeType = "Column"
	var columnNodes = svg.selectAll(".node")
						.filter(function(d) { return d.type == nodeType });

	/*
	 * Find all of the svg "g" elements in columnNodes and dynamically create
	 * 	option tags in the select element of the form, and give them the text
	 * 	from the column nodes.
	 */
	var column = columnNodes.selectAll("g");
	var i = 0;
	while (i<column.length) {
		var option = new Option(column[i].parentNode.__data__.name, column[i].parentNode.__data__.id);
		document.getElementById("nodeSelections").appendChild(option);	
		i++;
	}
	
}

//Function to handle when the user clicks on different option tags
//	so that the same functionality occurs as when using the graph.
function optionChange() {
	
	//debugger;
	//Get the select tag in the html
	var selectBox = document.getElementById("nodeSelections");
	
	//get the current value of the option selected
	var selectedValue = selectBox.options[selectBox.selectedIndex].value;
	
	//Based upon the value, select the corresponding node and call getNode() on it
	var optionNode = svg.selectAll(".node")
				.filter(function (d) { return d.id == selectedValue});
	
	//Keep track of the last and currently clicked on node, and highlight them accordingly
	last = current;
	current = optionNode;
	current.style('fill', 'rebeccapurple');
	if(last) {last.style('fill', null);}
	
	//Call getNode with data of currently clicked on node
	getNode(optionNode[0][0].__data__);
			
}

//Function to change from the second form back
//to the first form
function goBackToForm1() {
	//Refresh the D3 Graph
	d3.select("svg").remove();
	document.getElementById("pickNode").style.display="none";
	document.getElementById("getDataForm").style.display="block";
	/*
	 * Find select element in DOM and remove all the options that were created by the populateForm() method
	 */
	var selectElement = document.getElementById("nodeSelections")
	while (selectElement.firstChild) {
		selectElement.removeChild(selectElement.firstChild);
	}
}

//Go from 3rd form to 2nd form
function goBackToForm2() {

	//Get the form and hide the display
	var form = document.getElementById("findMatches");
	form.style.display="none";
	
	//Remove all the buttons from the div
	var getDiv = form.firstChild;
	
	while (getDiv.firstChild) {
    	getDiv.removeChild(getDiv.firstChild);
	}
	
	//Go back to showing the 2nd form
	document.getElementById("pickNode").style.display="block";
}

//Go from 4th form to 3rd form
function goBackToForm3() {

	//Hide the current form [4th form for creating edges]
	document.getElementById("createEdges").style.display="none";
	
	//Go back to showing the 3rd form
	document.getElementById("findMatches").style.display="block";
	
	//Remove rows from table
	var table = document.getElementById("createEdgesTable")
	while (table.rows.length > 0) {
		table.deleteRow();
	}
	
	console.log("Unique nodes is:");
	console.log(uniqueNodes);
	//Remove any nodes that could of been added from the set of unique nodes
	for (var node in newNodes){
		console.log("node is:");
		uniqueNodes.pop(newNodes[node].id);
	}
	
	console.log("Unique nodes after removal is:");
	console.log(uniqueNodes);
}

//After clicking on a node it will fill the metadata console with the information.
//Also it will color the node [still needs implemented]
//This then dynamically updates the Find Matches button to transform the UI
//into the 3rd form when it is pressed.
function getNode(n) {

	//console.log("Inside getNode");
	//console.log("n inside getNode is:");
	//console.log(n);

	//Assign the node to the global variable nodeForMatches
	//Its index is needed to create new edges to the dataset
	nodeForMatches = n;
	
	/*
	 * Need to check if the current element passed into getNode function is an SVG element and if it is then keep track of
	 * 	the last and currently clicked on node, and highlight them accordingly. If it is not a SVG element then this will have
	 * 	already been done.
	 */
	if (Object.prototype.toString.call(d3.select(this)[0][0]) == "[object SVGGElement]") { 
		last = current;
		current = d3.select(this);
		current.style('fill', 'rebeccapurple');
		if(last) {last.style('fill', null);}
	}
	
	//Update Console on the nodes information
	// var info = [n.name, n.type, n.properties.represents, n.properties.columntype, n.properties.semanticrelation];
    cells = document.getElementsByClassName("infocell");
    //console.log(cells);
    // console.log(info);
    cells[0].innerHTML = n.name;
    cells[1].innerHTML = n.type;
    cells[2].innerHTML = n.properties.represents;
    cells[3].innerHTML = n.properties.columntype;
    cells[4].innerHTML = n.properties.semanticrelation;
    
    //Update the buttons onclick function
	document.getElementById("getNode").onclick = function(){ nodeOnClick(n) };
}

function nodeOnClick(n) {
	
	//Hide the 2nd Form and Show the 3rd Form
	document.getElementById("pickNode").style.display="none";
	document.getElementById("findMatches").style.display="block";

	//console.log("inside nodeOnClick");

    //Return color of nodes back to normal
    svg.selectAll(".node").style("fill", null);
    
    var getOptionsDiv = document.getElementById("displayOptions");
    if (getOptionsDiv.children.length) {
    	while (getOptionsDiv.hasChildNodes()) { 
    	    getOptionsDiv.removeChild(getOptionsDiv.lastChild);
    	}
    }
    
    //Get Represents property from currently selected node
    currRepresents = n.properties.represents;
        
    getTitle = n.properties.title;
    getRepresents = n.properties.represents;
    getColumnType = n.properties.columntype;
    getSemanticRelation = n.properties.semanticrelation;
    
 
    //Dynamically create button for finding related Titles, Represents, Column Types, Relations
    if (getTitle !== undefined)            { createButton("Find Related Titles", findTitle); }
    // if (getRepresents !== undefined)       { createButton("Find Related Represents", findRep); }
    if (getRepresents !== undefined)       { createButton("Find Related Entities", findRep); }
    // if (getColumnType !== undefined)       { createButton("Find Related Column Types", findColType); }
    // if (getSemanticRelation !== undefined) { createButton("Find Related Semantic Relations", findSemRel); }
    if (getSemanticRelation !== undefined) { createButton("Find Related Attributes", findSemRel); }

}

//force feed algo ticks
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



//Function to dynamically create buttons and add them to the 3rd form
function createButton(label, functionCall) {
	//Create the button element
    var btn = document.createElement("BUTTON"); 
    //Create the button label, and add it to the button
    var title = document.createTextNode(label); 
    
    //create break
    var br = document.createElement("br");
    
    //btn.className = "btn btn-default";
    btn.className = "btn btn-default";
    btn.style.width = "200px";
    btn.appendChild(title);
    

    btn.onclick = functionCall; 
    //Add button to the 'displayOptions' div inside the console
    document.getElementById("displayOptions").appendChild(btn);
    document.getElementById("displayOptions").appendChild(br)
	btn.setAttribute("type", "button");	

}

//function for handling zoom event
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

function match(prop, propVal, color, n) {

	//console.log("inside match function");
	//console.log("n is:");
	//console.log(n);
	
	queryNodes = [];
	
	//Hide the 3rd form and show the 4th form
	//Get the form and hide the display
	var form = document.getElementById("findMatches");
	form.style.display="none";
	
	//Remove all the buttons from the div
	var getDiv = form.firstChild;
	
	while (getDiv.firstChild) {
    	getDiv.removeChild(getDiv.firstChild);
	}
	
	//Go back to showing the 2nd form
	document.getElementById("createEdges").style.display="block";
	
    //create array to hold the new nodes
	var newNodes = [];
    var newNodeIDs = [];
    
    //Used to get the node that connects to the original dataset
    var connectNode = {};

	d3.json("/Justin/matchProperty/" + prop + "/" + propVal, function(error, data)
		{
			if(error) return;
			
			//create array to hold the new nodes
			newNodes = [];
		
			//console.log("Inside /matchProperty/");
			//console.log("Data is:");
			//console.log(data);
			//console.log("Inside /matchProperty/ n is:");
			//console.log(n);
			
			//console.log("Graph Links is:");
			//console.log(graphLinks);
			
			data.resultingNodes.forEach(function(node) 
				{
					var nodeId = node.id;
				    var nodeIndex = parseInt(uniqueNodes.indexOf(nodeId));
				    if (nodeIndex == -1)
				    {
				    	newNodes.push(node);
				    	newNodeIDs.push(nodeId);
				    }
				});
			
			var newCounter = 0;

			//console.log("newNodesIds is:");
			//console.log(newNodeIDs);
			// for each node that is matched in the query, get its respective table and update the graph
			newNodeIDs.forEach(function (newId)
				{
					d3.json("/Justin/getTable/" + newId, function(error, tableData)
							{
								newCounter += 1;
								//console.log("newCounter is:");
								//console.log(newCounter);
								if (error) return;
								
								//console.log("tableData is:");
								//console.log(tableData);
								var indexOffset = graphNodes.length;
								var linkOffset = graphLinks.length
								var tableNodeIndex = 0;
								var tableNodeId = 0;
								var tableNSize = tableData.nodes.length;
								var tableLSize = tableData.links.length;
								var datasetDupIndex = 1000;
								var datasetIndex = 1000;
								var i = 0;
								
								tableData.nodes.forEach(function (tNode)
									{
										var nId = tNode.id;
										
										//If the node from the table matches the new node
										//for creating the dashed line, assign it to connectNode
										if (nId == newId) {
											
											//console.log("INSIDE OF of tableDataRows logic");
											connectNode = tNode;
											//connectNodes.push(connectNode);
											var dashedEdge = {source: n, target: connectNode, id: "dash"};
											listOfNodeMatches.push(dashedEdge);
											//console.log("connectNodes is");
											//console.log(connectNodes);
										}
										
										if (tNode.type == "Table" || tNode.type == "JoinTable")
										{
											tableNodeIndex = graphNodes.length;
											tableNodeId = tNode.id;
										}
										
										var nIndex = parseInt(uniqueNodes.indexOf(nId));
										
										/*
										 * Check if the index is already in uniqueNodes, and also if it is then check if
										 * 	its a dataset node so that the correct links can be made
										 */										
									    if (nIndex == -1) {
									    	uniqueNodes.push(nId);
											graphNodes.push(tNode);
									    } else if (tNode.type == "Dataset") {
									    	datasetDupIndex = $.inArray(nId, uniqueNodes);
									    	datasetIndex = i;																		
									    }
									    
									    i++;
									});
								
								// must change the relationship indices to reflect the indices that the nodes assume
								// when placed into graphNodes. This is because 
								
								//console.log("tableData is:");
								//console.log(tableData);
								tableData.links.forEach(function (edge)
								{
										
									var sourceDecrement = false;	
									var targetDecrement = false;
									/*
									 * Check if the target edge/source is after the dataset duplicate, because if it is then 
									 * 	it needs to be decremented
									 */
									if (edge.target>datasetIndex) {
										targetDecrement = true;
									} 
									if (edge.source>datasetIndex) {
										sourceDecrement = true;
									}
									
									/*
									 * Check if any of the source or targets are the datasetIndex node and in which case you
									 * 	need to make it equal to the dataset node that already exists in uniqueNodes
									 */
									if (edge.source == datasetIndex) {
										edge.source = datasetDupIndex;
										edge.target += indexOffset;
									} else if (edge.target == datasetIndex) {
										edge.target = datasetDupIndex;
										edge.source += indexOffset;
									} else {
										edge.source += indexOffset;
										edge.target += indexOffset;
									}
									
									/*
									 * Checks if the booleans have been changed and if so then it decrements
									 */
									if (targetDecrement) {
										edge.target -= 1;
									} 
									if (sourceDecrement) {
										edge.source -= 1;
									}
																	
									//Add the link to the global list of links
									graphLinks.push(edge);

									
								});
									
								// refresh the graphical display
								refreshGraph();
								
								// increment edge count since dashed edge was added
								tableLSize++;
								tableInfo[tableNodeId] = indexOffset + "/" + tableNSize + "/" + linkOffset + "/" + tableLSize;

								
							});
				});
									
				
			//Update the cancel button so it has the list of new nodes it can remove
			var backButton = document.getElementById("backToThirdForm").onclick
			
			//call function to add rows to the frontend UI
			createTable(newNodes, n);
			
		});
	
}

function createTable(newNodes,n) {

	//get HTML Table to add rows in
	var edgeTable = document.getElementById("createEdgesTable");
	
	//Create row to insert column headers
	
	//First row element left blank [to align headers correctly]
	var row = edgeTable.insertRow();
	var td = document.createElement('td');
	text = document.createTextNode("Connecting Nodes");
	td.appendChild(text);	
	row.appendChild(td);
	
	//Second row element (First Column header)
	//td = document.createElement('td');
	//var text = document.createTextNode("Display Node");
	//td.appendChild(text);
	//eow.appendChild(td);
	
	//Third row element (Second Column header)
	td = document.createElement('td');
	text = document.createTextNode("Create Edge");
	td.appendChild(text);
	row.appendChild(td);
	
	//Fourth row element (Third Column header)
	td = document.createElement('td');
	text = document.createTextNode("Delete Node");
	td.appendChild(text);
	row.appendChild(td);
	
	//Create a table row for each node
	for (var i in newNodes) {
		var row = edgeTable.insertRow();

		row.id = "node"+newNodes[i].id;

		
		//console.log("row id : " +row.id);
		//Show name of the node
		var td = document.createElement('td');
		var text = document.createTextNode(newNodes[i].name);
		td.appendChild(text);
		row.appendChild(td);
		
		//Choice for showing node
		//var td2 = document.createElement('td');
		//var radioButton1 = document.createElement('input');
		//radioButton1.type = "radio";
		//radioButton1.name = i;
		//radioButton1.value = "showNode";
		//td2.appendChild(radioButton1);
		//row.appendChild(td2);
		
		//Choice for creating edge 
		var td3 = document.createElement('td');
		var radioButton2 = document.createElement('input');
		radioButton2.type = "radio";
		radioButton2.name = i;
		radioButton2.value = "createEdge";
		td3.appendChild(radioButton2);
		row.appendChild(td3);

		//Choice for deleting node 
		var td4 = document.createElement('td');
		var radioButton3 = document.createElement('input');
		radioButton3.type = "radio";
		radioButton3.name = i;
		radioButton3.value = "removeNode";
		td4.appendChild(radioButton3);
		row.appendChild(td4);	
							
	}
		
	//JQuery function for creating edges and removing nodes
	$('tr[id^=node] input').on('change', function() {
	
    	var row = $(this).parents('tr:first').get(0);
    	console.log('Node: '+ row.id+ ' value:' + this.value); 
    	
    	console.log("INSIDE JQUERY *************************");
    	//Get target node based on the index in the table
    	var getIndex = row.id;

    	getIndex = parseInt(getIndex.substring(4));
    	//var nodeToModify = newNodes[getIndex];
    	
    	var nodeToModify = uniqueNodes.indexOf(getIndex);
    	
    	//Creates the edge when this radio button is chosen
    	if (this.value == "createEdge") {
    		var edge = {};
    		var source = n;
    		var target = nodeToModify;

			//Create edge and update graph
    		edge = {source:source, target:target};
			graphLinks.push(edge);
			
			// update the data sourced by the graphical containers
			linkContainer = linkContainer.data(graphLinks);
									
			// any new data must be entered into its new graphical container
			linkContainer.enter()
				.append("line")
				.attr("class", "link");
    		
    		// begin simulation with updated data
			force.start();	
			
		//Remove the node from the graph	
    	} else if (this.value == "removeNode") 
    	{
    	
			console.log("GRAPHINFO BEFORE REMOVAL");
			console.log(tableInfo);
			console.log(graphNodes);
			console.log(graphNodes.length);
			console.log(graphLinks);
			console.log(graphLinks.length);
    		var nodeToRemove = graphNodes[nodeToModify];
    		
    		console.log(nodeToRemove);
    		
			
    		// this method relies on the fact that nodes and edges for tables are added in continuous chunks to graphNodes and graphLinks
    		
    		// given matched node that is to be deleted along with its other table nodes

    		// get id of matched node's parent table node
    		
    		d3.json("/Justin/getTableIdForNode/" + nodeToRemove.id, function(error, tableData)
    			{	
    					
	    			debugger;	
					
	        		// find the index of the first node belonging to that table in graphNodes
	        		var tableId = tableData.idForTable;
	        		
	        		
	        		var data = tableInfo[tableId]
	        		
	        		var tableMetaData = data.split("/");
	        		
	        		// structure of tableMetaData --- indexOffset + "/" + tableNSize + "/" + linkOffset + "/" + tableLSize;
	        		var nodeStart = tableMetaData[0];
	        		var numberOfNodes = tableMetaData[1];
	        		var linkStart =  tableMetaData[2];
	        		var numberOfLinks = tableMetaData[3];
	
					delete tableInfo[tableId];
	        		// delete x nodes after the first node where x is the number of nodes belonging to that table
	        		
	        		// repeat last two steps for edges in graphLinks
	        		uniqueNodes.splice(nodeStart, numberOfNodes);
	        		graphNodes.splice(nodeStart, numberOfNodes);
	        		//nodeContainer[0].splice(nodeStart, numberOfNodes);
	        		graphLinks.splice(linkStart, numberOfLinks);
	        		//linkContainer[0].splice(linkStart, numberOfLinks);
	        		
	        		// update tableInfo to reflect any index changes if a table was removed from anywhere but the end of graphNodes
	
	        		Object.keys(tableInfo).forEach(function(key) 
	        			{
	        				var tmp1 = null;
	        				var tmp2 = null;
	        				var flag;
	        			 	var t = tableInfo[key];
	    					tData = t.split("/");
	    					if (parseInt(tData[0]) > parseInt(nodeStart)) { tmp1 = parseInt(tData[0]) - parseInt(numberOfNodes); flag = 1;}
	    					if (parseInt(tData[2]) > parseInt(linkStart)) { tmp2 = parseInt(tData[2]) - parseInt(numberOfLinks); }
	    					
	    					if(flag) {tableInfo[key] = tmp1 + "/" + tData[1] + "/" + tmp2 + "/"  + tData[3];}
						}); 
	        		
	        		// update the graphical display
	        		console.log("befor the graph refresh with 0");
	    			refreshGraph();
		    			
    			});
    	}
	});	
}

//Function for changing dashed edges to a continuous edge
function clickLine() {
	console.log("inside clickLine");
   	d3.select(this).transition()
   	 .style("stroke-linecap", "butt")
     .duration(750)
     .style("stroke", "lightsteelblue")
     .style("stroke-dasharray", "3,0");
}

// function for exporting all shown graph columns
function dataExport() {
	var csvString = [];

	var nodeType = "Column"
	var columnNodes = svg.selectAll(".node")
						.filter(function(d) { return d.type == nodeType });

	/*
	 * Find all of the svg "g" elements in columnNodes and dynamically create
	 * 	option tags in the select element of the form, and give them the text
	 * 	from the column nodes.
	 */
	var column = columnNodes.selectAll("g");
	for (var i = 0; i < column.length; i++) {
		var option = new Option(column[i].parentNode.__data__.name, column[i].parentNode.__data__.id);
		csvString.push(option.innerHTML);
	}

	// format csv file output
	var a         = document.createElement('a');
	a.href        = 'data:attachment/csv,' + csvString;
	a.target      = '_blank';
	a.download    = 'DataFusion.csv';
	document.body.appendChild(a);
	a.click();
}

// this method begins by clearing the current graphical display and creates a new one with
// whatever data is included in graphLinks and graphNodes at the time of the call
// it happens so fast that the graph does not disappear
function refreshGraph() 

{
	//Remove the original graph
	d3.select("svg").remove();
	
	//Create the basic graph element
    svg = d3.select("#graph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("pointer-events", "all")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
    .call(zoom);

	//Create a generic container
    container = svg.append("g");
	
	//Add any connector [dashed] edges to the array of graph edges
	//These edges connect different datasets
    for (var edge in listOfNodeMatches) {
    	if (graphLinks.indexOf(listOfNodeMatches[edge]) == -1) {
    		graphLinks.push(listOfNodeMatches[edge]);
    	
    	}
    }
    
	//Update the data sourced by the graphical containers
	linkContainer = container.append("g")
		.selectAll(".link")
		.data(graphLinks).enter()
		.append("line")
		
		//Style edges based on if they are connecting different 
		//datasets or edges within a dataset
		.style("stroke-dasharray", function(d) {
			if (d.id == "line") {return "3,0"; }
			if (d.id == "dash") {return "3.3"; }			
		})
		.attr("class", "link")
		.on("click", clickLine);
		  
    //Nodes are now a container that contains a circle graphic and its title
    //Each node creates a "g" element container and appends:
   	//	1: SVG Circle
   	//	2: Text displaying title of node
    nodeContainer = container.append("g")
    	.selectAll(".node")
    	.data(graphNodes)
    	.enter().append("g")
    	.attr("class", function (d) { return "node "+ d.type.toString(); })
    	.call(drag);
    
    //Add a SVG circle element to the node container	
    nodeContainer.append("circle")
    	//Dynamically adjust the size of circles depending on its type
    	.attr("r", getNodeSize);
    	
    //Add a Title element to display nodes title container
    nodeContainer.append("text")
    	//Adjust the placement of text on the X-AXIS for displaying the title
    	.attr("dx", getNodeSize)
    	.attr("dy", ".35em")
        .text(function (d) { return d.name; });
        

	//Add on click function to nodes
	nodeContainer.on("click", getNode);
			
	// begin simulation with updated data
	force.start();    
    
}

function findTitle()   { match("title", getTitle, "yellow", nodeForMatches); }
function findRep()     { match("represents", getRepresents, "blue", nodeForMatches); }
function findColType() { match("columntype", getColumnType, "green", nodeForMatches); }
function findSemRel()  { match("semanticrelation", getSemanticRelation, "orange", nodeForMatches); }
