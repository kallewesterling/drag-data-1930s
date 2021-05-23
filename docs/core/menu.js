let menuWidth = getComputedStyle(document.querySelector('.popup-nav')).width;
document.getElementById('togglePopupNav').addEventListener('click', () => {
    if (document.getElementById("popupNav").style.left == `-${menuWidth}`) {
        document.getElementById("popupNav").style.left = "0px";
    } else {
        document.getElementById("popupNav").style.left = `-${menuWidth}`;
    }
});