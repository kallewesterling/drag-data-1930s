#!/usr/bin/env python
# coding: utf-8

# # Setup
#
# The script is set up: imports all the necessary packages and all the necessary functions to run.

# In[1]:


import community as community_louvain
import copy
import networkx as nx
from collections import Counter
import unicodedata
import re
import pandas as pd
import json
import datetime
from IPython.display import display, HTML, Markdown, clear_output

settings = {"DAYSPANS": [3, 14, 31, 93, 186, 365]}


# In[2]:


# display(HTML("<style>.container {width: 80% !important; }</style>"))


# ## Imports

# In[3]:


# ## Meta functions

# In[1]:


def in_notebook():
    try:
        from IPython import get_ipython

        try:
            if "IPKernelApp" not in get_ipython().config:  # pragma: no cover
                return False
        except AttributeError:
            return False
    except ImportError:
        return False
    return True


def log(msg, color="green", verbose=True):
    now = datetime.datetime.now().strftime("%H:%M%:%S")
    if verbose and in_notebook():
        return display(Markdown(f'<font color="{color}">[{now}] {msg}</font>'))
    elif verbose:
        return print(f"[{now}]:\n{msg}\n\n")
    return None


def slugify(value, allow_unicode=False, verbose=False):
    init_value = str(value)
    value = init_value
    value = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    )
    value = re.sub(r"[^\w\s-]", "", value.lower())
    value = re.sub(r"^(\d+)", r"n\1", value)
    value = re.sub(r"[-\s]+", "_", value).strip("-_")
    if verbose:
        clear_output(wait=True)
        log(f"Making slug from {init_value}: {value}", verbose=verbose)
    return value


# ### Central function (`get_raw_data`)

# In[5]:


def get_raw_data(verbose=True):
    df = pd.read_csv(
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=0&single=true&output=csv"
    )

    # Fix basic stuff
    df.replace("—", "", inplace=True)
    df.replace("—*", "", inplace=True)
    df.replace("–", "", inplace=True)
    df.fillna("", inplace=True)

    log(f"**{df.shape[0]} rows imported.**", verbose=verbose)

    return df


# ### Main filter function (`filter_data`)

# In[6]:


# Main filter function


def filter_data(df, min_date=None, max_date=None, verbose=True):
    def has_required_data(row):
        """(internal) for use with DataFrame lambda function to ensure that any given row has the required data present"""
        has_performer = (
            row["Performer"] != ""
            or row["Normalized performer"] != ""
            or (row["Performer first-name"] != "" or row["Performer last-name"]) != ""
        )
        # has_city = row['City'] or row['Normalized City']
        has_venue = row["Venue"] != ""
        if has_performer and has_venue:
            return True
        else:
            return False

    def has_correct_date(row):
        """(internal) for use with DataFrame lambda function to ensure that any given row has a correct date present"""
        return re.search(r"\d{4}\-\d{2}\-\d{2}", row["Date"]) != None

    def string_date(row):
        return row["Date"].strftime("%Y-%m-%d")

    df["has_required_data"] = df.apply(lambda row: has_required_data(row), axis=1)
    df.drop(df[df["has_required_data"] == False].index, inplace=True)
    log(f"**{df.shape[0]} rows after filtering**: Required data.", verbose=verbose)

    # Filter
    df.drop(df[df["Exclude from visualization"] == True].index, inplace=True)
    df.drop(df[df["Exclude from visualization"] == "TRUE"].index, inplace=True)
    log(
        f"**{df.shape[0]} rows after filtering**: Exclusion from visulization.",
        verbose=verbose,
    )

    # Filter
    df.drop(df[df["Unsure whether drag artist"] == True].index, inplace=True)
    df.drop(df[df["Unsure whether drag artist"] == "TRUE"].index, inplace=True)
    log(
        f"**{df.shape[0]} rows after filtering**: Unsure whether drag artist.",
        verbose=verbose,
    )

    df["has_correct_date"] = df.apply(lambda row: has_correct_date(row), axis=1)
    df.drop(df[df["has_correct_date"] == False].index, inplace=True)
    log(
        f"**{df.shape[0]} rows after filtering**: Full date in `Date` column.",
        verbose=verbose,
    )

    if min_date or max_date:
        df["Date"] = pd.to_datetime(df["Date"])
        df = df[(df["Date"] > min_date) & (df["Date"] < max_date)]
        df["Date"] = df.apply(lambda row: string_date(row), axis=1)
        log(
            f"**{df.shape[0]} rows after filtering**: Min and max date set.",
            verbose=verbose,
        )

    return df


