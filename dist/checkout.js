
(function(){
"use strict";
angular.module('mx.checkout', [
  'mx/template/checkout/checkout.html',
  'mx/template/checkout/card.html',
  'mx/template/checkout/ibank.html',
  'mx/template/checkout/emoney.html',
  'mx/template/checkout/field-input.html',
  'mx/template/checkout/modal.html'
]);

;
angular.module('mx.checkout').constant('mxCheckoutConfig', {
  fields: {
    card: {
      id: 'card',
      // placeholder: 'Card number',
      text: 'Card number',
      label: true,
      size: '19',
      pattern: '[0-9]{14,19}',
      valid: 'ccard,required'
    },
    expireMonth: {
      id: 'expireMonth',
      placeholder: 'MM',
      text: 'Expiration',
      label: true,
      size: '2',
      pattern: '[0-9]{2}',
      valid: 'exp_date,required',
      bind: 'expireYear',
      format: 'month'
    },
    expireYear: {
      id: 'expireYear',
      placeholder: 'YY',
      label: true,
      size: '2',
      pattern: '[0-9]{2}',
      valid: 'exp_date,required',
      bind: 'expireMonth',
      format: 'year'
    },
    cvv: {
      id: 'cvv',
      // placeholder: 'CVV',
      text: 'Security Code',
      label: true,
      info:
        'CVV/CVC2 – this 3-digits are security code. It is located in the signature field on the back of your payment card (last three digits)',
      size: '3',
      pattern: '[0-9]{3}',
      valid: 'cvv2,required'
    }
  },
  formMap: ['card', 'expireMonth', 'expireYear', 'cvv'],
  error: {
    required: 'Required field',
    ccard: 'Credit card number is invalid',
    exp_date: 'Invalid expiry date',
    cvv2: 'Incorrect CVV2 format'
  },
  defaultData: {
    tabs: {
      card: {
        id: 'card',
        icons: ['visa', 'master', 'american', 'discover']
      },
      emoney: {
        id: 'emoney',
        icons: []
      },
      ibank: {
        id: 'ibank',
        icons: []
      }
    }
  },
  getData: {
    active_tab: 'card',
    tabs_order: ['card', 'ibank', 'emoney'],
    tabs: {
      card: {
        name: 'Credit or Debit Card'
      },
      emoney: {
        name: 'Electronic money',
        payment_systems: {
          webmoney: {
            name: 'Webmoney'
          }
        }
      },
      ibank: {
        name: 'Internet-banking',
        payment_systems: {
          p24: {
            name: 'Приват24'
          },
          plotva24: {
            name: 'PLATBA 24'
          }
        }
      }
    }
  }
});

;
angular
  .module('mx.checkout')
  .directive('mxCheckout', function(mxCheckout) {
    return {
      restrict: 'A',
      templateUrl: 'mx/template/checkout/checkout.html',
      scope: {
        mxCheckoutOptions: '=?',
        onSubmit: '&'
      },
      controller: mxCheckout.controller
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
  .directive('mxAutoFocus', function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs, ngModel) {
        scope.$watch(
          attrs.mxAutoFocus,
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
            // валидируем при инициализации
            // console.log('init ' + ngModel.$name + ' ' + valid)
            validate(
              valid,
              ngModel.$modelValue,
              scope.model[scope.config.bind],
              setError
            );

            // когда поле валидно убираем tooltip
            scope.$watch(
              function() {
                return ngModel.$modelValue;
              },
              function(value) {
                if (ngModel.$valid) {
                  scope.valid.errorText[ngModel.$name] = '';
                }
              },
              true
            );

            //view -> model
            ngModel.$parsers.push(function(value) {
              // console.log('$parsers ' + ngModel.$name + ' ' + valid)
              validate(valid, value, scope.model[scope.config.bind], setError);
              return value;
            });
          });
        }

        if (scope.config.bind) {
          attrs.$observe('bind', function(value) {
            // console.log('$observe ' + scope.config.bind + ' exp_date')
            validate('exp_date', ngModel.$modelValue, value, function(
              result,
              valid
            ) {
              ngModel.$setValidity(valid, result);
            });
          });
        }

        function validate(valid, value, bind, cb) {
          mxValidation.validate(
            {
              value: value,
              config: scope.config,
              bind: bind
            },
            valid,
            cb
          );
        }

        function setError(result, valid) {
          if (result) {
            scope.valid.iconShow[scope.config.bind] = false;
          } else {
            scope.valid.errorText[ngModel.$name] =
              mxCheckoutConfig.error[valid];
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
    var defaultOptions = {
      panelClass: 'panel-checkout',
      alertDangerClass: 'alert-checkout-danger',
      formControlClass: 'form-control form-control-checkout',
      btnClass: 'btn-checkout',
      tooltipClass: 'tooltip-checkout'
    };
    var globalOptions = {};

    return {
      options: function(value) {
        angular.extend(globalOptions, value);
      },
      $get: function($q, mxModal) {
        return {
          controller: [
            '$scope',
            'mxCheckoutConfig',
            '$element',
            'mxCheckout',
            function($scope, mxCheckoutConfig, $element, mxCheckout) {
              $scope.data = {
                options: angular.extend(
                  {},
                  defaultOptions,
                  globalOptions,
                  $scope.mxCheckoutOptions
                ),
                config: angular.merge({}, mxCheckoutConfig),
                formCtrl: {},

                card: {},
                emoney: {},
                ibank: {},

                loading: true,
                alert: {},

                valid: {
                  errorText: {},
                  iconShow: {},
                  autoFocus: {}
                }
              };

              $scope.formSubmit = formSubmit;
              $scope.stop = mxCheckout.stop;
              $scope.blur = blur;
              $scope.focus = focus;
              $scope.selectPaymentSystems = selectPaymentSystems;

              angular.forEach($scope.data.config.fields, function(item) {
                item.formControlClass = $scope.data.options.formControlClass;
                item.tooltipClass = $scope.data.options.tooltipClass;
              });
              getData();

              function getData() {
                $scope.data.loading = true;
                mxCheckout.request($scope.data.config.getData).then(
                  function(response) {
                    angular.merge(
                      $scope.data,
                      $scope.data.config.defaultData,
                      response
                    );
                    $scope.data.tabs[$scope.data.active_tab].open = true;

                    $scope.data.loading = false;
                  },
                  function(error) {
                    $scope.data.loading = false;
                  }
                );
              }

              function formSubmit(clickButton) {
                var form = getActiveTab();
                if ($scope.data.formCtrl[form].$valid) {
                  $scope.onSubmit({
                    formMap: $scope.data[form]
                  });
                  if (form === 'card') {
                    mxCheckout.show3DS($element);
                  }
                } else if (form === 'card') {
                  var autoFocusFlag = true;
                  angular.forEach($scope.data.config.formMap, function(field) {
                    if ($scope.data.formCtrl[form][field].$invalid) {
                      if (autoFocusFlag) {
                        autoFocusFlag = false;
                        $scope.data.valid.autoFocus[field] = +new Date();
                        $scope.data.valid.iconShow[field] = false;
                      } else {
                        $scope.data.valid.iconShow[field] = true;
                      }
                    }
                  });
                  if (clickButton) {
                    addAlert(
                      "Please verify that all card information you've provided is accurate and try again"
                    );
                  }
                }
              }

              function blur(inputCtrl) {
                if (inputCtrl.$invalid) {
                  $scope.data.valid.iconShow[inputCtrl.$name] = true;
                }
              }

              function focus(inputCtrl) {
                if (inputCtrl.$invalid) {
                  $scope.data.valid.iconShow[inputCtrl.$name] = false;
                  // $scope.data.valid.errorText[inputCtrl.$name] = '';
                }
              }

              function selectPaymentSystems(tab, id) {
                tab.selected = id;
                $scope.data[tab.id].type = id;
              }

              function getActiveTab() {
                var result;
                angular.forEach($scope.data.tabs, function(tab) {
                  if (tab.open) {
                    result = tab.id;
                  }
                });
                return result;
              }

              function addAlert(text, type) {
                $scope.data.alert = {
                  text: text,
                  type: type || $scope.data.options.alertDangerClass
                };
              }
            }
          ],
          request: function(response) {
            var deferred = $q.defer();

            setTimeout(function() {
              deferred.resolve(response);
            }, 500);

            return deferred.promise;
          },
          show3DS: function($element) {
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
          },
          stop: function($event) {
            $event.preventDefault();
            $event.stopPropagation();
          }
        };
      }
    };
  })
  .factory('mxValidation', function() {
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
          field.config.format === 'month' ? field.value : field.bind,
          field.config.format === 'year' ? field.value : field.bind
        );
      }
    };

    return {
      validate: function(value, valid, cb) {
        var result = _validation[valid](value);
        if (cb) {
          cb(result, valid);
        }
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
angular.module("mx/template/checkout/card.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/card.html",
    "<form name=\"data.formCtrl.card\" ng-submit=\"formSubmit()\" novalidate>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <div\n" +
    "                    ng-if=\"data.alert.text\"\n" +
    "                    class=\"alert {{data.alert.type}}\"\n" +
    "                    role=\"alert\"\n" +
    "            >\n" +
    "                <div class=\"alert-inner\">{{data.alert.text}}</div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-7 col-card\">\n" +
    "            <div mx-field-input=\"data.card\" config=\"data.config.fields.card\" form-ctrl=\"data.formCtrl.card\" blur=\"blur(inputCtrl)\" focus=\"focus(inputCtrl)\" valid=\"data.valid\"></div>\n" +
    "        </div>\n" +
    "        <div class=\"col-xs-5\">\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"col-xs-6 col-expire-month\">\n" +
    "                    <div mx-field-input=\"data.card\" config=\"data.config.fields.expireMonth\"\n" +
    "                         form-ctrl=\"data.formCtrl.card\" blur=\"blur(inputCtrl)\" focus=\"focus(inputCtrl)\" valid=\"data.valid\"></div>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-6 col-expire-year\">\n" +
    "                    <div mx-field-input=\"data.card\" config=\"data.config.fields.expireYear\"\n" +
    "                         form-ctrl=\"data.formCtrl.card\" blur=\"blur(inputCtrl)\" focus=\"focus(inputCtrl)\" valid=\"data.valid\"></div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-4 col-cvv\">\n" +
    "            <div mx-field-input=\"data.card\" config=\"data.config.fields.cvv\" form-ctrl=\"data.formCtrl.card\" blur=\"blur(inputCtrl)\" focus=\"focus(inputCtrl)\" valid=\"data.valid\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <input type=\"submit\" style=\"position: absolute; left: -9999px; width: 1px; height: 1px;\" tabindex=\"-1\" />\n" +
    "</form>");
}]);

;
angular.module("mx/template/checkout/checkout.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/checkout.html",
    "<div class=\"loading\" ng-if=\"data.loading\">Loading...</div>\n" +
    "<div ng-if=\"!data.loading\">\n" +
    "    <uib-accordion>\n" +
    "        <div\n" +
    "                uib-accordion-group\n" +
    "                class=\"panel {{::data.options.panelClass}}\"\n" +
    "                ng-repeat=\"tabId in ::data.tabs_order\"\n" +
    "                ng-init=\"tab = data.tabs[tabId]\"\n" +
    "                is-open=\"tab.open\"\n" +
    "        >\n" +
    "            <uib-accordion-heading ng-click=\"\">\n" +
    "                <span class=\"tab-icons\">\n" +
    "                    <i class=\"i i-{{::icon}}\" ng-repeat=\"icon in ::tab.icons\" ng-click=\"stop($event)\"></i>\n" +
    "                </span>\n" +
    "                {{::tab.name}}\n" +
    "            </uib-accordion-heading>\n" +
    "            <div  ng-include=\"'mx/template/checkout/' + tab.id + '.html'\"></div>\n" +
    "        </div>\n" +
    "    </uib-accordion>\n" +
    "    <div class=\"lock\"><i class=\"i i-lock\"></i> Your payment info is stored securely</div>\n" +
    "    <hr>\n" +
    "    <div class=\"text-right\"><button type=\"button\" class=\"btn {{::data.options.btnClass}}\" ng-click=\"formSubmit(true)\">Checkout</button></div>\n" +
    "</div>");
}]);

