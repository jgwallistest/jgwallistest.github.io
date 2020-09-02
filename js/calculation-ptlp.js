//==============================================================================
// Low-pressure testing calculations.
//
// Version 0.00
//
// J. G. Wallis, June 2019.
//
// The calculation is carried out with 64-bit floating-point precision, then the
// results are rounded to two decimal places. There are 'magic numbers' all over
// the place, but that is the nature of the calculation and cannot be helped.
//==============================================================================

// Turn on 'strict' mode to disable controversial JavaScript features.

"use strict";

// Create a module called 'PressureTestLP' using an Immediately-Invoked Function
// Expression (IIFE). This avoids pollution of the global namespace with a
// large number of variables, constants, and functions.

var PressureTestLP = (function()
  {
  //----------------------------------------------------------------------------
  // Variables (some of these are actually constants, but the 'const' keyword is
  // not recognised by all JavaScript interpreters).
  //----------------------------------------------------------------------------

  // Input values.

  var nominalPipeDiameter;

  var SDR;

  var pipeLength;

  // Intermediate values.

  var zFactor;

  var minimumTestDurationInHours;

  // Output values.

  var minimumTestDurationInMinutes;

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

    // The nominal pipe diameter is chosen from a drop-down list.

    nominalPipeDiameter =
     document.getElementById('nominal-pipe-diameter').selectedIndex;

    // The standard dimension ratio is chosen from a drop-down list.

    SDR =
     document.getElementById('sdr').selectedIndex;

    // Fetch the pipe length in metres.

    pipeLength = parseFloat(document.getElementById('pipe-length').value);

    if (isNaN(pipeLength) || (pipeLength <= 0))
      {
      alert('The pipe length must be a positive number');
      return false;
      }

    return true;
    }

  //----------------------------------------------------------------------------
  // Do the low-pressure mains test calculation.
  //----------------------------------------------------------------------------

  function DoCalculation()
    {
    var zFactor;

    var pipeDiameterAsText = PipeDiameterIndexToText(nominalPipeDiameter);

    var sdrAsText = SDRIndexToText(SDR);

    zFactor = ZFactorMOPLE75mbar(pipeDiameterAsText, sdrAsText)

    minimumTestDurationInHours = zFactor * pipeLength;

    minimumTestDurationInMinutes = minimumTestDurationInHours * 60;
    }

  //----------------------------------------------------------------------------
  // Display the results.
  //----------------------------------------------------------------------------

  function DisplayResults()
    {
    // Turn on the visibiliy of the 'Results' heading.

    document.getElementById('pressure-test-lp-results').style.display = "block";

    if (isNaN(minimumTestDurationInMinutes))
      {
      document.getElementById('result-pressure-test-lp').innerHTML =
       'Unable to calculate minimum test duration. ' +
       'You may have selected an invalid combination of ' +
       'nominal pipe diameter and standard dimension ratio.';
      }
    else
      {
      var minOrMins;
      var minPeriod = '';
      var permittedLoss = ' The permitted pressure loss is 3 mbar.';

      // See whether the rounded-up number of minutes is singular or plural.
      // This prevents us from producing minimum test durations that when
      // 'rounded up comes to 1 minutes.'

      if (Math.ceil(minimumTestDurationInMinutes) > 1)
        {
        minOrMins = ' minutes.'
        }
      else
        {
        minOrMins = ' minute.'
        }

      if (Math.ceil(minimumTestDurationInMinutes) < 15)
        {
        minPeriod = ' However, the minimum test duration should always be at least 15 minutes.';
        permittedLoss = ' The permitted pressure loss is zero.';
        }

      document.getElementById('result-pressure-test-lp').innerHTML =
       'For the input values specified above, the minimum test duration is ' +
       minimumTestDurationInMinutes.toFixed(2) +
/*
       Change made by JGW on 12Aug19...

       The following three lines have been commented-out and replaced by the
       immediately following line as requested by Bob Beavis on 02Aug19:

       ' minutes, which rounded up comes to ' +
       Math.ceil(minimumTestDurationInMinutes) +
       minOrMins +
*/
       ' minutes.' +

       minPeriod +
       permittedLoss +
       ' These figures have been added to the network results.';

      // Add the calculated results to the stored results.

      PTLPAddToStoredResults(PipeDiameterIndexToText(nominalPipeDiameter), SDRIndexToText(SDR), pipeLength, minimumTestDurationInMinutes);

      // Turn on the visibiliy of the 'Handle Stored Results' buttons.

      document.getElementById('handle-stored-results').style.display = "block";
      }
    }

  //------------------------------------------------------------------------------
  //
  //------------------------------------------------------------------------------

  function PipeDiameterIndexToText(index)
    {
    var result = "Invalid Pipe Diameter Index";

    var table =
      [
/*
      We were using this lookup table derived from table 15 in IGEM/TD/3
      Edition 5, but apparently this includes some pipe sizes that are
      not in standard use.

      "55",
      "63",
      "75",
      "90",
      "110",
      "125",
      "140",
      "160",
      "180",
      "200",
      "213",
      "250",
      "268",
      "280",
      "315",
      "355",
      "400",
      "440",
      "450",
      "469",
      "500",
      "560",
      "630"

      We now use the following table instead, which consists of the same
      pipe sizes as are used in the pressure loss calculation, except
      25mm and 32 mm pipes are missing. This is because those sizes
      are 'service pipes' whioh have a separate, simple testing
      regime that does not require a calculator.
*/
      "63",
      "90",
      "125",
      "180",
      "250",
      "315",
      "355"
      ];

    if (index < table.length)
      {
      result = table[index];
      }

    return result;
    }

  //------------------------------------------------------------------------------
  //
  //------------------------------------------------------------------------------

  function SDRIndexToText(index)
    {
    var result = "Invalid SDR Index";

    var table =
      [
      "SDR11",
      "SDR13.6",
      "SDR17.6",
      "SDR21",
      "SDR26"
      ];

    if (index < table.length)
      {
      result = table[index];
      }

    return result;
    }

  //------------------------------------------------------------------------------
  // Find the cross-sectional area of a polyethylene pipe in square metres, given
  // the diameter in millimetres and the SDR.
  //------------------------------------------------------------------------------

  function CrossSectionalAreaPE(diameter, SDR)
    {
    var result = NaN;

    var csape =
      {
      "55SDR11" : 0.0016,
      "63SDR11" : 0.0021,
      "75SDR11" : 0.0030,
      "90SDR11" : 0.0043,
      "110SDR11" : 0.0064,
      "125SDR11" : 0.0082,
      "140SDR11" : 0.0103,
      "160SDR11" : NaN,
      "180SDR11" : 0.0170,
      "200SDR11" : 0.0210,
      "213SDR11" : NaN,
      "250SDR11" : 0.0329,
      "268SDR11" : NaN,
      "280SDR11" : 0.0412,
      "315SDR11" : 0.0522,
      "355SDR11" : 0.0663,
      "400SDR11" : 0.0841,
      "440SDR11" : NaN,
      "450SDR11" : 0.1065,
      "469SDR11" : NaN,
      "500SDR11" : 0.1314,
      "560SDR11" : NaN,
      "630SDR11" : 0.2087,

      "55SDR13.6" : NaN,
      "63SDR13.6" : 0.0023,
      "75SDR13.6" : 0.0032,
      "90SDR13.6" : NaN,
      "110SDR13.6" : NaN,
      "125SDR13.6" : NaN,
      "140SDR13.6" : NaN,
      "160SDR13.6" : NaN,
      "180SDR13.6" : NaN,
      "200SDR13.6" : NaN,
      "213SDR13.6" : NaN,
      "250SDR13.6" : NaN,
      "268SDR13.6" : NaN,
      "280SDR13.6" : NaN,
      "315SDR13.6" : NaN,
      "355SDR13.6" : NaN,
      "400SDR13.6" : NaN,
      "440SDR13.6" : NaN,
      "450SDR13.6" : NaN,
      "469SDR13.6" : NaN,
      "500SDR13.6" : NaN,
      "560SDR13.6" : NaN,
      "630SDR13.6" : NaN,

      "55SDR17.6" : 0.0018,
      "63SDR17.6" : 0.0024,
      "75SDR17.6" : 0.0034,
      "90SDR17.6" : 0.0050,
      "110SDR17.6" : 0.0074,
      "125SDR17.6" : 0.0096,
      "140SDR17.6" : 0.0120,
      "160SDR17.6" : NaN,
      "180SDR17.6" : 0.0200,  // Red
      "200SDR17.6" : 0.0247,  // Red
      "213SDR17.6" : NaN,
      "250SDR17.6" : 0.0386,  //Red
      "268SDR17.6" : NaN,
      "280SDR17.6" : 0.0484,  // Red
      "315SDR17.6" : 0.0612,  // Red
      "355SDR17.6" : 0.0778,  // Red
      "400SDR17.6" : 0.0987,  // Red
      "440SDR17.6" : NaN,     // Red
      "450SDR17.6" : 0.1250,  // Red
      "469SDR17.6" : NaN,     // Red
      "500SDR17.6" : 0.1543,  // Red
      "560SDR17.6" : NaN,     // Red
      "630SDR17.6" : 0.2449,  // Red

      "55SDR21" : NaN,
      "63SDR21" : NaN,
      "75SDR21" : NaN,
      "90SDR21" : NaN,
      "110SDR21" : NaN,
      "125SDR21" : NaN,
      "140SDR21" : NaN,
      "160SDR21" : NaN,
      "180SDR21" : NaN,
      "200SDR21" : NaN,
      "213SDR21" : NaN,
      "250SDR21" : 0.0402,
      "268SDR21" : 0.0461,
      "280SDR21" : 0.0505,
      "315SDR21" : 0.0638,
      "355SDR21" : 0.0810,
      "400SDR21" : 0.1029,
      "440SDR21" : NaN,
      "450SDR21" : 0.1302,
      "469SDR21" : 0.1414,
      "500SDR21" : 0.1607,
      "560SDR21" : NaN,
      "630SDR21" : 0.2552,

      "55SDR26" : NaN,
      "63SDR26" : NaN,
      "75SDR26" : NaN,
      "90SDR26" : NaN,
      "110SDR26" : NaN,
      "125SDR26" : NaN,
      "140SDR26" : NaN,
      "160SDR26" : 0.0171,
      "180SDR26" : NaN,
      "200SDR26" : NaN,
      "213SDR26" : 0.0304,
      "250SDR26" : 0.0418,
      "268SDR26" : 0.0481,
      "280SDR26" : 0.0525,
      "315SDR26" : 0.0664,
      "355SDR26" : 0.0843,
      "400SDR26" : 0.1070,
      "440SDR26" : 0.1295,
      "450SDR26" : 0.1355,  // Red
      "469SDR26" : NaN,     // Green
      "500SDR26" : 0.1673,  // Green
      "560SDR26" : 0.2098,
      "630SDR26" : 0.2657
      }

    // Combine arguments to form search string.

    var searchString = diameter + SDR;

    // Look for search string in 'csape' dictionary.

    for (var name in csape)
      {
      if (name == searchString)
        {
        result = csape[name];
        break;
        }
      }

    return result;
    }

  //------------------------------------------------------------------------------
  // Find the Z-factor to use when calculating the test period for a polyethylene
  // pipeline with a maximum operating pressure of less than or equal to 75 mbar,
  // given the diameter in millimetres and the SDR.
  //------------------------------------------------------------------------------

  function ZFactorMOPLE75mbar(diameter, SDR)
    {
    var result = NaN;

    var zfmople75mbar =
      {
      "55SDR11" : 0.0005,  // Green
      "63SDR11" : 0.0006,
      "75SDR11" : 0.0009,
      "90SDR11" : 0.0013,  // Green
      "110SDR11" : 0.0019,
      "125SDR11" : 0.0025,  // Green
      "140SDR11" : 0.0031,
      "160SDR11" : NaN,
      "180SDR11" : 0.0051,
      "200SDR11" : 0.0063,
      "213SDR11" : NaN,
      "250SDR11" : 0.0099,  // Green
      "268SDR11" : NaN,
      "280SDR11" : 0.0124,  // Green
      "315SDR11" : 0.0157,  // Green
      "355SDR11" : 0.0199,  // Green
      "400SDR11" : 0.0252,
      "440SDR11" : NaN,
      "450SDR11" : 0.0319,
      "469SDR11" : NaN,
      "500SDR11" : 0.0394,
      "560SDR11" : NaN,
      "630SDR11" : 0.0626,

      "55SDR13.6" : NaN,
      "63SDR13.6" : 0.0006,
      "75SDR13.6" : 0.0009,
      "90SDR13.6" : NaN,
      "110SDR13.6" : NaN,
      "125SDR13.6" : NaN,
      "140SDR13.6" : NaN,
      "160SDR13.6" : NaN,
      "180SDR13.6" : NaN,
      "200SDR13.6" : NaN,
      "213SDR13.6" : NaN,
      "250SDR13.6" : NaN,
      "268SDR13.6" : NaN,
      "280SDR13.6" : NaN,
      "315SDR13.6" : NaN,
      "355SDR13.6" : NaN,
      "400SDR13.6" : NaN,
      "440SDR13.6" : NaN,
      "450SDR13.6" : NaN,
      "469SDR13.6" : NaN,
      "500SDR13.6" : NaN,
      "560SDR13.6" : NaN,
      "630SDR13.6" : NaN,

      "55SDR17.6" : 0.0006,  // Green
      "63SDR17.6" : 0.0007,
      "75SDR17.6" : 0.0010,
      "90SDR17.6" : 0.0015,
      "110SDR17.6" : 0.0022,
      "125SDR17.6" : 0.0029,  // Green
      "140SDR17.6" : 0.0036,
      "160SDR17.6" : NaN,
      "180SDR17.6" : 0.0060,  // Green
      "200SDR17.6" : 0.0074,  // Green
      "213SDR17.6" : NaN,  // Red
      "250SDR17.6" : 0.0116,  // Red
      "268SDR17.6" : NaN,  // Red
      "280SDR17.6" : 0.0145,  // Red
      "315SDR17.6" : 0.0184,  // Red
      "355SDR17.6" : 0.0233,  // Red
      "400SDR17.6" : 0.0296,  // Red
      "440SDR17.6" : NaN,  // Red
      "450SDR17.6" : 0.0375,  // Red
      "469SDR17.6" : NaN,  // Red
      "500SDR17.6" : 0.0463,  // Red
      "560SDR17.6" : NaN,  // Red
      "630SDR17.6" : 0.0735,  // Red

      "55SDR21" : NaN,
      "63SDR21" : NaN,
      "75SDR21" : NaN,
      "90SDR21" : NaN,
      "110SDR21" : NaN,
      "125SDR21" : NaN,
      "140SDR21" : NaN,
      "160SDR21" : NaN,
      "180SDR21" : NaN,
      "200SDR21" : NaN,
      "213SDR21" : NaN,
      "250SDR21" : 0.0121,  // Green
      "268SDR21" : 0.0139,  // Green
      "280SDR21" : 0.0151,
      "315SDR21" : 0.0191,
      "355SDR21" : 0.0243,
      "400SDR21" : 0.0309,  // Green
      "440SDR21" : NaN,
      "450SDR21" : 0.0391,  // Green
      "469SDR21" : 0.0424,
      "500SDR21" : 0.0482,
      "560SDR21" : NaN,
      "630SDR21" : 0.0766,  // Green

      "55SDR26" : NaN,
      "63SDR26" : NaN,
      "75SDR26" : NaN,
      "90SDR26" : NaN,
      "110SDR26" : NaN,
      "125SDR26" : NaN,
      "140SDR26" : NaN,
      "160SDR26" : 0.0051,
      "180SDR26" : NaN,
      "200SDR26" : NaN,
      "213SDR26" : 0.0091,
      "250SDR26" : 0.0125,
      "268SDR26" : 0.0144,
      "280SDR26" : 0.0157,
      "315SDR26" : 0.0199,
      "355SDR26" : 0.0253,  // Green
      "400SDR26" : 0.0321,
      "440SDR26" : 0.0389,  // Green
      "450SDR26" : 0.0407,  // Green
      "469SDR26" : NaN,
      "500SDR26" : 0.0502,  // Green
      "560SDR26" : 0.0630,  // Green
      "630SDR26" : 0.0797
      }

    // Combine arguments to form search string.

    var searchString = diameter + SDR;

    // Look for search string in 'csape' dictionary.

    for (var name in zfmople75mbar)
      {
      if (name == searchString)
        {
        result = zfmople75mbar[name];
        break;
        }
      }

    return result;
    }

  // When first loading this code, clear any network results that might be in
  // local storage.

  PTLPClearStoredResults();

  // The result of this whole Immediately-Invoked Function Expression (IIFE) is
  // a module called 'PressureTestLP' that exposes only the following function
  // to be called when a user clicks 'Calculate Results' button. No other
  // parts of the module are exposed, such as internal variables,
  // constants, or private functions.

  return CalculateResults;
  }
