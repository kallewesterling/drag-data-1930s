/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

/**
 * @arg {String} url - address for the HTML to fetch
 * @return {String} the resulting HTML string fragment
 */
async function fetchHtmlAsText(url) {
  return await (await fetch(url)).text();
}

/**
 * this is your `load_home() function` // TODO: Needs docstring
 * @arg {String} filename - the URL for the file to load
 * @arg {string} selectorID - ID for a HTML element where to drop the text
 * @return {undefined}
 */
async function include(filename, selectorID = undefined) {
  const html = await fetchHtmlAsText(filename);
  if (!selectorID) return html;

  const contentDiv = document.getElementById(selectorID);
  contentDiv.innerHTML = html;
}
