warnings = d3.select("#warnings");

const warning = (message, level = "info", color = "") => {
    iconName = "";
    switch (level) {
        case "info":
            iconName = "info";
            color = "primary";
            break;
        case "success":
            iconName = "check-circle";
            color = "success";
            break;
        case "warning":
            iconName = "exclamation-triangle";
            color = "warning";
            break;
        case "alert":
            iconName = "exclamation-triangle";
            color = "danger";
            break;
    }
    warnings.classed("d-none", false);
    d3.select("#warnings div[role=alert]")
        .classed("alert-success", false)
        .classed("alert-warning", false)
        .classed("alert-primary", false)
        .classed("alert-danger", false);
    d3.select("#warnings div[role=alert]").classed(`alert-${color}`, true);
    d3.select("#alertMessage").html(message);
    d3.select("use#icon").attr("xlink:href", `#${iconName}-fill`);
};
