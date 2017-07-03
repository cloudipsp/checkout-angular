
(function(){
"use strict";
angular.module('mx.checkout', [
  'mx/template/checkout/form.html',
  'mx/template/checkout/field-input.html',
  'mx/template/checkout/modal.html'
]);

;
angular.module('mx.checkout').constant('mxCheckoutConfig', {
  fields: {
    card: {
      id: 'card',
      placeholder: 'Card number',
      // text: 'Card number',
      // label: true,
      pattern: '[0-9]{14,19}',
      icon: 'glyphicon-credit-card',
      valid: 'ccard,required'
    },
    expireMonth: {
      id: 'expireMonth',
      placeholder: 'MM',
      size: '2',
      pattern: '[0-9]{2}',
      valid: 'exp_date,required',
      expdate: 'expireYear'
    },
    expireYear: {
      id: 'expireYear',
      placeholder: 'YY',
      size: '2',
      pattern: '[0-9]{2}',
      valid: 'exp_date,required',
      expdate: 'expireMonth'
    },
    cvv: {
      id: 'cvv',
      placeholder: 'CVV',
      size: '3',
      pattern: '[0-9]{3}',
      valid: 'cvv2,required'
    }
  },
  formMap: ['card', 'expireMonth', 'expireYear', 'cvv']
});

;
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

;
angular.module('mx.checkout').filter('trusted', function($sce) {
  return function(url) {
    return $sce.trustAsResourceUrl(url);
  };
});

;
angular
  .module('mx.checkout')
  .provider('mxCheckout', function() {
    var defaultOptions = {};
    var globalOptions = {};

    return {
      options: function(value) {
        angular.extend(globalOptions, defaultOptions, value);
      },
      $get: function(mxCheckoutConfig, mxModal) {
        var data = {
          config: mxCheckoutConfig,
          formMap: {},

          valid: {
            errorText: {},
            iconShow: {},
            autoFocus: {}
          }
        };

        return {
          data: data,
          formSubmit: formSubmit,
          blur: blur,
          focus: focus
        };

        function formSubmit(formCtrl, onSubmit, $element) {
          if (formCtrl.$valid) {
            onSubmit({
              formMap: data.formMap
            });
            mxModal
              .open(
                {
                  title: 'Title',
                  text: 'Text',
                  type: 'success'
                },
                $element
              )
              .result.then(function() {}, function() {});
          } else {
            var autoFocusFlag = true;
            angular.forEach(data.config.formMap, function(field) {
              if (formCtrl[field].$invalid) {
                if (autoFocusFlag) {
                  autoFocusFlag = false;
                  data.valid.autoFocus[field] = +new Date();
                }

                data.valid.iconShow[field] = true;
              }
            });
          }
        }

        function blur(inputCtrl) {
          if (inputCtrl.$invalid) {
            data.valid.iconShow[inputCtrl.$name] = true;
          }
        }

        function focus(inputCtrl) {
          if (inputCtrl.$invalid) {
            data.valid.iconShow[inputCtrl.$name] = false;
          }
        }
      }
    };
  })
  .factory('mxValidation', function(mxCheckout) {
    var REGEX_NUM = /^[0-9]+$/,
      REGEX_EMAIL = /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/,
      REGEX_NUM_DASHED = /^[\d\-\s]+$/,
      REGEX_URL = /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,
      REGEX_DEC = /^\-?[0-9]*\.?[0-9]+$/,
      REGEX_RULE = /^(.+?):(.+)$/,
      REGEXP_LUHN_DASHED = /^[\d\-\s]+$/;

    var _validation = {
      required: function(field) {
        var value = field.value;
        return !!value;
      },
      ccard: function(field) {
        if (!REGEXP_LUHN_DASHED.test(field.value)) return false;
        var nCheck = 0,
          nDigit = 0,
          bEven = false;
        var strippedField = field.value.replace(/\D/g, '');
        for (var n = strippedField.length - 1; n >= 0; n--) {
          var cDigit = strippedField.charAt(n);
          nDigit = parseInt(cDigit, 10);
          if (bEven) {
            if ((nDigit *= 2) > 9) nDigit -= 9;
          }
          nCheck += nDigit;
          bEven = !bEven;
        }
        return nCheck % 10 === 0;
      },
      num: function(field) {
        return REGEX_NUM.test(field.value);
      },
      min_length: function(field, length) {
        if (!REGEX_NUM.test(length)) return false;
        return field.value.length >= parseInt(length, 10);
      },
      cvv2: function(field) {
        return (
          _validation.num.call(this, field) &&
          _validation.min_length.call(this, field, 3)
        );
      },
      expiry: function(month, year) {
        var currentTime, expiry;
        if (!(month && year)) {
          return false;
        }
        if (!/^\d+$/.test(month)) {
          return false;
        }
        if (!/^\d+$/.test(year)) {
          return false;
        }
        if (!(1 <= month && month <= 12)) {
          return false;
        }
        if (year.length === 2) {
          if (year < 70) {
            year = '20' + year;
          } else {
            year = '19' + year;
          }
        }
        if (year.length !== 4) {
          return false;
        }
        expiry = new Date(year, month);
        currentTime = new Date();
        expiry.setMonth(expiry.getMonth() - 1);
        expiry.setMonth(expiry.getMonth() + 1, 1);
        return expiry > currentTime;
      },
      exp_date: function(field) {
        return _validation.expiry.call(
          this,
          mxCheckout.data.formMap.expireMonth,
          mxCheckout.data.formMap.expireYear
        );
      }
    };

    return {
      validate: function(value, valid, cb) {
        var result = _validation[valid]({ value: value });
        cb(result, valid);
        return result;
      }
    };
  })
  .factory('mxModal', function($uibModal) {
    return {
      open: function(option, $element) {
        return $uibModal.open({
          templateUrl: 'mx/template/checkout/modal.html',
          controller: function($scope, $uibModalInstance) {
            $scope.option = option;

            $scope.url = '';
          },
          appendTo: $element
        });
      }
    };
  });

;
angular.module("mx/template/checkout/field-input.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/field-input.html",
    "<!--form-group-lg-->\n" +
    "<!--formCtrl[config.id].$invalid && formCtrl[config.id].$touched-->\n" +
    "<div class=\"form-group has-feedback\"\n" +
    "     ng-class=\"{\n" +
    "                'has-error': valid.iconShow[config.id],\n" +
    "                'has-success': formCtrl[config.id].$valid\n" +
    "            }\"\n" +
    ">\n" +
    "    <label\n" +
    "            class=\"control-label\"\n" +
    "            for=\"{{::config.id}}\"\n" +
    "            ng-if=\"::config.label\"\n" +
    "    >{{::config.text}}</label>\n" +
    "    <!--input-group-lg-->\n" +
    "    <div class=\"input-group-lg\" ng-class=\"::{'input-group': config.icon}\">\n" +
    "        <span ng-if=\"::config.icon\" class=\"input-group-addon\"><i class=\"glyphicon {{::config.icon}}\"></i></span>\n" +
    "        <input\n" +
    "                id=\"{{::config.id}}\"\n" +
    "                name=\"{{::config.id}}\"\n" +
    "                ng-model=\"model[config.id]\"\n" +
    "                type=\"tel\"\n" +
    "                class=\"form-control\"\n" +
    "                placeholder=\"{{::config.placeholder}}\"\n" +
    "                ng-pattern=\"::config.pattern\"\n" +
    "\n" +
    "                size=\"{{::config.size}}\"\n" +
    "                maxlength=\"{{::config.size}}\"\n" +
    "                autocomplete=\"off\"\n" +
    "                auto-focus=\"valid.autoFocus[config.id]\"\n" +
    "\n" +
    "                mx-field-valid=\"config\"\n" +
    "                expdate=\"{{model[config.expdate]}}\"\n" +
    "\n" +
    "                ng-blur=\"blur(formCtrl[config.id])\"\n" +
    "                ng-focus=\"focus(formCtrl[config.id])\"\n" +
    "\n" +
    "                uib-tooltip=\"{{valid.errorText[config.id]}}\"\n" +
    "                tooltip-placement=\"bottom\"\n" +
    "                tooltip-trigger=\"'focus'\"\n" +
    "                tooltip-enable=\"{{formCtrl[config.id].$invalid}}\"\n" +
    "        >\n" +
    "    </div>\n" +
    "    <!--&& formCtrl[config.id].$touched-->\n" +
    "    <span class=\"glyphicon glyphicon-exclamation-sign form-control-feedback\"\n" +
    "          ng-if=\"valid.iconShow[config.id]\"\n" +
    "    ></span>\n" +
    "    <span class=\"glyphicon glyphicon-ok form-control-feedback\" ng-if=\"formCtrl[config.id].$valid\"></span>\n" +
    "</div>");
}]);

