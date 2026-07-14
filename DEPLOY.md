# CryptoPal Google Cloud VM Deploy

This setup runs the full app with Docker Compose:

- `frontend`: Nginx serves the React build on port `80`
- `backend`: Spring Boot runs internally on port `8080`
- `postgres`: internal PostgreSQL database
- `redis`: internal Redis cache

The public URL is:

```text
http://34.10.14.229
```

## 1. Open VM Firewall

In Google Cloud, allow inbound TCP `80` for the VM.

You do not need to expose PostgreSQL, Redis, or backend port `8080`.

## 2. Install Docker On The VM

Run these commands over SSH:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out and SSH back in after `usermod`.

## 3. Pull The Repository

```bash
git clone https://github.com/ahmetikolik/KriptoKasa.git
cd KriptoKasa
```

If the repo already exists:

```bash
cd KriptoKasa
git pull
```

## 4. Create Environment File

```bash
cp .env.example .env
nano .env
```

Set a real password:

```text
POSTGRES_PASSWORD=your_strong_password_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-lite-latest
```

## 5. Start The App

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
```

Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## 6. Open In Browser

```text
http://34.10.14.229
```

## Updating Later

```bash
cd KriptoKasa
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
