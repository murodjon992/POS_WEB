# 1-bosqich: React-ni build qilish
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2-bosqich: Nginx orqali tarqatish
FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Nginx konfiguratsiyasini (ixtiyoriy) ko'chirish
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]