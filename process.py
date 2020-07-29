import networkx as nx
import pandas as pd
import json
from datetime import datetime
from drag.settings import SPREADSHEET, START_YEAR, END_YEAR, CLEANING


df = pd.read_csv(SPREADSHEET, encoding='utf8')
graph = nx.DiGraph()

if not START_YEAR:
    print('Warning: no start year set.')

if not END_YEAR:
    print('Warning: no end year set.')


for row in df.fillna('').itertuples():
    _id, date, category, performer, club, _city, city, revue_name, normalized_revue_name, unsure_drag, legal_name, alleged_age, assumed_birth_year, source, eima, newspapers_search, fulton_search = row

    if not date:
        print(f'no date on row {_id}')
        continue

    for cat in CLEANING:
        if cat == 'city':
            for search, replace in CLEANING[cat].items():
                # print(f'searching city data for {search} - replacing with {replace}')
                city = city.replace(search, replace)
        elif cat == 'club':
            for search, replace in CLEANING[cat].items():
                # print(f'searching club data for {search} - replacing with {replace}')
                club = club.replace(search, replace)

    # clean up date
    try:
        date = datetime.strptime(date, '%Y-%m-%d')
    except:
        try:
            date = datetime.strptime(date.strip(), '%Y-%m')
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
    if club:       club = club.strip()
    if city:       city = city.strip()
    if performer:  performer = performer.strip()
    if revue_name: revue_name = revue_name.strip()

    add = list()
    if club and city:
        current_weight = graph.get_edge_data(club, city, default={}).get('weight')
        current_found = graph.get_edge_data(club, city, default={}).get('found', [])
        if current_weight == None:
            add.append((club, city, 1))
            found = [source]
        else:
            add.append((club, city, current_weight+1))
            found = current_found
            found.append(source)
    else:
        if performer and city:
            current_weight = graph.get_edge_data(performer, city, default={}).get('weight')
            current_found = graph.get_edge_data(club, city, default={}).get('found', [])

            if current_weight == None:
                add.append((performer, city, 1))
                found = [source]
            else:
                add.append((performer, city, current_weight+1))
                found = current_found
                found.append(source)

    if performer and club:
        current_weight = graph.get_edge_data(performer, club, default={}).get('weight')
        current_found = graph.get_edge_data(club, city, default={}).get('found', [])

        if current_weight == None:
            add.append((performer, club, 1))
            found = [source]
        else:
            add.append((performer, club, current_weight+1))
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
        city: {'category': 'city', 'lat': '0.4252235', 'lon': '42.235235'},
        club: {'category': 'club'},
        performer: {'category': 'performer'}
    }
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


# write file
from pathlib import Path
Path('./docs/drag-data-for-1930s.json').write_text(json.dumps(nx.node_link_data(graph)))