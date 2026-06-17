import os
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler

STATIC_DIR = os.path.join(os.path.dirname(__file__), "out")

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)
    
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status": "Healthy"}')
            return
        
        if self.path == "/" or self.path == "":
            self.path = "/index.html"
        
        if not self.path.startswith("/"):
            self.path = "/" + self.path
        
        file_path = os.path.join(STATIC_DIR, self.path.lstrip("/"))
        
        if os.path.isdir(file_path):
            file_path = os.path.join(file_path, "index.html")
        
        if os.path.exists(file_path) and os.path.isfile(file_path):
            ext = os.path.splitext(file_path)[1]
            content_type = mimetypes.types_map.get(ext, "application/octet-stream")
            if ext == ".js":
                content_type = "application/javascript"
            elif ext == ".css":
                content_type = "text/css"
            
            self.send_response(200)
            self.send_header("Content-type", content_type)
            self.send_header("Cache-Control", "public, max-age=31536000")
            self.end_headers()
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Not Found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

def run_server():
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("0.0.0.0", port), CustomHandler)
    print(f"UI Server running on port {port}")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
