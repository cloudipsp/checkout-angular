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
