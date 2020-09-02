//==============================================================================
// Gas Calculation Library.
//
// Version 0.00
//
// J. G. Wallis, August 2019.
//
// This library is written in JavaScript and conforms to the ECMAScript Language
// Specification ECMA-262, 5.1 Edition, June 2011.
//
// We use the 'Revealing Module' pattern as the underlying architecture for this
// library. This technique is documented in multiple locations on the Internet.
//==============================================================================

var gasCalcLib = (function() {

// Turn on 'strict' mode to disable controversial JavaScript features.

'use strict';

var _privateProperty = 'This is only accessible inside gasCalcLib';
var publicProperty = 'This is accessible outside GasCalcLib';

function _privateMethod() {
  console.log(_privateProperty);
}

function publicMethod() {
  _privateMethod();
}

return {
  publicMEthod: publicMethod,
  publicProperty: publicProperty
};

}());

// Test access.

gasCalcLib.publicMethod();
console.log(gasCalcLib.publicProperty);
console.log(gasCalcLib._privateProperty);
gasCalcLib._privateMethod();
