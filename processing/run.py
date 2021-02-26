import networkx as nx
from collections import Counter
import json
from helpers import Row, Place, load_spreadsheet, get_revue_comments, get_general_comments

nodes = Counter()
multi_edges = Counter()
bipartite_edges = {
    'performer-city': Counter(),
    'performer-venue': Counter()
}
edge_data = {}
general_edge_comments = {}
found = {}
alleged_ages = {}
assumed_birth_years = {}
performer_comments = []
city_comments = []
venue_comments = []
revue_comments = []
places = {}

SPREADSHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=0&single=true&output=csv'
df = load_spreadsheet(SPREADSHEET)

for row in df.fillna('').itertuples():
    row = Row(row)
    
    if not row.has_basic_data:
        continue
        
    if row.date:
        date = row.date.strftime('%Y-%m-%d')
    else:
        print('NO DATE')
        exit()
    
    # Add nodes to list
    if row.performer:
        nodes[(row.performer, 'performer', row.ensure_safe(row.performer), row.performer_display)] += 1
    if row.venue:
        nodes[(f'{row.venue}-{row.city}', 'venue', row.ensure_safe(f'{row.venue}-{row.city}'), row.venue_display)] += 1
    if row.city:
        nodes[(row.city, 'city', row.ensure_safe(row.city), row.city_display)] += 1
        places[row.city_display] = Place(row.city_display)
        
    if row.alleged_age and row.performer:
        alleged_ages[row.performer] = int(row.alleged_age)

    if row.assumed_birth_year and row.performer:
        assumed_birth_years[row.performer] = int(row.assumed_birth_year)
    
    ########################################################
    
    # Add comments to lists of comments
    if row.comment_performer and row.performer:
        performer_comments.append((row.performer, row.comment_performer, row.source))
    if row.comment_venue and row.venue:
        venue_comments.append((f'{row.venue}-{row.city}', row.comment_venue, row.source))
    if row.comment_city and row.city:
        city_comments.append((row.city, row.comment_city, row.source))
    if row.comment_revue and row.revue_name:
        revue_comments.append((row.revue_name, row.comment_revue, row.source))
    
    ########################################################
    
    process_multi_edges = []

    # Add edges to correct lists
    if row.performer and row.venue and row.city:
        node1 = row.performer
        node2 = f'{row.venue}-{row.city}'
        node3 = row.city
        edge1 = (node1, node2, row.ensure_safe(f'{node1}-{node2}'))
        edge2 = (node2, node3, row.ensure_safe(f'{node2}-{node3}'))
        process_multi_edges.append(edge1)
        process_multi_edges.append(edge2)

        bipartite_edge1 = (node1, node3, row.ensure_safe(f'{node1}-{node3}'))

        bipartite_edges['performer-venue'][edge1] += 1
        bipartite_edges['performer-city'][bipartite_edge1] += 1

        # Special provision of edge_data for performer-city bipartite graph
        edge_data[bipartite_edge1] = {
            'date': date,
            'row_num': row.row_num,
            'revue_name': row.revue_name
        }
        if not bipartite_edge1 in found:
            found[bipartite_edge1] = []
        found[bipartite_edge1].append(row.source)

    elif row.venue and row.city:
        node1 = f'{row.venue}-{row.city}'
        node2 = row.city
        edge = (node1, node2, row.ensure_safe(f'{node1}-{node2}'))
        process_multi_edges.append(edge)

    elif row.performer and row.city:
        node1 = row.performer
        node2 = row.city
        edge = (node1, node2, row.ensure_safe(f'{node1}-{node2}'))
        process_multi_edges.append(edge)

        bipartite_edges['performer-city'][edge] += 1
        
    elif row.performer and row.venue:
        node1 = row.performer
        node2 = f'{row.venue}-{row.city}'
        edge = (node1, node2, row.ensure_safe(f'{node1}-{node2}'))
        process_multi_edges.append(edge)

        bipartite_edges['performer-venue'][edge] += 1
        
    else:
        print('Warning: could not interpret data:')
        print(row.performer)
        print(row.venue)
        print(row.city)
        print('-------------')
        exit()

    for edge in process_multi_edges:
        multi_edges[edge] += 1
        
        # Add to found dict
        if not edge in found:
            found[edge] = []
            
        found[edge].append(row.source)
        
        # Add to general_edge_comments dict
        if row.comment:
            if not edge[2] in general_edge_comments:
                general_edge_comments[edge[2]] = []

            general_edge_comments[edge[2]].append({'comment': row.comment, 'source': row.source})

        # Add edge_data here...
        edge_data[edge] = {
            'date': date,
            'row_num': row.row_num,
            'revue_name': row.revue_name
        }

        if not edge_data[edge]['date']:
            exit('no date')


