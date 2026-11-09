# CHESS ARENA

## Vercel арқылы жариялау
1. ZIP-ті ашып, GitHub-та жаңа repository жасаңыз.
2. Жоба файлдарын repository-ге жүктеңіз.
3. Vercel → Add New → Project → GitHub repository таңдаңыз.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy басыңыз.

`vercel.json` осы баптауларды автоматты береді. Build кезінде Stockfish 19 Lite single-threaded JS және WASM файлдары `dist/engine/` ішіне көшіріледі. Браузер Worker-ді сол жерден жүктейді.

## Компьютерде іске қосу
Node.js орнатылған терминалда:
`npm.cmd install`
`npm.cmd start`
Содан кейін http://localhost:8080 ашыңыз.

Stockfish қозғалтқышы браузерде орындалады. Алғашқы жариялау кезінде Vercel npm пакеттерін орнатады.
