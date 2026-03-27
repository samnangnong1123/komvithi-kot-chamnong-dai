# វេបសាយផុសរឿង

Website សម្រាប់សរសេរ និងផុសរឿងជាភាសាខ្មែរ ដែល deploy ទៅ Vercel បាន ហើយរក្សាទុកទិន្នន័យនៅលើ Supabase database។

## មុខងារ

- បង្ហោះរឿងថ្មី
- ដាក់ចំណងជើង អ្នកនិពន្ធ និងប្រភេទរឿង
- ដាក់រូបភាព cover URL
- ដាក់សេចក្តីសង្ខេប និងខ្លឹមសាររឿង
- ស្វែងរករឿង
- លុបរឿង
- Export stories ជា CSV
- Sync online និង auto refresh

## Files

- `index.html` UI សម្រាប់ story publishing
- `styles.css` design
- `app.js` frontend logic + Supabase REST integration
- `config.js` ដាក់ Supabase URL និង anon key
- `supabase.sql` SQL សម្រាប់បង្កើត stories table និង policies
- `vercel.json` Vercel config

## Supabase Setup

### 1. បង្កើត Supabase project

ចូល `https://supabase.com/dashboard` ហើយបង្កើត project ថ្មីមួយនៅលើ Free plan។

### 2. រត់ SQL

ចូល `SQL Editor` ក្នុង Supabase ហើយ copy content ពី file `supabase.sql` ទៅ run។

វានឹង:

- លុប table `wedding_gifts` ចាស់
- បង្កើត table `stories`
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

## Deploy To Vercel

1. commit និង push project ទៅ GitHub
2. Vercel នឹង deploy ថ្មីដោយស្វ័យប្រវត្តិ

## Security Note

Version នេះអនុញ្ញាតឲ្យ public users អាចមើល បង្ហោះ និងលុប stories បាន។ បើចង់ production សុវត្ថិភាពជាងនេះ គួរបន្ថែម admin login ឬ server-side API។
