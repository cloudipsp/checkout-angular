angular
  .module('mx.checkout')
  .directive('mxCheckout', function() {
    return {
      restrict: 'A',
      templateUrl: 'mx/template/checkout/form.html',
      scope: {
        onSubmit: '&'
      },
      controller: function($scope, mxCheckout, $element, $attrs) {
        $scope.data = mxCheckout.data;

        $scope.formSubmit = function(cF) {
          return mxCheckout.formSubmit(cF, $scope.onSubmit, $element);
        };
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
        formCtrl: '='
      },
      controller: function($scope, mxCheckout) {
        $scope.blur = mxCheckout.blur;
        $scope.focus = mxCheckout.focus;
        $scope.valid = mxCheckout.data.valid;
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
  .directive('mxFieldValid', function(mxValidation, mxCheckout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      // scope: {
      //   config: '=mxFieldValid'
      // },
      link: function(scope, element, attrs, ngModel) {
        if (scope.config.valid) {
          angular.forEach(scope.config.valid.split(','), function(valid) {
            // mxValidation.validate(ngModel.$modelValue, valid, setError);
            scope.$watch(
              function() {
                return ngModel.$modelValue;
              },
              function(value) {
                mxValidation.validate(value, valid, setError);
              },
              true
            );

            // ngModel.$formatters.push(function(value) {
            //   mxValidation.validate(value, valid, setError);
            //   return value;
            // });
            //view -> model
            ngModel.$parsers.push(function(value) {
              mxValidation.validate(value, valid, setError);
              return value;
            });
          });
        }

        if (scope.config.expdate) {
          attrs.$observe('expdate', function(value) {
            mxValidation.validate(value, 'exp_date', setError);
          });
        }

        function setError(result, valid) {
          if (result) {
            mxCheckout.data.valid.iconShow[scope.config.expdate] = false;
          } else {
            mxCheckout.data.valid.errorText[ngModel.$name] = 'error ' + valid;
          }
          ngModel.$setValidity(valid, result);
        }
      }
    };
  });
