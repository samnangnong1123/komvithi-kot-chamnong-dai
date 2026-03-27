# កម្មវិធីកត់ចំណងដៃ

Website សម្រាប់កត់ត្រាចំណងដៃក្នុងពិធីមង្គលការ ដែលអាច deploy ទៅ Vercel បានភ្លាម។

## មុខងារ

- បញ្ចូលឈ្មោះភ្ញៀវ
- កត់ចំនួនទឹកប្រាក់ និងរូបិយប័ណ្ណ
- បន្ថែមប្រភេទអំណោយ និងកំណត់ចំណាំ
- ស្វែងរក record បាន
- លុប record បាន
- Export ទិន្នន័យជា CSV
- រក្សាទុកទិន្នន័យក្នុង browser ដោយ `localStorage`

## Files

- `index.html` សម្រាប់ layout និង content
- `styles.css` សម្រាប់ design និង responsive UI
- `app.js` សម្រាប់ logic កត់ត្រា ស្វែងរក លុប និង export
- `vercel.json` សម្រាប់ Vercel config

## Run Local

Project នេះជា static website ដូច្នេះអាចបើក `index.html` ដោយផ្ទាល់ក្នុង browser បាន។

បើចង់ run ជា local server អាចប្រើ extension ឬ tool ដូចជា Live Server។

## Deploy To Vercel

1. បង្កើត GitHub repository មួយ
2. Upload file ទាំងអស់ទៅ repo
3. ចូល `https://vercel.com`
4. ចុច `Add New` -> `Project`
5. Import GitHub repository
6. ចុច `Deploy`

Vercel នឹង deploy project នេះជា static site ដោយស្វ័យប្រវត្តិ។

## Git Commands

បន្ទាប់ពីដំឡើង Git រួច អ្នកអាចរត់ command ទាំងនេះក្នុង folder project:

```bash
git init
git add .
git commit -m "Initial commit"
```

បើចង់ភ្ជាប់ទៅ GitHub repo:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## Next.js Option

បើចង់បម្លែង project នេះទៅ `Next.js` ខ្ញុំអាចជួយរៀបចំ version ថ្មីដែលសមស្របជាងសម្រាប់:

- Vercel hosting
- API routes
- database integration
- admin login
- future scalability
