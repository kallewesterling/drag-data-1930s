import re
import pandas as pd
import datetime
from .meta import log


def filter_data(df, min_date=None, max_date=None, verbose=False):
    """Main filter function"""

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

    _df = df.copy()

    _df["has_required_data"] = _df.apply(lambda row: has_required_data(row), axis=1)
    _df.drop(_df[_df["has_required_data"] == False].index, inplace=True)
    log(f"**{_df.shape[0]} rows after filtering**: Required data.", verbose=verbose)

    # Filter
    _df.drop(_df[_df["Exclude from visualization"] == True].index, inplace=True)
    _df.drop(_df[_df["Exclude from visualization"] == "TRUE"].index, inplace=True)
    log(
        f"**{_df.shape[0]} rows after filtering**: Exclusion from visulization.",
        verbose=verbose,
    )

    # Filter
    _df.drop(_df[_df["Unsure whether drag artist"] == True].index, inplace=True)
    _df.drop(_df[_df["Unsure whether drag artist"] == "TRUE"].index, inplace=True)
    log(
        f"**{_df.shape[0]} rows after filtering**: Unsure whether drag artist.",
        verbose=verbose,
    )

    _df["has_correct_date"] = _df.apply(lambda row: has_correct_date(row), axis=1)
    _df.drop(_df[_df["has_correct_date"] == False].index, inplace=True)
    log(
        f"**{_df.shape[0]} rows after filtering**: Full date in `Date` column.",
        verbose=verbose,
    )

    if min_date or max_date:
        _df["Date"] = pd.to_datetime(_df["Date"])
        _df = _df[(_df["Date"] > min_date) & (_df["Date"] < max_date)]
        _df["Date"] = _df.apply(lambda row: string_date(row), axis=1)
        log(
            f"**{_df.shape[0]} rows after filtering**: Min and max date set.",
            verbose=verbose,
        )

    return _df


def filter_by_date(df, start_year=1930, end_year=1940):
    _df = df.copy()
    _df.Date = pd.to_datetime(_df.Date)

    start_date, end_date = None, None

    if start_year:
        start_date = datetime.datetime(year=start_year, month=1, day=1)
    if end_year:
        end_date = datetime.datetime(year=end_year, month=12, day=31)

    if start_date and end_date:
        return _df.loc[(_df["Date"] >= start_date) & (_df["Date"] < end_date)]
    elif start_date:
        return _df.loc[(_df["Date"] >= start_date)]
    elif end_date:
        return _df.loc[(_df["Date"] < end_date)]
