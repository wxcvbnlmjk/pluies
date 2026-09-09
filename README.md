# Averse

Application Vite/React affichant le radar des précipitations Météo-France.

## Déploiement Netlify

Le token reste côté serveur dans une fonction Netlify. Après avoir créé ou importé le site :

1. Ouvrir `Site configuration > Environment variables`.
2. Ajouter `METEO_FRANCE_API_KEY` avec le token Météo-France.
3. Relancer un déploiement pour appliquer la variable.

La configuration de [netlify.toml](netlify.toml) construit `dist`, publie les fonctions de `netlify/functions` et redirige `/api/meteo-wms` vers la fonction serverless.

## Développement local

Copier `.env.example` vers `.env`, renseigner `METEO_FRANCE_API_KEY`, puis lancer `npm run dev`. Le proxy Vite local appelle directement l’API Météo-France avec cette variable.
