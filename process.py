from difflib import SequenceMatcher
import re
import networkx as nx
import pandas as pd
import json
from datetime import datetime
from drag.settings import SPREADSHEET, DB_SPREADSHEET, START_YEAR, END_YEAR, CLEANING, CACHE
from pathlib import Path


class Place():

    if not CACHE.exists():
        CACHE.mkdir(parents=True)

    from geopy.geocoders import Nominatim
    geolocator = Nominatim(user_agent="place-app")

    def __init__(self, name: str):
        self.name = name
        self.cache = CACHE / f'{self.name}.json'

        if not self.cache.exists():
            g = self.geolocator.geocode(name + ", United States")
            if g:
                self.cache.write_text(json.dumps(g.raw))
            else:
                self.cache.write_text(json.dumps({}))

        self.data = json.loads(self.cache.read_text())
        if self.data == {}:
            print(f'Warning: Could not find geo data for {name}')

        self.lat = self.data.get('lat')
        self.lon = self.data.get('lon')
        self.boundingbox = self.data.get('boundingbox')
        self.display_name = self.data.get('display_name')
        self.importance = self.data.get('importance')


df = pd.read_csv(SPREADSHEET, encoding='utf8')
graph = nx.DiGraph()

if not START_YEAR:
    print('Warning: no start year set.')

if not END_YEAR:
    print('Warning: no end year set.')

for row in df.fillna('').itertuples():
    _id, date, category, performer, club, _city, \
        city, revue_name, normalized_revue_name, \
        unsure_drag, legal_name, alleged_age, \
        assumed_birth_year, source, eima, \
        newspapers_search, fulton_search, \
        former_archive, comment = row

    if not date:
        print(f'no date on row {_id}')
        continue

    if not city and _city:
        city = _city

    club_display = None
    club_id = None

    if club and city:
        club_display = club
        club_id = club + "-" + city
    else:
        club_display = club
        club_id = club

    for cat in CLEANING:
        if cat == 'city':
            for search, replace in CLEANING[cat].items():
                # print(f'searching city data for {search} - replacing with {replace}')
                city = city.replace(search, replace)
        elif cat == 'club':
            for search, replace in CLEANING[cat].items():
                # print(f'searching club data for {search} - replacing with {replace}')
                if club_display != None:
                    club_display = club_display.replace(search, replace)

    # clean up date
    try:
        date = datetime.strptime(date, '%Y-%m-%d')
    except:
        try:
            date = datetime.strptime(date.strip(), '%Y-%m')
        except:
            try:
                date = datetime.strptime(date.strip(), '%Y')
            except:
                raise RuntimeError(f"{date} cannot be interpreted")

    # clean up source
    source = source.split("[")[0]

    if performer == "—" or performer == "-":
        performer = None

    if START_YEAR and END_YEAR:
        if date.year > END_YEAR or date.year < START_YEAR:
            continue

    # strip off any trailing or leading spaces
    if club_display:
        club_display = club_display.strip()
    if club_id:
        club_id = club_id.strip()
    if city:
        city = city.strip()
    if performer:
        performer = performer.strip()
    if revue_name:
        revue_name = revue_name.strip()

    add = list()
    if club_id and city:
        current_weight = graph.get_edge_data(
            club_id, city, default={}).get('weight')
        current_found = graph.get_edge_data(
            club_id, city, default={}).get('found', [])
        if current_weight == None:
            add.append((club_id, city, 1))
            found = [source]
        else:
            add.append((club_id, city, current_weight+1))
            found = current_found
            found.append(source)
    else:
        if performer and city:
            current_weight = graph.get_edge_data(
                performer, city, default={}).get('weight')
            current_found = graph.get_edge_data(
                performer, city, default={}).get('found', [])

            if current_weight == None:
                add.append((performer, city, 1))
                found = [source]
            else:
                add.append((performer, city, current_weight+1))
                found = current_found
                found.append(source)

    if club_id and performer:
        current_weight = graph.get_edge_data(
            performer, club_id, default={}).get('weight')
        current_found = graph.get_edge_data(
            performer, club_id, default={}).get('found', [])

        if current_weight == None:
            add.append((performer, club_id, 1))
            found = [source]
        else:
            add.append((performer, club_id, current_weight+1))
            found = current_found
            found.append(source)

    try:
        found
    except NameError:
        found = []

    graph.add_weighted_edges_from(
        add,
        found=list(set(found)),
        revue_name=revue_name,
        date=date.strftime("%Y-%m-%d")
    )

    attrs = {
        city: {
            'category': 'city',
            'comment': comment,
        },
        club_id: {
            'category': 'club',
            'display': club,
            'comment': comment
        },
        performer: {
            'category': 'performer',
            'comment': comment
        }
    }

    if city:
        p = Place(city)
        attrs[city]['lat'] = p.lat
        attrs[city]['lon'] = p.lon

    if performer and assumed_birth_year:
        attrs[performer]['assumed_birth_year'] = assumed_birth_year

    if performer and alleged_age:
        attrs[performer]['alleged_age'] = alleged_age

    nx.set_node_attributes(graph, attrs)


def set_degrees(graph):
    """Set degrees for each node"""

    for node in graph.nodes:
        attrs = {
            node: {
                'indegree': len(graph.in_edges(node)),
                'outdegree': len(graph.out_edges(node)),
                'degree': len(graph.out_edges(node)) + len(graph.in_edges(node)),
            }
        }
        nx.set_node_attributes(graph, attrs)
    return(graph)