# ### Main clean function (`clean_data`)

# In[7]:


# Main clean function


def clean_data(df, drop_cols=[], verbose=True):
    def get_performer(row, null_value=""):
        """(internal) for use with DataFrame lambda function to return the cleaned-up version of a performer's name (in an order of priority)"""

        first_name = row["Performer first-name"]
        last_name = row["Performer last-name"]

        if last_name and not first_name:
            return last_name

        if first_name and last_name:
            if not "—" in first_name and not "—" in last_name:
                return f"{first_name} {last_name}"

            elif not "—" in last_name and "—" in first_name:
                return last_name

            elif not "—" in first_name and "—" in last_name:
                return first_name

        for r in ["Normalized performer", "Performer"]:
            if row[r]:
                return row[r]

        return null_value

    def get_city(row, null_value=""):
        """(internal) for use with DataFrame lambda function to return the cleaned-up version of a city's name (in an order of priority)"""
        for r in ["Normalized City", "City"]:
            if row[r]:
                return row[r]

        return null_value

    def get_unique_venue(row, null_value=""):
        """(internal) for use with DataFrame lambda function to return the cleaned-up version of a venue's name (in an order of priority)"""
        if row["Venue"] and row["City"]:
            return row["Venue"] + " (" + row["City"] + ")"

        for r in ["Venue", "City"]:
            if row[r]:
                return row[r]

        return null_value

    def get_source(row, null_value=""):
        """(internal) for use with DataFrame lambda function to return the cleaned-up version of a source (in an order of priority)"""
        for r in ["Source clean", "Source"]:
            if row[r]:
                g = re.search(
                    r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", row[r]
                )
                if not g:
                    g = re.search(r"\d{4}-\d{2}-\d{2}", row[r])
                    if not g:
                        return f"{row[r]} ({datetime.datetime.strptime(row['Date'], '%Y-%m-%d').strftime('%B %d, %Y')})"
                return row[r]

        return (null_value,)

    def get_revue(row, null_value=""):
        """(internal) for use with DataFrame lambda function to return the cleaned-up version of a revue's name (in an order of priority)"""
        for r in ["Normalized Revue Name", "Revue name"]:
            if row[r]:
                return row[r]

        return null_value

    # Clean up names
    df["Performer"] = df.apply(lambda row: get_performer(row), axis=1)
    df["City"] = df.apply(lambda row: get_city(row), axis=1)
    df["Source"] = df.apply(lambda row: get_source(row), axis=1)
    df["Revue"] = df.apply(lambda row: get_revue(row), axis=1)
    df["Unique venue"] = df.apply(lambda row: get_unique_venue(row), axis=1)
    log(f"**Cleaned up all names**.", verbose=verbose)

    # Drop unnecessary information
    for col in drop_cols:
        try:
            del df[col]
        except KeyError:
            pass  # already gone

    df = df.rename(columns={"Unique venue": "Venue"})

    log(
        f"**Fixed columns**: Renamed some columns and removed all unneccesary columns.",
        verbose=verbose,
    )

    return df


# # Create a clean, basic dataset from Sheets

# ## Set up functions

# In[8]:


