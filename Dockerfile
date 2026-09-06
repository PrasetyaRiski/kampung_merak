FROM nginx:alpine

# Copy hasil build production ke direktori Nginx
COPY dist /usr/share/nginx/html

# Berikan izin baca pada file html dan aset
RUN chmod -R 755 /usr/share/nginx/html

# Copy konfigurasi Nginx reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
