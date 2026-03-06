# Adrian Szuter - Master Thesis 2025

# Overview

# Installation

> **Mac/Linux users:** Replace `copy` with `cp` and `venv\Scripts\activate` with `source venv/bin/activate` where applicable.

This project can be run in two ways:

1. **Manual Setup** - using Node.js and Python directly on your machine
2. **Containerized Setup** - using Docker or Podman

## Setup

### 1. Clone the repository

```bash
git clone https://gitlab.liu.se/ivis/theses/adrian-szuter-master-thesis-2025.git
```

### 2. Configure environment variables

Copy the example env file:

```bash
copy .env.example .env
```

In the created **.env** file you can set the following environment variables:

```bash
COMPOSE_PROJECT_NAME=vincent               # Name of the docker compose container
BACKEND_PORT=8000                          # Port for the backend service
ALLOWED_ORIGINS=http://localhost:3000,*    # Allowed origins (CORS) (comma separated list with frontend URLs)
CELERY_BROKER_URL=redis://redis:6379/0     # Connection used by Celery to send tasks
CELERY_BACKEND_URL=redis://redis:6379/0    # Connection used by Celery to store task results
VITE_BACKEND_URL=http://localhost:8000     # Backend URL used by the frontend
VITE_PORT=3000                             # Port for the frontend service
VITE_GENERATE_SOURCEMAP=false              # Disable frontend source map generation for faster builds
```

Environment variables injected at runtime override those set during build.

---

## Option 1: Manual Setup

### Requirements

- **Node.js** v18+
- **Python** 3.x+

### Steps

#### 1. Backend setup

Create and activate a virtual environment:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

Make sure the virtual enviornment is active.

Install the required dependencies **with:**

```bash
pip install -r requirements.txt
```

#### 3. Frontend setup

If you followed step 2, **Run:**

```bash
cd ../frontend
npm install
```

#### 4. Run the project

You need to run the frontend and backend in separate terminals.

Run this command in the terminal for the backend folder:

```bash
python run-dev.py
```

Run this command in the terminal for the frontend folder:

```bash
npm start
```

## Option 2: Containerized Setup

### Requirements

- **Docker** or **Podman** (replace docker commands with podman)
- **Docker/Podman Compose** (usually part of docker/podman)

### Steps

#### 1. Build and Run

```bash
docker compose -f compose.dev.yml up --build
```

**NOTE:** If you have already built the project and made no changes, use:

```bash
docker compose -f compose.dev.yml up
```

#### 3. Open the app in your browser

- Frontend: http://localhost:3000 (default)

- Backend: http://localhost:8000 (default)

#### 4. Clean up

Run **CTRL+C** in the terminal and then:

```bash
docker compose -f compose.dev.yml down
```

in order to exit and clean up the containers.

## Opening the App

Once either setup is running, open your browser at:

- Frontend: http://localhost:3000 (default)
- Backend: http://localhost:8000 (default)

# Usage

You can download and view the Demo of the tool.

## Authors and acknowledgment

Show your appreciation to those who have contributed to the project.

## License

For open source projects, say how it is licensed.

## Project status

If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
