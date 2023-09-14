# Use an official Node.js runtime as the base image
FROM node:16-alpine

# Set environment variables
ENV MONGODB_LOCAL_CONNECTION_STRING = "mongodb://0.0.0.0:27017/rasoiDb";
ENV SECRET_KEY = my-secret-key;

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose port 3000 to the outside world
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
