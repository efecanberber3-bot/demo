# Ber Can't Premium Coaching Platform

GitHub Pages üzerinde çalışan premium tanıtım sitesi, öğrenci takip paneli ve koç yönetim paneli. Gerçek kullanıcı/veri altyapısı Supabase ile sağlanır. Supabase bağlanmadan önce proje demo modunda tamamen gezilebilir.

## İçerik

- Premium ve mobil uyumlu ana sayfa
- E-posta/parola üyeliği ve şifre sıfırlama
- Erkek/kadın/belirtmek istemiyorum profil ayrımı
- Öğrenci günlük takip sistemi
- Kilo ve vücut ölçüm geçmişi
- SVG gelişim grafiği ve günlük seri hesabı
- Program görüntüleme
- Özel ilerleme fotoğrafı yükleme
- Koç/admin paneli
- Öğrenci filtreleme, takip uyarıları ve üyelik yönetimi
- Program atama ve koç mesajı
- PostgreSQL şeması + Row Level Security politikaları
- Private Supabase Storage politikaları
- Demo modu ve örnek veriler

## Demo girişleri

`js/config.js` içinde `DEMO_MODE: true` iken:

- Öğrenci: `student@demo.com` / `demo123`
- Kadın öğrenci: `ayse@demo.com` / `demo123`
- Yönetici: `admin@demo.com` / `admin123`

Bu hesaplar yalnızca sunum içindir. Veriler tarayıcının localStorage alanında tutulur. Gerçek yayından önce demo modu kapatılmalıdır.

## Supabase kurulumu

1. Supabase üzerinde yeni bir proje oluşturun.
2. `supabase/schema.sql` dosyasının tamamını Supabase **SQL Editor** içinde çalıştırın.
3. Supabase > Project Settings > API bölümünden:
   - Project URL
   - Publishable/anon key
   değerlerini alın.
4. `js/config.js` dosyasını şu şekilde güncelleyin:

```js
window.BERCANT_CONFIG = {
  SUPABASE_URL: "https://PROJE.supabase.co",
  SUPABASE_ANON_KEY: "ANON-VEYA-PUBLISHABLE-KEY",
  DEMO_MODE: false,
  SITE_URL: "https://bercant.com.tr",
  SUPPORT_EMAIL: "yenelberkant@gmail.com"
};
```

> `service_role` anahtarını kesinlikle site koduna veya GitHub reposuna koymayın.

5. Supabase > Authentication > URL Configuration bölümünde:
   - Site URL: `https://bercant.com.tr`
   - Redirect URL: `https://bercant.com.tr/dashboard.html`
   adreslerini ekleyin.
6. Site üzerinden bir kullanıcı hesabı oluşturun.
7. İlk yöneticiyi tanımlamak için SQL Editor'da çalıştırın:

```sql
update public.profiles
set role = 'admin'
where email = 'admin-epostaniz@example.com';
```

8. Üretimde kullanıcı kaydını sadece onaylı öğrencilerle sınırlamak isterseniz Supabase Authentication ayarlarından e-posta doğrulamasını açık tutun ve kayıt akışını başvuru/onay modeline göre düzenleyin.

## GitHub Pages yayını

1. Bu klasördeki dosyaları mevcut `bercant.com.tr` reposunun kök dizinine yükleyin.
2. `CNAME` dosyasının yalnızca `bercant.com.tr` içerdiğini kontrol edin.
3. GitHub > Repository Settings > Pages bölümünde yayın kaynağını `main / root` olarak seçin.
4. Custom domain alanında `bercant.com.tr` yazdığından emin olun.
5. HTTPS kontrolü tamamlandığında **Enforce HTTPS** seçeneğini açın.

## Güvenlik notları

- Admin şifresi veya kullanıcı parolası JavaScript içinde tutulmaz.
- Kullanıcı oturumunu Supabase Auth yönetir.
- RLS politikaları öğrencilerin birbirinin verisini görmesini önler.
- Koç yalnızca kendisine bağlı öğrencileri; admin tüm öğrencileri yönetebilir.
- İlerleme fotoğrafları public olmayan `progress-photos` bucket'ında saklanır.
- Gerçek öğrenci verisi almadan önce KVKK metinleri ve açık rıza süreçleri hukuk uzmanına kontrol ettirilmelidir.
- Düzenli veritabanı yedeği alınmalıdır. Free plan üretim için kullanılırsa manuel yedek rutini oluşturun.

## Dosya yapısı

```text
index.html              Ana sayfa
login.html              Giriş / üyelik
programlar.html         Koçluk tanıtımı
dashboard.html          Öğrenci paneli
admin.html              Koç / admin paneli
gizlilik.html           Başlangıç gizlilik metni
style.css               Tüm tasarım sistemi
js/config.js            Supabase ayarları
js/app-core.js          Auth, demo ve ortak yardımcılar
js/login.js             Giriş / kayıt akışı
js/dashboard.js         Öğrenci paneli işlemleri
js/admin.js             Admin paneli işlemleri
supabase/schema.sql     Veritabanı, RLS ve örnek programlar
```

## Canlıya almadan önce kontrol listesi

- [ ] Supabase URL ve anon key girildi
- [ ] Demo modu `false` yapıldı
- [ ] İlk admin rolü tanımlandı
- [ ] E-posta doğrulaması test edildi
- [ ] Öğrenci günlük kayıt ekleyebiliyor
- [ ] Öğrenci başka kullanıcının verisini göremiyor
- [ ] Admin öğrenci detaylarını görebiliyor
- [ ] Program atama ve mesaj gönderme test edildi
- [ ] Fotoğraf bucket'ı private durumda
- [ ] KVKK/yasal metinler tamamlandı
- [ ] Sahte istatistik veya doğrulanmamış iddia kullanılmıyor


## v1.1 düzeltmeleri
- Sidebar butonlarındaki beyaz tarayıcı stili kaldırıldı.
- Mobil menüye karartma alanı, kapatma butonu ve kaydırma kilidi eklendi.
- Panel logosu artık ana sayfaya değil ilgili panele döner.
- Ana sayfada oturum açıkken “Panele Dön” bağlantısı gösterilir.
- Demo ve canlı ortam auth yönlendirmeleri mevcut alan adına/alt klasöre göre otomatik hesaplanır.
