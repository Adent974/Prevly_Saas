This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Prevly Dashboard – SaaS plateforme professionnelle

Tableau de bord SaaS pour professionnels de santé (médecins, gynécologues, hôpitaux) qui distribuent les licences de l'application mobile **Prevly**.

## Configuration rapide

### 1. Configurer l'environnement
```bash
# Modifier DATABASE_URL, NEXTAUTH_SECRET dans .env
nano .env
```

### 2. Initialiser la base de données
```bash
npm run db:migrate
```

### 3. Charger les données de démo
```bash
npm run db:seed
# Compte démo : demo@prevly.fr / Prevly2024!
```

### 4. Lancer
```bash
npm run dev
# → http://localhost:3000
```

## API Sync Mobile

L'app Android Prevly peut synchroniser les données via :

```
POST /api/mobile/sync
Authorization: Bearer <clé-de-licence>
```

Voir `app/api/mobile/sync/route.ts` pour le schéma complet.

## Tech Stack

- Next.js 16 (App Router) · Prisma 7 · PostgreSQL · NextAuth · Tailwind CSS · Recharts


```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
