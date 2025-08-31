FROM nginx:1.29.0-alpine

RUN mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.orig
RUN mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.orig

RUN apk update && apk upgrade && apk add --no-cache \
	openssl \
	pcre \
	&& rm -rf /var/cache/apk/*

COPY ./conf/nginx.conf /etc/nginx/nginx.conf
COPY ./conf/default.conf /etc/nginx/conf.d/default.conf
COPY ./nginx_entry.sh /entry.sh

RUN mkdir -p /usr/share/nginx/html && \
mkdir -p etc/nginx/ssl && \
adduser -D -g 'www' www && \
chown -R www:www /usr/share/nginx/html && \
chmod +x /entry.sh

# Default nginx page will be used until frontend is ready


EXPOSE 8080

ENTRYPOINT [ "/entry.sh" ]

CMD ["nginx", "-g", "daemon off;"]

