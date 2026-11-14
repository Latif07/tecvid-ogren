# Hazır harf ses paketi

Bu klasöre konan kayıtlar her telefonda çocuk modunda çalar (telefonda yapılan kayıt varsa o önceliklidir).

- Dosya adı: `h-<harfin Unicode kodu>.mp3` (harfin okunuşu), `hr-<kod>-<0|1|2>.mp3` (üstün/esre/ötreli hece).
  Örnek: `h-0628.mp3` = ب, `hr-0628-1.mp3` = بِ, lamelif: `h-0644-0627.mp3`.
- `liste.json`: paketteki anahtarlar, örn. `["h:ب", "hr:ب:1"]`.
- Yalnızca sesin sahibinin yazılı izniyle (ya da kendi kaydımızla) dosya eklenir.
