# Bot crêpe PTB
Le bot de test du [Serv Des Crêpes](https://discord.gg/5mzbtke9Jw).

Sur cette branche il n'y a que les fichiers et le code concernant les fonctionnalités en cours de test ou pas encore implémentées dans le bot.
Cela dans le but d'éviter les doublons lors des tests sur le serveur entre Robot de crêpe et la version de test.
Il n'y aura donc pas de pull request et de merge habituel.

## Structure du .env
### TOKEN
Le token discord du bot.

### COMMANDS
Le chemin vers le dossier dans lequel se trouve tous les fichiers de commandes.

### EVENTS
Le chemin vers le dossier dans lequel se trouve tous les fichiers d'evenements.

### GUILDS
L'identifiant du serveur que le bot peut rejoindre.

### BACKGROUND
Le chemin vers l'image de fond des cartes de nouveaux membres.

### PREFIX
Le prefixe utilisé pour les commandes textuelles (pas utilisé pour l'instant).

### RENAMECHANNEL
L'identifiant du salon de renommage

### FORBIDDENRENAME
L'identifiant du rôle de renommahe interdit.

### DB_HOST
L'addresse du serveur de la base de donnée.

### DB_USER
L'utilisateur utilisé pour la base de donnée.

### DB_PORT
Le port utilisé par le serveur pour accéder à la base de donnée.

### DB_PASSWORD
Le mot de passe de l'utilisateur utilisé pour la base de donnée.

### DB_DATABASE
La base de donnée utilisée dans le serveur.
