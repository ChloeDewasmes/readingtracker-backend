# API - Book Tracking Backend

## Prérequis

- Node.js
- MongoDB (ou autre base de données si nécessaire)
- Yarn

## Installation

### 1. Cloner le dépôt

Clone le dépôt back-end dans ton environnement local :

git clone <url-du-repository-backend>
cd backend

### 2. Installer les dépendances
Installe les dépendances nécessaires via Yarn :

yarn install

### 3. Configurer les variables d'environnement
Crée un fichier .env à la racine du projet pour les variables d'environnement suivantes :

MONGO_URI=<votre-uri-mongodb>
PORT=3000

### 4. Démarrer le serveur
Lance le serveur avec la commande suivante :

yarn start
Le serveur sera accessible sur http://localhost:3000 (ou un autre port que tu as configuré).

## Exemple endpoints disponibles
- GET /users/{token} : Récupère les informations de l'utilisateur.
- PUT /users/updatePagesRead/{token}/{bookId} : Met à jour la progression de lecture de l'utilisateur.
- GET /books/followedBook/{bookId} : Récupère les informations détaillées sur un livre suivi par l'utilisateur.

## Dépendances principales
- Express : Framework pour créer l'API.
- Mongoose : Pour la gestion des données MongoDB.
- dotenv : Pour gérer les variables d'environnement.

## Instructions supplémentaires
Assurez-vous que MongoDB est configuré et que la base de données est accessible. Si vous utilisez un service de base de données en ligne, assurez-vous que la chaîne de connexion (MONGO_URI) est correctement configurée.
