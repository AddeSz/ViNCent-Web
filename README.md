# Adrian Szuter - Master Thesis 2025

<!-- ## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.liu.se/ivis/theses/adrian-szuter-master-thesis-2025.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](https://gitlab.liu.se/ivis/theses/adrian-szuter-master-thesis-2025/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

--- -->

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

<!-- ## Name

Choose a self-explaining name for your project.

## Description

Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges

On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals

Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method. -->

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

Open it, and **On Windows Run:**

```bash
copy .env.example .env
```

**NOTE:** On Mac/Linux use **cp** instead of **copy**

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

Open it, and **On Windows Run:**

```bash
copy .env.example .env
```

**NOTE:** On Mac/Linux use **cp** instead of **copy**

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

#### 4. (Optional) Quit

- Run **CTRL+C** in the terminal and then:

```bash
docker compose down
```

for clean up.

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
