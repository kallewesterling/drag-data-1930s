function RGBToHSL(rgb, addLightness=undefined) {
	let ex = /^rgb\((((((((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5]),\s?)){2}|((((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5])\s)){2})((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5]))|((((([1-9]?\d(\.\d+)?)|100|(\.\d+))%,\s?){2}|((([1-9]?\d(\.\d+)?)|100|(\.\d+))%\s){2})(([1-9]?\d(\.\d+)?)|100|(\.\d+))%))\)$/i;
	if (ex.test(rgb)) {
		let sep = rgb.indexOf(",") > -1 ? "," : " ";
		rgb = rgb.substr(4).split(")")[0].split(sep);
		
		// convert %s to 0–255
		for (let R in rgb) {
			let r = rgb[R];
			if (r.indexOf("%") > -1)
				rgb[R] = Math.round(r.substr(0,r.length - 1) / 100 * 255);
		}

		// make r, g, and b fractions of 1
		let r = rgb[0] / 255,
			g = rgb[1] / 255,
			b = rgb[2] / 255,

		// find greatest and smallest channel values
			cmin = Math.min(r,g,b),
			cmax = Math.max(r,g,b),
			delta = cmax - cmin,
			h = 0,
			s = 0,
			l = 0;

		// calculate hue
		// no difference
		if (delta == 0)
			h = 0;
		// red is max
		else if (cmax == r)
			h = ((g - b) / delta) % 6;
		// green is max
		else if (cmax == g)
			h = (b - r) / delta + 2;
		// blue is max
		else
			h = (r - g) / delta + 4;

		h = Math.round(h * 60);

		// make negative hues positive behind 360°
		if (h < 0)
			h += 360;

		// calculate lightness
		l = (cmax + cmin) / 2;

		// calculate saturation
		s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

		// multiply l and s by 100
		s = +(s * 100).toFixed(1);
		l = +(l * 100).toFixed(1);
		
        if (addLightness)
            l += addLightness;

		return "hsl(" + h + "," + s + "%," + l + "%)";

	} else {
		return "Invalid input color";
	}
}
