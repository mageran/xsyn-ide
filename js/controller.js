var xsynApp = angular.module('xsynApp',['ui.router']);

// set up states to change between different views

xsynApp
    .run(['$rootScope','$state','$stateParams',function($rootScope,$state,$stateParams) {
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;
    }])
    .config(['$locationProvider', '$stateProvider', '$urlRouterProvider', '$httpProvider',
	     function($locationProvider,$stateProvider,$urlRouterProvider,$httpProvider) {
		 $urlRouterProvider.otherwise('/configure');
		 $stateProvider
		 /*.state('main', {
		   url : '/main',
		   templateUrl : 'main.tmpl.html'
		   })*/
		 
		     .state('configure', {
			 name : 'configure',
			 url : '/configure',
			 templateUrl : 'configure.tmpl.html'
		     })
		 
		     .state('code',{
			 name : 'code',
			 url : '/code',
			 templateUrl : 'code.tmpl.html'
		     });
		 $urlRouterProvider.deferIntercept();
		 $stateProviderRef = $stateProvider;
		 $urlRouterProviderRef = $urlRouterProvider;

		 console.log($urlRouterProvider);
		 
	     }])
    .run(['$q','$rootScope','$http','$urlRouter',function($q, $rootScope, $http, $urlRouter) {
	var $state = $rootScope.$state;
	console.log($state);
	$state.transitionTo('configure');
	$rootScope.validIdentifierRegExp = "[A-Za-z_][A-Za-z0-9_]*";
	$rootScope.isValidIdentifier = function(id) {
	    var re = new RegExp("^" + $rootScope.validIdentifierRegExp + "$")
	    return !!id ? id.match(re) : false;
	};
	var pleaseWaitDiv = $('<div class="modal fade" style=top:40% id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">Processing...</h4></div><div class="modal-body"><div class="progress"><div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div></div></div></div></div>');
        $rootScope.showPleaseWait = function () {
            pleaseWaitDiv.modal();
        };
        $rootScope.hidePleaseWait = function () {
            pleaseWaitDiv.modal('hide');
        };
    }])
;

xsynApp.controller('MainController',['$http','$rootScope','$scope',function($http,$rootScope,$scope) {
    console.log('running Main Controller config...');
    var self = this;
    $scope.addGrammar = function() {
	$('#no-grammar-popover').popover('hide');
	bootbox.prompt("Enter grammar name:",function(name) {
	    if (!name) {
		return;
	    }
	    if (!$rootScope.isValidIdentifier(name)) {
		bootbox.alert('"' + name + '" is not a valid grammar name; please use identifier syntax.');
		return;
	    }
	    $http.get('/api/grammar/exists/' + name).then(function(response) {
		var doCreate = function() {
		    var url = "/api/grammar/" + name
		    $http.put(url).then(function(response) {
			$scope.refreshGrammars();
		    },function(errResponse) {
			bootbox.alert("error: " + errResponse.data.error);
		    });
		};
		var exists = response.data.result;
		if (exists) {
		    var omsg = "Grammar \"" + name + "\" already exists. Do you want to overwrite it?";
		    bootbox.confirm(omsg,function(answer) {
			if (answer) {
			    doRename();
			}
		    });
		} else {
		    doCreate()
		}
	    },function(errResponse) {
		console.error(errResponse.data.error);
	    });
	});
    };
    $scope.getActiveClassForName = function(gname) {
	//return '';
	var dbg = 'getActiveClassForName("' + gname + '") = ';
	if (gname === self.grammarNames[0]) {
	    console.log(dbg + '"active"');
	    return 'active';
	} else {
	    console.log(dbg + '""');
	    return '';
	}
    };
    $rootScope.showErrorMessage = function(errmsg) {
	try {
	    clearTimeout(self._hideErrorDivTimer);
	} catch (e) {
	    console.log(e);
	}
	var div = document.getElementById('error-div');
	div.style.bottom = "0px";
	self.errorMessage = errmsg;
	self._hideErrorDivTimer = setTimeout(function() {
	    div.style.bottom = "-100px";
	}, 5000);
    };
    $scope.$on('$viewContentLoaded',
	       function(event, viewConfig){
		   try {
		       if (self.grammarNameObjects.length === 0) {
			   try {
			       clearTimeout(self._showpopoverTimer);
			   } catch (ee) {}
			   $('#no-grammar-popover').popover('show');
			   self._showpopoverTimer = setTimeout(function() {
			       $('#no-grammar-popover').popover('hide');
			   },5000);
		       } else {
			   $('#no-grammar-popover').popover('hide');
		       }
		   } catch(e) {
		   }
	       });
    $scope.makeGrammarActive = function(gname) {
    };
    var url = "/api/grammar";
    $scope.refreshGrammars = function() {
	$http.get(url).then(function(response) {
	    var grammarNameObjects = response.data.result.map(function(gname) {
		return { name : gname, active : false };
	    });
	    if (grammarNameObjects.length > 0) {
		grammarNameObjects[0].active = true;
	    }
	    self.grammarNames = grammarNameObjects.map(function(gnobj) { return gnobj.name; });
	    self.grammarNameObjects = grammarNameObjects;
	    if (self.grammarNameObjects.length === 0) {
		console.log('showing popover...');
		$('#no-grammar-popover').popover('show');
	    } else {
		$('#no-grammar-popover').popover('hide');
	    }
	},function(errResponse) {
	    $rootScope.showErrorMessage(errResponse.data.error);
	});
    }
    $scope.refreshGrammars();
}]);

