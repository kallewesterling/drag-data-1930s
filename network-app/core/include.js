/**
 * @param {String} url - address for the HTML to fetch
 * @return {String} the resulting HTML string fragment
 */
async function fetchHtmlAsText(url) {
    return await (await fetch(url)).text();
}

// this is your `load_home() function`
async function include(filename, selectorID = undefined) {
    html = await fetchHtmlAsText(filename);
    if (!selectorID) return html;

    const contentDiv = document.getElementById(selectorID);
    contentDiv.innerHTML = html;
}
