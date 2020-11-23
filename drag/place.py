import json
from geopy.geocoders import Nominatim
from .settings import CACHE


class Place():

    if not CACHE.exists():
        CACHE.mkdir(parents=True)

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