def set_centralities(graph):
    """Set centrality measures for each node"""

    # 1000x eigenvector centrality measure for each node
    for data in [{node: eigen_central*1000} for node, eigen_central in nx.eigenvector_centrality(graph, max_iter=10000).items()]:
        attrs = {
            list(data.keys())[0]: {'1000x-eigenvector-centrality': list(data.values())[0]},
        }
        nx.set_node_attributes(graph, attrs)

    # 1000x degree centrality measure for each node
    for data in [{node: degree_central*1000} for node, degree_central in nx.degree_centrality(graph).items()]:
        attrs = {
            list(data.keys())[0]: {'1000x-degree-centrality': list(data.values())[0]},
        }
        nx.set_node_attributes(graph, attrs)

    # 1000x closeness centrality measure for each node
    for data in [{node: close_central*1000} for node, close_central in nx.closeness_centrality(graph).items()]:
        attrs = {
            list(data.keys())[0]: {'1000x-closeness-centrality': list(data.values())[0]},
        }
        nx.set_node_attributes(graph, attrs)

    # 1000x betweenness centrality measure for each node
    for data in [{node: between_central*1000} for node, between_central in nx.betweenness_centrality(graph).items()]:
        attrs = {
            list(data.keys())[0]: {'1000x-betweenness-centrality': list(data.values())[0]},
        }
        nx.set_node_attributes(graph, attrs)

    return(graph)


graph = set_degrees(graph)
graph = set_centralities(graph)


json_data = nx.node_link_data(graph)


################################################
## Testing for similarities in names          ##
################################################


def clean_name(name):
    name = name.strip()

    if re.search(r'\s+(\(.*\))', name):
        name = re.sub(r'\s+(\(.*\))', '', name)

    if name.endswith('?'):
        name = name[:-1]

    if name.startswith('['):
        name = name[1:]
    if name.endswith(']'):
        name = name[:-1]
    if name.startswith('*'):
        name = name[1:]
    if name.endswith('*'):
        name = name[:-1]

    if name.endswith('?'):
        name = name[:-1]

    return name


def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()


def find_similar(name, list_of_names, threshold=0.75):
    _ = list()

    lower_list_of_names = [x.lower() for x in list_of_names]

    # we only want to keep names that are longer than 2 characters
    if len(name) < 4:
        names = [x.lower() for x in name.split(' ') if len(x) > 2]
        full_name = ' '.join(names)
    else:
        names = [x.lower() for x in name.split(' ')]
        full_name = name.lower()
    for name in names:
        for i, test_name in enumerate(lower_list_of_names):
            if name in test_name:
                if test_name == full_name:
                    continue
                sim = similar(full_name, test_name)
                if sim > threshold:
                    # print(test_name, f'({full_name}) =', )
                    _.append(list_of_names[i])
    return(_)


def load_G():
    with open('/Users/kallewesterling/Google Drive/Dropbox (snapshot)/dev/dev-dissertation/Drag data for 1930s/docs/drag-data-for-1930s.json', 'r') as f:
        return nx.json_graph.node_link_graph(json.load(f))


def edges_connected_to(edge='Jean Malin', G=None):
    if not G:
        G = load_G()
    connected_to = list()
    for node in [x[1] for x in G.out_edges(edge)]:
        connected_to.extend([x[0] for x in G.in_edges(node) if x[0] != edge])
        connected_to.extend([x[0] for x in G.out_edges(node) if x[0] != edge])
    for node in [x[1] for x in G.in_edges(edge)]:
        connected_to.extend([x[0] for x in G.in_edges(node) if x[0] != edge])
        connected_to.extend([x[0] for x in G.out_edges(node) if x[0] != edge])
    _ = sorted(list(set(connected_to)))
    return _


def neighboring_nodes(edge1, edge2, G=None, sort=True):
    set1 = set(edges_connected_to(edge1, G))
    set2 = set(edges_connected_to(edge2, G))
    if not sort:
        return list(set1.intersection(set2))
    return sorted(list(set1.intersection(set2)))


all_names = list()

for node in json_data.get('nodes'):
    if node.get('category') == 'performer':
        all_names.append(node.get('id'))

print('---------------------')

for name in all_names:
    test_list = all_names[:]
    test_list.remove(name)

    name = clean_name(name)
    similar_names = find_similar(name, test_list)
    if similar_names:
        print(
            f"Warning: {name} seems to have similar names:\n         {', '.join(similar_names)}")

print('---------------------')

for name in all_names:
    partial, full = list(), list()
    name_split = name.split(' ')
    neighbors = edges_connected_to(name, G=graph)
    for node in neighbors:
        for node_test in name_split:
            if node_test.lower().strip() in [x.lower().strip() for x in node.split(' ')]:
                if node.lower().strip() == node_test.lower().strip():
                    # full similar node found in neighborhood
                    full.append(node)
                else:
                    # partial similar node found in neighborhood
                    partial.append(node)

    if partial:
        print(
            f'Warning: Partial similar nodes to {name} found in its neighborhood:\n         {", ".join(partial)}')

    if full:
        print(
            f'Warning: FULL similar nodes to {name} found:\n         {", ".join(full)}\n')

    if full or partial:
        neighbors = "\n         - ".join(neighbors)
        print(f'-------> Neighbors:\n         - {neighbors}')
        print('\n')

print('---------------------')

# write file
Path('./docs/drag-data-for-1930s.json').write_text(json.dumps(json_data))
