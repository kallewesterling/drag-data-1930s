# General utilities

import re, unicodedata, datetime
try:
    from IPython.display import display, Markdown, clear_output
except:
    pass

def in_notebook():
    ''' Check whether we are in a notebook - returns True if we are, otherwise False '''
    try:
        from IPython import get_ipython

        try:
            if "IPKernelApp" not in get_ipython().config:
                return False
        except AttributeError:
            return False
    except ImportError:
        return False
    return True


def log(msg, color="green", verbose=True):
    ''' Pretty logger '''
    now = datetime.datetime.now().strftime("%H:%M%:%S")
    if verbose and in_notebook():
        return display(Markdown(f'<font color="{color}">[{now}] {msg}</font>'))
    elif verbose:
        return print(f"[{now}]:\n{msg}\n\n")
    return None


def slugify(value, allow_unicode=False, verbose=False):
    ''' Custom slugifier '''
    init_value = str(value)
    value = init_value
    value = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    )
    value = re.sub(r"[^\w\s-]", "", value.lower())
    value = re.sub(r"^(\d+)", r"n\1", value)
    value = re.sub(r"[-\s]+", "_", value).strip("-_")
    if verbose:
        clear_output(wait=True)
        log(f"Making slug from {init_value}: {value}", verbose=verbose)
    return value
