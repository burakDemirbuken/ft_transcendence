# ft\_transcendence 🎮

![transcendence_gif](image/transcendence.gif)

<br>

## Table of Contents

- [ft\_transcendence 🎮](#ft_transcendence-)
	- [Table of Contents](#table-of-contents)
	- [🚀 About the Project](#-about-the-project)
		- [Main Objectives](#main-objectives)
	- [✨ Modules and Descriptions](#-modules-and-descriptions)
	- [🛠️ Technologies Used](#️-technologies-used)
		- [🌐 Frontend](#-frontend)
		- [🖥️ Backend](#️-backend)
		- [💾 Database \& Infrastructure](#-database--infrastructure)
	- [🖼️ Screenshots \& GIFs](#️-screenshots--gifs)
		- [Application Flow](#application-flow)
		- [Homepage and Rankings](#homepage-and-rankings)
		- [🕹️ In-Game Dynamics (GIF)](#️-in-game-dynamics-gif)
		- [💬 Chat Interface](#-chat-interface)
	- [🚀 Installation and Running Instructions](#-installation-and-running-instructions)
		- [Option 1: Automated Installation (`setup.sh`)](#option-1-automated-installation-setupsh)
		- [Option 2: Manual Installation (In Case of Error)](#option-2-manual-installation-in-case-of-error)
			- [1. Check Prerequisites](#1-check-prerequisites)
			- [2. Compile and Run the Project](#2-compile-and-run-the-project)
			- [3. Configure the .env file](#3-configure-the-env-file)
			- [4. Access the Project](#4-access-the-project)
	- [👥 Contributors](#-contributors)
-----
<br>

## 🚀 About the Project

**ft\_transcendence** is a large-scale, full-stack web development project from **42 School**. Its primary goal is to create an advanced **online Pong** game and a comprehensive social platform surrounding it, using modern web technologies.

This platform offers more than just a game experience; it includes all essential features expected in professional-grade web applications, such as secure user authentication, a ranking system, and detailed profile management.

### Main Objectives

  * Design and implement a reliable and scalable full-stack architecture.
  * Provide a low-latency, real-time gaming experience using **WebSockets**.
  * Ensure user security with **OAuth2** integration and **Two-Factor Authentication (2FA)**.
  * Develop a modern and responsive user interface.

<br>

-----

<br>

## ✨ Modules and Descriptions

| Category     | Module Name                         | Type           | Description                            | Status                            |
| :---         | :---                                | :---         | :---                                   | :---                              |
| **Web**      |Backend Development with Fastify|Major|Backend development using Fastify on Node.js| <span style="color:#39ff14; font-weight:bold;">finished</span>|
| | Use a Database for the Backend |Minor| SQLite is used for all database instances in the project to ensure consistency and compatibility | <span style="color:#39ff14; font-weight:bold;">finished</span> |
| **User Management** | User management and authentication |Major| It must provide secure registration, login, unique display names, profile updates, avatar upload, a friends system, and match history features | <span style="color:#39ff14; font-weight:bold;">finished</span> |
| **Gameplay and user experience** |Remote Players|Major|Two players must be able to play the same Pong game from separate computers, with proper handling of disconnections, lag, and other network issues | <span style="color:#39ff14; font-weight:bold;">finished</span> |
|              |Multiple Players|Major|The game must support 3+ players in real time with an appropriate gameplay design | <span style="color:#39ff14; font-weight:bold;">finished</span> |
|              |Game Customization|Minor| It must provide user-friendly customization options—such as power-ups and maps—available across all games on the platform | <span style="color:#39ff14; font-weight:bold;">finished</span> |
| **AI-Algo**  |AI Opponent|Major| The AI must act human-like, update its view only once per second, make strategic decisions, and interact with gameplay elements intelligently | <span style="color:#39ff14; font-weight:bold;">finished</span> |
|              |Stats Dashboards|Minor| It should provide user-friendly dashboards with charts for viewing personal performance and detailed match data | <span style="color:#39ff14; font-weight:bold;">finished</span> |
| **Cybersecurity**  |Two-Factor & JWT|Major|It must provide 2FA setup (SMS, authenticator app, email) and secure JWT-based authentication/authorization | <span style="color:#39ff14; font-weight:bold;">finished</span> |
| **Devops**  |Microservices Architecture|Major| The backend should be divided into small independent services that communicate via REST or messaging | <span style="color:#39ff14; font-weight:bold;">finished</span> |
| **Graphics**  |Advanced 3D Graphics|Major| The Pong game should use Babylon.js to provide immersive and visually enhanced 3D graphics | <span style="color:#39ff14; font-weight:bold;">finished</span> |
| **Accessibility**  |Device Support|Minor| The website must be fully responsive and work smoothly on desktops, tablets, and smartphones with all input methods | <span style="color:#39ff14; font-weight:bold;">finished</span> |
|              |Browser Compatibility|Minor| The app should be tested and optimized for the new browser, ensuring full compatibility and a consistent user experience | <span style="color:#39ff14; font-weight:bold;">finished</span> |
|              |Language Support|Minor| The site should support at least three languages and include a language switcher; some translation work is still incomplete. | <span style="color:#00e5ff; font-weight:bold;">partially delivered</span> |
| **Server-Side Pong**  | Server-Side Pong & API|Major| The game should run on the server, expose API endpoints, and integrate with the web interface for gameplay | <span style="color:#39ff14; font-weight:bold;">finished</span> |

-----

<br>

## 🛠️ Technologies Used

The main technologies, libraries, and frameworks used in the development of this project:

### 🌐 Frontend

  * **Language:** `TypeScript`
  * **Styling:** `CSS`

### 🖥️ Backend

  * **Framework:** `Node.js`
  * **Language:** `JavaScript`
  * **Real-Time Communication:** `WebSockets`
  * **Database:** `SQLite`

### 💾 Database & Infrastructure

  * **Database:** `SQLite`
  * **Containerization:** `Docker` and `Docker Compose`
  * **Authentication:** `JWT (JSON Web Tokens)`

<br>

-----

<br>

## 🖼️ Screenshots & GIFs

This section is reserved for showcasing the visual appeal of your project. You can add high-quality screenshots and demos that illustrate the project's flow, core features, and in-game dynamics.

### Application Flow

  * **[Image/GIF Placeholder]** - A visual showing the user login process via the 42 API.

### Homepage and Rankings

  * **[Image/GIF Placeholder]** - A screenshot of the application's homepage (Dashboard) and the global ranking table.

### 🕹️ In-Game Dynamics (GIF)

  * **[GIF Placeholder]** - A short GIF showcasing a fluid moment of the real-time Pong game.

### 💬 Chat Interface

  * **[Image Placeholder]** - A screenshot illustrating the interface of general and private chat channels.

<br>

-----

<br></br>

## 🚀 Installation and Running Instructions
<br>

### Option 1: Automated Installation (`setup.sh`)

Use the `setup.sh` file located in the root directory to automate the project's installation, dependencies, and launch.

1.  Navigate to the project directory.
2.  Run the `setup.sh` file:
    ```bash
    ./setup.sh
    ```
    This command will execute the necessary installations (including building Docker container images), run the **make** command, and attempt to automatically open the project in your browser.

<br>

### Option 2: Manual Installation (In Case of Error)

If the `setup.sh` file does not run or if the automatic launch fails, you can manually follow the steps below:

#### 1\. Check Prerequisites

Ensure that `Docker` and `make` are installed on your system.

#### 2\. Compile and Run the Project

1.  Navigate to the project directory.
2.  Use the **make** command to compile the project, build the Docker container images, and launch the application:
    ```bash
    make
    ```
    [cite_start]This command fulfills the mandatory requirement to launch all services (frontend, backend, database, etc.) with a single command line using Docker Compose[cite: 115].

#### 3\. Configure the .env file

1.  Copy the `.env.example` file to `.env` in the project root directory:

    ```bash
    cp .env.example .env
    ```

2.  Open the `.env` file with a text editor and locate the `HOST_IP` variable. Replace its value with the IP address of the machine running the project. If you are running it on your local machine, you can leave it as `localhost`.

    If you want to access it from another device, write the device's IP address instead of `localhost`:

    ```env
    HOST_IP= (your device's ip)
    ```

#### 4\. Access the Project

Once all containers have started (which may take a few minutes), you can access the website via the following secure links:

  * **Local Access:**
    `https://localhost:3030`
  * **Network Access (From Other Devices):**
    `https://<your_device's_ip_address>:3030`

> To access from other computers, ensure that you have set the `HOST_IP` variable in the `.env` file to the IP address of the device running the project.

<br>

-----

<br>

## 👥 Contributors

This project was developed by the following team members:

| Full Name | GitHub | 42 Username |
| :--- | :--- | :--- |
| **Nisa Ceren Ünnü** | [nisaunnu](https://github.com/nisaunnu) | `nunnu` |
| **Betül Korkut** | [bkorkut](https://github.com/bkorkut) | `bkorkut` |
| **Burak Demirbüken** | [burakDemirbuken](https://github.com/burakDemirbuken) | `bdemirbu` |
| **Yunus Emre Saraç** | [TroubledKezoo1](https://github.com/TroubledKezoo1) | `ysarac` |
| **Ulaş Berke Yıldız** | [ulyildiz](https://github.com/ulyildiz) | `ulyildiz` |

-----
