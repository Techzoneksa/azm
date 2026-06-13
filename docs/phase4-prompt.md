# Phase 4 — Driver Mobile/PWA & Field Operations

نظام إدارة وتشغيل شركة عزم للخدمات اللوجستية

آخر Commit معتمد:
```
d864fd0 — fix: add dotenv to seed, finalize PrismaPg adapter, initial migration
```

## الفحوصات المبدئية قبل البدء
- `git status` — working tree نظيف
- `git log --oneline --decorate -10` — آخر Commit هو d864fd0
- `git rev-parse HEAD` — d864fd0
- `origin/master = d864fd0`

## النطاق
1. Driver Mobile/PWA
2. تسجيل دخول المندوب
3. بدء وإنهاء الوردية
4. عرض شحنات اليوم للمندوب
5. تفاصيل الشحنة للمندوب
6. تحديث حالة الشحنة من الجوال
7. تسجيل محاولة تسليم
8. إثبات التسليم من الجوال (POD)
9. إدارة المرتجعات من الجوال
10. ملخص وردية المندوب
11. حماية صلاحيات المندوب (DRIVER role)
12. سجل نشاط ميداني
13. PWA Manifest وتجهيز Mobile UX
14. جاهزية أولية للموقع الجغرافي

## الصفحات المطلوبة
- `/driver` — الرئيسية
- `/driver/shift` — الوردية
- `/driver/shipments` — شحناتي
- `/driver/shipments/[id]` — تفاصيل الشحنة
- `/driver/shipments/[id]/attempt` — محاولة تسليم
- `/driver/shipments/[id]/pod` — إثبات تسليم
- `/driver/returns` — المرتجعات
- `/driver/profile` — الملف الشخصي

Layout مستقل: `DriverLayout` + `DriverBottomNav` + `DriverTopBar`

## API Routes
- `GET /api/driver/home`
- `GET /api/driver/shift`, `POST /api/driver/shift/start`, `POST /api/driver/shift/end`
- `GET /api/driver/shipments`, `GET /api/driver/shipments/[id]`
- `POST /api/driver/shipments/[id]/status`
- `POST /api/driver/shipments/[id]/attempts`
- `POST /api/driver/shipments/[id]/pod`
- `GET /api/driver/returns`, `POST /api/driver/returns/[id]/update`
- `GET /api/driver/profile`

## قاعدة البيانات
- استخدام PostgreSQL (لا SQLite)
- نموذج `DriverShift` (جديد أو تفعيل الموجود)
- نموذج `FieldActivityLog` (اختياري)
- ربط `User.driverId` مع `Driver`
- Role: DRIVER
- Permissions: driver_app.access, driver_shipments.view, driver_shipments.update_status, driver_attempts.create, driver_pod.create, driver_returns.view, driver_returns.update, driver_shift.manage, driver_profile.view

## Seed Data
- مستخدم: `driver@azmflow.com` / `Admin@123` — Role: DRIVER
- شحنات مسندة للمندوب التجريبي
- شحنات غير مسندة (لاختبار العزل)
- مرتجع على عهدته

## معايير القبول
- DRIVER role يعمل
- توجيه تسجيل الدخول حسب الدور
- الوردية تعمل مع القيود
- عزل بيانات المندوب
- API محمية
- PWA manifest موجود
- Mobile UX جيدة
- Lint 0 errors, TypeScript pass, Build pass
- Smoke tests للصفحات الجديدة والقديمة

## ممنوع
- Native app
- GPS tracking حي
- Offline Sync
- تكامل شركاء
- محاسبة/رواتب/فواتير
- خرائط متقدمة
- تحسين مسارات آلي
