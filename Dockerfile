FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for compiling packages and PostgreSQL drivers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files and database seed
COPY backend/ ./backend/
COPY app.py .
COPY prospecao.db* ./

# Expose Streamlit default port
EXPOSE 8501

# Configure Streamlit environment settings for Docker
ENV STREAMLIT_SERVER_PORT=8501
ENV STREAMLIT_SERVER_ADDRESS=0.0.0.0
ENV STREAMLIT_SERVER_HEADLESS=true

# Command to launch the Streamlit frontend & backend app
CMD ["streamlit", "run", "app.py"]