;
angular.module("mx/template/checkout/form.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/form.html",
    "<form class=\"asd\" name=\"cF\" ng-submit=\"formSubmit(cF)\" novalidate>\n" +
    "    <div class=\"card card-front\">\n" +
    "        <div mx-field-input=\"data.formMap\" config=\"data.config.fields.card\" form-ctrl=\"cF\"></div>\n" +
    "        <div class=\"form-group has-feedback\"\n" +
    "             ng-class=\"{\n" +
    "                'has-error': data.valid.iconShow.expireMonth && data.valid.iconShow.expireYear,\n" +
    "                'has-success': cF.expireMonth.$valid && cF.expireYear.$valid\n" +
    "            }\"\n" +
    "        >\n" +
    "            <label class=\"control-label\" for=\"expireMonth\">Valid thru</label>\n" +
    "            <div class=\"form-inline\">\n" +
    "                <div mx-field-input=\"data.formMap\" config=\"data.config.fields.expireMonth\" form-ctrl=\"cF\"></div>\n" +
    "                <label class=\"expire-delimiter control-label\">/</label>\n" +
    "                <div mx-field-input=\"data.formMap\" config=\"data.config.fields.expireYear\" form-ctrl=\"cF\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"card card-back\">\n" +
    "        <div class=\"stripe\"></div>\n" +
    "        <div class=\"form-group has-feedback\"\n" +
    "             ng-class=\"{\n" +
    "                'has-error': data.valid.iconShow.cvv,\n" +
    "                'has-success': cF.cvv.$valid\n" +
    "            }\"\n" +
    "        >\n" +
    "            <!--<label class=\"control-label\" for=\"cvv\">CVV2/CVC2 code</label>-->\n" +
    "            <div class=\"form-inline\">\n" +
    "                <div mx-field-input=\"data.formMap\" config=\"data.config.fields.cvv\" form-ctrl=\"cF\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <button type=\"submit\" class=\"btn btn-primary btn-lg\">Checkout</button>\n" +
    "</form>");
}]);

;
angular.module("mx/template/checkout/modal.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/modal.html",
    "<div class=\"modal-header text-{{::option.type}}\">\n" +
    "    <h3 class=\"modal-title\">{{::option.title}}</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "    {{::option.text}}\n" +
    "    <iframe src=\"{{url | trusted}}\" frameborder=\"0\"></iframe>\n" +
    "</div>");
}]);

})();
//# sourceMappingURL=main.js.map