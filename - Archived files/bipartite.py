'''
Script that generates a bipartite directed graph from the dataset.
'''

from collections import Counter, OrderedDict
from collections import Counter
from difflib import SequenceMatcher
import re
import networkx as nx
import pandas as pd
import json
from datetime import datetime
from drag.settings import SPREADSHEET, DB_SPREADSHEET, CLEANING, NOT_ALLOWED_IN_ID, REPLACE_NUMBERS
from drag.place import Place
from pathlib import Path
from alive_progress import alive_bar

PROHIBITED_START_VALUE = r'^[-–—_.?]'
REQUIRED_COLUMNS = ['performer', 'venue', 'city', 'revue_name']

ERROR_LEVEL = 0


df = pd.read_csv(SPREADSHEET, encoding='utf8')
graph = nx.DiGraph()

def parse_row(row):
    data = {}
    data['row_num'], data['date'], data['category'], data['performer'], data['venue'], data['_city'], data['city'], data['_revue_name'], data['revue_name'], data['unsure_drag'], data['legal_name'], data['alleged_age'], data['assumed_birth_year'], data['source'], data['eima'], data['newspapers_search'], data['fulton_search'], data['former_archive'], data['comment'], data['exclude'], data['quote'], data['comment_performer'], data['comment_venue'], data['comment_city'], data['comment_revue'], data['id_dec_2020'], *_ = row
    
    if _ and ERROR_LEVEL > 1:
        print('Warning: Data encountered in row that was ineligible for parsing.')

    return data


def fix_date(date):
    date = date.replace('?', '').strip()

    try:
        date = datetime.strptime(date, '%Y-%m-%d')
    except ValueError as e:
        try:
            date = datetime.strptime(date.strip(), '%Y-%m')
        except ValueError as e:
            try:
                date = datetime.strptime(date.strip(), '%Y')
            except ValueError as e:
                raise RuntimeError(date, 'cannot be interpreted:', e)
    return date


def fix_data(data):
    data['exclude'] = data['exclude'] == True

    # Prioritize corrected city and revue names
    if data['city'] == '':
        data['city'] == data['_city']
    if data['revue_name'] == '':
        data['revue_name'] == data['_revue_name']

    # Drop uncorrected data
    del(data['_city'])
    del(data['_revue_name'])

    # Exclude data with no date
    if (data['date'] == '' or data['date'] == None) and (data['exclude'] == False):
        data['exclude'] = True

    # Fix dates
    if data['exclude'] == False and isinstance(data['date'], str):
        data['date'] = fix_date(data['date'])

    # Drop prohibited performer, venue, revue names
    for key in ['performer', 'venue', 'revue_name']:
        g = re.search(PROHIBITED_START_VALUE, data[key])
        if g:
            data[key] = re.sub(PROHIBITED_START_VALUE, '', data[key])

    if data['venue'] and data['city']:
        data['venue_display'], data['venue_id'] = data['venue'], f"{data['venue']}-{data['city']}".lower()
    elif data['venue']:
        data['venue_display'], data['venue_id'] = data['venue'], f"{data['venue']}".lower()

    for key, value in data.items():
        if isinstance(data[key], str):
            # Strip all leading and trailing whitespaces from strings
            data[key] = value.strip()

            if key != 'unsure_drag' and key != 'source' and 'comment' not in key:
                # Check for prohibited start values of certain columns
                g = re.search(PROHIBITED_START_VALUE, value)
                if g and ERROR_LEVEL > 1:
                    print(f"Warning: Looks like line ({key}) starts with a prohibited start value: {value}")

                if '?' in value and ERROR_LEVEL > 1:
                    print(f"Warning: data (column `{key}`) contains \"?\" where it might be misplaced: {value}.")

            # Set empties to None
            if value == '':
                data[key] = None

    return data


def dump_data(data, filtered_columns = []):
    import datetime as dt

    data = {k: v for k, v in data.items()} # make a copy

    for key, value in data.items():
        if not isinstance(data[key], str):
            if isinstance(data[key], dt.datetime):
                data[key] = value.strftime('%Y-%m-%d')
            else:
                try:
                    data[key] = str(value)
                except:
                    raise RuntimeError(f"Cannot serialize data of type {type(data[key])}")
    if filtered_columns:
        return_data = {}
        for column in filtered_columns:
            return_data[column] = data[column]
        return return_data

    return json.dumps(data)


def filter_data(data):
    from drag.settings import START_YEAR, END_YEAR

    # If already filtered (in fix_data, for instance) - drop data
    if data['exclude']:
        return None

    # Filter data if before START_YEAR or after END_YEAR
    if START_YEAR and END_YEAR:
        if data['date'].year < START_YEAR or data['date'].year > END_YEAR:
            data['exclude'] = True

    # Filter data where all of the REQUIRED_COLUMNS are empty
    if not any([data[x] != False and data[x] != '' and data[x] != None for x in REQUIRED_COLUMNS]):
        data['exclude'] = True

    # Filtered data returns `None`.
    if data['exclude']:
        return None
    
    # Unfiltered data returns `data` (dict).
    return data


