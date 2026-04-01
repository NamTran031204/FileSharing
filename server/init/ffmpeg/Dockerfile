FROM openjdk:17-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy application
COPY target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "/app.jar"]