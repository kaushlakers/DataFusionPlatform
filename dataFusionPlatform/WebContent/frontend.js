
var radius = 20, rTable = 30, rDataset = 40;
var margin = {top: -5, right: -5, bottom: -5, left: -5};
var width = 1200 - margin.left - margin.right, height = 800 - margin.top - margin.bottom;

var force = d3.layout.force()
    .charge(-500)
    .linkDistance(50)
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


d3.json("/ty/datasets", function(error, data)
		{
			if(error) return;
			
			console.log(data);
			console.log(data.datasets);
			
		})

		
// this ID should be set via user input
var datasetID = 536;

d3.json("/getDataset/" + datasetID, function(error, dataset)
		{
			if(error) return;
			
			console.log(dataset);
			
			
		})


// titles
// column types
// represents
// semantic relation

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
