define([
		'app',
		'directives',
		'services',
		'controllers/data-fusion-controller'],
function(appModule,
		directives,
		services,
		dataFusionController) {
	
	appModule.controller('DataFusionController', dataFusionController);		

});