def get_clean_network_data(min_date=None, max_date=None, drop_cols=None, verbose=True):
    """A "collector" function that runs through `get_raw_data`, `filter_data` and `clean_data` in that order and then resets the index."""

    df = get_raw_data(verbose=verbose)
    df = filter_data(df, min_date=min_date, max_date=max_date, verbose=verbose)

    if not drop_cols:
        drop_cols = [
            "EIMA",
            "Imported from former archive",
            "Search (newspapers.com)",
            "Search (fulton)",
            "Venue",
            "Revue name",
            "Normalized Revue Name",
            "Legal name",
            "Alleged age",
            "Assumed birth year",
            "Source clean",
            "Category",
            "2020-12-31 ID",
            "Normalized City",
            "Performer first-name",
            "Performer last-name",
            "Normalized performer",
            "has_required_data",
            "has_correct_date",
            "Exclude from visualization",
            "Blackface",
            "Sepia",
            "Fan dancer/Sally Rand",
            "Exotic/erotic/oriental dancer/Gypsy",
            "Has image",
            "Address",
            "Vaudeville Circuit/Circus",
            "Edge Comment",
            "Comment on node: performer",
            "Comment on node: venue",
            "Comment on node: city",
            "Comment on edge: revue",
            "Normalized Venue",
        ]  # , 'Unsure whether drag artist'

    df = clean_data(df, drop_cols, verbose=verbose)

    df = df.reset_index(drop=True)
    log(f"**Index has been reset**.", verbose=verbose)

    return df


# ## Clean data generated
#
# Dataframe `df` generated, which can create good network data.

# In[9]:


df = get_clean_network_data(
    min_date=datetime.datetime(year=1930, month=1, day=1),
    max_date=datetime.datetime(year=1940, month=12, day=31),
    verbose=False,
)

# To illustrate, we show a 10-row random sample:
# df.sample(10).sort_index()


# # Group data

# ## Set up functions

# In[10]:


def get_performers_who_were_there(df, where=None, when=[]):
    """Returns a list of all the performers from any list of dates and venue"""

    """
    How this function works:
    get_performers_who_were_there(df, 'Band Box (Syracuse, NY)', ['1935-03-29', '1935-04-05', '1935-04-12', '1935-04-19'])
    """
    if not isinstance(when, list):
        when = [when]

    all_values = []
    for when in when:
        if isinstance(when, datetime.datetime):
            when = when.strftime("%Y-%m-%d")

        selected_rows = df[(df["Date"] == when) & (df["Venue"] == where)]

        all_values.extend(selected_rows["Performer"])

    return sorted(list(set(all_values)))


def group_dates(
    dates: list = [], delta=datetime.timedelta(days=14), dateformat="%Y-%m-%d"
):
    """https://gist.github.com/kallewesterling/9a8d12ce073776ed52865bfb362ad073"""

    """
    Chains dates together by looking for the delta between any given dates in a list
    
    Example:
    
    (A.) Provided that the delta is `days=14`,
         the left side will generate the right side:
            [                           [
                1935-01-13,               [1935-01-13, 1935-01-26,
                1935-01-26,                1935-02-11, 1935-02-05],
                1935-02-11,
                1935-02-05,
                1935-04-01,               [1935-04-01, 1935-04-06]
                1935-04-06
            ]                           ]
            
    (B.) Provided that the delta is `days=3`,
         the left side will generate the right side:
            [                           [
                1935-01-13,               [1935-01-13],
                1935-01-26,               [1935-01-26],
                1935-02-11,               [1935-02-11],
                1935-02-05,               [1935-02-05],
                1935-04-01,               [1935-04-01],
                1935-04-06                [1935-04-06]
            ]                           ]

    """

    try:
        dates = sorted([datetime.datetime.strptime(x, dateformat) for x in dates])
    except ValueError as e:
        date = re.search(r"""['"](.*)['"] does not match format""", str(e))
        if date:
            date = date.groups()[0]
        raise ValueError(
            f"A date found in list that did not adhere to format (`{date}`). Needs to follow format `{dateformat}`."
        ) from None

    if isinstance(delta, int):
        delta = datetime.timedelta(days=delta)

    periods = []

    for ix, date in enumerate(dates):
        min_date = date - delta
        max_date = date + delta

        prev_date, next_date = None, None
        start_chain, end_chain, in_chain, solo_date = None, None, None, None
        prev_date_in_range, next_date_in_range = None, None

        try:
            if ix - 1 >= 0:
                prev_date = dates[ix - 1]
        except IndexError:
            prev_date = None

        try:
            next_date = dates[ix + 1]
        except IndexError:
            next_date = None

        if next_date:
            next_date_in_range = next_date >= min_date and next_date <= max_date

        if prev_date:
            prev_date_in_range = prev_date >= min_date and prev_date <= max_date

        if all([next_date, prev_date, prev_date_in_range, next_date_in_range]):
            # In the loop and in a chain (near previous date and next)
            in_chain = True
        elif all([next_date, prev_date, next_date_in_range]) and not prev_date_in_range:
            # In the loop and beginning of a chain (not near previous date but near next)
            start_chain = True
        elif all([next_date, prev_date, prev_date_in_range]) and not next_date_in_range:
            # In the loop and end of a chain (near previous date but not next)
            end_chain = True
        elif all([next_date, prev_date]) and not all(
            [prev_date_in_range, next_date_in_range]
        ):
            # In the loop but solo date (not not near previous date nor next)
            solo_date = True
        elif next_date and next_date_in_range:
            # In the loop but solo date (not not near previous date nor next)
            start_chain = True
        elif next_date:
            solo_date = True
        elif prev_date and prev_date_in_range:
            end_chain = True
        elif prev_date:
            solo_date = True
        elif not next_date and not prev_date:
            solo_date = True
        else:
            raise RuntimeError("An unexpected error occurred.")

        date_str = date.strftime("%Y-%m-%d")

        if start_chain:
            periods.append([date_str])

        elif end_chain:
            periods[len(periods) - 1].append(date_str)

        elif solo_date:
            periods.append([date_str])

        elif in_chain:
            periods[len(periods) - 1].append(date_str)

    return periods


