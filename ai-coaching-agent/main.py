import os
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote
from datetime import datetime

STATIC_DIR = os.path.join(os.path.dirname(__file__), "out")

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = unquote(parsed_path.path)
        
        if path == "/health":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status": "Healthy", "time_of_last_update": ' + str(int(datetime.now().timestamp())).encode() + b'}')
            return
        
        if path == "/invocations" or path == "/api/invocations":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            response = b'{"status": "success", "response": "Welcome to AI Development Coach! Go to / to see the UI.", "timestamp": "' + datetime.now().isoformat().encode() + b'"}'
            self.wfile.write(response)
            return
        
        if path == "/" or path == "":
            path = "/index.html"
        
        if not path.startswith("/"):
            path = "/" + path
        
        file_path = os.path.join(STATIC_DIR, path.lstrip("/"))
        
        if os.path.isdir(file_path):
            file_path = os.path.join(file_path, "index.html")
        
        if os.path.exists(file_path) and os.path.isfile(file_path):
            ext = os.path.splitext(file_path)[1]
            content_type = mimetypes.types_map.get(ext, "application/octet-stream")
            if ext == ".js":
                content_type = "application/javascript"
            elif ext == ".css":
                content_type = "text/css"
            elif ext == ".json":
                content_type = "application/json"
            
            self.send_response(200)
            self.send_header("Content-type", content_type)
            self.send_header("Cache-Control", "public, max-age=31536000")
            self.end_headers()
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
        else:
            file_path = os.path.join(STATIC_DIR, "404.html")
            if os.path.exists(file_path):
                self.send_response(404)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                with open(file_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.send_header("Content-type", "text/plain")
                self.end_headers()
                self.wfile.write(b"404 Not Found")

    def do_POST(self):
        if self.path == "/invocations" or self.path == "/api/invocations":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            
            response = self.get_ai_response(body)
            
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(response.encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()
    
    def get_ai_response(self, body):
        import random
        responses = [
            "Tuyệt vời! Hãy cho tôi biết bạn muốn học gì hôm nay?",
            "Tôi có thể giúp bạn phân tích kỹ năng, tạo lộ trình học.",
            "Để đạt Senior Developer, tập trung System Design và Python nhé!"
        ]
        
        message = ""
        if "message" in body:
            import json
            try:
                data = json.loads(body)
                message = data.get("message", "").lower()
            except:
                pass
        
        if "gap" in message or "phân tích" in message or "skill" in message:
            response = """📊 GAP ANALYSIS

Kỹ năng cần cải thiện:
• Python: 45% → 80% (Gap: 35%)
• System Design: 40% → 85% (Gap: 45%)  
• Docker/K8s: 35% → 75% (Gap: 40%)

Lộ trình đề xuất: 6 tháng để Senior Developer"""
        elif "lộ trình" in message or "roadmap" in message:
            response = """🗺️ LEARNING ROADMAP (6 tháng)

Phase 1: Advanced JS/TypeScript - 4 weeks
Phase 2: System Design - 6 weeks  
Phase 3: Cloud & DevOps - 6 weeks
Phase 4: Leadership Skills - 4 weeks

Tiến độ: 35%"""
        else:
            response = random.choice(responses)
        
        return f'{{"status": "success", "response": "{response}", "timestamp": "{datetime.now().isoformat()}"}}'

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

def run_server():
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("0.0.0.0", port), CustomHandler)
    print(f"AI Development Coach running on port {port}")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