collected = []
nodes = {}


def get_edge_data(graph, id1, id2):
    _ = {}
    d = graph.get_edge_data(id1, id2, default={})
    for category, standard in {'weight': 0, 'sources': [], 'revue_comments': [], 'venue_comments': []}.items():
        _[category] = d.get(category, standard)
    return _

def get_id(text):
    text = re.sub(NOT_ALLOWED_IN_ID, '', text.lower())
    text = REPLACE_NUMBERS(text)
    return text


comments = {}

multipartite_graph = nx.DiGraph()
bipartite_graph = nx.DiGraph()

with alive_bar(len(df)) as bar:
    for row in df.fillna('').itertuples():
        bar()
        data = parse_row(row)
        data = fix_data(data)
        data = filter_data(data)
        if not data:
            continue

        dataline = dump_data(data, REQUIRED_COLUMNS.append('date'))
        if not dataline in collected:
            collected.append(dump_data)
        else:
            if ERROR_LEVEL > 1: print("Row looks like duplicate:", json.loads(dataline))

        def get_data(g, data, col1, col2):
            edge_data = get_edge_data(g, data[col1], data[col2])
            if data['comment_revue']:
                edge_data['revue_comments'].append({'comment': data['comment_revue'], 'source': data['source']})
            if data['comment_venue']:
                edge_data['venue_comments'].append({'comment': data['comment_venue'], 'source': data['source']})
            if not data['source'] in edge_data['sources']:
                edge_data['sources'].append(data['source'])
                edge_data['weight'] += 1
            return edge_data

        # MULTI-PARTITE GRAPH
        if data['performer'] and data['venue']:
            # add edge between data['performer'] and data['venue']
            edge_data = get_data(multipartite_graph, data, 'performer', 'venue')
            print(edge_data.get('date'))

            multipartite_graph.add_weighted_edges_from(
                [data['performer'], data['venue'], edge_data['weight']],
                sources = edge_data['sources'],
                revue_name = edge_data.get('revue_name'),
                # date = edge_data.get('date').strftime('%Y-%m-%d'),
                revue_comments = edge_data['revue_comments'],
                venue_comments = edge_data['venue_comments'],
                edge_id = get_id(data['performer']+'-'+data['venue'])
            )

        # BIPARTITE GRAPH

        # do things with nodes
        if data['performer'] and data['city']:
            # add edge between data['performer'] and data['city']
            edge_data = get_data(bipartite_graph, data, 'performer', 'city')
            
            bipartite_graph.add_weighted_edges_from(
                [(data['performer'], data['city'], edge_data['weight'])],
                sources=edge_data['sources'],
                venue=data['venue'],
                revue_name=data.get('revue_name'),
                date=data['date'].strftime("%Y-%m-%d"),
                revue_comments=edge_data['revue_comments'],
                venue_comments=edge_data['venue_comments'],
                edge_id=get_id(data['performer']+'-'+data['city'])
            )

            # Process comments, part 1
            if data['performer'] and data['comment_performer']:
                if not data['performer'] in comments:
                    comments[data['performer']] = []
                comments[data['performer']].append({
                    'comment':  data['comment_performer'],
                    'source': data['source']
                })
            elif not data['performer'] and data['comment_performer'] and ERROR_LEVEL > 1:
                print(f"Warning: Comment about performer with no performer name present: {data['comment_performer'][:100]}...")
            
            if data['city'] and data['comment_city']:
                if not data['city'] in comments:
                    comments[data['city']] = []
                comments[data['city']].append({
                    'comment':  data['city'],
                    'source': data['source']
                })
            elif not data['city'] and data['comment_city'] and ERROR_LEVEL > 1:
                print(f"Warning: Comment about city with no city name present: {data['comment_city'][:100]}...")


# Double check weight v. number of sources
for edge in bipartite_graph.edges:
    d = bipartite_graph.get_edge_data(*edge)
    #print(d.get('edge_id'))
    num_sources = len(d.get('sources', []))
    weight = d.get('weight')
    if not num_sources == weight:
        print(f'Error: number of sources does not match weight: {num_sources} ≠ {weight}')

# Fix nodes
for node in bipartite_graph.nodes:
    node_id = get_id(node)
    attrs = {
        node: {
            'node_id': node_id,
            'indegree': len(bipartite_graph.in_edges(node)),
            'outdegree': len(bipartite_graph.out_edges(node)),
            'degree': len(bipartite_graph.out_edges(node)) + len(bipartite_graph.in_edges(node)),
        }
    }
    if node in comments:
        attrs[node]['comments'] = comments[node]
    else:
        attrs[node]['comments'] = []
    nx.set_node_attributes(bipartite_graph, attrs)


# Process comments, part 2
for node, all_comments in comments.items():
    if not bipartite_graph.nodes.get(node) and ERROR_LEVEL > 1:
        print('Warning: node has not been added to network (likely because it has no matching performer/city) but has been commented in dataset:', node)
    else:
        pass # TODO: add comments here

with open('docs/drag-data-bipartite.json', 'w+') as f:
    json.dump(obj=nx.node_link_data(bipartite_graph), fp=f)

