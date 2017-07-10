angular
  .module('mx.checkout')
  .provider('mxCheckout', function() {
    var defaultOptions = {
      panelClass: 'panel-checkout',
      alertDangerClass: 'alert-checkout-danger',
      formControlClass: 'form-control-checkout'
    };
    var globalOptions = {};

    return {
      options: function(value) {
        angular.extend(globalOptions, value);
      },
      $get: function(mxCheckoutConfig, mxModal, $q) {
        var data = {
          options: angular.extend({}, defaultOptions, globalOptions),
          config: mxCheckoutConfig,
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

        return {
          data: data,
          init: init,
          formSubmit: formSubmit,
          stop: stop,
          blur: blur,
          focus: focus,
          selectPaymentSystems: selectPaymentSystems
        };

        function init() {
          angular.forEach(data.config.fields, function(item) {
            item.formControlClass = data.options.formControlClass;
          });
          getData();
        }

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
              formMap: data[getActiveTab()]
            });
            show3DS($element);
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
            addAlert(
              "Please verify that all card information you've provided is accurate and try again"
            );
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

        function stop($event) {
          $event.preventDefault();
          $event.stopPropagation();
        }

        function getActiveTab() {
          var result;
          angular.forEach(data.tabs, function(tab) {
            if (tab.open) {
              result = tab.id;
            }
          });
          return result;
        }

        function addAlert(text, type) {
          data.alert = {
            text: text,
            type: type || data.options.alertDangerClass
          };
        }

        function show3DS($element) {
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
