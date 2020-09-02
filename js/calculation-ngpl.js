//==============================================================================
// Natural gas pressure loss calculation.
//
// Version 1.00
// J. G. Wallis, September 2018.
//
// Version 1.01
// Renamed source file from 'calculations.js' to 'calculation-ngpl.js' and made
// pipe efficiency factor variable, rather than assuming fixed value of 0.97.
// J. G. Wallis, October 2019.
//
// Version 1.02
// Updated pipe data table to add entry for NPD 20 mm and SDR 9.
// J. G. Wallis, August 2020.
//
// This software is deliberately written in traditional procedural style, rather
// than using object-orientated or functional programming techniques, because it
// needs to be verified by non-programmers. Clarity is preferred over elegance.
//
// The calculation is carried out with 64-bit floating-point precision, then the
// results are rounded to two decimal places. There are 'magic numbers' all over
// the place, but that is the nature of the calculation and cannot be helped.
//==============================================================================

// Turn on 'strict' mode to disable controversial JavaScript features.

"use strict";

// Create a module called 'PressureDrop' using an Immediately-Invoked Function
// Expression (IIFE). This avoids pollution of the global namespace with a
// large number of variables, constants, and functions.

var PressureDrop = (function()
  {
  //----------------------------------------------------------------------------
  // Variables (some of these are actually constants, but the 'const' keyword is
  // not recognised by all JavaScript interpreters).
  //----------------------------------------------------------------------------

  // Input values.

  var upstreamPressure;

  var baseGasFlowRate;

  var pipeLength;

  var pipeEfficiencyFactor;

  var nominalPipeDiameterAndSDR;

  var changeInAltitude;

  // Constant values.

  var c = 0.0007574;

  var specificGravity = 0.6;

  var averageCompressibilityFactor = 1;

  var averageTemperatureOfFlowingGas = 278.15;

  var standardTemperature = 288.15;

  var standardPressure = 1.01325;

  // Intermediate values.

  var upstreamPressureBarAbsolute;

  var internalPipeDiameter;

  var reynoldsNumber;

  var log10ReynoldsNumber;

  var x;

  var xSquared;

  var frictionFactorSmoothPipe;

  var frictionFactor;

  var temporary1;

  var temporary2;

  // Output values.

  var downstreamPressureBarAbsolute;

  var pressureLossBarAbsolute;

  var pressureLossMillibars;

  var correctedPressureLossMillibars;

  var velocityLE75mb;

  var velocityGT75mb;

  var correctedVelocity;

  //----------------------------------------------------------------------------
  // This gets called when the user presses the 'Calculate Results' button.
  //----------------------------------------------------------------------------

  function CalculateResults()
    {
    var inputsAllValid;

    // Fetch all input values from the on-screen form.

    inputsAllValid = FetchInputValues();

    // If the fetched input values are all valid...

    if (inputsAllValid)
      {
      // Do the natural gas pressure loss calculation.

      DoCalculation();

      // Display the results of the calculation.

      DisplayResults();
      }
    }

  //----------------------------------------------------------------------------
  // Fetch the input values and return 'true' if they are all valid.
  //----------------------------------------------------------------------------

  function FetchInputValues()
    {
    // Throughout the following code, 'NaN' means 'not a number'.

    // We return 'false' immediately on finding a problem. This means that the
    // function contains multiple 'return' statements, which is not usually a
    // good idea, but in this case the code is short and the logic obvious.

    upstreamPressure =
     parseFloat(document.getElementById('upstream-pressure').value);

    if (isNaN(upstreamPressure) || (upstreamPressure <= 0))
      {
      alert('The upstream pressure must be a positive number');
      return false;
      }

    baseGasFlowRate =
     parseFloat(document.getElementById('gas-flow-rate').value);

    if (isNaN(baseGasFlowRate) || (baseGasFlowRate <= 0))
      {
      alert('The base gas flow rate must be a positive number');
      return false;
      }

    pipeLength = parseFloat(document.getElementById('pipe-length').value);

    if (isNaN(pipeLength) || (pipeLength <= 0))
      {
      alert('The pipe length must be a positive number');
      return false;
      }

    pipeEfficiencyFactor = parseFloat(document.getElementById('pipe-efficiency-factor').value);

    if (isNaN(pipeEfficiencyFactor) || (pipeEfficiencyFactor <= 0) || (pipeEfficiencyFactor > 1))
      {
      alert('The pipe efficiency factor must be a positive number less than or equal to 1');
      return false;
      }

    // The combination of nominal pipe diameter and standard dimension ratio is
    // chosen from a drop-down list, which contains all valid combinations. We
    // just fetch the index of the chosen item.

    nominalPipeDiameterAndSDR =
     document.getElementById('nominal-pipe-diameter-and-sdr').selectedIndex;

    // Find the internal pipe diameter by looking it up in a pipe data table.

    internalPipeDiameter = PipeDataLookUp(nominalPipeDiameterAndSDR);

    changeInAltitude =
     parseFloat(document.getElementById('change-in-altitude').value);

    // Note that the change in altitude can be positive, negative, or zero. We
    // only need to check that it is a number.

    if (isNaN(changeInAltitude))
      {
      alert('The change in altitude has to be a number, but this can be zero');
      return false;
      }

    return true;
    }

  //----------------------------------------------------------------------------
  // Do the natural gas pressure loss calculation.
  //----------------------------------------------------------------------------

  function DoCalculation()
    {
    // Calculate intermediate values.

    upstreamPressureBarAbsolute = 1.01325 + (upstreamPressure / 1000);

    // Calculate the Reynolds number.

    reynoldsNumber = 25043 * baseGasFlowRate / internalPipeDiameter;

    // Calculate the base 10 logarithm of the Reynolds number. Modern browsers
    // provide the 'Math.log10' function , but Internet Explorer 11 does not.
    // However, all browsers provide the base 'e' (natural) logarithm as the
    // 'Math.log' function. As log10(n) = log(n) * log10(e), and log10(e) is
    // a constant, we can easily calculate the base 10 logarithm required.

    log10ReynoldsNumber = Math.log(reynoldsNumber) * Math.LOG10E;

    // Calculate 'x', which will be used in calculating the friction factor.

    x = log10ReynoldsNumber - 5;

    // Calculate 'x', squared which will be used in calculating the friction
    // factor.

    xSquared = x * x;

    // Calculate the smooth pipe friction factor.

    frictionFactorSmoothPipe = Math.pow(14.7519 + (3.5657 * x) +
     (0.0362 * xSquared), -2);

    // Calculate the friction factor.

    frictionFactor = frictionFactorSmoothPipe / (pipeEfficiencyFactor *
     pipeEfficiencyFactor);

    // Calculate some more intermediate values.

    temporary1 = (averageCompressibilityFactor *
     averageTemperatureOfFlowingGas *
     standardPressure * standardPressure) /
     (c * c * standardTemperature * standardTemperature);

    temporary2 = baseGasFlowRate * baseGasFlowRate * temporary1 *
     specificGravity * pipeLength * frictionFactor /
     Math.pow(internalPipeDiameter, 5);

    // Calculate the downstream pressure.

    downstreamPressureBarAbsolute = Math.sqrt((upstreamPressureBarAbsolute *
     upstreamPressureBarAbsolute) - temporary2);

    // Calculate the pressure loss.

    pressureLossBarAbsolute = upstreamPressureBarAbsolute -
     downstreamPressureBarAbsolute;

    // Now calculate the output values to be displayed.

    // Convert the pressure loss to millibars.

    pressureLossMillibars = pressureLossBarAbsolute * 1000;

    // Correct the pressure loss for changes in altitude.

    correctedPressureLossMillibars = pressureLossMillibars - (0.048 *
     changeInAltitude);

    // We probably do not need to calculate the velocity for <= 75 millibars
    // and > 75 millibars as only one of these will be relevant.

    // Calculate the velocity (<= 75 millibars).

    velocityLE75mb = 353 * baseGasFlowRate / (internalPipeDiameter *
     internalPipeDiameter);

    // Calculate the velocity (> 75 millibars). This part of the calculation is
    // laid out in a nested fashion to make it clear what is going on with all
    // the parentheses.

    velocityGT75mb = (353 * baseGasFlowRate * standardPressure) /
                     (
                     internalPipeDiameter * internalPipeDiameter *
                     Math.pow
                       (
                         (
                         upstreamPressureBarAbsolute *
                         upstreamPressureBarAbsolute
                         ) -
                         (
                         3730 * baseGasFlowRate * baseGasFlowRate * pipeLength *
                         frictionFactor /
                         Math.pow
                           (
                           internalPipeDiameter,
                           5
                           )
                         ),
                       0.5
                       )
                     )

    if (upstreamPressureBarAbsolute > 1.08825)
      {
      correctedVelocity = velocityGT75mb;
      }
    else
      {
      correctedVelocity = velocityLE75mb;
      }
    }

  //----------------------------------------------------------------------------
  // Display the results.
  //----------------------------------------------------------------------------

  function DisplayResults()
    {
    // Turn on the visibiliy of the 'Results' heading.

    document.getElementById('pressure-loss-results').style.display = "block";

    // Check that the results are valid numbers before displaying them. This is
    // necessary because in some circumstances the calculation produces results
    // that do not make sense, which a spreadsheet would display as '#DIV/0' or
    // '#NUM!' errors.

    if (isNaN(correctedPressureLossMillibars))
      {
      document.getElementById('result-pressure-loss-corrected').innerHTML =
       'Calculated pressure loss is out of range';
      }
    else
      {
      document.getElementById('result-pressure-loss-corrected').innerHTML =
       'Pressure loss is ' + correctedPressureLossMillibars.toFixed(2) +
       ' mbar';
      }

    if (isNaN(correctedVelocity))
      {
      document.getElementById('result-velocity-corrected').innerHTML =
       'Calculated velocity is out of range';
      }
    else
      {
      document.getElementById('result-velocity-corrected').innerHTML =
       'Velocity is ' + correctedVelocity.toFixed(2) + ' m/s';
      }
    }

  //----------------------------------------------------------------------------
  // Given a table index respresenting a chosen combination of nominal pipe dia-
  // meter and standard dimension ratio, find out the corresponding internal
  // pipe diameter.
  //----------------------------------------------------------------------------

  function PipeDataLookUp(nominalPipeDiameterAndSDR)
    {
    var result = NaN;

    //--------------------------------------------------------------------------
    // Pipe data table.
    //
    // The table contains the internal diameters that correspond with each valid
    // combination of nominal pipe diameter and standard dimension ratio. The
    // standard dimension ratio being the minimum outside diameter divided by
    // the minimum wall thickness).
    //--------------------------------------------------------------------------

    var pipeDataTable = new Array(1);

    pipeDataTable[ 0] = [ 15.15];    // NPD  20 mm and SDR 9
    pipeDataTable[ 1] = [ 20.15];    // NPD  25 mm and SDR 11
    pipeDataTable[ 2] = [ 25.75];    // NPD  32 mm and SDR 11
    pipeDataTable[ 3] = [ 50.90];    // NPD  63 mm and SDR 11
    pipeDataTable[ 4] = [ 72.90];    // NPD  90 mm and SDR 11
    pipeDataTable[ 5] = [101.30];    // NPD 125 mm and SDR 11
    pipeDataTable[ 6] = [145.95];    // NPD 180 mm and SDR 11
    pipeDataTable[ 7] = [202.95];    // NPD 250 mm and SDR 11
    pipeDataTable[ 8] = [255.75];    // NPD 315 mm and SDR 11
    pipeDataTable[ 9] = [288.30];    // NPD 355 mm and SDR 11
    pipeDataTable[10] = [ 79.20];    // NPD  90 mm and SDR 17.6
    pipeDataTable[11] = [110.30];    // NPD 125 mm and SDR 17.6
    pipeDataTable[12] = [158.75];    // NPD 180 mm and SDR 17.6
    pipeDataTable[13] = [220.75];    // NPD 250 mm and SDR 17.6
    pipeDataTable[14] = [278.25];    // NPD 315 mm and SDR 17.6
    pipeDataTable[15] = [313.50];    // NPD 355 mm and SDR 17.6

    if ((nominalPipeDiameterAndSDR >= 0) &&
        (nominalPipeDiameterAndSDR <= pipeDataTable.length))
      {
      result = pipeDataTable[nominalPipeDiameterAndSDR];
      }

    if (isNaN(result))
      {
      alert('Pipe data look-up failed, so results will not be valid');
      }

    return result;
    }

  // The result of this whole Immediately-Invoked Function Expression (IIFE) is
  // a module called 'PressureDrop' that exposes only the following function to
  // be called when a user clicks 'Calculate Results' button. No other parts of
  // the module are exposed, such as internal variables, constants, or private
  // functions.

  return CalculateResults;
  }
());
