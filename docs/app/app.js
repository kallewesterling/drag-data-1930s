"use strict";

////// list of things left to do
/*
- TODO: filter on more things, like city (see `store.count`)
- TODO: choose indegree / outdegree as nodeSize !important

- TODO: add auto-generated explanation of data:
        color = three different categories of nodes (if you click them, they will turn red)
            if stickyNodes is on: if you drag the nodes, they will stick in the place where you've dragged them. If you don't desire this feature, just click here, and it will be removed and reset.

            minDegree = 
            but if current degree is different = 

        size of nodes: ("node size from current graph" is clicked) the nodes are scaled in relation to the other nodes on the chart. currentDegree is used instead of degree.

        If you click each node, you will see the centrality measures. Those are counted (and described here at 1000x) across the entire network, and are not generated dynamically, depending on the graph that you see in front of you.
            - betweenness
            - closeness
            - degree
            - eigenvector

        What about the placement of the nodes? This is taken care of by the "force simulation" [TODO: read this https://medium.com/@sxywu/understanding-the-force-ef1237017d5]
*/

(function () {
    // Immediately invoked function to set the theme on initial load
    window.egoNetwork = false;
    loadNetwork();
    graph.svg.call(zoom); // only call zoom on the graph.svg object at the start
})();
