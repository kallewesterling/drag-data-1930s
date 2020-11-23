import { standard_settings } from "./settings.js";
import { post_change } from "./visualization3.js";

//// Set up all the option buttons

export var min_degree_btn = d3.select("#minDegree");
export var max_degree_btn = d3.select("#maxDegree");
export var gravity_slider = d3.select("#gravitySlider");
export var start_year_btn = d3.select("#startYear");
export var end_year_btn = d3.select("#endYear");

const _generate_years = function (startYear, endYear) {
    if (!endYear) {
        endYear = new Date().getFullYear();
    }
    var years = [];
    startYear = startYear || 1980;
    while (startYear <= endYear) {
        years.push(startYear++);
    }
    return years;
};

export const get_object_from_settings = () => {
    var min_degree =
        min_degree_btn.node().value != 0
            ? min_degree_btn.node().value
            : undefined;
    var max_degree =
        max_degree_btn.node().value != 0
            ? max_degree_btn.node().value
            : undefined;
    var gravity = gravity_slider.node().value;
    return {
        min_degree: min_degree,
        max_degree: max_degree,
        gravity: gravity,
    };
};

const _change = (d) => {
    var settings = get_object_from_settings();
    d3.select("#gravityValue").html(settings.gravity);
    post_change(settings);
};

export var setup_options = () => {
    min_degree_btn
        .selectAll("options")
        .data([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        .join((enter) => {
            return enter
                .append("option")
                .text((d) => d)
                .attr("value", (d) => d)
                .attr("selected", (d) => {
                    if (d == standard_settings.min_degree) {
                        return true;
                    }
                });
        });

    max_degree_btn
        .selectAll("options")
        .data([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        .join((enter) => {
            return enter
                .append("option")
                .text((d) => d)
                .attr("value", (d) => d)
                .attr("selected", (d) => {
                    if (d == standard_settings.max_degree) {
                        return true;
                    }
                });
        });

    start_year_btn
        .selectAll("options")
        .data(_generate_years(1900, 1950))
        .join((enter) => {
            return enter
                .append("option")
                .text((d) => d)
                .attr("value", (d) => d)
                .attr("selected", (d) => {
                    if (d == standard_settings.start_year) {
                        return true;
                    }
                });
        });

    end_year_btn
        .selectAll("options")
        .data(_generate_years(1900, 1950))
        .join((enter) => {
            return enter
                .append("option")
                .text((d) => d)
                .attr("value", (d) => d)
                .attr("selected", (d) => {
                    if (d == standard_settings.end_year) {
                        return true;
                    }
                });
        });

    min_degree_btn.on("change", _change);
    max_degree_btn.on("change", _change);
    start_year_btn.on("change", _change);
    end_year_btn.on("change", _change);
    gravity_slider.on("change", _change);
};

d3.select("#gravityValue").html(standard_settings.gravity);
gravity_slider.node().value = standard_settings.gravity;
