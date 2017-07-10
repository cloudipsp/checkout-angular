angular.module(
  'app', [
    'ngAnimate',
    'ui.bootstrap',
    'mx.checkout'
  ]
);

angular.module('app').config(function(mxCheckoutProvider) {
    mxCheckoutProvider.options({
      panelClass: 'panel-default',
      alertDangerClass: 'alert-danger'
      // formControlClass: ''
    })
  }
);

angular.module('app').controller('Demo', function($scope) {
  $scope.formSubmit = function(formMap){
    console.log(formMap)
  };
});