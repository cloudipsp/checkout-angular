## Dependencies
This repository contains a set of **native AngularJS directives** based on Bootstrap's markup and CSS. As a result no dependency on jQuery or Bootstrap's JavaScript is required. 
The **only required dependencies** are: 
* [Angular](https://angularjs.org/) (1.4.x or higher)
* [Bootstrap CSS 3]() (3.x.)
* [UI Bootstrap](https://angular-ui.github.io/bootstrap/) (2.x.)

### Adding dependency to your project

When you are done downloading all the dependencies and project files the only remaining part is to add dependencies on the `ui.bootstrap` AngularJS module:

```js
angular.module('myModule', ['mx.checkout']);
```