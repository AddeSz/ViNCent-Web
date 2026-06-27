# Adrian Szuter - Master Thesis 2025

**ViNCent Web** is a web-based tool for interactive visualization and analysis of multivariate and temporal networks. It is a modern reimplementation of the original [ViNCent](https://ep.liu.se/konferensartikel.aspx?series=&issue=81&Article_No=12) system, rebuilt from Java/Prefuse into a full client-server web application.

The centerpiece is a **circular radial-bar diagram** where each node is represented as a stacked bar encoding multiple centrality measures and attributes simultaneously, coordinated with a **node-link diagram** and **data table view**.

**Highlights:**

- 25 centrality measures + 8 community detection algorithms
- Multivariate support for arbitrary categorical and numerical node attributes
- Temporal network navigation with foresighted layouts and visual change indicators
- Histogram and bar chart filtering, synchronized across all views
- Force-Directed Edge Bundling (FDEB) for dense networks
- Supports GraphML, CSV, MTX, adjacency matrix, and custom JSON formats

Built with **React / TypeScript / D3.js** and **Python / FastAPI / NetworkX**.

![ViNCent Web Interface](screenshot.PNG)

## Installation

This project runs via Docker (or Podman) Compose. There is no manual/non-containerized setup, since the backend depends on Redis and a Celery worker process in addition to the API itself.

### Requirements

- **Docker** or **Podman** (replace docker commands with podman)
- **Docker/Podman Compose** (usually part of docker/podman)

### Project Initialization

#### 1. Clone the repository

```bash
git clone https://gitlab.liu.se/ivis/theses/adrian-szuter-master-thesis-2025.git
```

#### 2. Configure environment variables

Copy the example env file:

```bash
copy .env.example .env
```

> **Mac/Linux users:** use `cp` instead of `copy`.

In the created **.env** file you can set the following environment variables:

```bash
BACKEND_PORT=8000                          # Port for the backend service
ALLOWED_ORIGINS=http://localhost:3000,*    # Allowed origins (CORS) (comma separated list with frontend URLs)
CELERY_BROKER_URL=redis://redis:6379/0     # Connection used by Celery to send tasks
CELERY_BACKEND_URL=redis://redis:6379/0    # Connection used by Celery to store task results
CELERY_CONCURRENCY=4                       # Number of worker processes spawned by Celery
VITE_BACKEND_URL=http://localhost:8000     # Backend URL used by the frontend
VITE_PORT=3000                             # Port for the frontend service
```

Environment variables injected at runtime override those set during build.

---

### Development

#### 1. Build and Run

```bash
docker compose -f compose.yml -f compose.dev.yml up --build
```

> **NOTE:** If you have already built the project and made no changes, use:
>
> ```bash
> docker compose -f compose.yml -f compose.dev.yml up
> ```

#### 2. Clean up

Run **CTRL+C** in the terminal and then:

```bash
docker compose -f compose.yml -f compose.dev.yml down
```

in order to exit and clean up the containers.

---

### Production

To run the production configuration instead:

```bash
docker compose -f compose.yml -f compose.prod.yml up --build
```

---

### Opening the App

Once either setup is running, open your browser at:

- Frontend: http://localhost:3000 (default)
- Backend: http://localhost:8000 (default)

---

## Usage

A demo video (`ViNCent_Web_Demo.mp4`) is included in this repository. You can open it with any standard media player to see the tool in action.

Simply download or clone the repo, then play the video to get a quick overview of how the tool works.

## Authors and acknowledgment

I would like to thank everyone who participated in the interviews for their time and insights, which helped shape the final version of the system. I am especially grateful to my supervisor, Prof. Dr. Andreas Kerren, and my examiner, Dr. Kostiantyn Kucher, for their invaluable feedback and guidance throughout this work, which helped refine the direction of the research and implementation and significantly improved its quality.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