def get_group_data(df, days=settings["DAYSPANS"], verbose=False):
    data_dict = {}

    venue_count = len(df.groupby("Venue"))
    i = 1
    for venue, row in df.groupby("Venue"):
        i += 1
        for num_days in days:
            log(
                f'Generating group data for spans of {", ".join([str(x) for x in days])} days.',
                verbose=verbose,
            )
            log(
                f"   [{i}/{venue_count}] processing venue {venue} (date span {num_days} days)...",
                verbose=verbose,
            )
            clear_output(wait=True)
            all_dates = list(set(row.Date))
            grouped_dates = group_dates(
                all_dates, delta=datetime.timedelta(days=num_days)
            )
            for ix, date_group in enumerate(grouped_dates, start=1):
                if not venue in data_dict:
                    data_dict[venue] = {}
                if not f"grouped-by-{num_days}-days" in data_dict[venue]:
                    data_dict[venue][f"grouped-by-{num_days}-days"] = {}

                revues = list(set([x for x in row.Revue if x]))
                cities = list(set([x for x in row.City if x]))

                data_dict[venue][f"grouped-by-{num_days}-days"][f"date_group-{ix}"] = {
                    "dates": date_group,
                    "performers": get_performers_who_were_there(df, venue, date_group),
                    "revues": revues,
                    "cities": cities,
                }
    log(f"Generated group data for {venue_count} venues.", verbose=verbose)
    return data_dict


# ## Get grouped data

# In[11]:


group_data_dict = get_group_data(df)


# ### Grouped data meta dataset
#
# Starts collecting a `metadata` dictionary.

# In[12]:


metadata = {}

df_grouped_dates = pd.DataFrame()

