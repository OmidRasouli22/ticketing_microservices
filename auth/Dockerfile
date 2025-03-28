# Stage 1: Build stage
FROM node:alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available) to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies (only production dependencies)
# RUN npm install --omit=dev
RUN npm install

# Copy the rest of the application code
COPY . .

# Stage 2: Production stage
FROM node:alpine AS production

# Set working directory for production stage
WORKDIR /app

# Copy node_modules from the build stage to avoid reinstalling
COPY --from=build /app/node_modules ./node_modules

# Copy the application code from the build stage
COPY --from=build /app ./

# Set environment to production (ensure it’s set correctly)
ENV NODE_ENV=production

# Expose the port your app is running on
EXPOSE 3000

# Run the application
CMD [ "npm", "start" ]
