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
  $scope.checkoutOptions = {
    panelClass: 'panel-default',
    alertDangerClass: 'alert-danger',
    formControlClass: 'form-control',
    btnClass: 'btn-success',
    tooltipClass: ''
  };

  $scope.formSubmit = function(formMap){
    console.log(formMap)
  };
});