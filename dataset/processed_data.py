import json
import pandas as pd
from pathlib import Path


def get_geolocated_performers(
    df, start_year=None, end_year=None, download_geodata=False
):
    """returns a formatted pandas DataFrame based on a dataframe with geotagged information about the performers whereabouts by year"""

    def get_year(row):
        return pd.to_datetime(row.Date).year

    df["Year"] = df.apply(lambda row: get_year(row), axis=1)

    output = pd.DataFrame()

    performer_by_year = {}
    for groups, row in df.groupby(["Performer", "Year"]):
        performer, year = groups
        if not performer in performer_by_year:
            performer_by_year[performer] = {}

        if start_year and end_year:
            if year < start_year or year > end_year:
                # print(f"year {year} is smaller than {start_year} or larger than {end_year}")
                continue
        elif start_year:
            if year < start_year:
                # print(f"year {year} is smaller than {start_year}")
                continue
        elif end_year:
            if year > end_year:
                # print(f"year {year} is larger than {end_year}")
                continue
        performer_by_year[performer][year] = set([str(x) for x in row.City if str(x)])

    for performer, data in performer_by_year.items():
        for year, cities in data.items():
            for city in cities:
                if Path(f".cache/{city}.json").exists():
                    json_data = json.loads(Path(f".cache/{city}.json").read_text())
                    lat = json_data["lat"]
                    lon = json_data["lon"]
                else:
                    lat, lon = None, None
                    if download_geodata:
                        raise NotImplementedError(
                            "This feature is not yet available but in a stable version, we will make sure to try to download the geodata here."
                        )

                if lat and lon:
                    s = pd.Series(
                        {
                            "performer": performer,
                            "year": year,
                            "city": city,
                            "lat": lat,
                            "lon": lon,
                        }
                    )
                    # output_csv += f"{performer},{year},{city},{lat},{lon}\n"
                    output = output.append(s, ignore_index=True)

    output.year = output.year.astype(int)

    return output
    # return output_csv