/*
xsynApp.controller('DSLController',['$http','$rootScope','$scope',function($http,$rootScope,$scope) {
    var self = this;
    var grammarId = 'nl_queries';
    if (typeof(self.cnt) !== 'number') self.cnt = 0;
    $rootScope.refreshGrammar = $scope.$apply;
}]);
*/

xsynApp.directive('grammar',['$http','$rootScope',function($http,$rootScope) {
    return {
	restrict : 'AE',
	replace : false,
	templateUrl : 'grammar.tmpl.html',
	scope : {
	    grammarId : '='
	},
	link : function($scope, $element, $attrs) {
	    //console.log('grammar directive: grammarId=' + $scope.grammarId);
	    //console.log($scope.grammarForm);
	    $scope.grammarProcessingError = null;
	    var url = "/api/grammar/" + $scope.grammarId;
	    $http.get(url).then(function(response) {
		$scope.grammarObject = response.data;
		console.log($scope.grammarObject);
	    }, function(errResponse) {
		$scope.grammarObject = { name : $scope.grammarId, nonterminals : [] };
		$scope.grammarProcessingError = errResponse.data.error;
	    });
	    $scope.__defineGetter__('nonterminalNames',function() {
		var gobj = $scope.grammarObject;
		try {
		    return gobj.nonterminals.map(function(nt) { return nt.name; });
		} catch (e) {
		    return [];
		}
	    });
	    $scope.showActionCode = false;
	    $scope.isEditMode = false;
	    $scope.validIdentifierRegExp = $rootScope.validIdentifierRegExp;
	    $scope.submit = function(event) {
		$scope.grammarProcessingError = null;
		$rootScope.showPleaseWait();
		var b = event.target;
		console.log($scope.grammarObject);
		$http.post(url,$scope.grammarObject).then(function(response) {
		    $rootScope.hidePleaseWait();
		    var data = response.data;
		    console.log(data.message);
		    bootbox.alert("Changes deployed successfully.");
		    console.log('refreshing DSLs...');
		    $scope.$parent.refreshGrammars();
		    $scope.isEditMode = false;
		}, function(errResponse) {
		    $rootScope.hidePleaseWait();
		    $scope.grammarProcessingError = errResponse.data.error;
		    //$rootScope.showErrorMessage(errResponse.data.error);
		})
	    };
	    $scope.remove = function() {
		var gname =  $scope.grammarObject.name;
		var msg = "Do you really want to remove grammar \"" + gname + "\"?";
		bootbox.confirm(msg,function(yes) {
		    if (!yes) return
		    $http.get("/api/grammar/remove/" + gname).then(function(response) {
			$scope.$parent.refreshGrammars();
		    },function(errResponse) {
			bootbox.alert(errResponse.data.error);
		    });
		});
	    };
	    $scope.duplicate = function() {
		$scope.rename(true);
	    };
	    $scope.rename = function(isDuplicate) {
		bootbox.prompt({
		    title : isDuplicate ? "Enter name of duplicate:" : "Enter new name:",
		    value : $scope.grammarObject.name + "_copy",
		    callback : function(newName) {
			if (newName === null) return;
			if (newName === $scope.grammarObject.name) {
			    console.log('same name, nothing to rename.');
			    return true;
			}
			if ($rootScope.isValidIdentifier(newName)) {
			    $http.get('/api/grammar/exists/' + newName).then(function(response) {
				var doRename = function() {
				    var url = "/api/grammar/"
				    url += isDuplicate ? "duplicate" : "rename";
				    url += "/" + $scope.grammarObject.name + "/" + newName;
				    console.log(url);
				    $http.get(url).then(function(response) {
					$scope.$parent.refreshGrammars();
				    },function(errResponse) {
					bootbox.alert(errResponse.data.error);
				    });
				};
				var exists = response.data.result;
				if (exists) {
				    var omsg = "Grammar \"" + newName + "\" already exists. Do you want to overwrite it?";
				    bootbox.confirm(omsg,function(answer) {
					if (answer) {
					    doRename();
					}
				    });
				} else {
				    doRename()
				}
			    },function(errResponse) {
				console.error(errResponse.data.error);
			    });
			} else {
			    bootbox.alert('"' + newName + '" is not a valid identifier.');
			    return true;
			}
		    }
		});
	    }
	}
    }
}]);

