# កម្មវិធីកត់ចំណងដៃ

Website កត់ចំណងដៃសម្រាប់មង្គលការ ដែល deploy ទៅ Vercel បាន ហើយរក្សាទុកទិន្នន័យនៅលើ Supabase database ពិតៗ។

## មុខងារ

- បញ្ចូលឈ្មោះភ្ញៀវ
- កត់ចំណងដៃជា USD ឬ រៀល
- បន្ថែមប្រភេទអំណោយ និងកំណត់ចំណាំ
- ស្វែងរក records
- លុប records
- Export CSV
- Sync ទិន្នន័យ online
- Auto refresh រៀងរាល់ 10 វិនាទី

## Files

- `index.html` UI
- `styles.css` design
- `app.js` frontend logic + Supabase REST integration
- `config.js` ដាក់ Supabase URL និង anon key
- `supabase.sql` SQL សម្រាប់បង្កើត table និង policies
- `vercel.json` Vercel config

## Supabase Setup

### 1. បង្កើត Supabase project

ចូល `https://supabase.com/dashboard` ហើយបង្កើត project ថ្មីមួយនៅលើ Free plan។

### 2. រត់ SQL

ចូល `SQL Editor` ក្នុង Supabase ហើយ copy content ពី file `supabase.sql` ទៅ run។

វានឹង:

- បង្កើត table `wedding_gifts`
- បើក Row Level Security
- បង្កើត policies សម្រាប់ `select`, `insert`, និង `delete`

## Config Frontend

បើក file `config.js` ហើយដាក់តម្លៃពិតរបស់អ្នក:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY"
};
```

រក `supabaseUrl` និង `anon key` ពី:

- Supabase Dashboard
- `Project Settings`
- `Data API` ឬ `API Keys`

ចំណាំ:

- ក្នុង project នេះ `anon key` ត្រូវបានប្រើនៅ frontend ដោយផ្ទាល់
- នេះសមស្របសម្រាប់ public guestbook/workflow សាមញ្ញ
- បើចង់សុវត្ថិភាពខ្ពស់ជាងនេះ គួរបន្ថែម admin login ឬ server/API layer

## Run Local

អាចបើក `index.html` ផ្ទាល់បាន ប៉ុន្តែដើម្បីជៀសវាងបញ្ហា browser ខ្លះៗ គួរប្រើ local server ដូចជា Live Server។

## Deploy To Vercel

1. commit និង push project ទៅ GitHub
2. ចូល `https://vercel.com`
3. `Add New` -> `Project`
4. Import GitHub repository
5. Deploy

សម្រាប់ static site នេះ Vercel មិនចាំបាច់ build config ពិសេសទេ។

## Auto Deploy

បន្ទាប់ពីភ្ជាប់ GitHub ជាមួយ Vercel រួច:

```bash
git add .
git commit -m "update site"
git push
```

រាល់ `push` ទៅ branch `main` នឹង deploy ថ្មីដោយស្វ័យប្រវត្តិ។

## Security Note

SQL policy ក្នុង `supabase.sql` បច្ចុប្បន្នអនុញ្ញាតឲ្យ public users:

- មើល records
- បញ្ចូល records
- លុប records

នេះល្អសម្រាប់ version សាមញ្ញ និងតេស្តលឿន។ បើចង់ production ឲ្យមានសុវត្ថិភាពល្អជាងនេះ ខ្ញុំស្នើឲ្យបន្ថែម:

- admin login
- authenticated policies
- server-side API
