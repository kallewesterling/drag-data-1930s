from pathlib import Path
SPREADSHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=0&single=true&output=csv'
DB_SPREADSHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0E0Y7txIa2pfBuusA1cd8X5OVhQ_D0qZC8D40KhTU3xB7McsPR2kuB7GH6ncmNT3nfjEYGbscOPp0/pub?gid=1853011182&single=true&output=csv'

START_YEAR = 1800
END_YEAR = 2020

CLEANING = {
    'city': {
        '?': ''
    },
    'club': {
        '?': ''
    }
}

CACHE = './.cache'

NOT_ALLOWED_IN_ID = r'''[\[\].,\(\\*)?:;~`\\"'!–—\/&]|\s+'''

######################## NO EDITS BELOW ############

CACHE = Path(CACHE)


def REPLACE_NUMBERS(string):
    return string.replace('1', 'one').replace('2', 'two').replace('3', 'three').replace('4', 'four').replace('5', 'five').replace('6', 'six').replace('7', 'seven').replace('8', 'eight').replace('9', 'nine').replace('0', 'z')
