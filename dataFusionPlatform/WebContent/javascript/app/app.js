define([
        '../checklist-model',
        '../angular-ui-switch.min'
    ], 
    function() {
		
		var dataFusionModule = angular.module('DataFusionModule',['checklist-model','uiSwitch']);
		//define routes here later
		
		return dataFusionModule;
	}
);