import networkx as nx
import pandas as pd
import json

spreadsheet = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=0&single=true&output=csv'


df = pd.read_csv(spreadsheet, encoding = 'utf8')

graph = nx.DiGraph()


from datetime import datetime

for row in df.fillna('').itertuples():
    _id, date, category, performer, club, _city, city, revue_name, normalized_revue_name, unsure_drag, legal_name, alleged_age, assumed_birth_year, source, eima = row

    if not date:
        print(f'no date on row {_id}')
        continue


    # clean up city
    city = city.replace("?", "")

    # clean up club
    club = club.replace("?", "")

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
    
    
    if performer == "—":
        performer = None
    
    
    if date.year > 1940 or date.year < 1930:
        continue
    
    
    add = []
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

# set degrees for each node
for node in graph.nodes:
    attrs = {
        node: {
            'indegree': len(graph.in_edges(node)),
            'outdegree': len(graph.out_edges(node)),
            'degree': len(graph.out_edges(node)) + len(graph.in_edges(node)),
        }
    }
    nx.set_node_attributes(graph, attrs)

# write file
from pathlib import Path
Path('./docs/drag-data-for-1930s.json').write_text(json.dumps(nx.node_link_data(graph)))