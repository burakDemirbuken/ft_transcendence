# Temel değişkenler
IMAGE_NAME=ai
CONTAINER_NAME=ai
PORT=3000

all: build run

# Docker imajını inşa et
build:
	@docker build -t $(IMAGE_NAME) .

# Konteyneri çalıştır (önceki varsa sil, sonra yeniden başlat)
run:
	@docker run -it -d \
		-p $(PORT):$(PORT) \
		--name $(CONTAINER_NAME) \
		$(IMAGE_NAME)

# Konteyneri durdur ve sil
stop:
	@docker stop $(CONTAINER_NAME) && docker rm $(CONTAINER_NAME)

# Logları göster
logs:
	@docker logs -f $(CONTAINER_NAME)

# Tüm konteynerleri listele
show:
	@docker ps -a
