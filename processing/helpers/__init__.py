import pandas as pd
from datetime import datetime
import os
import re
import json
from geopy.geocoders import Nominatim


CACHE = '.cache'

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
        self.test_data()
    
    def test_data(self):
        if self.alleged_age and not self.performer:
            print('Warning: Found a stray alleged age with no performer assigned')
            print(self.venue)
            print(self.city)
            print(self.alleged_age)
            print('-------------')

        if self.assumed_birth_year and not self.performer:
            print('Warning: Found a stray alleged age with no performer assigned')
            print(self.alleged_age)
            print('-------------')

        if self.comment_performer and not self.performer:
            print('Warning: Found a comment in the comment section for a performer with no name set:')
            print(self.comment_performer)
            print('----')

        if self.comment_venue and not self.venue:
            print('Warning: Found a comment in the comment section for a venue with no name set:')
            print(self.comment_venue)
            print('----')
            
        if self.comment_city and not self.city:
            print('Warning: Found a comment in the comment section for a city with no name set:')
            print(self.comment_city)
            print('----')

        if self.comment_revue and not self.revue_name:
            print('Warning: Found a comment in the comment section for a revue with no name set:')
            print(self.comment_revue)
            print('----')


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


def load_spreadsheet(spreadsheet=None):
    if not spreadsheet:
        return pd.DataFrame()
    df = pd.read_csv(spreadsheet, encoding='utf8')
    return df


def get_revue_comments(revue_name, revue_comments):
    comments = []
    for revue_comment in set(list([x for x in revue_comments if x[0] == revue_name])):
        _name, comment, comment_source = revue_comment
        comments.append({'comment': comment, 'source': comment_source})
    return comments


def get_general_comments(edge_id, general_edge_comments):
    general_comments = [y for x, y in general_edge_comments.items() if x == edge_id]
    if len(general_comments) == 1:
        general_comments = general_comments[0]
    elif len(general_comments) > 1:
        print('Warning: Seems like there may be general comments that are not captured here:')
        print(general_comments[1:])
    return general_comments




class Place():

    geolocator = Nominatim(user_agent="place-app")

    def __init__(self, name: str, cache_dir: str=CACHE):
        self.name = name
        self.cache_file = os.path.join(cache_dir, f'{self.name}.json')

        if 'UK' in self.name:
            self.name.replace('UK', 'United Kingdom')
        elif 'geneva' in self.name.lower() or 'cuba' in self.name.lower() or 'switzerland' in self.name.lower() or 'kursaal' in self.name.lower():
            pass
        else:
            self.name = self.name + ', United States'

        if not os.path.exists(cache_dir):
            os.mkdir(cache_dir, exist_ok=True)

        if not os.path.exists(self.cache_file) or (os.path.exists(self.cache_file) and os.stat(self.cache_file).st_size < 5):
            g = self.geolocator.geocode(self.name)
            with open(self.cache_file, 'w+') as f:
                if g:
                    f.write(json.dumps(g.raw))
                else:
                    f.write(json.dumps({}))

        with open(self.cache_file, 'r') as f:
            self.data = json.loads(f.read())

        if self.data == {}:
            print(f'Warning: Could not find geo data for {name}')

        self.lat = self.data.get('lat')
        self.lon = self.data.get('lon')
        self.boundingbox = self.data.get('boundingbox')
        self.display_name = self.data.get('display_name')
        self.importance = self.data.get('importance')
