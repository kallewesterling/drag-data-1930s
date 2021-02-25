try:
    df
except:
    SPREADSHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=0&single=true&output=csv'
    df = pd.read_csv(SPREADSHEET, encoding='utf8')


from pprint import pprint

multi_g = nx.DiGraph()
bipartite_g = nx.DiGraph()

##############################################################################

def get_multi_nodes(row):
    multi_nodes = []
    if row.performer and row.venue and row.city:
        multi_nodes.extend([
            (row.performer, row.venue, {
                'comment_performer': [{'comment': row.comment_performer, 'source': row.source}],
                'comment_venue': [{'comment': row.comment_venue, 'source': row.source}]
                }
            ),
            (row.venue, row.city, {
                'comment_venue': [{'comment': row.comment_revue, 'source': row.source}],
                'comment_city': [{'comment': row.comment_city, 'source': row.source}],
                }
            )
        ])

    elif row.performer and row.venue and not row.city:
        multi_nodes.extend([
            (row.performer, row.venue, {
                'comment_performer': [{'comment': row.comment_performer, 'source': row.source}],
                'comment_venue': [{'comment': row.comment_venue, 'source': row.source}]
                }
            )
            ])

    elif row.performer and row.city and not row.venue:
        multi_nodes.extend([
            (row.performer, row.city, {
                'comment_performer': [{'comment': row.comment_performer, 'source': row.source}],
                'comment_city': [{'comment': row.comment_city, 'source': row.source}],
                }
            )
            ])

    elif row.venue and row.city and not row.performer:
        multi_nodes.extend([
            (row.venue, row.city, {
                'comment_venue': [{'comment': row.comment_venue, 'source': row.source}],
                'comment_city': [{'comment': row.comment_city, 'source': row.source}],
                }
            )
            ])
    else:
        print('No case caught here!')
        print(row.parsed)
        exit()
        
    return multi_nodes


def get_bipartite_nodes(row):
    bipartite_nodes = []
    if row.performer and row.city:
        bipartite_nodes.extend([
            (row.performer, row.city, {
                'comment_performer': [{'comment': row.comment_performer, 'source': row.source}],
                'comment_venue': [{'comment': row.comment_venue, 'source': row.source}],
                'comment_city': [{'comment': row.comment_city, 'source': row.source}],
            })
        ])

    return bipartite_nodes


def process_edge(edge_data, g):
    if isinstance(edge_data, list):
        edge_data = edge_data[0]

    if not isinstance(edge_data, dict):
        raise RuntimeError('Edge data needs to be a dictionary.')

    if edge_data:
        has_check = {}
        for field in ['comment_performer', 'comment_venue', 'comment_city', 'comment_revue']:
            has_check[field] = field in edge_data and edge_data.get(field, [{'comment': None}])[0].get('comment') != None
            
        print(has_check)

        if 'comment_performer' in edge_data and edge_data.get('comment_performer', [{'comment': None}])[0].get('comment'):
            try:
                if g.edges[source, target]['comment_performer']:
                    edge_data['comment_performer'] = g.edges[source, target]['comment_performer'].extend(edge_data.get('comment_performer'))
                else:
                    pass # edge_data.get('comment_performer') = edge_data.get('comment_performer')
            except KeyError:
                pass
        '''
        if 'comment_venue' in edge_data and edge_data.get('comment_venue', [{'comment': None}])[0].get('comment'):
            del edge_data['comment_venue']
        if 'comment_city' in edge_data and edge_data.get('comment_city', [{'comment': None}])[0].get('comment'):
            del edge_data['comment_city']
        if 'comment_revue' in edge_data and edge_data.get('comment_revue', [{'comment': None}])[0].get('comment'):
            del edge_data['comment_revue']
        '''

        try:
            edge_data['weight'] = g.edges[source, target]['weight']
        except KeyError:
            edge_data['weight'] = 0

    else:
        edge_data = {'weight': 0}
    return edge_data


##################################################################

for row in df.fillna('').itertuples():
    row = Row(row)
    
    if not row.has_basic_data:
        continue
    
    multi_nodes = get_multi_nodes(row)
    bipartite_nodes = get_bipartite_nodes(row)
                
    # We have a [multi_nodes] list with all the nodes in the row
    for node in multi_nodes:
        source, target, *edge_data = node
        edge_data = process_edge(edge_data, multi_g)
        
        # Adding weight
        edge_data['weight'] += 1

        # Adding edge
        multi_g.add_edge(source,
            target
        )
        
        multi_g.edges[source, target].update(edge_data)
    
    
    # We have a [bipartite_nodes] list with all the nodes in the row
    for node in bipartite_nodes:
        source, target, *edge_data = node
        edge_data = process_edge(edge_data, bipartite_g)
        
        # Adding weight
        edge_data['weight'] += 1

        bipartite_g.add_edge(
            source,
            target
        )
        
        bipartite_g.edges[source, target].update(edge_data)


print([v for k, v in nx.get_edge_attributes(bipartite_g, 'comment_performer').items() if v])


#nx.set_node_attributes(bipartite_g, {0: {"attr1": 20, "attr2": "nothing"}, 1: {"attr2": 3}})

bipartite_g.nodes




