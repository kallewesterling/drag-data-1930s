# Drag data in the 1930s

[![ci](https://github.com/kallewesterling/drag-data-1930s/actions/workflows/cy.yml/badge.svg)](https://github.com/kallewesterling/drag-data-1930s/actions/workflows/cy.yml)

To see the final visualization, visit [this website](https://kallewesterling.github.io/drag-data-1930s/).

## Steps

### Step 1. Creating Dataset

The dataset was created in a combination of a manual and automatic process, where searches were performed across a number of databases, results collated and PDF files/images of scanned newspapers were presented to the researcher (see below), who then manually coded all of the data into a data row for each person who occurred on that particular data in that particular newspaper.

The dataset can be seen [here](https://docs.google.com/spreadsheets/d/1UlpFQ9WWA6_6X-RuMJ3vHdIbyqhCZ1VRYgcQYjXprAg/edit#gid=0).

The data was manually processed into each column of each row as follows.

Each row has some central data assigned to it, which includes:
- a date (in the format YYYY-MM-DD)
- a name of the performer
- a name of the venue
- if not venue is mentioned but a city is mentioned, that name is filled out as well
- a source

Optional data includes:
- If there is a revue name mentioned, it is also noted here.
- If there is a legal name mentioned for the given performer, the legal name is noted
- If there is an alleged age mentioned for the given performer, the alleged age (and consequentially, the assumed birth year) are noted
- ID number that identifies the source in the Entertainment Industry Magazine Archive (EIMA)
- How the source was found through a search in newspapers.com
- How the source was found through a search in Fulton archives
- How the source was found through a search in an already existing archive
- Edge comment, which refers to any comments on the source itself (meta)
- Whether the data point shall be excluded from the final visualization
- Any interesting quotes from source
- Any interesting comments on the performer
- Any interesting comments on the venue
- Any interesting comments on the city
- Any interesting comments on the revue

Cleaned up data includes:
- Name of the performer
- Name of the venue
- Name of the city
- Source

### Step 2. Processing dataset

To run the analysis, clone this package and run in your terminal:

```sh
$ python process.py
```

### Step 3. Visualize

Then open a local http server:

```sh
$ python -m http.server
```

_Note that this will only work on Python 3._

## Who is the Researcher?

Kalle Westerling is a Ph.D. Candidate in Theatre and Performance at The Graduate Center, CUNY, where he works on a dissertation about the history and aesthetics of male-identified bodies in 20th-century burlesque and 21st-century boylesque. He is also the project manager for the NEH-funded project “Expanding Communities of Practice,” aimed at helping to create infrastructure for digital humanities across several higher education institutions across the U.S. [Read more about Kalle Westerling on his website.](https://westerling.nu/)
