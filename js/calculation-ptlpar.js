//==============================================================================
// Low-pressure testing calculations accumulated results.
//
// Version 0.00
//
// J. G. Wallis, July 2019.
//
// The calculation is carried out with 64-bit floating-point precision, then the
// results are rounded to two decimal places. There are 'magic numbers' all over
// the place, but that is the nature of the calculation and cannot be helped.
//==============================================================================

// Turn on 'strict' mode to disable controversial JavaScript features.

"use strict";

window.onload = function()
  {
  var ptlpStoredResults = sessionStorage.getItem('gaslptest');

  if (ptlpStoredResults)
    {
    var ptlpResultsArray = [];

    // Turn the stored results from a string back into an array.

    ptlpResultsArray = JSON.parse(ptlpStoredResults);

    var isOrAre;
    var resultOrResults;

    // See whether the number of accumulated results is singular or plural.

    if (ptlpResultsArray.length > 1)
      {
      isOrAre = 'are ';
      resultOrResults = ' pipe sections.'
      }
    else
      {
      isOrAre = 'is only ';
      resultOrResults = ' pipe section.'
      }

    document.getElementById('ptlpar-no-of-results').innerHTML =
     'There ' +
     isOrAre +
     ptlpResultsArray.length +
     resultOrResults;

    var baseName = 'ptlpar-ps-';
    var fullName;
    var totalTestDuration = 0;

    for (var i = 0; i < ptlpResultsArray.length; i++)
      {
      fullName = baseName + String(i + 1) + '-hdg';

      // Turn on the visibiliy of the heading.

      document.getElementById(fullName).style.display = "block";

      // Turn on the visibility of the paragraph.

      fullName = baseName + String(i + 1) + '-bdy';

      document.getElementById(fullName).style.display = "block";

      document.getElementById(fullName).innerHTML =
       PTLPStoredResultToTidyString(ptlpResultsArray[i]);

      totalTestDuration = totalTestDuration + (ptlpResultsArray[i])[3];
      }

    // The total test duration should never be less than 15 minutes.

    var minTestWarning = '';

    if (Math.ceil(totalTestDuration) < 15)
      {
      minTestWarning = ' (however, the minimum test duration should always be' +
       ' at least 15 minutes)';
      }

    // Work out the permitted pressure loss.

    var allowedPressureLoss = 'zero';

    if (Math.ceil(totalTestDuration) >= 15)
      {
      allowedPressureLoss = '3 mbar';
      }

/*
    Change made by JGW on 12Aug19...

    The following five lines have been commented-out as requested by Bob Beavis
    on 02Aug19:

    var allowedLossNote =
     ' Note that although small lengths of pipe might each have zero' +
     ' pressure loss when calculated individually, when calculated' +
     ' as a combination of pipes they could be allowed a pressure' +
     ' drop of 3 mbar.';
*/

    document.getElementById('ptlpar-test-duration').innerHTML =
     'Test duration: ' + totalTestDuration.toFixed(2) +
     ' minutes' +
     minTestWarning + '<br />' +
     'Allowed pressure loss: ' + allowedPressureLoss;

    // Add time of calculation to page. This has to be done in two places, one
    // that shows on large screens and one that shows on small screens.

    var calcTime = new Date();

    var calcString =
     'Calculated by Breckland Utility Solutions Limited on ' +
     calcTime.toUTCString();

    document.getElementById('calc-credit-1').innerHTML =
     calcString;
    document.getElementById('calc-credit-2').innerHTML =
     calcString;
    }
  }

//------------------------------------------------------------------------------
// Convert a stored result into a meaningful formatted string for display.
//------------------------------------------------------------------------------

function PTLPStoredResultToTidyString(setOfResults)
  {
  var result;

  var lineBreak = '<br />';

  result =
   'Diameter: ' + setOfResults[0] + 'mm, ' + setOfResults[1] + lineBreak +
   'Length: ' + setOfResults[2] + 'm' + lineBreak +
   'Test duration: ' + setOfResults[3].toFixed(2) + ' minutes';

  return result;
  }
