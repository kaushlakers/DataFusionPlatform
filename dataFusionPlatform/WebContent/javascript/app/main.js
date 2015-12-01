require.config({
	baseUrl: "javascript/app",
	paths: {
		app: 'app',
		checklistModel: '../checklist-model',
		angularSwitch: '../angular-ui-switch.min',
		controllers: 'controllers',
		services: 'services',
		directives: 'directives',
	},
	
	shim: {
		controllers: {
			deps: ['app']
		},
		services: {
			exports: ['services']
		},
	}
	
});

require(['controllers'], function(controllers) {
	angular.element(document).ready(function() {
		angular.bootstrap(document, ['DataFusionModule']);
		});
	}
);