;
angular.module("mx/template/checkout/emoney.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/emoney.html",
    "<form name=\"data.formCtrl.emoney\" ng-submit=\"formSubmit()\" novalidate>\n" +
    "    <div class=\"payment-systems form-group\">\n" +
    "        <div class=\"payment-system\"\n" +
    "             ng-class=\"{\n" +
    "            active: tab.selected === id\n" +
    "         }\"\n" +
    "             ng-repeat=\"(id, value) in tab.payment_systems\"\n" +
    "             aria-selected=\"{{tab.selected === id}}\"\n" +
    "             ng-click=\"selectPaymentSystems(tab, id)\"\n" +
    "        >\n" +
    "            <div class=\"i-payment-system i-{{::id}}\"></div>\n" +
    "            <div>{{::value.name}}</div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <input type=\"hidden\" ng-model=\"data.emoney.type\" ng-required=\"true\">\n" +
    "    <input type=\"submit\" style=\"position: absolute; left: -9999px; width: 1px; height: 1px;\" tabindex=\"-1\" />\n" +
    "</form>");
}]);

;
angular.module("mx/template/checkout/field-input.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/field-input.html",
    "<div class=\"form-group\"\n" +
    "     ng-class=\"{\n" +
    "                'has-error': valid.iconShow[config.id],\n" +
    "                'has-success': formCtrl[config.id].$valid\n" +
    "            }\"\n" +
    ">\n" +
    "    <label\n" +
    "            ng-if=\"::config.label\"\n" +
    "    ><span>{{::config.text}}&nbsp;</span>\n" +
    "        <i ng-if=\"::config.info\" class=\"i i-i\" uib-tooltip=\"{{::config.info}}\" tooltip-placement=\"right\" tooltip-append-to-body=\"true\"></i>\n" +
    "    <input\n" +
    "\n" +
    "            name=\"{{::config.id}}\"\n" +
    "            ng-model=\"model[config.id]\"\n" +
    "            type=\"tel\"\n" +
    "            class=\"{{::config.formControlClass}}\"\n" +
    "\n" +
    "            placeholder=\"{{::config.placeholder}}\"\n" +
    "            ng-pattern=\"::config.pattern\"\n" +
    "\n" +
    "            size=\"{{::config.size}}\"\n" +
    "            maxlength=\"{{::config.size}}\"\n" +
    "            autocomplete=\"off\"\n" +
    "            mx-auto-focus=\"valid.autoFocus[config.id]\"\n" +
    "\n" +
    "            model=\"model\"\n" +
    "            config=\"config\"\n" +
    "            mx-field-valid=\"valid\"\n" +
    "            bind=\"{{model[config.bind]}}\"\n" +
    "\n" +
    "            ng-blur=\"blur({inputCtrl: formCtrl[config.id]})\"\n" +
    "            ng-focus=\"focus({inputCtrl: formCtrl[config.id]})\"\n" +
    "\n" +
    "            uib-tooltip=\"{{valid.errorText[config.id]}}\"\n" +
    "            tooltip-placement=\"right\"\n" +
    "            tooltip-trigger=\"{'mouseenter': 'mouseleave', 'none': 'focus'}\"\n" +
    "            tooltip-enable=\"{{valid.iconShow[config.id]}}\"\n" +
    "            tooltip-append-to-body=\"true\"\n" +
    "            tooltip-class=\"{{::config.tooltipClass}}\"\n" +
    "            tooltip-animation=\"false\"\n" +
    "    >\n" +
    "    </label>\n" +
    "</div>");
}]);

;
angular.module("mx/template/checkout/ibank.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/ibank.html",
    "<form name=\"data.formCtrl.ibank\" ng-submit=\"formSubmit()\" novalidate>\n" +
    "    <div class=\"payment-systems form-group\">\n" +
    "        <div class=\"payment-system\"\n" +
    "             ng-class=\"{\n" +
    "            active: tab.selected === id\n" +
    "         }\"\n" +
    "             ng-repeat=\"(id, value) in tab.payment_systems\"\n" +
    "             ng-click=\"selectPaymentSystems(tab, id)\"\n" +
    "        >\n" +
    "            <div class=\"i-payment-system i-{{::id}}\"></div>\n" +
    "            <div>{{::value.name}}</div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <input type=\"hidden\" ng-model=\"data.ibank.type\" ng-required=\"true\">\n" +
    "    <input type=\"submit\" style=\"position: absolute; left: -9999px; width: 1px; height: 1px;\" tabindex=\"-1\" />\n" +
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
//# sourceMappingURL=checkout.js.map