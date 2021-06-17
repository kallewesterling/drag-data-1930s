import pandas as pd
from pathlib import Path
from .settings import Settings

"""
def test_same_df(df1, df2):
    # A function that verifies whether two Pandas DataFrames are in fact the same.
    # NOTE: This function is overridden below.
    try:
        for cols in [[x for x in df1.columns], [x for x in df2.columns]]:
            for col in cols:
                for ix, row in (df1 == df2).iterrows():
                    if not all([row[col] for col in cols]):
                        return False
                if not [x for x in df1[col]] == [x for x in df2[col]]:
                    return False
    except ValueError:
        return False
    return True
"""


def test_same_df(df1, df2):
    """A function that verifies whether two Pandas DataFrames are in fact the same."""

    try:
        cols = set(df1.columns)
        cols.update(df2.columns)
        for col in cols:
            for ix, row in (df1 == df2).iteritems():
                if not set(row) == {True}:
                    return False
    except ValueError:
        return False

    return True


def get_cached_data():
    return pd.read_pickle("network-app/data/_df.pickle")


class Cache(Settings):
    def cache_file_path(self):
        """Checks whether cache dir exists and returns the path to the cache file in the correct directory."""
        if not Path(self.CACHE_FILE_DIR).exists():
            Path(self.CACHE_FILE_DIR).mkdir(parents=True)

        cache_file = Path(f"{self.CACHE_FILE_DIR}{self.CACHE_FILE}")

        return cache_file

    def get_from_source(self):
        df = pd.read_csv(self.URL)
        return df.to_csv(index=False)

    def set_cache_file(self):
        """Gets the content from the dataset and saves to cache file path."""
        contents = self.get_from_source()
        self.cache_file_path().write_text(contents)

    def get_contents(self):
        """Gets the content from the dataset and saves to cache file path."""
        if self.has_cache_file():
            return self.cache_file_path().read_text()
        raise RuntimeError("No cache file exists.")

    def has_cache_file(self):
        """Checks if the cache file path exists. If it does, returns the path (otherwise False)."""
        if not self.cache_file_path().exists():
            return False
        else:
            return self.cache_file_path()

    def __init__(self):
        if not self.has_cache_file():
            self.set_cache_file()

        if not self.has_cache_file():
            raise RuntimeError("Cache file could not be downloaded.")

    def reset_cache(self):
        self.cache_file_path().unlink()
        self.__init__()

    @property
    def data(self):
        return self.get_contents()

    @property
    def compare_online(self):
        if not self.has_cache_file():
            return False

        online_content = self.get_from_source()
        cache_content = self.get_contents()

        source_lines = online_content.splitlines()
        cache_lines = cache_content.splitlines()

        if source_lines == cache_lines:
            return True

        return False

    @property
    def as_dataframe(self):
        return pd.read_csv(self.cache_file_path())
