# Use official Node.js image
FROM node:18-slim

# Install Python, pip, and gcc (needed for some Python packages)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm ci

# Copy Python requirements and install Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages || pip3 install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY . .

# Expose the port
EXPOSE 8000

# Start command
CMD ["npm", "start"]
