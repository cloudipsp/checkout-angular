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