if not len(multi_edges):
    exit('No multipartite graph found!')


##### MAJOR STEP: Process graph

graphs = {
    'multipartite': nx.DiGraph(),
    'bipartite': []
}

for edge in multi_edges:
    source, target, edge_id = edge
    weight = multi_edges[edge]
    revue_name = edge_data[edge].get('revue_name')
    date = edge_data[edge].get('date')
    row_num = edge_data[edge]['row_num']
    comments = get_revue_comments(revue_name, revue_comments)
    general_comments = get_general_comments(edge_id, general_edge_comments)

    graphs['multipartite'].add_edge(source, target, weight=weight, date=date, revue_name=revue_name, comments=comments, found=found[edge], edge_id=edge_id, general_comments=general_comments, row_num=row_num)



for network in bipartite_edges:
    bipartite_graph = {}
    bipartite_graph['filename'] = f'app/data/bipartite-data-{network}.json'

    bipartite_graph['G'] = nx.DiGraph()

    for edge in bipartite_edges[network]:
        source, target, edge_id = edge
        weight = bipartite_edges[network][edge]
        revue_name = edge_data[edge].get('revue_name')
        date = edge_data[edge].get('date')
        row_num = edge_data[edge]['row_num']
        comments = get_revue_comments(revue_name, revue_comments)
        general_comments = get_general_comments(edge_id, general_edge_comments)
        
        bipartite_graph['G'].add_edge(source, target, date=date, revue_name=revue_name, comments=comments, found=found[edge], edge_id=edge_id, general_comments=general_comments, row_num=row_num)

    graphs['bipartite'].append(bipartite_graph)




for d in nodes:
    node, category, node_id, display = d
    
    if not node_id:
        print("HAS NO ID")
        print(d)
    
    comments = []
    
    if category == 'venue':
        # Process comments for venues
        for d in [x for x in venue_comments if x[0] == node]:
            _, comment, source = d
            comments.append({'comment': comment, 'source': source})
    elif category == 'performer':
        # Process comments for performers
        for d in [x for x in performer_comments if x[0] == node]:
            _, comment, source = d
            comments.append({'comment': comment, 'source': source})
    elif category == 'city':
        # Process comments for cities
        for d in [x for x in city_comments if x[0] == node]:
            _, comment, source = d
            comments.append({'comment': comment, 'source': source})
    else:
        print('Warning: I have no way to handle this category type of node.')

    if comments:
        nx.set_node_attributes(graphs['multipartite'], {node: {'comments': comments}})
    
    if node in alleged_ages:
        nx.set_node_attributes(graphs['multipartite'], {node: {'alleged_age': alleged_ages[node]}})

    if node in assumed_birth_years:
        nx.set_node_attributes(graphs['multipartite'], {node: {'assumed_birth_year': assumed_birth_years[node]}})

    nx.set_node_attributes(graphs['multipartite'], {node: {'display': display, 'category': category, 'node_id': node_id}})

    for graph in graphs['bipartite']:
        if comments:
            nx.set_node_attributes(graph['G'], {node: {'comments': comments}})
        
        if node in alleged_ages:
            nx.set_node_attributes(graph['G'], {node: {'alleged_age': alleged_ages[node]}})

        if node in assumed_birth_years:
            nx.set_node_attributes(graph['G'], {node: {'assumed_birth_year': assumed_birth_years[node]}})

        nx.set_node_attributes(graph['G'], {node: {'display': display, 'category': category, 'node_id': node_id}})

