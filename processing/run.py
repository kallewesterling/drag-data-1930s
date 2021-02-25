import pandas as pd
import networkx as nx
from collections import Counter
from datetime import datetime
from pprint import pprint
import json
import re


class PropertyMap:
    @property
    def performer(self):
        return self.get_prop('performer')

    @property
    def category(self):
        return self.get_prop('category')
    
    @property
    def venue(self):
        return self.get_prop('venue')
    
    @property
    def city(self):
        return self.get_prop('city')
    
    @property
    def revue_name(self):
        return self.get_prop('revue_name')
    
    @property
    def unsure_drag(self):
        return self.get_prop('unsure_drag')
    
    @property
    def legal_name(self):
        return self.get_prop('legal_name')
    
    @property
    def alleged_age(self):
        return self.get_prop('alleged_age')
    
    @property
    def assumed_birth_year(self):
        return self.get_prop('assumed_birth_year')
    
    @property
    def source(self):
        return self.get_prop('source')
    
    @property
    def eima(self):
        return self.get_prop('eima')
    
    @property
    def newspapers_search(self):
        return self.get_prop('newspapers_search')
    
    @property
    def fulton_search(self):
        return self.get_prop('fulton_search')
    
    @property
    def former_archive(self):
        return self.get_prop('former_archive')
    
    @property
    def comment(self):
        return self.get_prop('comment')
    
    @property
    def exclude(self):
        return self.get_prop('exclude')
    
    @property
    def quote(self):
        return self.get_prop('quote')
    
    @property
    def comment_performer(self):
        return self.get_prop('comment_performer')
    
    @property
    def comment_venue(self):
        return self.get_prop('comment_venue')
    
    @property
    def comment_city(self):
        return self.get_prop('comment_city')
    
    @property
    def comment_revue(self):
        return self.get_prop('comment_revue')
    
    @property
    def performer(self):
        return self.get_prop('performer')
    
    @property
    def performer_display(self):
        return self.get_prop('performer_display')
    
    @property
    def venue_display(self):
        return self.get_prop('venue_display')
    
    @property
    def city_display(self):
        return self.get_prop('city_display')
    
    @property
    def performer_safe(self):
        return self.ensure_safe(self.get_prop('performer'))
    
    @property
    def date(self):
        return self.get_prop('date')
    
    @property
    def row_num(self):
        return self.get_prop('row_num')

    
class Row(PropertyMap):

    def parse_row(self, row):
        data = {}
        data['row_num'], data['date'], data['category'], data['performer'], data['venue'], data['_city'], data['city'], data['_revue_name'], data['revue_name'], data['unsure_drag'], data['legal_name'], data['alleged_age'], data['assumed_birth_year'], data['source'], data['eima'], data['newspapers_search'], data['fulton_search'], data['former_archive'], data['comment'], data['exclude'], data['quote'], data['comment_performer'], data['comment_venue'], data['comment_city'], data['comment_revue'], *_ = row

        ##### Fix date
        data['date'] = data['date'].replace('?', '').strip()
        orig_date = data['date']
        data['date'] = self.fix_date(data['date'])

        if not data['date'] and (data['performer'] or data['venue'] or data['city']):
            pass # print(f'Warning: No date found ({orig_date}) but performer / venue / city found: {data["performer"]} / {data["venue"]} / {data["city"]}')
        
        if not data['date'] or data['exclude']:
            data = {}
            return data

        ##### Fix city
        if not data['city']:
            data['city'] = data['_city']
            data['_city'] = ''

        ##### Fix revue name
        if not data['revue_name']:
            data['revue_name'] = data['_revue_name']
            data['_revue_name'] = ''
        
        ##### Filter names
        data['performer'] = data['performer'].replace(' & ', ' and ').replace('/', ' aka ').strip()
        
        for char in ['-', '–', '—', '?', '[', ']']:
            while data['performer'].startswith(char):
                data['performer'] = data['performer'][1:].strip()
            
            while data['venue'].startswith(char):
                data['venue'] = data['venue'][1:].strip()
            
            while data['city'].startswith(char):
                data['city'] = data['city'][1:].strip()
                
            while data['performer'].endswith(char):
                #print(data['performer'], 'shortened to', data['performer'][:-1])
                data['performer'] = data['performer'][:-1].strip()
            
            while data['venue'].endswith(char):
                #print(data['venue'], 'shortened to', data['venue'][:-1])
                data['venue'] = data['venue'][:-1].strip()
            
            while data['city'].endswith(char):
                #print(data['city'], 'shortened to', data['city'][:-1])
                data['city'] = data['city'][:-1].strip()
        
        data['performer_display'] = data['performer']
        data['venue_display'] = data['venue']
        data['city_display'] = data['city']

        for number, replacement in {1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 0: 'zero'}.items():
            data['performer'] = data['performer'].replace(str(number), replacement)
            data['venue'] = data['venue'].replace(str(number), replacement)
            data['city'] = data['city'].replace(str(number), replacement)
        
        data = {k: v for k, v in data.items() if v}
        
        return data

    def fix_date(self, date):
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
                    return ''
                    # raise RuntimeError(date, 'cannot be interpreted:', e)

        return date

    def get_prop(self, name):
        return self.parsed.get(name)
    
    def ensure_safe(self, string):
        string = ''.join(re.findall(r'[a-zA-Z1-9-]', string)).lower()
        while string.startswith('-'):
            string = string[1:]
        return string
    
    def __init__(self, row):
        self.row = row
        self.parsed = self.parse_row(row)
    
    @property
    def has_basic_data(self):
        if self.exclude:
            return False
        
        if self.performer and self.venue:
            return True
        elif self.performer and self.city:
            return True
        elif self.venue and self.city:
            return True
        return False
    
    
