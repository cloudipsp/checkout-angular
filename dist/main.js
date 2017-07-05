
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
      // placeholder: 'CVV',
      text: 'Security Code',
      label: true,
      info: 'info text',
      size: '3',
      pattern: '[0-9]{3}',
      valid: 'cvv2,required'
    }
  },
  formMap: ['card', 'expireMonth', 'expireYear', 'cvv'],
  defaultData: {
    tabs: {
      card: {
        id: 'card',
        icons: ['visa', 'maestro']
      },
      emoney: {
        id: 'emoney',
        icons: ['qiwi']
      },
      ibank: {
        id: 'ibank',
        icons: ['p24']
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
        name: 'emoney',
        payment_systems: {
          webmoney: {
            name: 'Webmoney'
          },
          webmoney_direct: {
            name: 'Webmoney'
          },
          rfi_webmon: {
            name: 'Webmoney'
          },
          qiwi: {
            name: 'Qiwi'
          },
          qiwi_direct: {
            name: 'Qiwi'
          },
          rfi_qiwi: {
            name: 'Qiwi'
          },
          rfi_yandex: {
            name: 'rfi_yandex'
          },
          master_pass: {
            name: 'master_pass'
          }
        }
      },
      ibank: {
        name: 'ibank',
        payment_systems: {
          p24: {
            name: 'Приват24'
          },
          alfa: {
            name: 'alfa'
          },
          plotva24: {
            name: 'PLATBA 24'
          },
          kb_mplotva: {
            name: 'MojePlatba'
          },
          liqpay: {
            name: 'liqpay'
          },
          ralf_banklink: {
            name: 'Raifaizen BankLink'
          }
        }
      }
    }
  }
});

