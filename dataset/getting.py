import pandas as pd
from .meta import log
from .filtering import filter_data
from .cleaning import clean_data, basic_cleaning
from .cache import Cache


def get_raw_data(verbose=False, force_download=False):
    """The function that downloads the raw data from the spreadsheet"""

    cache = Cache()
    if not cache.compare_online or force_download == True:
        cache.reset_cache()

    df = cache.as_dataframe

    # Don't forget to run `basic_cleaning` on the DataFrame:
    basic_cleaning(df)

    log(f"**{df.shape[0]} rows imported.**", verbose=verbose)

    return df


def get_clean_network_data(
    df=None, min_date=None, max_date=None, drop_cols=None, verbose=False
):
    """A "collector" function that runs through `get_raw_data`, `filter_data` and `clean_data` in that order and then resets the index."""

    if isinstance(df, type(None)):
        df = get_raw_data(verbose=verbose)

    df = filter_data(df, min_date=min_date, max_date=max_date, verbose=verbose)

    if drop_cols == None:
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