'''
def fix_id_for_json(string):
    string = ''.join(re.findall(r'[a-zA-Z1-9-]', string)).lower()
    while string.startswith('-'):
        string = string[1:]
    return string
'''

def load_spreadsheet():
    SPREADSHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=0&single=true&output=csv'
    df = pd.read_csv(SPREADSHEET, encoding='utf8')
    return df


nodes = Counter()
multi_edges = Counter()
bipartite_edges = {
    'performer-city': Counter()
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

df = load_spreadsheet()

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
        
    if row.alleged_age and row.performer:
        alleged_ages[row.performer] = int(row.alleged_age)
    elif row.alleged_age and not row.performer:
        print('Warning: Found a stray alleged age with no performer assigned')
        print(row.venue)
        print(row.city)
        print(row.alleged_age)
        print('-------------')

    if row.assumed_birth_year and row.performer:
        assumed_birth_years[row.performer] = int(row.assumed_birth_year)
    elif row.assumed_birth_year and not row.performer:
        print('Warning: Found a stray alleged age with no performer assigned')
        print(row.alleged_age)
        print('-------------')

    if (row.performer and (row.performer in alleged_ages and not row.performer in assumed_birth_years)):
        print(f"Warning: Found an age but not alleged birth year for performer {row.performer}.")
        print('-------------')

    ########################################################
    
    # Add comments to lists of comments
    if row.comment_performer and row.performer:
        performer_comments.append((row.performer, row.comment_performer, row.source))
    elif row.comment_performer and not row.performer:
        print('Warning: Found a comment in the comment section for a performer with no name set:')
        print(row.comment_performer)
        print('----')

    if row.comment_venue and row.venue:
        venue_comments.append((f'{row.venue}-{row.city}', row.comment_venue, row.source))
    elif row.comment_venue and not row.venue:
        print('Warning: Found a comment in the comment section for a venue with no name set:')
        print(row.comment_venue)
        print('----')
        
    if row.comment_city and row.city:
        city_comments.append((row.city, row.comment_city, row.source))
    elif row.comment_city and not row.city:
        print('Warning: Found a comment in the comment section for a city with no name set:')
        print(row.comment_city)
        print('----')

    if row.comment_revue and row.revue_name:
        revue_comments.append((row.revue_name, row.comment_revue, row.source))
    elif row.comment_revue and not row.revue_name:
        print('Warning: Found a comment in the comment section for a revue with no name set:')
        print(row.comment_revue)
        print('----')

    ########################################################
    
    process_edges = []

    # Add edges to correct lists
    if row.performer and row.venue and row.city:
        node1 = row.performer
        node2 = f'{row.venue}-{row.city}'
        node3 = row.city
        edge1 = (node1, node2, row.ensure_safe(f'{node1}-{node2}'))
        edge2 = (node2, node3, row.ensure_safe(f'{node2}-{node3}'))
        process_edges.append(edge1)
        process_edges.append(edge2)

        bipartite_edges['performer-city'][(row.performer, row.city)] += 1

    elif row.venue and row.city:
        node1 = f'{row.venue}-{row.city}'
        node2 = row.city
        edge = (node1, node2, row.ensure_safe(f'{node1}-{node2}'))
        process_edges.append(edge)

    elif row.performer and row.city:
        node1 = row.performer
        node2 = row.city
        edge = (node1, node2, row.ensure_safe(f'{row.performer}-{row.city}'))
        process_edges.append(edge)

        bipartite_edges['performer-city'][(row.performer, row.city)] += 1
        
    elif row.performer and row.venue:
        node1 = row.performer
        node2 = f'{row.venue}-{row.city}'
        edge = (node1, node2, row.ensure_safe(f'{node1}-{node2}'))
        process_edges.append(edge)
        
    else:
        print('Warning: could not interpret data:')
        print(row.performer)
        print(row.venue)
        print(row.city)
        print('-------------')
        exit()

    for edge in process_edges:
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
            'row_num': row.row_num
        }

        if row.revue_name:
            edge_data[edge]['revue_name'] = row.revue_name

        if not edge_data[edge]['date']:
            exit('no date')
        




