# Masaustu Tek Tik Baslatma

Bu klasor, uygulamayi masaustunden tek tikla baslatmak icin gerekli dosyalari icerir.

## 1) Logo ekleme (PNG destekli)
1. Logonu `TO-DO.png` olarak adlandir.
2. Buraya koy: `frontend/public/TO-DO.png`

Not: Script, `frontend/public/TO-DO.png` dosyasini otomatik olarak `generated-logo.ico` dosyasina cevirir ve kisayolda onu kullanir.

## 2) Kisayol olusturma
PowerShell'i proje kokunden ac ve su komutu calistir:

```powershell
powershell -ExecutionPolicy Bypass -File .\desktop\create-shortcut.ps1
```

Bu komut masaustune `TODO App.lnk` adinda bir kisayol olusturur.

## 3) Kullanim
- Masaustundeki `TODO App` simgesine tikla.
- Script otomatik olarak:
  - PostgreSQL'i kontrol eder/gerekiyorsa baslatir,
  - Backend'i acar,
  - Frontend'i acar.

## Opsiyonel: Farkli ikon yolu

PNG veya ICO verebilirsin:

```powershell
powershell -ExecutionPolicy Bypass -File .\desktop\create-shortcut.ps1 -IconPath "C:\icons\benim-logo.png"
```
