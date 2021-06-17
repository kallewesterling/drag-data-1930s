# Meta functions (that will need to be accessible from all steps)

import datetime


def log(msg, color="green", verbose=True):
    """Meta function to log correctly"""
    now = datetime.datetime.now().strftime("%H:%M%:%S")
    if verbose and in_notebook():
        from IPython.display import display, Markdown

        return display(Markdown(f'<font color="{color}">[{now}] {msg}</font>'))
    elif verbose:
        return print(f"[{now}]:\n{msg}\n\n")
    return None


def in_notebook():
    """Meta function that checks whether we are inside a Jupyter Notebook"""
    try:
        from IPython import get_ipython

        try:
            if "IPKernelApp" not in get_ipython().config:  # pragma: no cover
                return False
        except AttributeError:
            return False
    except ImportError:
        return False
    return True
