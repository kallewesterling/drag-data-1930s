// TODO: Work on this to make it able to construct tours through the data...

const tour1 = [
    {
        text: "Welcome. We will start by setting the graph to basic settings",
        settings: [
            {
                selector: "#minDegree",
                setTo: 13,
                type: "slider",
            },
        ],
    },
    {
        wait: 4000,
    },
    {
        text: "Next, we will adjust the XYZ, to make visible the connections...",
    },
];

function until(conditionFunction) {
    const poll = (resolve) => {
        if (conditionFunction()) resolve();
        else setTimeout((_) => poll(resolve), 400);
    };

    return new Promise(poll);
}

async function tour(steps = []) {
    window.tour = true;

    // hide settings
    hide("#settings");

    changeSetting("#minDegree", 0, true, 'slider');
    changeSetting("#minWeight", 0, true, 'slider');
    changeSetting("#startYear", 1930, true, 'dropdown');
    changeSetting("#endYear", 1940, true, 'dropdown');

    await until((_) => window.simulationDone == true);

    steps = [
        {
            node_id: "jackie_maye",
            zoom: 1,
            wait: 4000,
            html: "Jackie Maye",
            textX: 200,
            textY: 200,
        },
    ];

    goTo(0,0);
    
    steps.forEach((step) => {
        let nodeObject = findNode(step.node_id);
        if (nodeObject) {
            d3.select('#quickEdgeInfo').style('top', `${step.textY}px`)
            d3.select('#quickEdgeInfo').style('left', `${step.textX}px`)
            d3.select('#quickEdgeInfo').html(step.html)
            zoomToNode(step.node_id, step.zoom);
        } else {
            console.error(`Could not find node with id ${step.node_id}`)
        }
    });

}
