#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, socket, sys, threading, webbrowser

ROOT=Path(__file__).resolve().parent
os.chdir(ROOT)

def available_port(preferred=8088):
    for port in range(preferred, preferred+20):
        with socket.socket() as sock:
            try:
                sock.bind(('127.0.0.1',port))
                return port
            except OSError:
                continue
    raise RuntimeError('Tiada port tempatan tersedia.')

port=available_port()
url=f'http://localhost:{port}'
print(f'Interaktif Bersama FPIB sedang berjalan di {url}')
print('Tekan Control+C untuk berhenti.')
threading.Timer(.6,lambda:webbrowser.open(url)).start()
try:
    ThreadingHTTPServer(('127.0.0.1',port),SimpleHTTPRequestHandler).serve_forever()
except KeyboardInterrupt:
    print('\nPortal dihentikan.')
    sys.exit(0)
