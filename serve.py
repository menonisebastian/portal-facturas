#!/usr/bin/env python3
"""Simple HTTP server with correct MIME types and SPA fallback for testing."""
import http.server
import os

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        '': 'application/octet-stream',
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.pdf': 'application/pdf',
    }

    def do_GET(self):
        # SPA fallback: if path doesn't match a file, serve index.html
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not self.path.startswith('/src/') and not self.path.startswith('/assets/'):
            self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    PORT = 8765
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with http.server.HTTPServer(('', PORT), SPAHandler) as httpd:
        print(f'🚀 SPA Server running at http://localhost:{PORT}')
        httpd.serve_forever()
