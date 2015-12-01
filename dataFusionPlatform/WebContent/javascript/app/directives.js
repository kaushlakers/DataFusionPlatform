define(['app',
        'services'],
function(appModule) {
	
	appModule.directive('ngGraphRender',['UrlService', 'DatasetsService', function(URLService, DatasetsService) {
		return {
			templateUrl: URLService.buildUrl("views/graph.html"),
			scope: {
				exportFn:'&'
			},
			link: function($scope, $element, $attrs) {
				
				$scope.graph = {};
				
				var nodes = new vis.DataSet();
				var edges = new vis.DataSet();
				
				var container = document.getElementById('graph');
			    var data = {
				    nodes: nodes,
				    edges: edges
				};
			    
			    var options = getOptions();
			    
				var network = new vis.Network(container, data, options);
				
				network.on("click", function(params) {
					$scope.$emit("graph.click", params.nodes);
				})
				
				$scope.$on('graph.update', function(event, clear) {
					$scope.graph = DatasetsService.getGraphData();
					if (!clear) {
						nodes.update($scope.graph.nodes);
						edges.update($scope.graph.edges);
					}
					else {
						nodes.clear();
						edges.clear();
					}
				})
				
				function getOptions() {
					var options = {
				    		  nodes:{
				    		    borderWidth: 1,
				    		    borderWidthSelected: undefined,
				    		    scaling: {
				    		    	label: {
				    		    		enabled: false
				    		    	},
				    		    },
				    		    
				    		    fixed: {
				    		      x:false,
				    		      y:false
				    		    },
				    		    font: {
				    		      color: '#343434',
				    		      size: 3, // px
				    		      face: 'arial',
				    		      background: 'none',
				    		      strokeWidth: 0, // px
				    		      strokeColor: '#ffffff',
				    		      //align: 'horizontal'
				    		    },
				    		   // shape: 'database',
				    	},
				    	edges:{
				    		arrows: {
				    			to: {
				    				enabled: true,
				    				scaleFactor: 0.2
				    			}
				    		},
		    			    length: 1,
		    			    width: 1,
		    			    hidden: false,
		    			    smooth: {
		    			        enabled: false,
		    			   },
		    			   scaling: {
		    				   max: 2
		    			   }
				    	
				    	},
				    	physics: {
				    		enabled: true,
				    		barnesHut: {
				    		      gravitationalConstant: -1000,
				    		      centralGravity: 0.7,
				    		      springLength: 5,
				    		      springConstant: 0.04,
				    		      damping: 0.09,
				    		      avoidOverlap: 0
				    		},
				    		//minVelocity: 0.75
				    		maxVelocity: 40
				    	},
			    	};
					return options;
				}
				
				
			}
		}
	}])
		
		//add directives	
	}
)