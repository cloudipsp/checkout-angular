angular
  .module('mx.checkout')
  .provider('mxCheckout', function() {
    var defaultOptions = {
      panelClass: 'panel-checkout',
      alertDangerClass: 'alert-checkout-danger',
      formControlClass: 'form-control form-control-checkout',
      btnClass: 'btn-primary',
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