venue_span_data = {}
# Loop through each venue with adhering data
for venue, row in df.groupby("Venue"):
    d = {}
    for days in [3, 14, 31, 93, 186, 365]:
        all_dates = list(set(row.Date))
        # print(venue, all_dates)
        grouped_dates = group_dates(all_dates, delta=datetime.timedelta(days=days))
        max_span = 0
        max_performers_in_date_group = 0
        group_member_counters = Counter()
        for date_group in grouped_dates:
            venue_span_data[str(date_group)] = {}
            performers_in_date_group = []
            last_day_in_date_group = max(
                [datetime.datetime.strptime(x, "%Y-%m-%d") for x in date_group]
            )
            first_day_in_date_group = min(
                [datetime.datetime.strptime(x, "%Y-%m-%d") for x in date_group]
            )
            datespan = (last_day_in_date_group - first_day_in_date_group).days
            if datespan > max_span:
                max_span = datespan
            for performer in [
                get_performers_who_were_there(df, where=venue, when=x)
                for x in date_group
            ]:
                performers_in_date_group.extend(performer)
            performers_in_date_group = list(set(performers_in_date_group))
            if len(performers_in_date_group) > max_performers_in_date_group:
                max_performers_in_date_group = len(performers_in_date_group)
            group_member_counters[len(performers_in_date_group)] += 1
            # print(venue, first_day_in_date_group, last_day_in_date_group, performers_in_date_group)
        d[f"num_groups (#, delta: {days} days)"] = len(grouped_dates)
        d[f"max_span (days, delta: {days} days)"] = max_span
        d[
            f"max performers in a group (#, delta: {days} days)"
        ] = max_performers_in_date_group
        d[
            f"group_member_counters for venue (#, delta: {days} days)"
        ] = group_member_counters
    s = pd.Series(d, name=venue)
    df_grouped_dates = df_grouped_dates.append(s)
    dtype = {
        key: int
        for key in [x for x in d.keys() if not "group_member_counters for venue" in x]
    }
    df_grouped_dates = df_grouped_dates.astype(dtype)

# display(Markdown('### Sample of 10 random points in the dataset\n\nEach span (`3 days`, `14 days`, `31 days`, `93 days`, `186 days`, and `365 days`) has a `num_groups` column, a `max_span` column, and a `max performers` column.'))
# df_grouped_dates[list(d.keys())].sample(10).sort_values('num_groups (#, delta: 3 days)', ascending=False)


# In[13]:


metadata["grouped_dates"] = df_grouped_dates[list(d.keys())].T.to_json()


# # Network grouped data
#
# Setting up networks with nodes and edges for each of the day spans.

# In[14]:


networks = {}

venue_count = len(group_data_dict)
i = 0
for venue, data in group_data_dict.items():
    i += 1
    for grouped_by, data2 in data.items():
        clear_output(wait=True)
        # log(f'Generating network for {grouped_by}.')
        # log(f'   [{i}/{venue_count}] processing venue {venue}...')
        if not grouped_by in networks:
            networks[grouped_by] = nx.Graph()
            networks[grouped_by].generated = datetime.datetime.now()

        for date_group_id, data3 in data2.items():
            if len(data3["performers"]) > 1:
                performers = data3["performers"]
                dates = data3["dates"]
                revues = data3["revues"]
                cities = data3["cities"]
                for performer in performers:
                    for target in [x for x in performers if not x == performer]:
                        edge = (performer, target)
                        if not edge in networks[grouped_by].edges:
                            networks[grouped_by].add_edges_from([edge], coLocated={})
                        if not venue in networks[grouped_by].edges[edge]["coLocated"]:
                            networks[grouped_by].edges[edge]["coLocated"][venue] = []
                        if (
                            not dates
                            in networks[grouped_by].edges[edge]["coLocated"][venue]
                        ):
                            networks[grouped_by].edges[edge]["coLocated"][venue].append(
                                dates
                            )

                        if not "revues" in networks[grouped_by].edges[edge]:
                            networks[grouped_by].edges[edge]["revues"] = []
                        if not revues in networks[grouped_by].edges[edge]["revues"]:
                            networks[grouped_by].edges[edge]["revues"].append(revues)

                        if not "cities" in networks[grouped_by].edges[edge]:
                            networks[grouped_by].edges[edge]["cities"] = []
                        if not cities in networks[grouped_by].edges[edge]["cities"]:
                            networks[grouped_by].edges[edge]["cities"].append(cities)


# In[15]:


def drop_unnamed(n):
    return not "unnamed" in n.lower()


_networks = {}

for key in networks.keys():
    _networks[key] = copy.deepcopy(networks[key])
    _networks[f"{key}-no-unnamed-performers"] = nx.subgraph_view(
        _networks[key], filter_node=drop_unnamed
    )
    _networks[f"{key}-no-unnamed-performers"].generated = datetime.datetime.now()

networks = _networks


# In[ ]:


# # Edge meta/weight

# In[16]:


