# Multi-stage build: SPA + API in a single container.
# Stage 1 builds the frontend with same-origin API base (VITE_API_BASE_URL=/).
FROM node:22 AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
RUN npm ci

COPY frontend/ ./
ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2 bundles the built SPA into the Spring Boot jar (served from static/).
FROM eclipse-temurin:25-jdk AS backend-build

WORKDIR /app/backend

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist/ /app/backend/src/main/resources/static/
RUN ./gradlew bootJar

# Stage 3 minimal JRE runtime; PORT is assigned by the platform (Railway).
FROM eclipse-temurin:25-jre AS runtime

WORKDIR /app

COPY --from=backend-build /app/backend/build/libs/booking-0.0.1-SNAPSHOT.jar /app/booking.jar

ENV PORT=4010
EXPOSE 4010

ENTRYPOINT ["java", "-jar", "/app/booking.jar"]