());

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//----------------------------- Modern Web Storage -----------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

// This is a plain function in the global namespace.

function PTLPAddToStoredResults(pipeDiameterAsText, sdrAsText, pipeLength, minimumTestDurationInMinutes)
  {
  var ptlpStoredResults;
  var ptlpResultsArray = [];
  var setOfResults = [];

  // Try to retrieve any stored results.

  ptlpStoredResults = sessionStorage.getItem('gaslptest');

  // If there are already some stored results...

  if (ptlpStoredResults)
    {
    // Turn the already stored results from a string back into an array.

    ptlpResultsArray = JSON.parse(ptlpStoredResults);
    }

  if (ptlpResultsArray.length < 9)
    {
    // Add the latest set of results to the results array.

    setOfResults.push(pipeDiameterAsText);
    setOfResults.push(sdrAsText);
    setOfResults.push(pipeLength);
    setOfResults.push(minimumTestDurationInMinutes);

    ptlpResultsArray.push(setOfResults);

    // Turn all network results into a string and store them.

    sessionStorage.setItem('gaslptest', JSON.stringify(ptlpResultsArray));
    }
  else
    {
    alert('Maximum number of network results already stored.');
    }
  }









// This is a plain function in the global namespace.

function PTLPDisplayStoredResults()
  {
  var ptlpStoredResults = sessionStorage.getItem('gaslptest');

  if (ptlpStoredResults)
    {
    // Get the URL of the current window, which is the calculation page.

    var curPage = window.location.href;

    // Find the length of the URL.

    var urlLength = curPage.length;

    // Remove the trailing slash from the current URL, then add 'ar/' on the end
    // to form the URL of the network results page. This works when testing site
    // locally, but not on live site, so have replaced line immediately below.

    // var newPage = curPage.slice(0, urlLength - 1) + 'ar/';

    // We need to be smarter about forming target URL by replacing 'ptlp' with
    // 'ptlpar' so this will work when testing site locally and on live site.

    var newPage = curPage.replace('ptlp', 'ptlpar');

    // Create a new window, with a name based on the current window, to show the
    // network results.

    var resultsWindow = window.open(newPage);

    // The JavaScript associated with the new window will display whatever it
    // can find in the stored results. We do not do anything more here.
    }
  }

// This is a plain function in the global namespace.

function PTLPClearStoredResults()
  {
  sessionStorage.removeItem('gaslptest');
  }

//------------------------------------------------------------------------------
// Find out if the browser supports modern web storage.
//------------------------------------------------------------------------------

function PTLPSessionStorageAvailable()
  {
  try
    {
    sessionStorage.setItem('testssa', 'gaslptest');
    sessionStorage.removeItem('testssa');
    return true;
    }
  catch
    {
    return false;
    }
  }