for key in networks.keys():
    for edge in list(networks[key].edges):
        networks[key].edges[edge]["weights"] = {}
        for co_located, date_groups in networks[key].edges[edge]["coLocated"].items():
            networks[key].edges[edge]["weights"]["dateGroups"] = len(date_groups)
        networks[key].edges[edge]["weights"]["venues"] = len(
            networks[key].edges[edge]["coLocated"]
        )


# # Node meta/comments

# ## Set up functions for getting node meta information
#
# Node meta information = things like comments, images, etc

# In[17]:


def get_meta_data(df, category=None, verbose=False):
    meta_data = {"performers": {}, "venues": {}, "cities": {}, "revues": {}}

    MAP = {
        "performers": {
            "cleaned_row_name": "Performer",
            "MAPPING": {
                "comments": "Comment on node: performer",
                "legal_names": "Legal name",
                "alleged_ages": "Alleged age",
                "assumed_birth_years": "Assumed birth year",
                "images": "Has image",
                "exotic_dancer": "Exotic/erotic/oriental dancer/Gypsy",
                "fan_dancer": "Fan dancer/Sally Rand",
                "blackface": "Blackface",
                "sepia": "Sepia",
            },
        },
        "cities": {
            "cleaned_row_name": "City",
            "MAPPING": {"comments": "Comment on node: city"},
        },
        "venues": {
            "cleaned_row_name": "Venue",
            "MAPPING": {"comments": "Comment on node: venue"},
        },
        "revues": {
            "cleaned_row_name": "Revue",
            "MAPPING": {"comments": "Comment on edge: revue"},
        },
    }

    # No need to change anything below

    for meta_data_category, d in MAP.items():
        if category and not meta_data_category == category:
            continue

        log(
            f"Fetching node meta information for {meta_data_category}...",
            verbose=verbose,
        )
        for ix, row in df.iterrows():
            if not row[d["cleaned_row_name"]] in meta_data[meta_data_category]:
                meta_data[meta_data_category][row[d["cleaned_row_name"]]] = {}

            for key, column_name in d["MAPPING"].items():
                if not key in meta_data[meta_data_category][row[d["cleaned_row_name"]]]:
                    meta_data[meta_data_category][row[d["cleaned_row_name"]]][key] = []

                if row[column_name]:
                    source = row["Source"]
                    content = row[column_name]
                    if isinstance(content, str) and content.lower() == "true":
                        content = True

                    meta_data[meta_data_category][row[d["cleaned_row_name"]]][
                        key
                    ].append({"source": source, "content": content})

    return meta_data


def get_meta(df=None, category=None, verbose=False):
    if not isinstance(df, pd.DataFrame):
        log("Building new clean data for node meta information...", verbose=verbose)
        df = get_raw_data(verbose=False)
        df = filter_data(df, max_date=None, min_date=None, verbose=False)
        df = clean_data(df, drop_cols=["Venue"], verbose=False)

    all_meta = get_meta_data(df, category=category)

    if not category:
        return all_meta

    return all_meta[category]


# ## Get  node meta data from sheet
#
# `node_meta` fetches the information, then we loop through each network and add the meta data to each node.

# In[18]:


all_meta = get_meta()
# adding all the meta data for nodes and edges to metadata['content']
metadata["content"] = all_meta


# ## Add manual meta information to each network's nodes

# In[ ]:


for key in networks.keys():
    nx.set_node_attributes(networks[key], all_meta["performers"])

# log(f'Finished setting meta information about performers on all {len(networks)} networks.')


# ## Get automatic network meta information per node

# ### Set up functions

# In[ ]:


def get_connected_nodes_per_node(G):
    return {node: sorted(nx.bfs_tree(G, node, reverse=False).nodes) for node in G.nodes}


def get_unique_networks(connected_nodes_per_node):
    if isinstance(connected_nodes_per_node, dict):
        pass  # fine!
    elif isinstance(connected_nodes_per_node, nx.classes.graph.Graph):
        connected_nodes_per_node = get_connected_nodes_per_node(
            connected_nodes_per_node
        )
    else:
        raise RuntimeError(
            "connected_nodes_per_node provided must be either a dictionary of nodes connected together or a networkx Graph object."
        )

    unique_networks = []
    for network in list(connected_nodes_per_node.values()):
        if not network in unique_networks:
            unique_networks.append(network)
    return unique_networks


