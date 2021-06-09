# This script is here to generate one JavaScript file with all
# the source code so that I can attach them to my dissertation.

from pathlib import Path

JS_FILES = [
    "core/style.js",
    "core/include.js",
    "core/utils/collide.js",
    "core/utils/debug.js",
    "core/settings.js",
    "core/regex.js",
    "core/theme.js",
    "core/setup.js",
    "core/utils/colors.js",
    "core/utils/general.js",
    "core/utils/text.js",
    "core/utils/visibility.js",
    "core/utils/moment.js",
    "core/utils/community-detection.js",
    "core/scales.js",
    "core/filters.js",
    "core/load.js",
    "core/zoom.js",
    "core/app.js",
    "core/utils/dragging.js",
    "core/utils/numbers.js",
]
DEPENDENCIES = [
    "core/utils/community-detection-algorithms/jlouvain.js",
    "core/utils/jsnetworkx.js",
]
NETWORK_APP = "./network-app"
AUTO_PATH = "source-code/network-app.js"
DEPENDENCIES_DIR = "source-code/dependencies/"

path = input(f"Where would you like to save the source code? [ {AUTO_PATH} ]")

if not path:
    path = AUTO_PATH

if not Path(path).parent.exists():
    Path(path).parent.mkdir(parents=True)

if not Path(DEPENDENCIES_DIR).exists():
    Path(DEPENDENCIES_DIR).mkdir(parents=True)

all_js = ""

for file in JS_FILES:
    js_path = Path(NETWORK_APP) / Path(file)
    if not js_path.exists():
        raise RuntimeError(f"{js_path} does not exist.")

    all_js += (
        f"\n/* ------------ \n  original file: {js_path.name}\n */\n\n"
        + js_path.read_text().replace('"use strict";', "")
        + "\n\n"
    )

for file in DEPENDENCIES:
    js_path = Path(NETWORK_APP) / Path(file)
    if not js_path.exists():
        raise RuntimeError(f"{js_path} does not exist.")

    save_to = Path(DEPENDENCIES_DIR) / js_path.name
    save_to.write_text(js_path.read_text())

Path(AUTO_PATH).write_text(all_js)
