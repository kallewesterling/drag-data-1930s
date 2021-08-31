/*
This is for loading in the data from the Google Spreadsheet
*/

URLS = {
    v1: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=254069133&single=true&output=csv',
    live: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=0&single=true&output=csv'
}

const loadLiveData = (dataset='live') => {

    const clean = (data) => {
        dateParser = d3.timeParse('%Y-%m-%d');
        newDate = dateParser(data['Date']);
        for (const [key, value] of Object.entries(data)) {
            let newValueSet = false;
            newValue = undefined;
            if (value==="") {
                newValue = undefined;
                newValueSet = true;
            }
            if (newValueSet) {
                data[key] = newValue;
            }
        }
        return Object.assign(data, {
            'date': newDate
        });
    }

    url = URLS[dataset];
    returnValues = {};

    d3.csv(url, clean).then((data) => {
        returnValues.rawData = data;
        returnValues.thirties = returnValues.rawData.filter((d) => {
            if (!d.date) {
                return false
            } else {
                return d.date.getFullYear() >= 1930 && d.date.getFullYear() <= 1940
            }
        });
        return returnValues;
    });
}