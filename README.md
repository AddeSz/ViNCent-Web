# Adrian Szuter - Master Thesis 2025

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

# Installation

This project can be run in two ways:

1. **Locally (for development)** — using Node.js and Python
2. **Via Docker (for production testing)** — using Docker

## Option 1: Local Development

### Requirements

- **Node.js** v18+
- **Python** 3.x+

### Steps

#### 1. Clone and open the repository:

Get the project with:

```bash
git clone https://gitlab.liu.se/ivis/theses/adrian-szuter-master-thesis-2025.git
```

Open the project, and **On Windows Run:**

```bash
copy .env.example .env
```

**NOTE:** On Mac/Linux use **cp** instead of **copy**

#####  Enviornment Variables
In the created **.env** file you can set the following enviornment variables:
```bash
COMPOSE_PROJECT_NAME=vincent            # Name of the docker compose container
BACKEND_PORT=8000                       # Port for the backend service
ALLOWED_ORIGINS=http://localhost:3000,* # Allowed origins (CORS) (comma separated list with frontend URLs)
VITE_BACKEND_URL=http://localhost:8000  # Backend URL used by the frontend
VITE_PORT=3000                          # Port for the frontend service
VITE_GENERATE_SOURCEMAP=false           # Disable frontend source map generation for faster builds

```
Enviornment variables injected at runtime override the enviornment variables set during build.

#### 2. Backend setup

Create and activate a virtual environment:

**On Windows Run:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

**NOTE:** On Mac/Linux run **source venv/bin/activate** instead of **venv\Scripts\activate**

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

You need to run the frontend and backend in seperate terminals.

Run this command in the terminal for the backend folder:

```bash
    python run-dev.py
```

Run this command in the terminal for the frontend folder :

```bash
    npm start
```

#### 5. Open the app in your browser:

- Frontend: http://localhost:3000 (default)

- Backend: http://localhost:8000 (default)

## Option 2: Docker

### Requirements

- **Docker**
- **Docker Compose** (usually part of docker)

### Steps

#### 1. Clone and open the repository:

Get the project with:

```bash
git clone https://gitlab.liu.se/ivis/theses/adrian-szuter-master-thesis-2025.git
```

Open the project, and **On Windows Run:**

```bash
copy .env.example .env
```

**NOTE:** On Mac/Linux use **cp** instead of **copy**

##### Enviornment Variables

In the created **.env** file you can set the following enviornment variables:
```bash
COMPOSE_PROJECT_NAME=vincent            # Name of the docker compose container
BACKEND_PORT=8000                       # Port for the backend service
ALLOWED_ORIGINS=http://localhost:3000,* # Allowed origins (CORS) (comma separated list with frontend URLs)
VITE_BACKEND_URL=http://localhost:8000  # Backend URL used by the frontend
VITE_PORT=3000                          # Port for the frontend service
VITE_GENERATE_SOURCEMAP=false           # Disable frontend source map generation for faster builds

```
Enviornment variables injected at runtime override the enviornment variables set during build.

#### 2. Build and Run

```bash
docker compose up --build
```

**NOTE:** If you have already built the project and made no changes, use:

```bash
docker compose up
```

#### 3. Open the app in your browser

- Frontend: http://localhost:3000 (default)

- Backend: http://localhost:8000 (default)

#### 4. Docker Clean up

Run **CTRL+C** in the terminal and then:

```bash
docker compose down
```
in order to exit and clean up the docker containers.

# Usage

Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support

Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap

If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing

State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment

Show your appreciation to those who have contributed to the project.

## License

For open source projects, say how it is licensed.

## Project status

If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
