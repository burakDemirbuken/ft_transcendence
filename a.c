#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <json-c/json.h>

#define PORT 8080
#define BUFFER_SIZE 4096

void send_response(int socket, int status_code, const char *status_text, const char *content_type, const char *body) {
    char response[BUFFER_SIZE];
    snprintf(response, sizeof(response),
             "HTTP/1.1 %d %s\r\n"
             "Content-Type: %s\r\n"
             "Content-Length: %zu\r\n"
             "Connection: close\r\n"
             "\r\n"
             "%s", status_code, status_text, content_type, strlen(body), body);
    send(socket, response, strlen(response), 0);
}

void handle_get_users(int socket) {
    struct json_object *root = json_object_new_object();
    struct json_object *users_array = json_object_new_array();
    
    struct json_object *user1 = json_object_new_object();
    json_object_object_add(user1, "id", json_object_new_int(1));
    json_object_object_add(user1, "name", json_object_new_string("Ahmet"));
    json_object_object_add(user1, "email", json_object_new_string("ahmet@example.com"));
    json_object_array_add(users_array, user1);
    
    struct json_object *user2 = json_object_new_object();
    json_object_object_add(user2, "id", json_object_new_int(2));
    json_object_object_add(user2, "name", json_object_new_string("Ayşe"));
    json_object_object_add(user2, "email", json_object_new_string("ayse@example.com"));
    json_object_array_add(users_array, user2);
    
    json_object_object_add(root, "users", users_array);
    const char *json_string = json_object_to_json_string(root);
    
    send_response(socket, 200, "OK", "application/json", json_string);
    json_object_put(root);
}

void handle_get_status(int socket) {
    struct json_object *root = json_object_new_object();
    json_object_object_add(root, "status", json_object_new_string("running"));
    json_object_object_add(root, "version", json_object_new_string("1.0.0"));
    json_object_object_add(root, "message", json_object_new_string("API çalışıyor!"));
    
    const char *json_string = json_object_to_json_string(root);
    send_response(socket, 200, "OK", "application/json", json_string);
    json_object_put(root);
}

void handle_get_user(int socket, int user_id) {
    struct json_object *root = json_object_new_object();
    
    if (user_id == 1) {
        json_object_object_add(root, "id", json_object_new_int(1));
        json_object_object_add(root, "name", json_object_new_string("Ahmet"));
        json_object_object_add(root, "email", json_object_new_string("ahmet@example.com"));
        json_object_object_add(root, "age", json_object_new_int(25));
    } else if (user_id == 2) {
        json_object_object_add(root, "id", json_object_new_int(2));
        json_object_object_add(root, "name", json_object_new_string("Ayşe"));
        json_object_object_add(root, "email", json_object_new_string("ayse@example.com"));
        json_object_object_add(root, "age", json_object_new_int(28));
    } else {
        json_object_object_add(root, "error", json_object_new_string("Kullanıcı bulunamadı"));
        const char *json_string = json_object_to_json_string(root);
        send_response(socket, 404, "Not Found", "application/json", json_string);
        json_object_put(root);
        return;
    }
    
    const char *json_string = json_object_to_json_string(root);
    send_response(socket, 200, "OK", "application/json", json_string);
    json_object_put(root);
}

void handle_request(int socket, char *buffer) {
    printf("İstek: %s\n", buffer);
    
    if (strncmp(buffer, "GET /api/status", 15) == 0) {
        handle_get_status(socket);
    }
    else if (strncmp(buffer, "GET /api/users", 14) == 0) {
        handle_get_users(socket);
    }
    else if (strncmp(buffer, "GET /api/user/", 14) == 0) {
        int user_id = atoi(buffer + 14);
        handle_get_user(socket, user_id);
    }
    else if (strncmp(buffer, "GET /", 5) == 0) {
        const char *html = "<!DOCTYPE html><html><head><title>C API</title></head>"
                          "<body><h1>C ile REST API</h1>"
                          "<p>Endpoints:</p><ul>"
                          "<li>GET /api/status - API durumu</li>"
                          "<li>GET /api/users - Tüm kullanıcılar</li>"
                          "<li>GET /api/user/{id} - Belirli bir kullanıcı</li>"
                          "</ul></body></html>";
        send_response(socket, 200, "OK", "text/html", html);
    }
    else {
        struct json_object *root = json_object_new_object();
        json_object_object_add(root, "error", json_object_new_string("Endpoint bulunamadı"));
        const char *json_string = json_object_to_json_string(root);
        send_response(socket, 404, "Not Found", "application/json", json_string);
        json_object_put(root);
    }
}

int main() {
    int server_fd, new_socket;
    struct sockaddr_in address;
    int addrlen = sizeof(address);
    char buffer[BUFFER_SIZE];
    int opt = 1;

    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("socket failed");
        exit(EXIT_FAILURE);
    }

    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt))) {
        perror("setsockopt");
        exit(EXIT_FAILURE);
    }

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind failed");
        exit(EXIT_FAILURE);
    }

    if (listen(server_fd, 10) < 0) {
        perror("listen");
        exit(EXIT_FAILURE);
    }

    printf("🚀 Server çalışıyor: http://localhost:%d\n", PORT);
    printf("Endpoints:\n");
    printf("  GET /api/status\n");
    printf("  GET /api/users\n");
    printf("  GET /api/user/{id}\n\n");

    while (1) {
        if ((new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t *)&addrlen)) < 0) {
            perror("accept");
            continue;
        }

        memset(buffer, 0, BUFFER_SIZE);
        recv(new_socket, buffer, BUFFER_SIZE - 1, 0);
        
        handle_request(new_socket, buffer);
        
        close(new_socket);
    }

    close(server_fd);
    return 0;
}