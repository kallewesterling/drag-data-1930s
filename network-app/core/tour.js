// TODO: Work on this to make it able to construct tours through the data...

const tour1 = [
    {
        text: 'Welcome. We will start by setting the graph to basic settings',
        settings: [
            {
                selector: '#minDegree',
                setTo: 13,
                type: 'slider'
            }
        ]
    },
    {
        wait: 4000,
    },
    {
        text: 'Next, we will adjust the XYZ, to make visible the connections...'
    }
]

const tour = () => {
    // don't forget to run resetLocalStorage() before this function!
    tour1.forEach(step => {
        step.settings.forEach(settings => changeSetting(settings))
        console.log(step.text);
    })
    return true;
}