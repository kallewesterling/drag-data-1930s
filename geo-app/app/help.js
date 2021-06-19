[...document.querySelectorAll("[data-display-info=true]")].forEach((elem) => {
    const mouseoverInfo = (evt, elem) => {
        store.helptip.html(
            `<p class="small m-0 fw-bolder">${elem.dataset.header}</p>
                <p class="small m-0">${elem.dataset.explanation}</p>`
        );
        showHelptip(evt.pageX + 10, evt.pageY - 28);
    };

    elem.addEventListener("mouseover", (evt) => {
        mouseoverInfo(evt, elem);
    });
    elem.addEventListener("mouseout", hideHelptip);
});
