# @tempot/national-id-parser

باكيدج لاستخراج والتحقق من البيانات من الرقم القومي المصري.

## 📋 المميزات

- ✅ استخراج الجنس (ذكر/أنثى)
- ✅ استخراج تاريخ الميلاد
- ✅ استخراج المحافظة
- ✅ التحقق من صحة الرقم القومي
- ✅ تنسيق الرقم القومي (مع شرطات)
- ✅ دعم كامل للغة العربية

## 📦 التثبيت

```bash
pnpm add @tempot/national-id-parser
```

## 🚀 الاستخدام

### استخراج البيانات من الرقم القومي

```typescript
import { parseNationalId, extractNationalIdData } from '@tempot/national-id-parser';

// استخراج كامل البيانات
const data = parseNationalId('28009010100332');

console.log(data);
// {
//   gender: 'male',
//   birthDate: 1980-09-01T00:00:00.000Z,
//   governorate: 'القاهرة',
//   governorateCode: '01',
//   isValid: true
// }

// استخراج البيانات فقط (بدون التحقق)
const extracted = extractNationalIdData('28009010100332');

console.log(extracted);
// {
//   gender: 'male',
//   birthDate: 1980-09-01T00:00:00.000Z,
//   governorate: 'القاهرة'
// }
```

### التحقق من صحة الرقم القومي

```typescript
import { validateNationalId } from '@tempot/national-id-parser';

const result = validateNationalId('28009010100332');

console.log(result);
// {
//   isValid: true,
//   errors: []
// }

const invalid = validateNationalId('123');

console.log(invalid);
// {
//   isValid: false,
//   errors: [
//     'الرقم القومي يجب أن يكون 14 رقم',
//     'الرقم القومي يحتوي على أحرف غير صالحة'
//   ]
// }
```

### تنسيق الرقم القومي

```typescript
import { formatNationalId } from '@tempot/national-id-parser';

const formatted = formatNationalId('28009010100332');

console.log(formatted);
// '2800901-0100332'
```

### الحصول على اسم المحافظة

```typescript
import { getGovernorateName } from '@tempot/national-id-parser';

const name = getGovernorateName('01');

console.log(name);
// 'القاهرة'
```

## 📊 هيكل الرقم القومي المصري

الرقم القومي المصري يحتوي على 14 رقم مشفر:

```
28009010100332
│└─┬─┘│└┬─┘│└┬─┘│└────┬────┘│└──┬──┘│└─┬─┘│└─┬─┘
│  │  │  │  │  │     │     │    │   │   │  │
│  │  │  │  │  │     │     │    │   │   │  └─ الرقم التسلسلي (3 أرقام)
│  │  │  │  │  │     │     │    │   │   └──── رمز المحافظة (2 رقم)
│  │  │  │  │  │     │     │    │   └─────── سنة الميلاد (2 رقم)
│  │  │  │  │  │     │     │    └───────── يوم الميلاد (2 رقم)
│  │  │  │  │  │     │     └────────────── شهر الميلاد (2 رقم)
│  │  │  │  │  │     └─────────────────── القرية/المركز (4 أرقام)
│  │  │  │  │  └───────────────────────── نوع الميلاد (1 رقم)
│  │  │  │  └──────────────────────────── سنة الميلاد (المئات)
│  │  │  └─────────────────────────────── شهر الميلاد
│  │  └────────────────────────────────── يوم الميلاد
│  └───────────────────────────────────── الجنس (1 = ذكر، 2 = أنثى)
└─────────────────────────────────────── القرن (2 = 1900s، 3 = 2000s)
```

## 🎯 الأنواع

```typescript
interface NationalIdData {
  gender: 'male' | 'female';
  birthDate: Date;
  governorate: string;
  governorateCode: string;
  isValid: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ExtractedData {
  gender: 'male' | 'female';
  birthDate: Date;
  governorate: string;
}
```

## 📝 المحافظات المدعومة

- القاهرة (01)
- الإسكندرية (02)
- بورسعيد (03)
- السويس (04)
- دمياط (05)
- الدقهلية (06)
- الشرقية (07)
- المنوفية (08)
- الغربية (09)
- الجيزة (10)
- الإسماعيلية (11)
- بني سويف (12)
- الفيوم (13)
- المنيا (14)
- أسيوط (15)
- سوهاج (16)
- قنا (17)
- أسوان (18)
- الأقصر (19)
- البحر الأحمر (20)
- الوادي الجديد (21)
- مطروح (22)
- شمال سيناء (23)
- جنوب سيناء (24)
- القليوبية (25)
- كفر الشيخ (26)
- الغربية (27)
- البحيرة (28)
- الإسماعيلية (29)
- الجيزة (30)

## ⚠️ ملاحظات

- الرقم القومي يجب أن يكون 14 رقم
- أول رقم يحدد الجنس (1 = ذكر، 2 = أنثى)
- الرقم القومي يحتوي على تاريخ الميلاد والمحافظة
- هذا الباكيدج مصمم خصيصاً للرقم القومي المصري

## 📄 الترخيص

MIT
