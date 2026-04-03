# Build the frontend [dist folder]
#copy the dist folder content in backend/public folder

FROM node:20-alpine as frontend-builder

COPY ./frontend/vite-project/app