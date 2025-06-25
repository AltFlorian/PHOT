# PHOT 🔥

**PHOT** steht für _Python Heating Oil Tracker_ – eine moderne Webanwendung, mit der du einfach und komfortabel den Füllstand deines Heizöltanks überwachen kannst.

https://github.com/user-attachments/assets/3217d66b-4dce-4c4b-ada5-93dcf0a994e5

---

## 🌟 Features

- **Visualisierung**: Übersichtliche Darstellung von Tankfüllstand und Verbrauch im Zeitverlauf.
- **Responsive Webdesign**: Desktop- und mobilfreundliche Oberfläche.

---

## 🧱 Architektur & Tech‑Stack

| Komponente      | Technologie         |
|----------------|---------------------|
| Backend        | Python (FastAPI) |
| Datenbank      | SQLite (SQLModel) |
| Frontend       | HTML5, CSS, vanilla JavaScript, MUI |
| Visualisierung | Chart.js |
| Deployment     | Docker-Containers / optional Python‑Umgebung |

---

## 🚀 Setup
https://hub.docker.com/r/florianalt/phot

### Docker Run

```bash
docker run -d -v /code/app/storage:/phot/ --name florianalt/phot:latest -p 8080:80 phot 
```

### Docker Compose
```bash
name: phot
services:
    phot:
        volumes:
            - /code/app/storage:/phot/
        container_name: florianalt/phot:latest
        ports:
            - 8080:80
        image: phot
```

