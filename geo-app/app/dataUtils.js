"use strict";

/**
 * filterByComparisonDataset takes three arguments and returns a filtered array, depending on the provided arguments.
 *
 * @param {string} filterCat - a string name for the category to filter by.
 * @param {int} minVal - minimum value to filter by
 * @param {int} maxVal - maximum value to filter by
 * @param {Array} array - optional array to bypass dataset as array
 * @return {Array} filtered dataset
 */
const filterByComparisonDataset = (filterCat, minVal, maxVal, array) => {
    if (array === undefined) {
        array = store.raw;
    }

    if (minVal && maxVal) {
        array = array.filter(
            (d) => d[filterCat] >= minVal && d[filterCat] <= maxVal
        );
    } else if (minVal) {
        array = array.filter((d) => d[filterCat] >= minVal);
    } else if (maxVal) {
        array = array.filter((d) => d[filterCat] <= maxVal);
    }
    return array;
};

const getPerformerNamesByGeo = (city, startYear, endYear) => {
    let filtered = store.raw;
    filtered = filterByComparisonDataset("year", startYear, endYear);
    if (city) {
        filtered = filtered.filter((d) => d.city === city);
    }
    return [...new Set(filtered.map((d) => d.performer))];
};

const getUniqueFromDataset = (cat) => {
    return [...new Set(store.raw.map((d) => d[cat]))];
};

const getCities = () => {
    return getUniqueFromDataset("city");
};

const getPerformers = () => {
    return getUniqueFromDataset("performer");
};

const searchDataset = (searchCat, searchVal, returnVal) => {
    let search = [
        ...new Set(
            store.raw
                .filter((d) => d[searchCat] === searchVal)
                .map((d) => d[returnVal])
        ),
    ];
    if (search.length > 1) {
        console.error(
            `getLat for city ${city} returned more than one latitude. Check the dataset.`
        );
        return -1;
    }
    return search[0];
};

const getLat = (city) => {
    // shortcut to return the latitude of a given city (string)
    return searchDataset("city", city, "lat");
};

const getLon = (city) => {
    // shortcut to return the longitude of a given city (string)
    return searchDataset("city", city, "lon");
};

const getPerformerCount = (city, year) => {
    // returns a count of number of performers (in a given city, if provided) (in a given year, if provided)
    // thus:
    //    getPerformerCount() = total numbers of performers in dataset
    //    getPerformerCount('New York, NY') = total numbers of performers in New York
    //    getPerformerCount('New York, NY', 1933) = total numbers of performers in New York in 1933
    return getPerformerNamesByGeo(city, year, year).length;
};
