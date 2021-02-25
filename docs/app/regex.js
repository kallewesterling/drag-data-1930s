"use strict";

/**
 * fixMonth takes X argument/s... TODO: Finish this.
 * The return value is ...
 */
const fixMonth = (month_string) => {
    return month_string
        .replace("January", "01")
        .replace("February", "02")
        .replace("March", "03")
        .replace("April", "04")
        .replace("May", "05")
        .replace("June", "06")
        .replace("July", "07")
        .replace("August", "08")
        .replace("September", "09")
        .replace("October", "10")
        .replace("November", "11")
        .replace("December", "12")
        .replace("Jan", "01")
        .replace("Feb", "02")
        .replace("Mar", "03")
        .replace("Apr", "04")
        .replace("May", "05")
        .replace("Jun", "06")
        .replace("Jul", "07")
        .replace("Aug", "08")
        .replace("Sep", "09")
        .replace("Oct", "10")
        .replace("Nov", "11")
        .replace("Dec", "12");
};

let regeExes = [
    {
        map: "YYYY\\-MM\\-DD", // matches 1934-10-26
        locations: {
            full: 0,
            Y: 1,
            M: 2,
            D: 3,
        },
    },
    {
        // matches 26 Oct 1934
        map: "DD\\ MMM\\ YYYY",
        locations: {
            full: 0,
            Y: 3,
            M: 2,
            D: 1,
        },
    },
    {
        // 11 June 1938
        map: "DD\\ MMM\\ YYYY",
        locations: {
            full: 0,
            Y: 3,
            M: 2,
            D: 1,
        },
    },
    {
        // 10-09-40
        map: "DD\\-MM\\-YY",
        locations: {
            full: 0,
            Y: 3,
            M: 2,
            D: 1,
        },
    },
    {
        // 100940
        map: "MMDDYY",
        locations: {
            full: 0,
            Y: 3,
            M: 1,
            D: 2,
        },
    },
    {
        // starr-jackie-11-14-37
        map: "MM\\-DD\\-YY",
        locations: {
            full: 0,
            Y: 3,
            M: 1,
            D: 2,
        },
    },
    {
        // 30-12-17
        map: "YY\\-MM\\-DD",
        locations: {
            full: 0,
            Y: 1,
            M: 2,
            D: 3,
        },
    },
    {
        // December 13, 1932 + Feb 27, 1934
        map: "MMM\\ DD,\\ YYYY",
        locations: {
            full: 0,
            Y: 3,
            M: 1,
            D: 2,
        },
    },
    {
        // 5-11-26
        map: "Dnozero\\-Mnozero\\-YY",
        locations: {
            full: 0,
            Y: 3,
            M: 2,
            D: 1,
        },
    },
    {
        // 1940
        map: "YYYY",
        locations: {
            full: 0,
            Y: 1,
            M: undefined,
            D: undefined,
        },
    },
];

let day_regex = "(0[1-9]|[1-2][0-9]|3[0-1])";
let day_D_regex = "([1-9]|[1-2][0-9]|3[0-1])";
let month_MMM_regex =
    "(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
let month_MM_regex = "(0[1-9]|1[0-2])";
let month_M_regex = "([1-9]|1[0-2])";
let year_YYYY_regex = "(1[8-9][0-9][0-9])[-,\\s\\]\\)\\.]"; // since we are only looking for 1800s-1900s (and followed by `whitespace` or `-`)
let year_YY_regex = "([0-9]{2})"; // since we are only looking for 1900s

/**
 * dateParser takes a string and extracts an ISO date from it.
 * @returns object The return value is an object with only one property (`iso`) containing the ISO-formatted date.
 */
const dateParser = (test_string) => {
    if (!test_string) {
    } else {
        let dateObj = null,
            found = false;
        regeExes.forEach((rx) => {
            if (!found) {
                let dynamic_rx = new RegExp(
                    rx.map
                        .replace("YYYY", year_YYYY_regex)
                        .replace("MMM", month_MMM_regex)
                        .replace("MM", month_MM_regex)
                        .replace("Mnozero", month_M_regex)
                        .replace("DD", day_regex)
                        .replace("Dnozero", day_D_regex)
                        .replace("YY", year_YY_regex)
                );
                let date = test_string.match(dynamic_rx);
                if (date) {
                    let test_date = "";
                    if (rx.locations.Y && rx.locations.M && rx.locations.D) {
                        if (date[rx.locations.Y].length === 2) {
                            date[rx.locations.Y] = 19 + date[rx.locations.Y]; // we can do this because all sources are pre-2000s
                        }
                        test_date =
                            date[rx.locations.Y] +
                            "-" +
                            date[rx.locations.M] +
                            "-" +
                            date[rx.locations.D];
                    } else if (rx.locations.Y) {
                        test_date = date[rx.locations.Y];
                    } else {
                        console.log("huh!?");
                    }
                    dateObj = { dateObj: new Date(Date.parse(test_date)) };
                    try {
                        dateObj.iso = dateObj.dateObj
                            .toISOString()
                            .substring(0, 10);
                        if (dateObj.iso.substring(0, 4) > 2000) {
                            // year is larger than 2000 so will be corrected to 1900s
                            new_iso =
                                dateObj.iso.substring(0, 4) -
                                100 +
                                "-" +
                                dateObj.iso.substring(5, dateObj.iso.length);
                            dateObj.iso = new_iso;
                        }
                    } catch (error) {
                        console.error(
                            test_date +
                                " generated a mismatch with " +
                                rx.map +
                                " — interpreted as " +
                                test_date +
                                ":" +
                                error
                        );
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
        } else if (!found && dateObj) {
            console.error("weird");
        } else if (!found && !dateObj) {
            // console.error("date could not be found in `" + test_string + "`.");
        }
    }
    return { iso: undefined };
};