##### MAJOR STEP: Process graph

G_multi = nx.DiGraph()

for edge in multi_edges:
    source, target, edge_id = edge
    weight = multi_edges[edge]
    comments = []
    
    if edge_data[edge].get('revue_name'):
        for revue_comment in set(list([x for x in revue_comments if x[0] == edge_data[edge]['revue_name']])):
            _name, comment, comment_source = revue_comment
            comments.append({'comment': comment, 'source': comment_source})
    
    general_comments = [y for x, y in general_edge_comments.items() if x == edge_id]
    if len(general_comments) == 1:
        general_comments = general_comments[0]
    elif len(general_comments) > 1:
        print('Warning: Seems like there may be general comments that are not captured here:')
        print(general_comments[1:])

    G_multi.add_edge(source, target, date=edge_data[edge]['date'], comments=comments, weight=weight, found=found[edge], edge_id=edge_id, general_comments=general_comments, row_num=edge_data[edge]['row_num'])


for d in nodes:
    node, category, node_id, display = d
    
    if not node_id:
        print("HAS NO ID")
        print(d)
    
    comments = []
    
    if category == 'venue':
        # Process comments for venues
        for d in [x for x in venue_comments if x[0] == node]:
            _name, comment, source = d
            comments.append({'comment': comment, 'source': source})
    elif category == 'performer':
        # Process comments for performers
        for d in [x for x in performer_comments if x[0] == node]:
            _name, comment, source = d
            comments.append({'comment': comment, 'source': source})
    elif category == 'city':
        # Process comments for cities
        for d in [x for x in city_comments if x[0] == node]:
            _name, comment, source = d
            comments.append({'comment': comment, 'source': source})
    else:
        print('Warning: I have no way to handle this category type of node.')

    if comments:
        nx.set_node_attributes(G_multi, {node: {'comments': comments}})
    
    if node in alleged_ages:
        nx.set_node_attributes(G_multi, {node: {'alleged_age': alleged_ages[node]}})

    if node in assumed_birth_years:
        nx.set_node_attributes(G_multi, {node: {'assumed_birth_year': assumed_birth_years[node]}})

    nx.set_node_attributes(G_multi, {node: {'display': display, 'category': category, 'node_id': node_id}})

# Set degrees on all nodes
nx.set_node_attributes(G_multi, dict(G_multi.in_degree()), 'indegree')
nx.set_node_attributes(G_multi, dict(G_multi.out_degree()), 'outdegree')
nx.set_node_attributes(G_multi, dict(G_multi.degree()), 'degree')

# Set centrality measures on all nodes
nx.set_node_attributes(G_multi, nx.betweenness_centrality(G_multi), 'centrality-betweenness')
nx.set_node_attributes(G_multi, nx.eigenvector_centrality(G_multi, max_iter=1000), 'centrality-eigenvector')
nx.set_node_attributes(G_multi, nx.degree_centrality(G_multi), 'centrality-degree')
# nx.set_node_attributes(G_multi, nx.closeness_centrality(G_multi), 'centrality-closeness')
# nx.set_node_attributes(G_multi, nx.current_flow_betweenness_centrality(G_multi, weight='weight'), 'centrality-current-flow')
# nx.set_node_attributes(G_multi, nx.communicability_betweenness_centrality(G_multi), 'centrality-communicability')

for node, attrs in G_multi.nodes.items():
    G_multi.nodes[node]['1000x-betweenness-centrality'] = "{:.15f}".format(attrs['centrality-betweenness']*1000).rstrip('0')
    G_multi.nodes[node]['1000x-eigenvector-centrality'] = "{:.15f}".format(attrs['centrality-eigenvector']*1000).rstrip('0')
    G_multi.nodes[node]['1000x-degree-centrality'] = "{:.15f}".format(attrs['centrality-degree']*1000).rstrip('0')

with open('./docs/data/drag-data-new.json', 'w+') as f:
    json.dump(nx.node_link_data(G_multi), f)