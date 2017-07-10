angular.module(
  'app', [
    'ui.bootstrap',
    'mx.checkout'
  ]
);

angular.module('app').config(function(mxCheckoutProvider) {
    mxCheckoutProvider.options({

    })
  }
);

angular.module('app').controller('Demo', function($scope) {
  $scope.formSubmit = function(formMap){
    console.log(formMap)
  };
});