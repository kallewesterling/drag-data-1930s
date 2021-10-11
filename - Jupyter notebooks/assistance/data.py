# Utilities to handle the data set

import pandas as pd
from .utils import log
import re, datetime


def get_raw_data(
    verbose=True,
    url="https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=254069133&single=true&output=csv",
):
    ''' loads in the main dataframe and does a simple cleanup '''
    df = pd.read_csv(url)

    df.replace("—", "", inplace=True)
    df.replace("—*", "", inplace=True)
    df.replace("–", "", inplace=True)
    df.fillna("", inplace=True)

    log(f"**{df.shape[0]} rows imported.**", verbose=verbose)

    return df
    

def filter_data(df, min_date=None, max_date=None, verbose=True, skip_unsure=False):
    ''' Filtering dataframe '''

    def has_required_data(row):
        """(internal) for use with DataFrame lambda function to ensure that any given row has the required data present"""
        has_performer = (
            row["Performer"] != ""
            or row["Normalized performer"] != ""
            or (row["Performer first-name"] != "" or row["Performer last-name"]) != ""
        )
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

    df = df.copy()

    df["has_required_data"] = df.apply(lambda row: has_required_data(row), axis=1)
    df.drop(df[df["has_required_data"] == False].index, inplace=True)
    log(f"**{df.shape[0]} rows after filtering**: Required data.", verbose=verbose)

    df.drop(df[df["Exclude from visualization"] == True].index, inplace=True)
    df.drop(df[df["Exclude from visualization"] == "TRUE"].index, inplace=True)
    log(
        f"**{df.shape[0]} rows after filtering**: Exclusion from visulization.",
        verbose=verbose,
    )

    if skip_unsure == False:
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


def clean_data(df, drop_cols=[], verbose=True, forbidden=["?", "[", "]"]):
    def get_performer(row, null_value=""):
        """(internal) for use with DataFrame lambda function to return the cleaned-up version of a performer's name (in an order of priority)"""

        first_name = row["Performer first-name"]
        last_name = row["Performer last-name"]

        returnVal = None

        if not returnVal and (last_name and not first_name):
            returnVal = last_name

        if not returnVal and (
            row["Normalized performer"]
            and not "—" in row["Normalized performer"]
            and not "–" in row["Normalized performer"]
        ):
            returnVal = row["Normalized performer"]

        if not returnVal and (first_name and last_name):
            if not "—" in first_name and not "—" in last_name:
                returnVal = f"{first_name} {last_name}"

            elif not "—" in last_name and "—" in first_name:
                returnVal = last_name

            elif not "—" in first_name and "—" in last_name:
                returnVal = first_name

        if not returnVal and row["Performer"]:
            returnVal = row["Performer"]

        if not returnVal:
            return null_value

        return "".join([x for x in returnVal if not x in forbidden])

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

    df["Performer"] = df.apply(lambda row: get_performer(row), axis=1)
    df["City"] = df.apply(lambda row: get_city(row), axis=1)
    df["Source"] = df.apply(lambda row: get_source(row), axis=1)
    df["Revue"] = df.apply(lambda row: get_revue(row), axis=1)
    df["Unique venue"] = df.apply(lambda row: get_unique_venue(row), axis=1)
    log(f"**Cleaned up all names**.", verbose=verbose)

    for col in drop_cols:
        try:
            del df[col]
        except KeyError:
            pass

    df = df.rename(columns={"Unique venue": "Venue"})

    log(
        f"**Fixed columns**: Renamed some columns and removed all unneccesary columns.",
        verbose=verbose,
    )

    return df


def get_clean_network_data(
    min_date=None,
    max_date=None,
    drop_cols=None,
    verbose=True,
    url="https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=254069133&single=true&output=csv",
):
    """A "collector" function that runs through `get_raw_data`, `filter_data` and `clean_data` in that order and then resets the index."""

    df = get_raw_data(verbose=verbose, url=url)
    df = filter_data(df, min_date=min_date, max_date=max_date, verbose=verbose)

    if not drop_cols:
        drop_cols = [
            "EIMA_Search",
            # "EIMA_ID",
            "Newspaper",
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
        ]

    df = clean_data(df, drop_cols, verbose=verbose)

    df = df.reset_index(drop=True)
    log(f"**Index has been reset**.", verbose=verbose)

    return df
