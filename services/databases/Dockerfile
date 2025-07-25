FROM alpine:latest

# Install SQLite and dependencies
RUN apk add --no-cache \
    sqlite \
    sqlite-dev 
# Main working directory
WORKDIR /app

RUN mkdir -p /data

COPY ./entry.sh /usr/local/bin/entry.sh

RUN chmod +x /usr/local/bin/entry.sh

CMD ["/usr/local/bin/entry.sh"]

