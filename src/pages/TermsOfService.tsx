import React from 'react';
import { Typography, Card, Alert } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;

const TermsOfService: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      <Card>
        <Typography>
          <Title level={2}>{t('terms_of_service')}</Title>
          <Text type="secondary">
            {t('last_updated')}: {new Date().toLocaleDateString()}
          </Text>

          {isHebrew ? (
            // Hebrew Content
            <>
              <Title level={4} style={{ marginTop: 24 }}>1. קבלת התנאים</Title>
              <Paragraph>
                על ידי גישה ושימוש באפליקציה זו, אתה מקבל ומסכים להיות מחויב לתנאי שימוש אלה. אם אינך מסכים לתנאים אלה, אל תשתמש באפליקציה.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>2. תיאור השירות</Title>
              <Paragraph>
                שירות זה מספק כלי ניהול עסקי לפעילות משאיות מזון, כולל ניהול מלאי, מעקב פיננסי, ניהול עובדים, תכנון תפריט ואנליטיקה.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>3. הצהרת אחריות</Title>
              <Paragraph>
                השירות מסופק "כמות שהוא" ו"כפי שזמין" ללא אחריות מכל סוג, מפורשת או מרומזת. אנו לא מתחייבים ש:
              </Paragraph>
              <ul>
                <li>השירות יעמוד בדרישות או בציפיות שלך</li>
                <li>השירות יהיה רציף, זמין, מאובטח או ללא שגיאות</li>
                <li>התוצאות שהתקבלו משימוש בשירות יהיו מדויקות או אמינות</li>
                <li>כל שגיאה בשירות תתוקן</li>
                <li>השירות נקי מווירוסים או רכיבים מזיקים אחרים</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>4. הגבלת אחריות</Title>
              <Paragraph>
                במידה המרבית המותרת על פי חוק, בשום מקרה לא נהיה אחראים לכל נזק עקיף, מקרי, מיוחד, תוצאתי או עונשי, או לכל אובדן רווחים או הכנסות, בין אם נגרמו ישירות או עקיפות, או כל אובדן נתונים, שימוש, מוניטין או הפסדים לא מוחשיים אחרים הנובעים מ:
              </Paragraph>
              <ul>
                <li>השימוש שלך או חוסר היכולת להשתמש בשירות</li>
                <li>כל גישה לא מורשית לשרתים שלנו או למידע אישי המאוחסן בהם</li>
                <li>כל הפרעה או הפסקה של העברה לשירות או ממנו</li>
                <li>כל באגים, וירוסים או קוד מזיק אחר שעלול להיות מועבר דרך השירות</li>
                <li>כל שגיאות, אי-דיוקים או השמטות בתוכן או בנתונים</li>
                <li>אובדן נתונים או מידע עסקי</li>
                <li>הפסדים פיננסיים או נזקי עסק</li>
                <li>החלטות שהתקבלו על סמך מידע שסופק על ידי השירות</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>5. אחריות משתמשים</Title>
              <Paragraph>
                אתה אחראי באופן בלעדי עבור:
              </Paragraph>
              <ul>
                <li>שמירה על אבטחת פרטי ההתחברות לחשבון שלך</li>
                <li>כל הפעילויות המתרחשות תחת החשבון שלך</li>
                <li>הדיוק והחוקיות של הנתונים שאתה מזין למערכת</li>
                <li>גיבוי הנתונים שלך באופן קבוע</li>
                <li>ציות לכל החוקים והתקנות הרלוונטיים בשימוש שלך בשירות</li>
                <li>החלטות עסקיות ופעולות שלך</li>
                <li>ניהול רשומות פיננסיות ואחריות מס</li>
                <li>ניהול עובדים וציות לחוקי עבודה</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>6. ללא ייעוץ מקצועי</Title>
              <Paragraph>
                שירות זה אינו מיועד לספק ייעוץ משפטי, חשבונאי, מיסוי, פיננסי או מקצועי אחר. עליך להתייעץ עם אנשי מקצוע מתאימים לייעוץ ספציפי למצבך.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>7. דיוק נתונים ואחריות</Title>
              <Paragraph>
                בעוד שאנו שואפים לספק חישובים ואנליטיקה מדויקים, אתה אחראי באופן בלעדי לבדיקת הדיוק של כל הנתונים, החישובים והדוחות שנוצרים על ידי השירות. איננו אחראים לכל שגיאות בחישובים פיננסיים, מעקב מלאי או כל עיבוד נתונים אחר.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>8. זמינות שירות</Title>
              <Paragraph>
                איננו מתחייבים שהשירות יהיה זמין בכל עת. אנו עשויים להשעות, למשוך או להגביל את הזמינות של השירות מסיבות עסקיות או תפעוליות. איננו אחראים לכל הפסדים שנגרמו עקב אי זמינות השירות.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>9. שיפוי</Title>
              <Paragraph>
                אתה מסכים לשפות, להגן ולפטור את ספק השירות, נושאי המשרה, הדירקטורים, העובדים והסוכנים שלו מכל תביעות, התחייבויות, נזקים, הפסדים והוצאות, כולל שכר טרחת עורכי דין סבירים, הנובעים מהגישה שלך או השימוש בשירות, הפרת תנאים אלה, או הפרת זכויות אחרים.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>10. שירותי צד שלישי</Title>
              <Paragraph>
                שירות זה משתמש בשירותי צד שלישי (כולל Supabase לאחסון נתונים). איננו אחראים לזמינות, דיוק או תוכן של שירותי צד שלישי כאלה. השימוש שלך בשירותי צד שלישי כפוף לתנאי השימוש ולמדיניות הפרטיות שלהם.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>11. שינויים לשירות ולתנאים</Title>
              <Paragraph>
                אנו שומרים לעצמנו את הזכות לשנות או להפסיק את השירות או את התנאים האלה בכל עת ללא הודעה. לא נהיה אחראים כלפיך או כלפי צד שלישי לכל שינוי, השעיה או הפסקה של השירות.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>12. סמכות שיפוט</Title>
              <Paragraph>
                תנאים אלה יהיו כפופים ויפורשו בהתאם לחוקי התחום השיפוטי שבו ממוקם ספק השירות, ללא קשר להוראות ניגוד חוקים.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>13. פתרון סכסוכים</Title>
              <Paragraph>
                כל סכסוכים הנובעים מתנאים אלה או מהשימוש בשירות ייפתרו באמצעות בוררות מחייבת. אתה מוותר על זכותך להשתתף בתביעות ייצוגיות או בוררות ברמת המחלקה.
              </Paragraph>

              <Alert
                message="חשוב"
                description="על ידי שימוש בשירות זה, אתה מאשר שקראת, הבנת ומסכים להיות מחויב לתנאי שימוש אלה. אם אינך מסכים לכל חלק מתנאים אלה, אינך רשאי להשתמש בשירות."
                type="error"
                showIcon
                style={{ marginTop: 32 }}
              />
            </>
          ) : (
            // English Content
            <>
              <Title level={4} style={{ marginTop: 24 }}>1. Acceptance of Terms</Title>
              <Paragraph>
                By accessing and using this food truck management application, you accept and agree to be bound
                by these Terms of Service. If you do not agree to these terms, do not use the Service.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>2. Description of Service</Title>
              <Paragraph>
                This Service provides business management tools for food truck operations, including but not limited to
                inventory management, financial tracking, employee management, menu planning, and analytics.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>3. Disclaimer of Warranties</Title>
              <Paragraph>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                We do not warrant that:
              </Paragraph>
              <ul>
                <li>The Service will meet your requirements or expectations</li>
                <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                <li>The results obtained from the use of the Service will be accurate or reliable</li>
                <li>Any errors in the Service will be corrected</li>
                <li>The Service is free from viruses or other harmful components</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>4. Limitation of Liability</Title>
              <Paragraph>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
                WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
                INTANGIBLE LOSSES RESULTING FROM:
              </Paragraph>
              <ul>
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
                <li>Any interruption or cessation of transmission to or from the Service</li>
                <li>Any bugs, viruses, or other harmful code that may be transmitted through the Service</li>
                <li>Any errors, inaccuracies, or omissions in any content or data</li>
                <li>Loss of data or business information</li>
                <li>Financial losses or business damages</li>
                <li>Decisions made based on information provided by the Service</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>5. User Responsibilities</Title>
              <Paragraph>
                You are solely responsible for:
              </Paragraph>
              <ul>
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>The accuracy and legality of the data you input into the Service</li>
                <li>Backing up your data regularly</li>
                <li>Complying with all applicable laws and regulations in your use of the Service</li>
                <li>Your business decisions and operations</li>
                <li>Financial record-keeping and tax compliance</li>
                <li>Employee management and labor law compliance</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>6. No Professional Advice</Title>
              <Paragraph>
                This Service is not intended to provide legal, accounting, tax, financial, or other professional advice.
                You should consult with appropriate professionals for advice specific to your situation.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>7. Data Accuracy and Responsibility</Title>
              <Paragraph>
                While we strive to provide accurate calculations and analytics, you are solely responsible for verifying
                the accuracy of all data, calculations, and reports generated by the Service. We are not liable for any
                errors in financial calculations, inventory tracking, or any other data processing.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>8. Service Availability</Title>
              <Paragraph>
                We do not guarantee that the Service will be available at all times. We may suspend, withdraw, or restrict
                the availability of all or any part of the Service for business or operational reasons.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>9. Indemnification</Title>
              <Paragraph>
                You agree to indemnify, defend, and hold harmless the Service provider, its officers, directors, employees,
                and agents from any claims, liabilities, damages, losses, and expenses, including reasonable attorney's fees,
                arising out of or in any way connected with your access to or use of the Service.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>10. Third-Party Services</Title>
              <Paragraph>
                This Service uses third-party services (including Supabase for data storage). We are not responsible for the
                availability, accuracy, or content of such third-party services.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>11. Modifications to Service and Terms</Title>
              <Paragraph>
                We reserve the right to modify or discontinue the Service or these Terms at any time without notice. We will
                not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>12. Governing Law</Title>
              <Paragraph>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the
                Service provider is located, without regard to its conflict of law provisions.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>13. Dispute Resolution</Title>
              <Paragraph>
                Any disputes arising from these Terms or the use of the Service shall be resolved through binding arbitration.
                You waive your right to participate in class action lawsuits or class-wide arbitration.
              </Paragraph>

              <Alert
                message="IMPORTANT"
                description="BY USING THIS SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE. IF YOU DO NOT AGREE WITH ANY PART OF THESE TERMS, YOU MUST NOT USE THE SERVICE."
                type="error"
                showIcon
                style={{ marginTop: 32 }}
              />
            </>
          )}
        </Typography>
      </Card>
    </div>
  );
};

export default TermsOfService;
