FROM python:3.13-slim
WORKDIR /app
COPY ai-coaching-agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ai-coaching-agent/out ./out
COPY ai-coaching-agent/main.py .
EXPOSE 8080
CMD ["python", "main.py"]
