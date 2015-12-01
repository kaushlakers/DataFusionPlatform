define(['app',
        ],
function(appModule) {
	
	//add services
	appModule.factory("UrlService", function() {
		var warName = "dataFusionPlatform";
		return {
			buildUrl: function(path) {
				return "/" + warName + "/" + path;
			}
		}
	});
	
	appModule.factory("DatasetsService", ["$http", "$q", "$rootScope", "UrlService", function($http, $q, $rootScope, UrlService) {
		
		var datasetsPromise = $http.get(UrlService.buildUrl('datasets'));
		var nodeGroupMap = {"dataset": 0, "table": 1, "column": 2};
		var datasets = {};
		var nodeBank = {};
		var graph = {nodes: [], edges: [], crossDatasetEdges: []};
		
		function createGraphFormatNode(node, shape) {
			if (shape == undefined) {
				shape = "ellipse";
			}
			return {
				id: node.id,
				label: node.properties.title,
				group: nodeGroupMap[node.type],
				shape: shape,
				};
		}
		
		function updateStoreObjects(data, broadcast, partial) {
			
			var datasets = data.datasets;
			
			if (!partial) {
				graph = {nodes: [], edges: [], crossDatasetEdges: []};
			}
			
			for(var d = 0; d < datasets.length; d++) {
				
				var dataset = data.datasets[d];
				
				graph.edges = graph.edges.concat(dataset.relationships);
				
				var datasetNode = dataset.datasetNode;
				nodeBank[datasetNode.id] = datasetNode;
				graph.nodes.push(createGraphFormatNode(datasetNode, "database"));
				var tableNodes = dataset.tableNodes;
				for(var i = 0;i < tableNodes.length; i++){
					nodeBank[tableNodes[i].id] = tableNodes[i];
					graph.nodes.push(createGraphFormatNode(tableNodes[i], "box"));
				}
				var columnNodes = dataset.columnNodes;
				for(var i = 0;i < columnNodes.length; i++){
					nodeBank[columnNodes[i].id] = columnNodes[i];
					graph.nodes.push(createGraphFormatNode(columnNodes[i]));
				}
			}
			if (data.crossDatasetLinks) {
				for (var i = 0; i < data.crossDatasetLinks.length; i++) {
					var arrows = {to: false};
					data.crossDatasetLinks[i].arrows = arrows;
					graph.crossDatasetEdges.push(data.crossDatasetLinks[i]);
				}
				//graph.edges = graph.edges.concat(data.crossDatasetLinks);
			}
			if (broadcast) {
				$rootScope.$broadcast('graph.update', false);
			}
			
		}
		
		return {
			
			toggleEdgeType: function(edge) {
				edge.dashes = !edge.dashes;	
				$rootScope.$broadcast('graph.update', false);
			},
			
			clearGraph: function() {
				graph = {nodes: [], edges: [], crossDatasetEdges: []};
				$rootScope.$broadcast('graph.update', true);
			},
			
			getColumnMatches: function(id, prop, propValue, callback) {
				var requestData = {
						datasetId: id,
						propName: prop,
						propValue: propValue
				};
				console.log(requestData);
				$http.post(UrlService.buildUrl('matchProperty'), requestData)
				.success(function(data) {
					console.log(data);
					updateStoreObjects(data, true, true);
					callback();
				})
				
			},
			
			getColumnsWithProperty: function(id, property) {
				console.log(datasets);
				console.log(id);
				var columns = datasets[id].columnNodes;
				console.log(columns);
				var relevantColumns = [];
				for(var i = 0; i < columns.length; i++) {
					if (property in columns[i].properties) {
						relevantColumns.push(columns[i]);
					}
				}
				return relevantColumns;
			},
			
			getCrossDatasetEdgeNodes: function() {
				var crossEdges = graph.crossDatasetEdges;
				var crossEdgeNodes = [];
				for (var i = 0; i < crossEdges.length; i++) {
					var obj = {};
					obj.src = nodeBank[crossEdges[i].from];
					obj.dest = nodeBank[crossEdges[i].to];
					obj.edge = crossEdges[i];
					crossEdgeNodes.push(obj);
				}
				return crossEdgeNodes;
			},
			
			getDataset: function(id, callback) {
				//if (datasets[id]) {
					//callback(datasets[id]);
				//}
				//else {
					$http.get(UrlService.buildUrl('getDataset/' + id))
					.success(function(data) {
						datasets[id] = data.datasets[0];
						callback(datasets[id]);
						updateStoreObjects(data, true, false);
					});
				//}
			},
			
			getDatasetMatches: function(ids, intermediate) {
				/*
				$http.get(UrlService.buildUrl('getDatasetMatches/'+ids.join('/')))
				.success(function(data) {
					updateStoreObjects(data, true, false);
				})
				*/
				var data = {datasetId1: ids[0], datasetId2: ids[1], intermediate: intermediate};
				console.log(data);
				$http.post(UrlService.buildUrl('getDatasetMatches'), data)
				.success(function(data) {
					updateStoreObjects(data, true, false);
				})
			},
			
			getGraphData: function() {
				return {
					nodes: graph.nodes,
					edges: graph.edges.concat(graph.crossDatasetEdges)
				};
			},
			
			getNode: function(id) {
				return nodeBank[id];
			},
			
			listDatasets: function(callback) {
				datasetsPromise.success(callback);
			},
			
		}
		
	}]);
	
		
})