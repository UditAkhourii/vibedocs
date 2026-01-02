# SuperDocs Deployment Checklist

## 1. Code Quality & Build Integrity
- [ ] **Build Check**: Run `npm run build` and ensure it passes without errors.
- [ ] **Type Safety**: Ensure no critical TypeScript errors (`any` types are acceptable for now if limited, but build must pass).
- [ ] **Linting**: Run `npm run lint` to catch obvious issues.
- [ ] **Unused Code**: Remove any scaffolded files or unused components.

## 2. Environment & Configuration
- [ ] **Environment Variables**: Verify all required env vars are present in the production environment (Vercel/Railway/etc.).
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `GEMINI_API_KEY`
    - `GITHUB_TOKEN`
    - `DATABASE_URL` (Use the IPv4 Pooler string for serverless deployments!)
    - `DIRECT_URL` (For migrations)
- [ ] **Database**: Ensure the Supabase project is active and in the correct region.
- [ ] **Domains**: Configure custom domain (e.g., `superdocs.dev`) if applicable.

## 3. SEO & Metadata
- [ ] **Global Metadata**: Ensure `layout.tsx` has correct Title, Description, and OpenGraph tags.
- [ ] **Favicon**: Add a custom favicon.ico / icon.png.
- [ ] **Sitemap**: (Optional) Generate a sitemap for published docs.

## 4. User Experience & Polishing
- [ ] **Error Boundaries**: Check if a global `error.tsx` exists to handle crashes gracefully.
- [ ] **404 Page**: Customize `not-found.tsx`.
- [ ] **Loading States**: Verify `loading.tsx` or Suspense boundaries are working (we added the top loader).

## 5. Security
- [ ] **RLS Policies**: Check Supabase RLS policies if we rely on them (currently much logic is in API routes, which is safe, but RLS adds a layer).
- [ ] **API Protection**: Ensure sensitive routes like `/api/docs/publish` have auth checks (Done).

## 6. Deployment (Vercel Recommended)
- [ ] Connect GitHub Repo to Vercel.
- [ ] Add Environment Variables in Vercel Dashboard.
- [ ] Deploy!
