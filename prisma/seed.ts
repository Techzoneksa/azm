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

  const opsManagerPerms = ["drivers.manage", "drivers.view", "vehicles.manage", "vehicles.view", "company.manage", "company.view", "compliance.manage", "compliance.view", "readiness.view", "readiness.manage", "reports.view", "audit.read"];
  for (const permName of opsManagerPerms) {
    await prisma.rolePermission.create({ data: { roleId: opsManagerRole.id, permissionId: permMap[permName] } });
  }

  const opsCoordPerms = ["drivers.view", "vehicles.view", "company.view", "compliance.view", "readiness.view"];
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

  console.log("✅ Seed completed successfully!");
  console.log("");
  console.log("📋 Users created:");
  console.log("   admin@azmflow.com / Admin@123 (SUPER_ADMIN)");
  console.log("   manager@azmflow.com / Admin@123 (OPERATIONS_MANAGER)");
  console.log("   coordinator@azmflow.com / Admin@123 (OPERATIONS_COORDINATOR)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
