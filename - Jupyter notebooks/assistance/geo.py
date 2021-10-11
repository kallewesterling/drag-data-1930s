from pathlib import Path
from geopy.geocoders import Nominatim
import requests, json
from .utils import slugify

key = json.loads(Path(f'{Path(__file__).parent}/auth.json').read_text()).get('google-api')
nomatim_locator = Nominatim(user_agent="drag-data-1930s")

def get_google_geodata(city):
    if not city or city.strip() == '?':
        print('No city was provided, cannot geocode. Returns empty dict.')
        return {}
    datafile = Path(f'{Path(__file__).parent}/.cache/geo-locator/google/{slugify(city)}.json')
    if not datafile.exists():
        print(f'Geocoding {city}')
        if not datafile.parent.exists():
            datafile.parent.mkdir(parents=True)

        url = f'https://maps.googleapis.com/maps/api/geocode/json?address={city.replace(" ", "%20")}&key={key}'

        r = requests.get(url)

        if not r.status_code == 200:
            raise RuntimeError(f'Not correct status code from the Google API: {r.status_code}.\n\nContent:\n{r.text}')

        datafile.write_text(r.text)

    google_data = json.loads(datafile.read_text())
    
    return google_data['results'][0] # Google generates multiple results, so we will just throw back the first one


def get_nomatim_geodata(city):
    if not city or city.strip() == '?':
        print('No city was provided, cannot geocode. Returns empty dict.')
        return {}
    datafile = Path(f'{Path(__file__).parent}/.cache/geo-locator/nomatim/{slugify(city)}.json')
    if not datafile.exists():
        print(f'Geocoding {city}')
        if not datafile.parent.exists():
            datafile.parent.mkdir(parents=True)

        data = nomatim_locator.geocode(city)
        if data:
            data = data.raw

            datafile.write_text(json.dumps(data))
        else:
            print(f'Warning: Nomatim could not find {city}')

    nomatim_data = json.loads(datafile.read_text())
    
    # generate a google-like bounding box:
    lat_max, lat_min, lng_max, lng_min = nomatim_data['boundingbox']
    bounding_box = {
        'northeast': {
            'lat': float(lat_min),
            'lng': float(lng_min)
        },
        'southwest': {
            'lat': float(lat_max),
            'lng': float(lng_max)
        }
    }
    return nomatim_data