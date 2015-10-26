function createCodeController(app,grammarName) {
    console.log('adding code-editor directive...');
    app.directive('codeeditor',['$http','$rootScope',function($http,$rootScope) {
	console.log('in code-editor directive...');
	var firstTime = true;
	var savedScope = {
	    grammarName : grammarName,
	    selectedLanguage : grammarName
	};
	return {
	    restrict : 'AE',
	    replace : false,
	    templateUrl : 'codeeditor.tmpl.html',
	    scope : {
		selectedLanguage : '='
	    },
	    link : function($scope, $element, $attrs) {
		if (firstTime) {
		    firstTime = false;
		} else {
		}
		$scope.grammarName = savedScope.grammarName;
		$scope.selectedLanguage = savedScope.selectedLanguage
		$scope._code = savedScope._code;
		$scope.__defineGetter__('code',function() {
		    if (typeof($scope._code) === 'undefined') {
			$scope._code = "";
		    }
		    return $scope._code;
		});
		$scope.__defineSetter__('code',function(value) {
		    $scope._code = value;
		    $scope.parseErrorMessage = '';
		    try {
			clearTimeout($scope._parseCodeTimer);
		    } catch (ignored) {}
		    $scope._parseCodeTimer = setTimeout(function() {
			$scope.parseCode();
		    }, 2000);
		    return value;
		});
		$scope.doSelectLanguage = function(name) {
		    $scope.selectedLanguage = name;
		};
		var url = "/api/grammar";
		$scope.refreshGrammars = function() {
		    console.log('refreshGrammars...');
		    $http.get(url).then(function(response) {
			var grammarNameObjects = response.data.result.map(function(gname) {
			    return { name : gname, active : false };
			});
			if (grammarNameObjects.length > 0) {
			    grammarNameObjects[0].active = true;
			}
			$scope.grammarNames = grammarNameObjects.map(function(gnobj) { return gnobj.name; });
			$scope.grammarNameObjects = grammarNameObjects;
		    },function(errResponse) {
			$rootScope.showErrorMessage(errResponse.data.error);
		    });
		}
		$scope.parseErrorMessage = '';
		$scope.parseCode = function() {
		    console.log("parseCode...");
		    if (!$scope.selectedLanguage) return;
		    var url = '/api/parse/' + $scope.selectedLanguage;
		    console.log(url)
		    var req = {
			url : url,
			method : 'POST',
			headers : {
			    'Content-Type' : 'application/json'
			},
			data : { code : $scope.code }
		    };
		    $scope.parseErrorMessage = '';
		    $scope.glyphiconParseResult = ['glyphicon-option-horizontal','black'];
		    $http(req).then(function(response) {
			var output = response.data.output;
			console.log('parse success; output:');
			console.log(output);
			$scope.glyphiconParseResult = ['glyphicon-ok','green'];
		    },function(errResponse) {
			//console.error("ERROR: " + errResponse.data.error);
			$scope.parseErrorMessage = errResponse.data.error;
			$scope.glyphiconParseResult = ['glyphicon-remove','red'];
		    });
		};
		$scope.refreshGrammars();
		if ($scope.selectedLanguage) {
		    $scope.parseCode();
		}
		savedScope = $scope;
		console.log('savedScope:');
		console.log(savedScope);
	    }
	}
    }]);
}




function createCodeController_(app,grammarName) {
    app.controller('CodeController',['$http','$rootScope','$scope',function($http,$rootScope,$scope) {
	console.log('running code controller config script...');
	var $scope = this;
	$scope.grammarName = grammarName;
	$scope.selectedLanguage = grammarName;
	$scope.__defineGetter__('code',function() {
	    if (typeof($scope._code) === 'undefined') {
		$scope._code = "";
	    }
	    return $scope._code;
	});
	$scope.__defineSetter__('code',function(value) {
	    $scope._code = value;
	    $scope.parseErrorMessage = '';
	    try {
		clearTimeout($scope._parseCodeTimer);
	    } catch (ignored) {}
	    $scope._parseCodeTimer = setTimeout(function() {
		$scope.parseCode();
	    }, 2000);
	    return value;
	});
	var url = "/api/grammar";
	$scope.refreshGrammars = function() {
	    $http.get(url).then(function(response) {
		var grammarNameObjects = response.data.result.map(function(gname) {
		    return { name : gname, active : false };
		});
		if (grammarNameObjects.length > 0) {
		    grammarNameObjects[0].active = true;
		}
		$scope.grammarNames = grammarNameObjects.map(function(gnobj) { return gnobj.name; });
		$scope.grammarNameObjects = grammarNameObjects;
	    },function(errResponse) {
		$rootScope.showErrorMessage(errResponse.data.error);
	    });
	}
	$scope.parseErrorMessage = '';
	$scope.parseCode = function() {
	    console.log("parseCode...");
	    if (!$scope.selectedLanguage) return;
	    var url = '/api/parse/' + $scope.selectedLanguage;
	    console.log(url)
	    var req = {
		url : url,
		method : 'POST',
		headers : {
		    'Content-Type' : 'application/json'
		},
		data : { code : $scope.code }
	    };
	    $scope.parseErrorMessage = '';
	    $scope.glyphiconParseResult = ['glyphicon-option-horizontal','black'];
	    $http(req).then(function(response) {
		var output = response.data.output;
		console.log('parse success; output:');
		console.log(output);
		$scope.glyphiconParseResult = ['glyphicon-ok','green'];
	    },function(errResponse) {
		//console.error("ERROR: " + errResponse.data.error);
		$scope.parseErrorMessage = errResponse.data.error;
		$scope.glyphiconParseResult = ['glyphicon-remove','red'];
	    });
	};
	$scope.refreshGrammars();
	if ($scope.selectedLanguage) {
	    $scope.parseCode();
	}
    }]);
}

