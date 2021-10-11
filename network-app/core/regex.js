/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

/**
 * fixMonth takes X argument/s... TODO: Needs docstring
 * The return value is ...
 */
/*
const fixMonth = (monthString) => {
  return monthString
      .replace('January', '01')
      .replace('February', '02')
      .replace('March', '03')
      .replace('April', '04')
      .replace('May', '05')
      .replace('June', '06')
      .replace('July', '07')
      .replace('August', '08')
      .replace('September', '09')
      .replace('October', '10')
      .replace('November', '11')
      .replace('December', '12')
      .replace('Jan', '01')
      .replace('Feb', '02')
      .replace('Mar', '03')
      .replace('Apr', '04')
      .replace('May', '05')
      .replace('Jun', '06')
      .replace('Jul', '07')
      .replace('Aug', '08')
      .replace('Sep', '09')
      .replace('Oct', '10')
      .replace('Nov', '11')
      .replace('Dec', '12');
};
*/

/**
 * dateParser takes a string and extracts an ISO date from it.
 * @arg {string} testString - the string to test for the date.
 * @return {Object} - The return value is an object with only one
 *                    property (`iso`) containing the ISO-formatted date.
 */
const dateParser = (testString) => {
  if (!testString) {
    return {iso: undefined};
  }

  let dateObj = null;
  let found = false;
  regexes.forEach((rx) => {
    if (!found) {
      const dynamicRegex = new RegExp(
          rx.map
              .replace('YYYY', regex.rYYYY)
              .replace('MMM', regex.rMMM)
              .replace('MM', regex.rMM)
              .replace('Mnozero', regex.rM)
              .replace('DD', regex.rDwithZero)
              .replace('Dnozero', regex.rDnoZero)
              .replace('YY', regex.rYY),
      );
      const date = testString.match(dynamicRegex);
      if (date) {
        let testDate = '';
        if (rx.locations.Y && rx.locations.M && rx.locations.D) {
          if (date[rx.locations.Y].length === 2) {
            // we can do this because all sources are pre-2000s
            date[rx.locations.Y] = 19 + date[rx.locations.Y];
          }
          testDate =
            date[rx.locations.Y] +
            '-' +
            date[rx.locations.M] +
            '-' +
            date[rx.locations.D];
        } else if (rx.locations.Y) {
          testDate = date[rx.locations.Y];
        } else {
          throw new Error('An unexpected error occurred when parsing date.');
        }
        dateObj = {dateObj: new Date(Date.parse(testDate))};
        try {
          dateObj.iso = dateObj.dateObj
              .toISOString()
              .substring(0, 10);
          if (dateObj.iso.substring(0, 4) > 2000) {
            // year is larger than 2000 so will be corrected to 1900s
            newISO =
              dateObj.iso.substring(0, 4) -
              100 +
              '-' +
              dateObj.iso.substring(5, dateObj.iso.length);
            dateObj.iso = newISO;
          }
        } catch (error) {
          const msg = `Error: ${testDate} mismatches ${rx.map}.`;
          throw new Error(msg);
        }
        if (dateObj.dateObj) {
          found = true;
        }
      }
    }
  });

  // regex complete, we should have a found and a dateObj
  if (found && dateObj) {
    return dateObj;
  }

  // something happened - we ran into issue!
  if (!found && dateObj) {
    throw new Error('Something unexpected happened in handling date.');
  } else if (!found && !dateObj) {
    throw new Error(`Date could not be found in ${testString}.`);
  }

  // somehow, we made it here?!
  return {iso: undefined};
};