# Set degrees on all nodes
nx.set_node_attributes(graphs['multipartite'], dict(graphs['multipartite'].in_degree()), 'indegree')
nx.set_node_attributes(graphs['multipartite'], dict(graphs['multipartite'].out_degree()), 'outdegree')
nx.set_node_attributes(graphs['multipartite'], dict(graphs['multipartite'].degree()), 'degree')

# Set centrality measures on all nodes
nx.set_node_attributes(graphs['multipartite'], nx.betweenness_centrality(graphs['multipartite']), 'centrality-betweenness')
nx.set_node_attributes(graphs['multipartite'], nx.eigenvector_centrality(graphs['multipartite'], max_iter=1000), 'centrality-eigenvector')
nx.set_node_attributes(graphs['multipartite'], nx.degree_centrality(graphs['multipartite']), 'centrality-degree')
# nx.set_node_attributes(graphs['multipartite'], nx.closeness_centrality(graphs['multipartite']), 'centrality-closeness')
# nx.set_node_attributes(graphs['multipartite'], nx.current_flow_betweenness_centrality(graphs['multipartite'], weight='weight'), 'centrality-current-flow')
# nx.set_node_attributes(graphs['multipartite'], nx.communicability_betweenness_centrality(graphs['multipartite']), 'centrality-communicability')

for node, attrs in graphs['multipartite'].nodes.items():
    graphs['multipartite'].nodes[node]['1000x-betweenness-centrality'] = "{:.15f}".format(attrs['centrality-betweenness']*1000).rstrip('0')
    graphs['multipartite'].nodes[node]['1000x-eigenvector-centrality'] = "{:.15f}".format(attrs['centrality-eigenvector']*1000).rstrip('0')
    graphs['multipartite'].nodes[node]['1000x-degree-centrality'] = "{:.15f}".format(attrs['centrality-degree']*1000).rstrip('0')

for graph in graphs['bipartite']:
    # Set degrees on all nodes
    nx.set_node_attributes(graph['G'], dict(graph['G'].in_degree()), 'indegree')
    nx.set_node_attributes(graph['G'], dict(graph['G'].out_degree()), 'outdegree')
    nx.set_node_attributes(graph['G'], dict(graph['G'].degree()), 'degree')

    # Set centrality measures on all nodes
    nx.set_node_attributes(graph['G'], nx.betweenness_centrality(graph['G']), 'centrality-betweenness')
    nx.set_node_attributes(graph['G'], nx.eigenvector_centrality(graph['G'], max_iter=1000), 'centrality-eigenvector')
    nx.set_node_attributes(graph['G'], nx.degree_centrality(graph['G']), 'centrality-degree')
    # nx.set_node_attributes(graph['G'], nx.closeness_centrality(graph['G']), 'centrality-closeness')
    # nx.set_node_attributes(graph['G'], nx.current_flow_betweenness_centrality(graph['G'], weight='weight'), 'centrality-current-flow')
    # nx.set_node_attributes(graph['G'], nx.communicability_betweenness_centrality(graph['G']), 'centrality-communicability')

    for node, attrs in graph['G'].nodes.items():
        graph['G'].nodes[node]['1000x-betweenness-centrality'] = "{:.15f}".format(attrs['centrality-betweenness']*1000).rstrip('0')
        graph['G'].nodes[node]['1000x-eigenvector-centrality'] = "{:.15f}".format(attrs['centrality-eigenvector']*1000).rstrip('0')
        graph['G'].nodes[node]['1000x-degree-centrality'] = "{:.15f}".format(attrs['centrality-degree']*1000).rstrip('0')

# Time to save!
with open('./app/data/multipartite-data.json', 'w+') as f:
    json.dump(nx.node_link_data(graphs['multipartite']), f)

for graph in graphs['bipartite']:
    with open(graph['filename'], 'w+') as f:
        json.dump(nx.node_link_data(graph['G']), f)
