# 🚀 Quick Setup Guide

Follow these steps to get your Gift List application running.

## Step 1: Configure Supabase

### Create Database Tables

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase-schema.sql` from this project
6. Paste it into the SQL editor
7. Click **Run** to execute the script

This creates all necessary tables, indexes, and security policies.

### Get Your Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

## Step 2: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
BACKOFFICE_PASSWORD=DreamTeam@2024
```

**Important**: Keep the password as `DreamTeam@2024` or change it to your preferred password.

## Step 3: Install and Run

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The application will be available at: http://localhost:3000

## Step 4: First Login

1. Open http://localhost:3000 in your browser
2. You'll be redirected to the login page
3. Enter the password: `DreamTeam@2024`
4. You're now in the admin panel!

## Step 5: Add Your First Gift

1. Click **"Add New Gift"** button
2. Fill in the form:
   - **Title**: Name of the gift
   - **Description**: Short description
   - **Purchase Link**: URL where to buy it
   - **Image URL**: (Optional) Link to an image
   - **Price**: Price in euros
   - **Categories**: Comma-separated (e.g., "Electronics, Gaming")
3. Click **"Create Gift"**

## Step 6: Generate User Links

1. Go to **Users** tab in the navigation
2. Click **"Generate New Link"**
3. Enter a name (e.g., "Mom", "Dad", "Sister")
4. Click **"Generate Link"**
5. Copy the generated link and share it with that person

## Testing the User Experience

1. Copy one of the generated user links
2. Open it in a **new incognito/private window** (to simulate a different user)
3. You should see the gift list with the user's name
4. Try clicking the ❤️ button to mark interest
5. Go back to the admin panel and check another user's view - you'll see the interest marked!

## Common Issues

### "Invalid access link" error
- Make sure you've run the SQL schema in Supabase
- Check that your Supabase credentials are correct in `.env.local`
- Verify the user link was generated correctly

### Gifts not showing up
- Ensure you've added at least one gift in the admin panel
- Check browser console for any errors
- Verify Supabase connection is working

### Can't login to backoffice
- Verify the password in `.env.local` matches what you're typing
- Clear browser cookies and try again
- Check that the API route is working: http://localhost:3000/api/auth/login

## Next Steps

1. **Customize the design**: Edit the Tailwind classes in the components
2. **Add more categories**: Create gifts with different categories for filtering
3. **Share links**: Send the generated links to your family members
4. **Monitor interests**: Check the dashboard to see who's interested in what

## Production Deployment

When ready to deploy:

1. Push your code to GitHub
2. Deploy to Vercel (recommended for Next.js)
3. Add environment variables in Vercel dashboard
4. Update Supabase URL restrictions if needed

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Ensure Supabase tables were created successfully
4. Check that you're using the correct Node.js version (18+)

---

**Enjoy your Gift List application! 🎁**