ชุดไฟล์แบบทดสอบพร้อมระบบเปิด/ปิด

ไฟล์ในชุดนี้
1. index.html
   - หน้าแรก
   - แสดงสถานะว่าเปิดหรือปิดแบบทดสอบ
   - มีปุ่มเข้าสู่แบบทดสอบ

2. quiz.html
   - หน้าแบบทดสอบ
   - ถ้าปิดอยู่ นักเรียนจะเห็นข้อความ “ยังไม่เปิดให้ทำแบบทดสอบ”
   - นักเรียนไม่เห็นคะแนนและเฉลยหลังส่ง

3. admin.html
   - หน้าผู้ดูแลสำหรับเปิด/ปิดแบบทดสอบ
   - รหัสผ่านเริ่มต้นคือ 1234
   - เปลี่ยนรหัสได้ใน Code.gs ตรง ADMIN_KEY

4. Code.gs
   - ใช้กับ Google Apps Script
   - ส่งผลสอบเข้าอีเมล
   - บันทึกผลลง Google Sheet
   - เก็บสถานะเปิด/ปิดด้วย Script Properties

วิธีติดตั้ง
1. นำ Code.gs ไปวางทับใน Google Apps Script
2. กด Save
3. Deploy > Manage deployments > Edit
4. เลือก Version ใหม่ แล้วกด Deploy
5. Copy Web App URL
6. เปิดไฟล์ index.html, quiz.html และ admin.html
7. แทนที่ข้อความ PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE ด้วย Web App URL เดียวกันทั้ง 3 ไฟล์
8. อัปโหลดไฟล์ index.html, quiz.html, admin.html ขึ้นเว็บ

การใช้งาน
- เปิดหน้า admin.html
- กรอกรหัสผ่าน 1234
- กด “เปิดให้ทำแบบทดสอบ” หรือ “ปิดการทำแบบทดสอบ”
