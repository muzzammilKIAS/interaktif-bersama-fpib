#!/usr/bin/env python3
"""Local-only static server. Requires Python 3, no pip packages."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
import threading
import webbrowser
import sys

def main():
    root = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    url = 'http://localhost:8080'
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 8080), handler)
    except OSError as exc:
        print('Port 8080 tidak tersedia. Tutup server lama kemudian cuba semula.')
        print('Jika Sirah Journey sudah berjalan, buka ' + url)
        print(str(exc))
        return 1
    print('\nSIRAH JOURNEY CHALLENGE\n' + url)
    print('Biarkan tetingkap ini terbuka. Tekan Ctrl+C untuk berhenti.\n')
    threading.Timer(.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer dihentikan.')
    finally:
        server.server_close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