;
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
        mxCheckout.getData();

        $scope.data = mxCheckout.data;

        $scope.formSubmit = function(cF) {
          return mxCheckout.formSubmit(cF, $scope.onSubmit, $element);
        };

        $scope.selectPaymentSystems = mxCheckout.selectPaymentSystems;
        $scope.openTab = mxCheckout.openTab;
        $scope.stop = mxCheckout.stop;
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
      $get: function(mxCheckoutConfig, mxModal, $q) {
        var data = {
          config: mxCheckoutConfig,
          card: {},
          emoney: {},
          ibank: {},
          loading: true,

          valid: {
            errorText: {},
            iconShow: {},
            autoFocus: {}
          }
        };

        return {
          data: data,
          getData: getData,
          formSubmit: formSubmit,
          openTab: openTab,
          stop: stop,
          blur: blur,
          focus: focus,
          selectPaymentSystems: selectPaymentSystems
        };

        function getData() {
          data.loading = true;
          request().then(
            function(response) {
              angular.merge(data, data.config.defaultData, response);
              data.tabs[data.active_tab].open = true;

              data.loading = false;
            },
            function(error) {
              data.loading = false;
            }
          );
        }

        function request() {
          var deferred = $q.defer();

          setTimeout(function() {
            deferred.resolve(data.config.getData);
          }, 500);

          return deferred.promise;
        }

        function formSubmit(formCtrl, onSubmit, $element) {
          if (formCtrl.$valid) {
            onSubmit({
              formMap: data[data.active_tab]
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

        function selectPaymentSystems(tab, id) {
          tab.selected = id;
          data[tab.id].type = id;
        }

        function openTab($event, id) {
          if (data.active_tab === id) {
            stop($event);
          } else {
            data.active_tab = id;
          }
        }

        function stop($event) {
          $event.preventDefault();
          $event.stopPropagation();
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
          mxCheckout.data.card.expireMonth,
          mxCheckout.data.card.expireYear
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
angular.module("mx/template/checkout/card.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/card.html",
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-7\">\n" +
    "        <div mx-field-input=\"data.card\" config=\"data.config.fields.card\" form-ctrl=\"cF\"></div>\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-5\">\n" +
    "        <div class=\"form-group has-feedback\"\n" +
    "             ng-class=\"{\n" +
    "        'has-error': data.valid.iconShow.expireMonth || data.valid.iconShow.expireYear,\n" +
    "        'has-success': cF.expireMonth.$valid && cF.expireYear.$valid\n" +
    "    }\"\n" +
    "        >\n" +
    "            <label class=\"control-label\" for=\"expireMonth\">Expiration</label>\n" +
    "            <div class=\"form-inline\">\n" +
    "                <div mx-field-input=\"data.card\" config=\"data.config.fields.expireMonth\" form-ctrl=\"cF\"></div>\n" +
    "                <div mx-field-input=\"data.card\" config=\"data.config.fields.expireYear\" form-ctrl=\"cF\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-4\">\n" +
    "        <div mx-field-input=\"data.card\" config=\"data.config.fields.cvv\" form-ctrl=\"cF\"></div>\n" +
    "    </div>\n" +
    "</div>");
}]);

;
angular.module("mx/template/checkout/checkout.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/checkout.html",
    "<div class=\"loading\" ng-if=\"data.loading\">Loading...</div>\n" +
    "<form ng-if=\"!data.loading\" name=\"cF\" ng-submit=\"formSubmit(cF)\" novalidate>\n" +
    "    <uib-accordion>\n" +
    "        <div\n" +
    "                uib-accordion-group\n" +
    "                class=\"panel-default\"\n" +
    "                ng-repeat=\"tabId in data.tabs_order\"\n" +
    "                ng-init=\"tab = data.tabs[tabId]\"\n" +
    "                is-open=\"tab.open\"\n" +
    "        >\n" +
    "            <uib-accordion-heading ng-click=\"\">\n" +
    "                <span class=\"pull-right\">\n" +
    "                    <i class=\"icon-{{::icon}}\" ng-repeat=\"icon in ::tab.icons\" ng-click=\"stop($event)\">{{::icon}}</i>\n" +
    "                </span>\n" +
    "                <span ng-click=\"openTab($event, tab.id)\"><i class=\"glyphicon\" ng-class=\"{'glyphicon-check': tab.open, 'glyphicon-unchecked': !tab.open}\"></i> {{::tab.name}}</span>\n" +
    "            </uib-accordion-heading>\n" +
    "            <div ng-if=\"tab.open\" ng-include=\"'mx/template/checkout/' + tab.id + '.html'\"></div>\n" +
    "        </div>\n" +
    "    </uib-accordion>\n" +
    "    <div><i class=\"glyphicon glyphicon-lock\"></i> Your payment info is stored securely</div>\n" +
    "    <hr>\n" +
    "    <div class=\"text-right\"><button type=\"submit\" class=\"btn btn-primary btn-lg\">Checkout</button></div>\n" +
    "</form>");
}]);

;
angular.module("mx/template/checkout/emoney.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/emoney.html",
    "<div ng-repeat=\"(id, value) in tab.payment_systems\" aria-selected=\"{{tab.selected === id}}\">\n" +
    "    <a href=\"\" ng-click=\"selectPaymentSystems(tab, id)\"><i class=\"glyphicon\" ng-class=\"{'glyphicon-check': tab.selected === id, 'glyphicon-unchecked': tab.selected !== id}\"></i> {{::value.name}} ({{::id}})</a>\n" +
    "</div>\n" +
    "");
}]);

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
    "    <i ng-if=\"::config.info\" class=\"glyphicon glyphicon-info-sign\" uib-tooltip=\"{{::config.info}}\" tooltip-placement=\"right\"></i>\n" +
    "    <!--input-group-lg-->\n" +
    "    <div class=\"\" ng-class=\"::{'input-group': config.icon}\">\n" +
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
angular.module("mx/template/checkout/ibank.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("mx/template/checkout/ibank.html",
    "<div ng-repeat=\"(id, value) in tab.payment_systems\" aria-selected=\"{{tab.selected === id}}\">\n" +
    "    <a href=\"\" ng-click=\"selectPaymentSystems(tab, id)\"><i class=\"glyphicon\" ng-class=\"{'glyphicon-check': tab.selected === id, 'glyphicon-unchecked': tab.selected !== id}\"></i> {{::value.name}} ({{::id}})</a>\n" +
    "</div>\n" +
    "");
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