# ### Add data to each network's nodes

# In[ ]:


for key in networks.keys():
    unique_networks = get_unique_networks(networks[key])
    # log(f'Adding connected network data for network `{key}` ({len(unique_networks)} unique networks found)...')

    for network_id, unique_network in enumerate(unique_networks, start=1):
        for performer in unique_network:
            networks[key].nodes[performer]["connected"] = {
                "network": {
                    "nodes": [x for x in unique_network if not x == performer],
                    "network_id": network_id,
                }
            }


# ## Get communities per node

# ### Set up custom functions

# In[ ]:


def merge_community_dicts(*args):
    _ = {}
    for dictionary in args:
        for performer, data in dictionary.items():
            if not performer in _:
                _[performer] = {}
            for key, value in data.items():
                if not key in _[performer]:
                    if isinstance(value, dict):
                        _[performer][key] = {}
                    else:
                        raise NotImplemented("Nope")
                for key2, value2 in value.items():
                    if not key2 in _[performer][key]:
                        _[performer][key][key2] = value2
                    else:
                        raise NotImplemented("This should not happen")

    return _


# ### Set up dictionaries with all the community information

# In[ ]:


for key in networks.keys():
    # log(f'Setting community data on nodes in network {key}...')

    # Run Louvain algorithm
    louvain = community_louvain.best_partition(networks[key])
    louvain = {
        performer: {"modularities": {"Louvain": community_number}}
        for performer, community_number in louvain.items()
    }

    # Run Clauset Newman Moore algorithm
    c = nx.community.greedy_modularity_communities(networks[key])
    clauset_newman_moore = {
        performer: {"modularities": {"Clauset-Newman-Moore": community_number}}
        for community_number, list_of_performers in enumerate(c, start=1)
        for performer in list_of_performers
    }

    # Run Girvan Newman algorithm
    """
    # TODO: This won't work
    gn = nx.community.girvan_newman(networks[key])
    first_girvan_newman_iteration = next(gn)
    girvan_newman_groups = {group: names for group, names in enumerate([list(x) for x in first_girvan_newman_iteration], start=1)}
    """

    community_dicts = merge_community_dicts(louvain, clauset_newman_moore)

    nx.set_node_attributes(networks[key], community_dicts)


# ## Set centrality data per node

# In[ ]:


for key in networks.keys():
    # log(f'Setting centrality data on nodes in network {key}...')
    for performer in networks[key].nodes:
        networks[key].nodes[performer]["centralities"] = {}

    # log(f' --> `degree_centrality`')
    for performer, degree in nx.degree_centrality(networks[key]).items():
        networks[key].nodes[performer]["centralities"][
            "degree_centrality_100x"
        ] = round(degree * 100, 6)

    # log(f' --> `betweenness_centrality`')
    for performer, degree in nx.betweenness_centrality(
        networks[key], k=len(networks[key].nodes)
    ).items():
        networks[key].nodes[performer]["centralities"][
            "betweenness_centrality_100x"
        ] = round(degree * 100, 6)

    # log(f' --> `eigenvector_centrality`')
    for performer, degree in nx.eigenvector_centrality(
        networks[key], max_iter=100, weight="weight"
    ).items():
        networks[key].nodes[performer]["centralities"][
            "eigenvector_centrality_100x"
        ] = round(degree * 100, 6)

    # TODO: Katz centrality keeps failing within 1000 iterations :/
    # log(f' --> `katz_centrality`')
    # try:
    #    for performer, degree in nx.katz_centrality(networks[key]).items():
    #        networks[key].nodes[performer]['centralities']['katz_centrality_100x'] = round(degree*100, 6)
    # except nx.exception.PowerIterationFailedConvergence as e:
    #    print(f'Katz Centrality failed: {e}')

    # log(f' --> `closeness_centrality`')
    for performer, degree in nx.closeness_centrality(networks[key]).items():
        networks[key].nodes[performer]["centralities"][
            "closeness_centrality_100x"
        ] = round(degree * 100, 6)


