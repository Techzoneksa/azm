import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding AZM Flow database...");

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.readinessScore.deleteMany();
  await prisma.readinessItem.deleteMany();
  await prisma.readinessCategory.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driverDocument.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.officialLink.deleteMany();
  await prisma.complianceDocument.deleteMany();
  await prisma.complianceRecord.deleteMany();
  await prisma.governmentEntity.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  const permissions = await Promise.all([
    prisma.permission.create({ data: { name: "users.manage", nameAr: "إدارة المستخدمين", module: "users" } }),
    prisma.permission.create({ data: { name: "users.view", nameAr: "عرض المستخدمين", module: "users" } }),
    prisma.permission.create({ data: { name: "drivers.manage", nameAr: "إدارة المناديب", module: "drivers" } }),
    prisma.permission.create({ data: { name: "drivers.view", nameAr: "عرض المناديب", module: "drivers" } }),
    prisma.permission.create({ data: { name: "vehicles.manage", nameAr: "إدارة المركبات", module: "vehicles" } }),
    prisma.permission.create({ data: { name: "vehicles.view", nameAr: "عرض المركبات", module: "vehicles" } }),
    prisma.permission.create({ data: { name: "company.manage", nameAr: "إدارة بيانات الشركة", module: "company" } }),
    prisma.permission.create({ data: { name: "company.view", nameAr: "عرض بيانات الشركة", module: "company" } }),
    prisma.permission.create({ data: { name: "compliance.manage", nameAr: "إدارة التراخيص", module: "compliance" } }),
    prisma.permission.create({ data: { name: "compliance.view", nameAr: "عرض التراخيص", module: "compliance" } }),
    prisma.permission.create({ data: { name: "readiness.view", nameAr: "عرض الجاهزية", module: "readiness" } }),
    prisma.permission.create({ data: { name: "readiness.manage", nameAr: "إدارة الجاهزية", module: "readiness" } }),
    prisma.permission.create({ data: { name: "settings.manage", nameAr: "إدارة الإعدادات", module: "settings" } }),
    prisma.permission.create({ data: { name: "reports.view", nameAr: "عرض التقارير", module: "reports" } }),
    prisma.permission.create({ data: { name: "audit.read", nameAr: "عرض سجل المراجعة", module: "audit" } }),
    prisma.permission.create({ data: { name: "partners.view", nameAr: "عرض الشركاء", module: "partners" } }),
    prisma.permission.create({ data: { name: "partners.manage", nameAr: "إدارة الشركاء", module: "partners" } }),
    prisma.permission.create({ data: { name: "contracts.view", nameAr: "عرض العقود", module: "contracts" } }),
    prisma.permission.create({ data: { name: "contracts.manage", nameAr: "إدارة العقود", module: "contracts" } }),
    prisma.permission.create({ data: { name: "pickup_points.view", nameAr: "عرض نقاط الاستلام", module: "pickup_points" } }),
    prisma.permission.create({ data: { name: "pickup_points.manage", nameAr: "إدارة نقاط الاستلام", module: "pickup_points" } }),
    prisma.permission.create({ data: { name: "coverage_areas.view", nameAr: "عرض مناطق التغطية", module: "coverage_areas" } }),
    prisma.permission.create({ data: { name: "coverage_areas.manage", nameAr: "إدارة مناطق التغطية", module: "coverage_areas" } }),
    prisma.permission.create({ data: { name: "requirements.view", nameAr: "عرض المتطلبات", module: "requirements" } }),
    prisma.permission.create({ data: { name: "requirements.manage", nameAr: "إدارة المتطلبات", module: "requirements" } }),
    prisma.permission.create({ data: { name: "activities.view", nameAr: "عرض النشاطات", module: "activities" } }),
    prisma.permission.create({ data: { name: "activities.manage", nameAr: "إدارة النشاطات", module: "activities" } }),
  ]);

  const permMap = Object.fromEntries(permissions.map((p: { name: string; id: string }) => [p.name, p.id]));

  const superAdminRole = await prisma.role.create({
    data: { name: "SUPER_ADMIN", nameAr: "مدير عام", description: "جميع الصلاحيات", isSystem: true },
  });

  const opsManagerRole = await prisma.role.create({
    data: { name: "OPERATIONS_MANAGER", nameAr: "مدير تشغيل", description: "صلاحيات تشغيلية كاملة", isSystem: true },
  });

  const opsCoordinatorRole = await prisma.role.create({
    data: { name: "OPERATIONS_COORDINATOR", nameAr: "موظف متابعة", description: "صلاحيات متابعة محدودة", isSystem: true },
  });

  for (const [, permId] of Object.entries(permMap)) {
    await prisma.rolePermission.create({ data: { roleId: superAdminRole.id, permissionId: permId } });
  }

  const opsManagerPerms = ["drivers.manage", "drivers.view", "vehicles.manage", "vehicles.view", "company.manage", "company.view", "compliance.manage", "compliance.view", "readiness.view", "readiness.manage", "reports.view", "audit.read", "partners.view", "partners.manage", "contracts.view", "contracts.manage", "pickup_points.view", "pickup_points.manage", "coverage_areas.view", "coverage_areas.manage", "requirements.view", "requirements.manage", "activities.view", "activities.manage"];
  for (const permName of opsManagerPerms) {
    await prisma.rolePermission.create({ data: { roleId: opsManagerRole.id, permissionId: permMap[permName] } });
  }

  const opsCoordPerms = ["drivers.view", "vehicles.view", "company.view", "compliance.view", "readiness.view", "partners.view", "contracts.view", "pickup_points.view", "coverage_areas.view", "requirements.view", "activities.manage"];
  for (const permName of opsCoordPerms) {
    await prisma.rolePermission.create({ data: { roleId: opsCoordinatorRole.id, permissionId: permMap[permName] } });
  }

  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@azmflow.com",
      passwordHash,
      fullName: "مدير النظام",
      phone: "0500000001",
      isActive: true,
    },
  });

  const opsManager = await prisma.user.create({
    data: {
      email: "manager@azmflow.com",
      passwordHash,
      fullName: "أحمد القحطاني",
      phone: "0500000002",
      isActive: true,
    },
  });

  const opsCoord = await prisma.user.create({
    data: {
      email: "coordinator@azmflow.com",
      passwordHash,
      fullName: "سارة العنزي",
      phone: "0500000003",
      isActive: true,
    },
  });

  await prisma.userRole.create({ data: { userId: adminUser.id, roleId: superAdminRole.id } });
  await prisma.userRole.create({ data: { userId: opsManager.id, roleId: opsManagerRole.id } });
  await prisma.userRole.create({ data: { userId: opsCoord.id, roleId: opsCoordinatorRole.id } });

  await prisma.companyProfile.create({
    data: {
      nameAr: "شركة عزم للخدمات اللوجستية",
      nameEn: "AZM Logistics Services Co.",
      tradingName: "عزم",
      commercialReg: "1234567890",
      unifiedNumber: "1234567890",
      taxNumber: "312345678901234",
      activityType: "خدمات التوصيل والنقل",
      city: "الرياض",
      nationalAddress: "الرياض، حي العليا، شارع التخصصي",
      shortAddress: "8888 التخصصي، العليا",
      buildingNumber: "8888",
      street: "شارع التخصصي",
      district: "حي العليا",
      addressCity: "الرياض",
      postalCode: "12345",
      subNumber: "6789",
      contactPhone: "0112345678",
      contactEmail: "info@azm.com.sa",
      website: "https://azm.com.sa",
      managerName: "أحمد القحطاني",
      dataStatus: "DRAFT",
      notes: "شركة ناشئة في مجال التوصيل، تحت التأسيس",
    },
  });

  const tptEntity = await prisma.governmentEntity.create({
    data: {
      name: "TPT",
      nameAr: "الهيئة العامة للنقل",
      description: "تنظيم أنشطة النقل البري وإصدار التراخيص",
      websiteUrl: "https://tga.gov.sa",
      servicesUrl: "https://tga.gov.sa/services",
    },
  });

  const cstEntity = await prisma.governmentEntity.create({
    data: {
      name: "CST",
      nameAr: "هيئة الاتصالات والفضاء والتقنية",
      description: "تنظيم قطاع الاتصالات والتقنية",
      websiteUrl: "https://cst.gov.sa",
      servicesUrl: "https://cst.gov.sa/services",
    },
  });

  const splEntity = await prisma.governmentEntity.create({
    data: {
      name: "SPL",
      nameAr: "سبل - العنوان الوطني",
      description: "خدمات العنوان الوطني والخرائط",
      websiteUrl: "https://spl.com.sa",
      servicesUrl: "https://spl.com.sa/business",
    },
  });

  const mciEntity = await prisma.governmentEntity.create({
    data: {
      name: "MCI",
      nameAr: "وزارة التجارة",
      description: "السجلات التجارية والأنظمة",
      websiteUrl: "https://mc.gov.sa",
      servicesUrl: "https://mc.gov.sa/services",
    },
  });

  const qiwaEntity = await prisma.governmentEntity.create({
    data: {
      name: "QIWA",
      nameAr: "قوى",
      description: "الخدمات العمالية والتأمينات",
      websiteUrl: "https://qiwa.sa",
      servicesUrl: "https://qiwa.sa/services",
    },
  });

  await prisma.complianceRecord.create({
    data: {
      entityId: tptEntity.id,
      type: "TRANSPORT_LICENSE",
      licenseNumber: "TGA-2025-0001",
      activityType: "توصيل طرود ميل أخير",
      status: "IN_PROGRESS",
      submittedDate: new Date("2025-06-01"),
      transactionNumber: "TXN-2025-001",
      requirements: "توفير بيانات المنشأة، تراخيص المناديب، تأمين المركبات",
      nextStep: "استكمال مستندات المناديب والمركبات",
      responsiblePerson: "أحمد القحطاني",
      notes: "قيد الإجراء",
      portalUrl: "https://tga.gov.sa/license-inquiry",
    },
  });

  await prisma.complianceRecord.create({
    data: {
      entityId: cstEntity.id,
      type: "TRACKING_SERVICE",
      status: "NOT_STARTED",
      requirements: "تسجيل المنصة، سياسة الخصوصية، موافقات التتبع",
      nextStep: "التقديم على تسجيل خدمة التتبع",
      responsiblePerson: "سارة العنزي",
      notes: "لم يبدأ بعد",
      portalUrl: "https://cst.gov.sa/mottasel",
    },
  });

  await prisma.complianceRecord.create({
    data: {
      entityId: splEntity.id,
      type: "NATIONAL_ADDRESS",
      status: "NOT_STARTED",
      requirements: "تفعيل حساب المنشأة، الاشتراك في API العنوان الوطني",
      nextStep: "التسجيل في منصة سبل للأعمال",
      responsiblePerson: "سارة العنزي",
      notes: "لم يبدأ بعد",
      portalUrl: "https://spl.com.sa/business",
    },
  });

  const links = [
    { entityId: tptEntity.id, title: "TPT Portal", titleAr: "بوابة الهيئة العامة للنقل", description: "Official website", descriptionAr: "الموقع الرسمي للهيئة العامة للنقل", url: "https://tga.gov.sa", servicesUrl: "https://tga.gov.sa/services", licensesUrl: "https://tga.gov.sa/license-inquiry", sortOrder: 1 },
    { entityId: splEntity.id, title: "SPL Business", titleAr: "سبل للأعمال", description: "Business portal", descriptionAr: "منصة سبل للأعمال والعناوين", url: "https://spl.com.sa", servicesUrl: "https://spl.com.sa/business", licensesUrl: "https://spl.com.sa/api", sortOrder: 2 },
    { entityId: cstEntity.id, title: "CST Portal", titleAr: "بوابة هيئة الاتصالات", description: "Mottasel platform", descriptionAr: "منصة متصل للأعمال", url: "https://cst.gov.sa", servicesUrl: "https://cst.gov.sa/mottasel", licensesUrl: "https://cst.gov.sa/services", sortOrder: 3 },
  ];

  for (const link of links) {
    await prisma.officialLink.create({ data: { ...link, isActive: true } });
  }

  const driver1 = await prisma.driver.create({
    data: {
      fullName: "خالد الحربي",
      phone: "0555000001",
      email: "khalid@example.com",
      nationalId: "1010000001",
      nationality: "سعودي",
      city: "الرياض",
      district: "الملز",
      relationType: "موظف",
      joinDate: new Date("2025-01-15"),
      status: "ACTIVE",
      experience: "سنتان في شركة توصيل",
      previousCompanies: "نون للتوصيل",
      vehicleType: "دراجة نارية",
      plateNumber: "ABC 123",
      readinessStatus: "READY",
      notes: "ممتاز في التوصيل",
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      fullName: "فهد العتيبي",
      phone: "0555000002",
      email: "fahad@example.com",
      nationalId: "1010000002",
      nationality: "سعودي",
      city: "الرياض",
      district: "النرجس",
      relationType: "موظف",
      joinDate: new Date("2025-03-01"),
      status: "PENDING_DOCUMENTS",
      readinessStatus: "INCOMPLETE",
      notes: "ينقصه مستند التأمين",
    },
  });

  await prisma.driver.create({
    data: {
      fullName: "نورة الدوسري",
      phone: "0555000003",
      nationalId: "1010000003",
      nationality: "سعودية",
      city: "جدة",
      district: "الشاطئ",
      status: "DRAFT",
      readinessStatus: "INCOMPLETE",
    },
  });

  await prisma.driverDocument.create({
    data: {
      driverId: driver1.id,
      type: "NATIONAL_ID",
      documentNumber: "1010000001",
      issuedDate: new Date("2020-01-01"),
      expiryDate: new Date("2027-01-01"),
      status: "VERIFIED",
      notes: "سارية",
    },
  });

  await prisma.driverDocument.create({
    data: {
      driverId: driver1.id,
      type: "DRIVING_LICENSE",
      documentNumber: "DL-2023-001",
      issuedDate: new Date("2023-05-01"),
      expiryDate: new Date("2026-12-31"),
      status: "VERIFIED",
      notes: "سارية",
    },
  });

  await prisma.driverDocument.create({
    data: {
      driverId: driver2.id,
      type: "NATIONAL_ID",
      documentNumber: "1010000002",
      issuedDate: new Date("2021-06-01"),
      expiryDate: new Date("2026-08-01"),
      status: "VERIFIED",
    },
  });

  await prisma.driverDocument.create({
    data: {
      driverId: driver2.id,
      type: "INSURANCE",
      status: "MISSING",
      notes: "لم يتم رفع وثيقة التأمين بعد",
    },
  });

  const vehicle1 = await prisma.vehicle.create({
    data: {
      vehicleType: "دراجة نارية",
      brand: "ياماها",
      model: "MT-15",
      year: 2024,
      color: "أبيض",
      plateNumber: "ABC 123",
      serialNumber: "VIN-2024-0001",
      ownerName: "شركة عزم للخدمات اللوجستية",
      ownerNationalId: "1234567890",
      ownershipType: "مملوكة للشركة",
      registrationNumber: "REG-2024-001",
      insuranceNumber: "INS-2024-001",
      registrationExpiry: new Date("2026-12-31"),
      insuranceExpiry: new Date("2026-06-30"),
      driverId: driver1.id,
      status: "ACTIVE",
      readinessStatus: "READY",
    },
  });

  await prisma.vehicle.create({
    data: {
      vehicleType: "سيارة صغيرة",
      brand: "تويوتا",
      model: "كورولا",
      year: 2023,
      color: "فضي",
      plateNumber: "XYZ 789",
      serialNumber: "VIN-2023-0002",
      ownerName: "فهد العتيبي",
      ownerNationalId: "1010000002",
      ownershipType: "مملوكة للمندوب",
      registrationNumber: "REG-2023-002",
      insuranceNumber: "",
      registrationExpiry: new Date("2026-09-30"),
      insuranceExpiry: new Date("2025-12-31"),
      driverId: driver2.id,
      status: "ACTIVE",
      readinessStatus: "INCOMPLETE",
      notes: "التأمين منتهي - يحتاج تجديد",
    },
  });

  const categories = [
    { name: "company", nameAr: "جاهزية الشركة", description: "بيانات الشركة والسجل التجاري", weight: 10, sortOrder: 1, items: ["السجل التجاري", "الرقم الضريبي", "العنوان الوطني", "الموقع الإلكتروني", "بيانات المسؤول"] },
    { name: "licenses", nameAr: "جاهزية التراخيص", description: "تراخيص الهيئات الرسمية", weight: 25, sortOrder: 2, items: ["ترخيص الهيئة العامة للنقل", "ترخيص هيئة الاتصالات", "تصريح النشاط"] },
    { name: "drivers", nameAr: "جاهزية المناديب", description: "بيانات ووثائق المناديب", weight: 20, sortOrder: 3, items: ["مندوب واحد على الأقل جاهز", "مستندات المندوبين مكتملة", "التأمين ساري"] },
    { name: "vehicles", nameAr: "جاهزية المركبات", description: "بيانات ووثائق المركبات", weight: 15, sortOrder: 4, items: ["مركبة واحدة على الأقل جاهزة", "استمارة المركبة سارية", "تأمين المركبة ساري"] },
    { name: "address", nameAr: "جاهزية العنوان الوطني", description: "الربط مع سبل والعنوان الوطني", weight: 10, sortOrder: 5, items: ["حساب سبل للمنشأة", "API العنوان الوطني", "التحقق من العناوين"] },
    { name: "privacy", nameAr: "جاهزية الخصوصية والتتبع", description: "سياسة الخصوصية وموافقات التتبع", weight: 10, sortOrder: 6, items: ["سياسة الخصوصية", "موافقات التتبع", "سجل الأجهزة"] },
    { name: "contracts", nameAr: "جاهزية العقود", description: "العقود التشغيلية مع الشركاء", weight: 5, sortOrder: 7, items: ["عقد تشغيلي واحد", "اتفاقية مستوى الخدمة"] },
    { name: "integrations", nameAr: "جاهزية التكاملات", description: "التكاملات التقنية", weight: 5, sortOrder: 8, items: ["API عزم", "Webhook", "استيراد Excel"] },
  ];

  for (const cat of categories) {
    const category = await prisma.readinessCategory.create({
      data: {
        name: cat.name,
        nameAr: cat.nameAr,
        description: cat.description,
        weight: cat.weight,
        sortOrder: cat.sortOrder,
      },
    });

    for (let i = 0; i < cat.items.length; i++) {
      await prisma.readinessItem.create({
        data: {
          categoryId: category.id,
          name: cat.items[i],
          nameAr: cat.items[i],
          isCompleted: false,
          sortOrder: i + 1,
        },
      });
    }
  }

  const settings = [
    { key: "system_name", value: "AZM Flow", type: "STRING", group: "general", description: "اسم النظام" },
    { key: "default_language", value: "ar", type: "STRING", group: "general", description: "اللغة الافتراضية" },
    { key: "timezone", value: "Asia/Riyadh", type: "STRING", group: "general", description: "المنطقة الزمنية" },
    { key: "alert_days_90", value: "90", type: "NUMBER", group: "alerts", description: "تنبيه قبل 90 يومًا" },
    { key: "alert_days_60", value: "60", type: "NUMBER", group: "alerts", description: "تنبيه قبل 60 يومًا" },
    { key: "alert_days_30", value: "30", type: "NUMBER", group: "alerts", description: "تنبيه قبل 30 يومًا" },
    { key: "alert_days_7", value: "7", type: "NUMBER", group: "alerts", description: "تنبيه قبل 7 أيام" },
    { key: "allowed_file_types", value: "jpg,jpeg,png,pdf", type: "STRING", group: "files", description: "أنواع الملفات المسموحة" },
    { key: "max_file_size", value: "5", type: "NUMBER", group: "files", description: "الحد الأقصى لحجم الملف بالميجابايت" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.create({ data: setting });
  }

  // ========== Phase 2: Partners & Contracts ==========
  const partner1 = await prisma.partner.create({
    data: {
      tradingNameAr: "متجر السريع الإلكتروني",
      tradingNameEn: "Saree3 E-Store",
      legalName: "مؤسسة السريع للتجارة الإلكترونية",
      partnerType: "ECOMMERCE_STORE",
      sector: "تجارة إلكترونية",
      commercialReg: "1234567891",
      taxNumber: "312345678901235",
      city: "جدة",
      website: "https://saree3.store",
      officialEmail: "partners@saree3.store",
      primaryPhone: "0555000010",
      contactPersonName: "م. محمد الحربي",
      contactPersonPhone: "0555000011",
      contactPersonEmail: "m.alharbi@saree3.store",
      status: "ACTIVE",
      priority: "HIGH",
      source: "مؤتمر التجارة الإلكترونية 2025",
      notes: "شركة ناشئة في التوصيل السريع - بحاجة إلى تغطية جدة أولاً",
    },
  });

  const partner2 = await prisma.partner.create({
    data: {
      tradingNameAr: "مسار للشحن التجريبي",
      tradingNameEn: "Masar Logistics",
      legalName: "شركة مسار الخدمات اللوجستية",
      partnerType: "SHIPPING_COMPANY",
      sector: "خدمات لوجستية",
      commercialReg: "1234567892",
      city: "الرياض",
      website: "https://masar-logistics.com",
      officialEmail: "info@masar-logistics.com",
      primaryPhone: "0555000020",
      contactPersonName: "أ. سعد القحطاني",
      contactPersonPhone: "0555000021",
      status: "NEGOTIATION",
      priority: "MEDIUM",
      source: "إحالة من هيئة النقل",
      notes: "شركة شحن تحت التأسيس - تحتاج إلى دعم تشغيلي في الرياض وجدة",
    },
  });

  const partner3 = await prisma.partner.create({
    data: {
      tradingNameAr: "منصة السوق التجريبية",
      tradingNameEn: "Souq Trial Platform",
      legalName: "مؤسسة السوق الرقمية",
      partnerType: "MARKETPLACE",
      sector: "منصات رقمية",
      commercialReg: "1234567893",
      city: "مكة المكرمة",
      officialEmail: "support@souq-trial.com",
      primaryPhone: "0555000030",
      contactPersonName: "د. هناء العنزي",
      contactPersonPhone: "0555000031",
      contactPersonEmail: "hanan@souq-trial.com",
      status: "LEAD",
      priority: "STRATEGIC",
      source: "تواصل مباشر",
      notes: "منصة ناشئة - إمكانية شراكة استراتيجية لتوصيل الطلبات لموسم رمضان",
    },
  });

  // Partner Contacts
  await prisma.partnerContact.create({
    data: {
      partnerId: partner1.id,
      name: "محمد الحربي",
      position: "مدير العمليات",
      department: "العمليات",
      phone: "0555000011",
      email: "m.alharbi@saree3.store",
      contactType: "OPERATIONS",
      isPrimary: true,
      escalationLevel: 1,
    },
  });

  await prisma.partnerContact.create({
    data: {
      partnerId: partner1.id,
      name: "فهد السبيعي",
      position: "المدير التقني",
      department: "تقنية المعلومات",
      phone: "0555000012",
      email: "f.alsubaie@saree3.store",
      contactType: "TECHNICAL",
      isPrimary: false,
      escalationLevel: 2,
    },
  });

  await prisma.partnerContact.create({
    data: {
      partnerId: partner1.id,
      name: "خالد القرشي",
      position: "المدير التنفيذي",
      department: "الإدارة العليا",
      phone: "0555000013",
      contactType: "MANAGEMENT",
      isPrimary: false,
      escalationLevel: 3,
    },
  });

  await prisma.partnerContact.create({
    data: {
      partnerId: partner2.id,
      name: "سعد القحطاني",
      position: "مدير التشغيل",
      department: "العمليات",
      phone: "0555000021",
      email: "s.alqahtani@masar-logistics.com",
      contactType: "OPERATIONS",
      isPrimary: true,
      escalationLevel: 1,
    },
  });

  // Contracts
  const contract1 = await prisma.operationalContract.create({
    data: {
      partnerId: partner1.id,
      contractNumber: "AZM-CON-2025-001",
      name: "عقد توصيل متجر السريع - جدة",
      contractType: "STANDARD",
      status: "READY_FOR_TRIAL",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-06-30"),
      trialStartDate: new Date("2025-06-15"),
      cities: JSON.stringify(["جدة"]),
      workingDays: JSON.stringify(["SAT", "SUN", "MON", "TUE", "WED", "THU"]),
      pickupStartTime: "09:00",
      pickupEndTime: "18:00",
      deliveryStartTime: "10:00",
      deliveryEndTime: "22:00",
      deliveryAttempts: 2,
      waitBetweenAttempts: "24h",
      returnPolicy: "إعادة للفرع بعد 3 محاولات فاشلة",
      proofType: "OTP",
      shipmentEntryChannel: "MANUAL_ENTRY",
      updateChannel: "PORTAL_ONLY",
      azmResponsible: "أحمد القحطاني",
      partnerResponsible: "محمد الحربي",
      operationalNotes: "تجربة تشغيلية لـ 100 شحنة يومياً في الأسبوع الأول",
      readinessStatus: "INCOMPLETE",
    },
  });

  const contract2 = await prisma.operationalContract.create({
    data: {
      partnerId: partner1.id,
      contractNumber: "AZM-CON-2025-002",
      name: "عقد موسم رمضان 2025",
      contractType: "SEASONAL",
      status: "DRAFT",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-03-31"),
      cities: JSON.stringify(["جدة", "مكة"]),
      workingDays: JSON.stringify(["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"]),
      pickupStartTime: "08:00",
      pickupEndTime: "23:00",
      deliveryStartTime: "09:00",
      deliveryEndTime: "01:00",
      deliveryAttempts: 3,
      returnPolicy: "إعادة للمتجر في اليوم التالي",
      proofType: "PHOTO",
      shipmentEntryChannel: "CSV_UPLOAD",
      updateChannel: "EMAIL_REPORT",
      azmResponsible: "أحمد القحطاني",
      partnerResponsible: "فهد السبيعي",
      operationalNotes: "موسم رمضان - متوقع 500 شحنة يومياً",
      readinessStatus: "INCOMPLETE",
    },
  });

  await prisma.operationalContract.create({
    data: {
      partnerId: partner2.id,
      contractNumber: "AZM-CON-2025-003",
      name: "عقد تجربة مسار للشحن",
      contractType: "PILOT",
      status: "UNDER_REVIEW",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2025-10-31"),
      cities: JSON.stringify(["الرياض"]),
      workingDays: JSON.stringify(["SAT", "SUN", "MON", "TUE", "WED", "THU"]),
      pickupStartTime: "09:00",
      pickupEndTime: "17:00",
      deliveryStartTime: "09:00",
      deliveryEndTime: "20:00",
      deliveryAttempts: 2,
      proofType: "SIGNATURE",
      shipmentEntryChannel: "EXCEL_UPLOAD",
      updateChannel: "PORTAL_ONLY",
      azmResponsible: "سارة العنزي",
      readinessStatus: "INCOMPLETE",
    },
  });

  // Contract Readiness Items
  const readinessItems = [
    { itemKey: "partner_data_complete", name: "Partner data complete", nameAr: "بيانات الشريك مكتملة", isMandatory: true, sortOrder: 1 },
    { itemKey: "primary_contact_set", name: "Primary contact set", nameAr: "جهة التواصل الرئيسية محددة", isMandatory: true, sortOrder: 2 },
    { itemKey: "escalation_contact_set", name: "Escalation contact set", nameAr: "جهة التصعيد محددة", isMandatory: true, sortOrder: 3 },
    { itemKey: "pickup_point_set", name: "Pickup point set", nameAr: "نقطة الاستلام محددة", isMandatory: true, sortOrder: 4 },
    { itemKey: "coverage_areas_set", name: "Coverage areas set", nameAr: "مناطق التغطية محددة", isMandatory: true, sortOrder: 5 },
    { itemKey: "work_schedule_set", name: "Work days and hours set", nameAr: "أيام وساعات العمل محددة", isMandatory: true, sortOrder: 6 },
    { itemKey: "delivery_attempts_set", name: "Delivery attempts policy set", nameAr: "سياسة المحاولات محددة", isMandatory: true, sortOrder: 7 },
    { itemKey: "return_policy_set", name: "Return policy set", nameAr: "سياسة المرتجعات محددة", isMandatory: true, sortOrder: 8 },
    { itemKey: "proof_type_set", name: "Proof of delivery type set", nameAr: "إثبات التسليم محدد", isMandatory: true, sortOrder: 9 },
    { itemKey: "entry_channel_set", name: "Entry channel set", nameAr: "قناة إدخال الشحنات محددة", isMandatory: true, sortOrder: 10 },
    { itemKey: "update_channel_set", name: "Update channel set", nameAr: "قناة تحديث الحالات محددة", isMandatory: true, sortOrder: 11 },
    { itemKey: "spl_requirements", name: "SPL/National Address requirements", nameAr: "متطلبات سبل والعنوان الوطني محددة", isMandatory: false, sortOrder: 12 },
    { itemKey: "tga_requirements", name: "Transport authority requirements", nameAr: "متطلبات هيئة النقل محددة", isMandatory: false, sortOrder: 13 },
    { itemKey: "cst_requirements", name: "Communications authority requirements", nameAr: "متطلبات هيئة الاتصالات محددة", isMandatory: false, sortOrder: 14 },
    { itemKey: "azm_responsible_set", name: "AZM responsible person set", nameAr: "مسؤول عزم محدد", isMandatory: true, sortOrder: 15 },
    { itemKey: "partner_responsible_set", name: "Partner responsible person set", nameAr: "مسؤول الشريك محدد", isMandatory: true, sortOrder: 16 },
    { itemKey: "contract_file", name: "Contract file attached or waived", nameAr: "ملف العقد مرفق أو الإعفاء", isMandatory: true, sortOrder: 17 },
  ];

  for (const item of readinessItems) {
    await prisma.contractReadinessItem.create({
      data: {
        contractId: contract1.id,
        ...item,
      },
    });
  }

  // Pickup Points
  await prisma.pickupPoint.create({
    data: {
      partnerId: partner1.id,
      name: "مستودع السريع - جدة",
      pointType: "WAREHOUSE",
      city: "جدة",
      district: "حي الصناعية",
      address: "شارع الملك عبدالعزيز، المنطقة الصناعية",
      shortAddress: "جدة - الصناعية",
      contactPerson: "محمد الحربي",
      contactPhone: "0555000011",
      workingDays: JSON.stringify(["SAT", "SUN", "MON", "TUE", "WED", "THU"]),
      workingHours: "09:00 - 18:00",
      pickupInstructions: "التوجه إلى بوابة المستودع رقم 3 والتنسيق مع مسؤول الاستلام",
      requiresAppointment: true,
      expectedWaitTime: "15-30 دقيقة",
      status: "ACTIVE",
    },
  });

  await prisma.pickupPoint.create({
    data: {
      partnerId: partner1.id,
      name: "فرع السريع - مكة",
      pointType: "STORE_BRANCH",
      city: "مكة المكرمة",
      district: "العزيزية",
      address: "شارع إبراهيم الخليل",
      contactPerson: "فهد السبيعي",
      contactPhone: "0555000012",
      status: "DRAFT",
    },
  });

  await prisma.pickupPoint.create({
    data: {
      partnerId: partner2.id,
      name: "مركز مسار اللوجستي",
      pointType: "SORTING_CENTER",
      city: "الرياض",
      district: "الملز",
      address: "شارع الريل، حي الملز",
      contactPerson: "سعد القحطاني",
      contactPhone: "0555000021",
      status: "UNDER_REVIEW",
    },
  });

  // Coverage Areas
  await prisma.coverageArea.create({
    data: {
      partnerId: partner1.id,
      contractId: contract1.id,
      city: "جدة",
      operationalZone: "شمال جدة",
      districts: JSON.stringify(["الشاطئ", "الجامعة", "الموز", "البساتين", "الخالدية"]),
      coverageType: "DISTRICT_GROUP",
      coverageDays: JSON.stringify(["SAT", "SUN", "MON", "TUE", "WED", "THU"]),
      coverageStartTime: "10:00",
      coverageEndTime: "22:00",
      minExpectedShipments: 30,
      maxExpectedShipments: 80,
      needsDedicatedDrivers: true,
      status: "READY",
    },
  });

  await prisma.coverageArea.create({
    data: {
      partnerId: partner1.id,
      contractId: contract1.id,
      city: "جدة",
      operationalZone: "وسط جدة",
      districts: JSON.stringify(["البلد", "الرويس", "الحمراء", "السلامة"]),
      coverageType: "DISTRICT_GROUP",
      coverageDays: JSON.stringify(["SAT", "SUN", "MON", "TUE", "WED", "THU"]),
      coverageStartTime: "10:00",
      coverageEndTime: "20:00",
      minExpectedShipments: 20,
      maxExpectedShipments: 50,
      status: "PLANNED",
    },
  });

  await prisma.coverageArea.create({
    data: {
      partnerId: partner1.id,
      contractId: contract1.id,
      city: "مكة المكرمة",
      operationalZone: "العزيزية والشوقية",
      districts: JSON.stringify(["العزيزية", "الشوقية", "الخالدية", "الزاهر"]),
      coverageType: "DISTRICT_GROUP",
      status: "PLANNED",
    },
  });

  // Partner Requirements
  await prisma.partnerRequirement.create({
    data: {
      partnerId: partner1.id,
      name: "العنوان الوطني مطلوب",
      description: "يشترط تفعيل العنوان الوطني لجميع الشحنات",
      isMandatory: true,
      isCompleted: true,
      status: "COMPLETED",
      assignedTo: "فهد السبيعي",
    },
  });

  await prisma.partnerRequirement.create({
    data: {
      partnerId: partner1.id,
      name: "OTP مطلوب",
      description: "يشترط إثبات تسليم عن طريق رمز التحقق",
      isMandatory: true,
      isCompleted: true,
      status: "COMPLETED",
    },
  });

  await prisma.partnerRequirement.create({
    data: {
      partnerId: partner1.id,
      name: "تقرير يومي مطلوب",
      description: "يشترط تقرير يومي لجميع الشحنات",
      isMandatory: true,
      isCompleted: false,
      status: "IN_PROGRESS",
      assignedTo: "أحمد القحطاني",
      dueDate: new Date("2025-07-01"),
    },
  });

  await prisma.partnerRequirement.create({
    data: {
      partnerId: partner1.id,
      name: "سياسة المرتجعات محددة",
      description: "تحديد سياسة إعادة الشحنات بعد 3 محاولات",
      isMandatory: true,
      isCompleted: true,
      status: "COMPLETED",
    },
  });

  await prisma.partnerRequirement.create({
    data: {
      partnerId: partner1.id,
      name: "تتبع موقع المندوب",
      description: "يشترط تتبع موقع المندوب أثناء التوصيل",
      isMandatory: false,
      isCompleted: false,
      status: "WAITING_PARTNER",
      assignedTo: "محمد الحربي",
      dueDate: new Date("2025-08-01"),
    },
  });

  // Partner Integration Settings
  await prisma.partnerIntegrationSetting.create({
    data: {
      partnerId: partner1.id,
      entryChannel: "MANUAL_ENTRY",
      updateChannel: "PORTAL_ONLY",
      integrationStatus: "MANUAL_ONLY",
    },
  });

  // Activity Log
  await prisma.activityLog.create({
    data: {
      partnerId: partner1.id,
      activityType: "CALL",
      title: "اتصال أولي",
      description: "تم الاتصال بالشريك والتعريف بخدمات عزم",
      status: "COMPLETED",
    },
  });

  await prisma.activityLog.create({
    data: {
      partnerId: partner1.id,
      activityType: "MEETING",
      title: "اجتماع تعريفي",
      description: "اجتماع عبر Zoom مع فريق الشريك لشرح آلية العمل",
      userId: "1",
      status: "COMPLETED",
    },
  });

  await prisma.activityLog.create({
    data: {
      partnerId: partner1.id,
      contractId: contract1.id,
      activityType: "EMAIL",
      title: "طلب مستندات",
      description: "إرسال قائمة المستندات المطلوبة لإتمام العقد",
      status: "COMPLETED",
      needsFollowUp: true,
      followUpDate: new Date("2025-06-20"),
    },
  });

  await prisma.activityLog.create({
    data: {
      partnerId: partner1.id,
      contractId: contract1.id,
      activityType: "DOCUMENT_UPLOADED",
      title: "استلام مستندات العقد",
      description: "تم استلام السجل التجاري والرخصة من الشريك",
      status: "COMPLETED",
    },
  });

  await prisma.activityLog.create({
    data: {
      partnerId: partner2.id,
      activityType: "CALL",
      title: "اتصال أولي",
      description: "التواصل مع شركة مسار للشحن ومناقشة إمكانية التعاون",
      status: "COMPLETED",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("");
  console.log("📋 Users created:");
  console.log("   admin@azmflow.com / Admin@123 (SUPER_ADMIN)");
  console.log("   manager@azmflow.com / Admin@123 (OPERATIONS_MANAGER)");
  console.log("   coordinator@azmflow.com / Admin@123 (OPERATIONS_COORDINATOR)");
  console.log("📦 Phase 2: 3 Partners, 3 Contracts, 3 Pickup Points, 3 Coverage Areas");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
