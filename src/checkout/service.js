angular
  .module('mx.checkout')
  .provider('mxCheckout', function() {
    var defaultOptions = {
      panelClass: 'panel-checkout',
      alertDangerClass: 'alert-checkout-danger',
      formControlClass: 'form-control form-control-checkout',
      btnClass: 'btn-checkout',
      tooltipClass: 'tooltip-checkout',

      active: 'card',
      tabs: ['card', 'ibank', 'emoney'],
      ibank: ['p24'],
      emoney: ['webmoney']
    };
    var globalOptions = {};

    return {
      options: function(value) {
        angular.extend(globalOptions, value);
      },
      $get: function() {
        return {
          controller: [
            '$scope',
            'mxCheckoutConfig',
            '$element',
            'mxCheckout',
            function($scope, mxCheckoutConfig, $element, mxCheckout) {
              var api = $checkout('Api').setOrigin('https://api.fondy.eu');

              $scope.data = {
                options: getOption(),
                config: angular.copy(mxCheckoutConfig),
                formCtrl: {},

                card: {
                  payment_system: 'card'
                },
                emoney: {},
                ibank: {},

                disabled: false,

                alert: {
                  card: {},
                  emoney: {},
                  ibank: {}
                },

                valid: {
                  card: { errorText: {}, iconShow: {}, autoFocus: {} },
                  emoney: { errorText: {}, iconShow: {}, autoFocus: {} },
                  ibank: { errorText: {}, iconShow: {}, autoFocus: {} }
                }
              };

              $scope.formSubmit = formSubmit;
              $scope.stop = mxCheckout.stop;
              $scope.blur = blur;
              $scope.focus = focus;
              $scope.selectPaymentSystems = selectPaymentSystems;
              this.addParams = addParams;

              angular.forEach($scope.data.config.fields, function(item) {
                item.formControlClass = $scope.data.options.formControlClass;
                item.tooltipClass = $scope.data.options.tooltipClass;
              });
              $scope.data.config.tabs[$scope.data.options.active].open = true;

              angular.forEach($scope.data.options.tabs, function(tab) {
                angular.extend($scope.data[tab], $scope.data.options.params);
              });

              function addParams(field) {
                angular.forEach($scope.data.options.tabs, function(tab) {
                  $scope.data[tab][field.name] = field.value;
                });
              }

              function formSubmit() {
                var tab = getActiveTab();
                if ($scope.data.formCtrl[tab.id].$valid) {
                  if ($scope.data.disabled) return;
                  $scope.data.disabled = true;
                  $scope.data.alert[tab.id] = {};

                  api.scope(function() {
                    this.request('api.checkout.form', 'request', $scope.data[tab.id])
                      .done(function(model) {
                        $scope.onSuccess({
                          response: model
                        });
                        model.sendResponse();
                        $scope.data.disabled = false;
                        $scope.$apply();
                      })
                      .fail(function(model) {
                        $scope.data.disabled = false;
                        addAlert(tab.id, [model.attr('error.code'), model.attr('error.message')].join(' '));
                        $scope.onError({
                          response: model
                        });
                        $scope.$apply();
                      });
                  });
                } else {
                  var autoFocusFlag = true;
                  if (tab.selected) {
                    angular.forEach(tab.payment_systems[tab.selected].formMap, function(field) {
                      if ($scope.data.formCtrl[tab.id][field].$invalid) {
                        if (autoFocusFlag) {
                          autoFocusFlag = false;
                          $scope.data.valid[tab.id].autoFocus[field] = +new Date();
                          $scope.data.valid[tab.id].iconShow[field] = false;
                        } else {
                          $scope.data.valid[tab.id].iconShow[field] = true;
                        }
                      }
                    });
                  }
                  if (tab.id === 'card') {
                    addAlert(tab.id, $scope.data.config.error.card);
                  }
                }
              }

              function blur(inputCtrl, tab) {
                if (inputCtrl.$invalid) {
                  $scope.data.valid[tab].iconShow[inputCtrl.$name] = true;
                }
              }

              function focus(inputCtrl, tab) {
                if (inputCtrl.$invalid) {
                  $scope.data.valid[tab].iconShow[inputCtrl.$name] = false;
                }
              }

              function selectPaymentSystems(tab, id) {
                tab.selected = id;
                $scope.data[tab.id].payment_system = id;
              }

              function getActiveTab() {
                var result;
                angular.forEach($scope.data.config.tabs, function(tab) {
                  if (tab.open) {
                    result = tab;
                  }
                });
                return result;
              }

              function addAlert(tab, text, type) {
                $scope.data.alert[tab] = {
                  text: text,
                  type: type || $scope.data.options.alertDangerClass
                };
              }

              function getOption() {
                var _options = angular.extend({}, defaultOptions, globalOptions, $scope.mxCheckoutOptions);
                var options = {
                  tabs: [],
                  ibank: [],
                  emoney: []
                };
                var config = mxCheckoutConfig.tabs;

                angular.forEach(_options.tabs, function(i) {
                  if (config.hasOwnProperty(i) && options.tabs.indexOf(i) < 0) options.tabs.push(i);
                });
                angular.forEach(_options.ibank, function(i) {
                  if (config.ibank.payment_systems.hasOwnProperty(i) && options.ibank.indexOf(i) < 0)
                    options.ibank.push(i);
                });
                angular.forEach(_options.emoney, function(i) {
                  if (config.emoney.payment_systems.hasOwnProperty(i) && options.emoney.indexOf(i) < 0)
                    options.emoney.push(i);
                });
                if (options.tabs.indexOf(_options.active) < 0) {
                  _options.active = options.tabs[0] || defaultOptions.active;
                }

                return angular.extend(_options, options);
              }
            }
          ],
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
        return _validation.num.call(this, field) && _validation.min_length.call(this, field, 3);
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
