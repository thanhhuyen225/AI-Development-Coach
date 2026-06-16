FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY out ./out
COPY main.py .
COPY database.py .
EXPOSE 8080
CMD ["python", "main.py"]
