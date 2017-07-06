angular.module('mx.checkout').constant('mxCheckoutConfig', {
  fields: {
    card: {
      id: 'card',
      // placeholder: 'Card number',
      text: 'Card number',
      label: true,
      size: '19',
      pattern: '[0-9]{14,19}',
      // icon: 'glyphicon-credit-card',
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
      info:
        'CVV/CVC2 – this 3-digits are security code. It is located in the signature field on the back of your payment card (last three digits)',
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
