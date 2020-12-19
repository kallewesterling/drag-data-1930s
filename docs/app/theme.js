// Set up theme colors

// function to set a given theme/color-scheme
function setTheme(themeName) {
    localStorage.setItem("theme", themeName);
    document.documentElement.className = themeName;
}
// function to toggle between light and dark theme
function toggleTheme() {
    if (localStorage.getItem("theme") === "theme-dark") {
        setTheme("theme-light");
    } else {
        setTheme("theme-dark");
    }
}
// Immediately invoked function to set the theme on initial load
(function () {
    // first check for preference - if dark mode is on, stick to it!
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)') == true) {
        console.log('user has dark mode on - following suit...')
        setTheme("theme-dark");
        return true;
    }
    
    // else, check localStorage...
    if (localStorage.getItem("theme") === "theme-dark") {
        setTheme("theme-dark");
        return true;
    } else {
        setTheme("theme-light");
        return true;
    }
})();
