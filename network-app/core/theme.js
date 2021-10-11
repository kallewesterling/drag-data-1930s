/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

/**
 * setTheme takes X argument/s... TODO: Needs docstring
 * function to set a given theme/color-scheme
 * The return value is ...
 * @arg {string} themeName
 */
function setTheme(themeName) {
  localStorage.setItem('theme', themeName);
  document.documentElement.className = themeName;
}

/**
 * toggleTheme takes X argument/s... TODO: Needs docstring
 * function to toggle between light and dark theme
 */
function toggleTheme() {
  if (localStorage.getItem('theme') === 'theme-dark') {
    setTheme('theme-light');
  } else {
    setTheme('theme-dark');
  }
}

(function() {
  // Immediately invoked function to set the theme on initial load
  // first check for preference - if dark mode is on, stick to it!
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches == true
  ) {
    // console.log("user has dark mode on - following suit...");
    setTheme('theme-dark');
    return true;
  } else if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches == true
  ) {
    // console.log("user has light mode on - following suit...");
    setTheme('theme-light');
    return true;
  }

  // else, check localStorage...
  if (localStorage.getItem('theme') === 'theme-dark') {
    // console.log("user has set dark mode on manually...");
    setTheme('theme-dark');
    return true;
  } else {
    // console.log("user has set light mode on manually...");
    setTheme('theme-light');
    return true;
  }
})();