//rowspan="{{nt.rules.length}}"

xsynApp.directive('nonterminal',['$rootScope',function($rootScope) {
    return {
	restrict : 'AE',
	templateUrl : 'nonterminal.tmpl.html',
	link : function($scope, $element, $attrs) {
	    var grammarObject = $scope.$parent.grammarObject;
	    var nonterminals = grammarObject.nonterminals;
	    var index = nonterminals.indexOf($scope.nt);
	    //$scope.__defineGetter__('showActionCode', function() { return $scope.$parent.showActionCode; });
	    $scope.deleteNonterminal = function() {
		console.log('deleting nonterminal at position ' + index);
		bootbox.confirm("Do you really want to delete this nonterminal with all its rules?", function(result) {
		    if (!result) return;
		    nonterminals.splice(index,1);
		    $rootScope.refreshGrammar();
		});
	    };
	    $scope.addNonterminal = function() {
		console.log('adding nonterminal...');
		var nt = {
		    name : '',
		    rules : [ { definition : '', action : '' } ]
		};
		nonterminals.splice(index,0,nt);
	    };
	    //console.log($scope);
	}
    };
}]);

xsynApp.directive('productionrule',['$rootScope',function($rootScope) {
    return {
	restrict : 'AE',
	templateUrl : 'productionrule.tmpl.html',
	link : function($scope, $element, $attr) {
	    //$scope.__defineGetter__('showActionCode', function() { return $scope.$parent.showActionCode; });
	    var prule = $scope.prule;
	    var nt = $scope.$parent.nt;
	    var prules = nt.rules;
	    var index = prules.indexOf(prule);
	    $scope.sepsym = index === 0 ? ':' : '|'
	    $scope.deleteRule = function() {
		var doDelete = function(result) {
		    if (!result) return;
		    if (index >= 0) {
			prules.splice(index,1);
			$rootScope.refreshGrammar();
		    }
		};
		bootbox.confirm("Do you really want to delete this rule? " +prules[index].definition,doDelete);
	    };
	    $scope.addRule = function() {
		if (index < 0) return;
		var newRule = {
		    definition : '',
		    action : ''
		};
		nt.rules.splice(index,0,newRule);
		//$rootScope.refreshGrammar();
	    };
	}
    };
}]);

createCodeController(xsynApp);