# ## Set degree per node

# ### Set up function

# In[ ]:


def get_degrees(G, node):
    indegree = sum([1 for edge in G.edges if edge[0] == node])
    outdegree = sum([1 for edge in G.edges if edge[1] == node])
    degree = indegree + outdegree

    return {"indegree": indegree, "outdegree": outdegree, "degree": degree}


# ### Add data to each network's nodes

# In[ ]:


for key in networks.keys():
    # log(f'Setting degree data on {len(networks[key].nodes)} nodes in network {key}...')
    degrees = {
        node: {"degrees": get_degrees(networks[key], node)}
        for node in networks[key].nodes
    }
    nx.set_node_attributes(networks[key], degrees)


# ## Add additional node and edge metadata

# In[ ]:


for key, network in networks.items():
    for node in networks[key].nodes:
        networks[key].nodes[node]["node_id"] = slugify(node)
        networks[key].nodes[node]["category"] = "performer"
        networks[key].nodes[node]["display"] = node

    for edge in networks[key].edges:
        networks[key].edges[edge]["edge_id"] = slugify(f"{edge[0]}-{edge[1]}")
        networks[key].edges[edge]["comments"] = []  # TODO
        networks[key].edges[edge]["general_comments"] = []  # TODO

        # setup 'found' property of edges
        networks[key].edges[edge]["found"] = []
        for _, dates in networks[key].edges[edge]["coLocated"].items():
            for datelist in dates:
                for date in datelist:
                    if not date in networks[key].edges[edge]["found"]:
                        networks[key].edges[edge]["found"].append(date)

        # setup 'comments' for all of the involved venues, cities, revues
        networks[key].edges[edge]["comments"] = {
            "venues": {},
            "cities": {},
            "revues": {},
        }

    networks[grouped_by].finished = datetime.datetime.now()


# # Export to JSON data

# In[ ]:


for key in networks:
    file_name = f"co-occurrence-{key}.json"

    data = nx.node_link_data(networks[key])
    data["createdDate"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    diff = datetime.datetime.now() - networks[key].generated
    data["timeToCreate"] = {
        "minutes": diff.seconds // 60,
        "seconds": diff.seconds % 60,
        "totalInSeconds": diff.seconds,
    }
    data["days"] = re.findall(r"\d+", key)[0]

    with open("./network-app/data/" + file_name, "w+") as fp:
        json.dump(obj=data, fp=fp)
        # log(f'Saved {fp.name} (took {round((data["timeToCreate"]["totalInSeconds"]/60), 2)} minutes to generate)')

with open("./network-app/data/co-occurrence-_metadata.json", "w+") as fp:
    json.dump(obj=metadata, fp=fp)
    # log(f'Saved metadata file.')


# # Export to other formats (optional)

# ## Gephi
#
# The following part of the script removes all the metadata from the graph (which causes trouble with Gephi's file format) and generates "naked" network files for each of the co-occurrence graphs.

# In[ ]:


gexf_networks = copy.deepcopy(networks)

for key in gexf_networks:
    for node in gexf_networks[key].nodes:
        for k in [
            "comments",
            "legal_names",
            "alleged_ages",
            "assumed_birth_years",
            "images",
            "exotic_dancer",
            "fan_dancer",
            "blackface",
            "sepia",
        ]:
            if k in gexf_networks[key].nodes[node]:
                del gexf_networks[key].nodes[node][k]
    for edge in gexf_networks[key].edges:
        for k in [
            "coLocated",
            "revues",
            "cities",
            "weights",
            "edge_id",
            "comments",
            "general_comments",
            "found",
        ]:
            if k in gexf_networks[key].edges[edge]:
                del gexf_networks[key].edges[edge][k]

for key in gexf_networks:
    file_name = f"gephi/co-occurrence-{key}.gexf"

    nx.write_gexf(gexf_networks[key], file_name)
    # log(f'Saved {file_name}')


# In[ ]:


# In[ ]:


# In[ ]:
