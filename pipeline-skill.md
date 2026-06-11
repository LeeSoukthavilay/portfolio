# Skill Pipeline — Portfolio Microservices

ลำดับการสั่งงาน skill สำหรับโปรเจ็คนี้ (และโปรเจ็คที่คล้ายกันในอนาคต)

## Pipeline Overview

```
/grill-me → /grill-with-docs → /writing-plans → /subagent-driven-development → เสร็จ
```

## Phase 1: Decision Tree (Grill)

| ลำดับ | Skill | หน้าที่ | Input | Output |
|--------|-------|--------|-------|--------|
| 1 | `/grill-me` | สัมภาษณ์ย้อนถาม decision tree ทุก branch ไล่ตอบทีละข้อ จนตกผลึกทุก architectural choice | ไอเดียดิบจากผู้ใช้ | 23 decisions ที่ confirm แล้ว |

**ทำไม grill ก่อน:** ป้องกัน "คิดเองเออเอง" — grill ดึง requirements จริงออกมาจากหัวผู้ใช้ ทีละคำถาม

## Phase 2: Documentation (Docs)

| ลำดับ | Skill | หน้าที่ | Input | Output |
|--------|-------|--------|-------|--------|
| 2 | `/grill-with-docs` | แปลง decisions → CONTEXT.md (domain language) + ADRs (เฉพาะที่กลับลำบาก/น่าแปลกใจ/มี trade-off) | 23 decisions จาก Phase 1 | CONTEXT.md + 5 ADRs |

**ทำไม grill-with-docs ต่อ:** ตกผลึกภาษากลางก่อนเขียนแผน — ADRs บันทึกว่าทำไมตัดสินใจแบบนี้ เผื่อกลับมาอ่านอีกที

## Phase 3: Planning (Plan)

| ลำดับ | Skill | หน้าที่ | Input | Output |
|--------|-------|--------|-------|--------|
| 3 | `/writing-plans` | เขียน implementation plan แบบ step-by-step — ไฟล์ไหน สร้างอะไร โค้ดอะไร test อะไร commit message อะไร | CONTEXT.md + ADRs | `docs/superpowers/plans/YYYY-MM-DD-feature.md` |

**ทำไม writing-plans ต่อ:** plan ที่ดีต้องอิงกับ architecture ที่ยืนยันแล้วและภาษาที่ตกลงกันไว้ — ไม่ใช่เขียนจากศูนย์

## Phase 4: Execution (Implement)

| ลำดับ | Skill | หน้าที่ | Input | Output |
|--------|-------|--------|-------|--------|
| 4 | `/subagent-driven-development` | Dispatch fresh subagent ทีละ task — implementer → spec reviewer → code quality reviewer → commit → ไป task ต่อไป | Implementation plan | โค้ดทั้งหมด + commits |

**ทำไม subagent-driven:** preserve context — เราไม่ polluted ตัวเองด้วยโค้ด 10 services, subagent แต่ละตัวเห็นเฉพาะ task ของตัวเอง

## Phase 5: Quality Gate (Optional)

| ลำดับ | Skill | หน้าที่ | Input | Output |
|--------|-------|--------|-------|--------|
| 5 | `/requesting-code-review` | Final code review ทั่วทั้งโปรเจ็คก่อน merge/push | โค้ดที่เสร็จแล้ว | Review report |

## Phase 6: Finish

| ลำดับ | Skill | หน้าที่ | Input | Output |
|--------|-------|--------|-------|--------|
| 6 | `/finishing-a-development-branch` | Clean up + merge/PR options | Branch ที่เสร็จแล้ว | Merge หรือ PR |

## Design Skills (เรียกใน subagent)

Skill เหล่านี้ถูกเรียกโดย implementer subagent (ไม่ใช่ pipeline หลัก):

| Skill | ใช้ตอน | หน้าที่ |
|--------|--------|--------|
| `/impeccable` | สร้าง UI components | Design review — visual hierarchy, spacing, accessibility |
| `/frontend-design` | สร้าง frontend pages | Implementation ตาม impeccable design |
| `/tdd` | เขียน business logic สำคัญ | Test-first — order-book engine, payment idempotency |
| `/diagnose` | เจอ bug ใน CI/build | Reproduce → instrument → fix แบบมีวินัย |

## กฎสำคัญ

1. **ห้ามข้าม Phase 1** — grill ก่อนเสมอ ไม่งั้น requirements ลอย
2. **ห้ามข้าม Phase 2** — CONTEXT.md ต้องเขียนก่อน plan ถ้าไม่เขียน plan จะไม่มีภาษากลาง
3. **ห้ามข้าม Phase 3** — writing-plans ก่อนเขียนโค้ดทุกครั้ง No plan = no direction
4. **ห้าม dispatch parallel subagents** — implement ทีละ task (กัน conflict)
5. **ห้าม skip review** — implementer เสร็จ → spec reviewer → code quality reviewer → commit → ไปต่อ

## Quick Start (ครั้งต่อไป)

```
/grill-me <ไอเดีย>
```
แล้วทำตาม pipeline ด้านบน
