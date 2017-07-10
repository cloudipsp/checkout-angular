angular
  .module('mx.checkout')
  .directive('mxCheckout', function() {
    return {
      restrict: 'A',
      templateUrl: 'mx/template/checkout/checkout.html',
      scope: {
        onSubmit: '&'
      },
      controller: function($scope, mxCheckout, $element, $attrs) {
        mxCheckout.init();

        $scope.data = mxCheckout.data;

        $scope.formSubmit = function(clickButton) {
          return mxCheckout.formSubmit($scope.onSubmit, $element, clickButton);
        };

        $scope.selectPaymentSystems = mxCheckout.selectPaymentSystems;
        $scope.stop = mxCheckout.stop;
        $scope.blur = mxCheckout.blur;
        $scope.focus = mxCheckout.focus;
      }
    };
  })
  .directive('mxFieldInput', function() {
    return {
      restrict: 'A',
      replace: true,
      templateUrl: 'mx/template/checkout/field-input.html',
      scope: {
        model: '=mxFieldInput',
        config: '=',
        formCtrl: '=',
        valid: '=',
        blur: '&',
        focus: '&'
      }
    };
  })
  .directive('autoFocus', function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs, ngModel) {
        scope.$watch(
          attrs.autoFocus,
          function(val) {
            if (angular.isDefined(val) && val) {
              $timeout(function() {
                element[0].focus();
              });
            }
          },
          true
        );
      }
    };
  })
  .directive('mxFieldValid', function(mxValidation, mxCheckoutConfig) {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        valid: '=mxFieldValid',
        config: '=',
        model: '='
      },
      link: function(scope, element, attrs, ngModel) {
        if (scope.config.valid) {
          angular.forEach(scope.config.valid.split(','), function(valid) {
            mxValidation.validate(ngModel.$modelValue, valid, setError);
            scope.$watch(
              function() {
                return ngModel.$modelValue;
              },
              function(value) {
                // console.log('$watch', value)
                mxValidation.validate({ value: value }, valid, setError);
              },
              true
            );

            // ngModel.$formatters.push(function(value) {
            //   mxValidation.validate(value, valid, setError);
            //   return value;
            // });
            //view -> model
            ngModel.$parsers.push(function(value) {
              // console.log('$parsers', value)
              mxValidation.validate({ value: value }, valid, setError);
              return value;
            });
          });
        }

        if (scope.config.expdate) {
          attrs.$observe('expdate', function(value) {
            // console.log({value: value, expdate: ngModel.$modelValue})
            mxValidation.validate(
              { value: value, expdate: scope.model[scope.config.expdate] },
              'exp_date',
              setError
            );
          });
        }

        function setError(result, valid) {
          if (result) {
            scope.valid.iconShow[scope.config.expdate] = false;
          } else {
            scope.valid.errorText[ngModel.$name] =
              mxCheckoutConfig.error[valid];
          }
          ngModel.$setValidity(valid, result);
        }
      }
    };
  });
