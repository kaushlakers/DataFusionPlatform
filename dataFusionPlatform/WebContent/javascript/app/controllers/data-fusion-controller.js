define(['services'], function() {
	function dataFusionController($scope, DatasetsService, UrlService) {
		
		init();
		
		//function to initialize controller
		function init() {
			
			$scope.formData = {datasets:[],selected:[], formStack:[]};
			$scope.form = UrlService.buildUrl("views/dataset-select.html");
			$scope.nodeDetails = UrlService.buildUrl("views/node-details.html");
			$scope.currentNode = null;
			$scope.crossDatasetEdges = [];
			
			
			DatasetsService.listDatasets(function(data) {
				$scope.formData.datasets = data.datasets;
			});
		}
		
		$scope.back = function() {
			$scope.form = $scope.formData.formStack.pop();
		}
		
		$scope.clearGraph = function() {
			console.log("das");
			DatasetsService.clearGraph();
		}
		
		$scope.exportSchema = function() {
			
		}
		
		$scope.isSwitchDisabled = function() {
			return ($scope.formData.selected.length !== 2);
		}
		
		$scope.getDataset = function(event) {
			$scope.formData.formStack.push($scope.form);
			if($scope.formData.selected.length === 1) {
				
				//setting columns in callback. Called in Factory code 
				DatasetsService.getDataset($scope.formData.selected[0], function(data) {
					$scope.formData.dataset = data.datasetNode;
					$scope.formData.columns= DatasetsService.getColumnsWithProperty(
							data.datasetNode.id, "represents");
					$scope.form = UrlService.buildUrl("views/column-select.html");
				})
			}
			else if($scope.formData.selected.length === 2) {
				DatasetsService.getDatasetMatches($scope.formData.selected, $scope.formData.interm);
				$scope.form = UrlService.buildUrl("views/cross-links.html");
			}
		}
		
		$scope.getDatasetMatches = function(event) {
			$scope.formData.formStack.push($scope.form);
			DatasetsService.getColumnMatches($scope.formData.dataset.id,
					"represents", $scope.formData.selectedPropValue, 
					function() {
				$scope.form = UrlService.buildUrl("views/cross-links.html");
			});
		}
		
		$scope.getNodeDetailsTemplate = function() {
			if ($scope.currentNode == null) {
				return '';
			}
			else {
				return UrlService.buildUrl("views/node-details.html");
			}
		}
		
		$scope.createDeleteEdge = function(edge) {
			DatasetsService.toggleEdgeType(edge);
		}
		
		$scope.$on('graph.click', function(event, nodes) {
			event.stopPropagation();
			if (nodes.length == 1) {
				$scope.currentNode = DatasetsService.getNode(parseInt(nodes[0]));
			}
			else {
				$scope.currentNode = null;
			}
			$scope.$apply();
		});
		
		$scope.$on('graph.update', function(event) {
			$scope.crossDatasetEdges = DatasetsService.getCrossDatasetEdgeNodes();
			//$scope.$apply();
		});
		
	}
	dataFusionController.$inject = ['$scope', 'DatasetsService', 'UrlService'];
	
	return dataFusionController;
});