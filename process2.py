from difflib import SequenceMatcher
import re
import networkx as nx
import pandas as pd
import json
from datetime import datetime
from drag.settings import SPREADSHEET, DB_SPREADSHEET, START_YEAR, END_YEAR, CLEANING
from drag.place import Place
from pathlib import Path


df = pd.read_csv(SPREADSHEET, encoding='utf8')
graph = nx.DiGraph()

if not START_YEAR:
    print('Warning: no start year set.')

if not END_YEAR:
    print('Warning: no end year set.')

performer_meta = dict()

for row in df.fillna('').itertuples():
    _id, date, category, performer, club, _city, \
        normalized_city, revue_name, normalized_revue_name, \
        unsure_drag, legal_name, alleged_age, \
        assumed_birth_year, source, eima, \
        newspapers_search, fulton_search, \
        former_archive, comment = row

    if not date:
        # print(f'no date on row {_id}')
        continue  # skip ahead

    # Auto correcting
    if performer == "—" or performer == "-":
        performer = None

    # Disambiguating revue (access through `revue`)
    revue = None

    if not normalized_revue_name and revue_name:
        revue = revue_name
    elif normalized_revue_name:
        revue = normalized_revue_name

    del(normalized_revue_name)
    del(revue_name)

    # Disambiguating city (access through `city`)
    city = None

    if not normalized_city and _city:
        city = city
    elif normalized_city:
        city = normalized_city

    del(normalized_city)
    del(_city)

    if city and club:
        print('we have city and club')

    if club and revue:
        print('we have club and revue')

    if revue and performer:
        print('we have club and revue')

    if not club and revue and performer:
        print('we have no club but revue and performer')
