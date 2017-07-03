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
