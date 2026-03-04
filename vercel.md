# Deploying to Vercel

## Backend Deployment

When deploying the backend to Vercel, ensure that you put the `vercel.json` file in the root of the project with the following content: 

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/api/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "apps/api/src/index.ts" }
  ]
}
```

This configuration tells Vercel to use the Node.js runtime for the API and routes all requests to the `index.ts` file. Make sure to adjust the paths if your project structure differs.

Then, you can deploy to Vercel using the following command (run in root):

```bash
vercel --prod
```

Be sure to set any necessary environment variables for the backend in the Vercel dashboard. See [apps/api/.env.example](apps/api/.env.example) for reference.

## Frontend Deployment

When deploying the **FRONTEND**, make sure to delete the `vercel.json` file above, then commit and push to the `master` branch. Vercel will automatically detect the frontend and deploy it, as long as you have the correct build and output settings in your `package.json` for the frontend.

Frontend UI configuration:

1. Framework Preset: Next.js
2. Build Command: `cd packages/shared-types && npx tsc && cd ../../apps/web && npm run build`
3. Output Directory: `apps/web/.next`
4. Root Directory: (Leave blank)
5. Environment Variables: Set any necessary environment variables for the frontend in the Vercel dashboard. See [apps/web/.env.example](apps/web/.env.example) for reference.
