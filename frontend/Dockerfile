FROM nginx:alpine
COPY dist /usr/share/nginx/html
# Copy custom nginx config if we need SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
