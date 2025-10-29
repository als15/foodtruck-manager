import React from 'react';
import { Typography, Card, Alert } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;

const Disclaimer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      <Card>
        <Typography>
          <Title level={2}>{t('disclaimer')}</Title>
          <Text type="secondary">
            {t('last_updated')}: {new Date().toLocaleDateString()}
          </Text>

          {isHebrew ? (
            // Hebrew Content
            <>
              <Title level={4} style={{ marginTop: 24 }}>הצהרה כללית</Title>
              <Paragraph>
                המידע והכלים המסופקים על ידי אפליקציית ניהול משאית המזון הזו הם למטרות מידע כללי וניהול עסקי בלבד.
                כל המידע המסופק דרך השירות מסופק בתום לב; עם זאת, איננו מספקים כל ייצוג או אחריות מכל סוג, מפורש או מרומז,
                לגבי הדיוק, ההתאמה, התוקף, האמינות, הזמינות או השלמות של כל מידע המסופק דרך השירות.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>אין יחסים מקצועיים</Title>
              <Paragraph>
                השימוש שלך בשירות זה אינו יוצר כל יחסים מקצועיים בינך לבין ספק השירות. השירות אינו תחליף לייעוץ מקצועי
                מרואי חשבון, עורכי דין, יועצי מס או יועצים עסקיים מוסמכים. עליך לבקש ייעוץ מקצועי לפני קבלת כל החלטות
                עסקיות, פיננסיות, משפטיות או מס.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>הצהרת אחריות מידע פיננסי</Title>
              <Paragraph>
                המעקב הפיננסי, החישובים, האנליטיקה והדוחות המסופקים על ידי שירות זה הם כלים לסייע לך בניהול העסק שלך. עם זאת:
              </Paragraph>
              <ul>
                <li>איננו מבטיחים את הדיוק של כל חישוב או תחזית פיננסית</li>
                <li>איננו אחראים לכל החלטות פיננסיות שהתקבלו על סמך הנתונים או ההמלצות של השירות</li>
                <li>אתה אחראי באופן בלעדי לשמירת רשומות פיננסיות מדויקות למטרות מס ורגולטוריות</li>
                <li>עליך לאמת את כל הנתונים הפיננסיים עם רואה חשבון או מנהל חשבונות מוסמך</li>
                <li>אין להשתמש בשירות כמערכת הרישום הפיננסי היחידה שלך</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>הצהרת אחריות פעולות עסקיות</Title>
              <Paragraph>
                שירות זה מספק כלים לניהול פעולות עסקיות, אך אתה אחראי באופן בלעדי עבור:
              </Paragraph>
              <ul>
                <li>כל ההחלטות העסקיות והתוצאות שלהן</li>
                <li>ציות לתקנות בריאות ובטיחות</li>
                <li>בטיחות ומניפולציה של מזון</li>
                <li>דרישות רישוי והיתרים</li>
                <li>ציות לחוקי עבודה וניהול עובדים</li>
                <li>ציות למס ודיווח</li>
                <li>כיסוי ביטוח ואחריות</li>
                <li>שירות לקוחות ושביעות רצון</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>הצהרת אחריות ניהול מלאי ותפריט</Title>
              <Paragraph>
                בעוד שהשירות מספק כלים למעקב מלאי וניהול תפריט:
              </Paragraph>
              <ul>
                <li>איננו אחראים לאי התאמות או הפסדי מלאי</li>
                <li>אתה אחראי לספירת מלאי פיזית והתאמה</li>
                <li>עלויות מרכיבים וחישובים הם הערכות המבוססות על נתוני הקלט שלך</li>
                <li>עליך לאמת עלויות מזון, תמחור ושולי רווח באופן עצמאי</li>
                <li>איננו אחראים לשגיאות תמחור או הפסדים פיננסיים מתמחור תפריט</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>הצהרת אחריות ניהול עובדים</Title>
              <Paragraph>
                תכונות ניהול העובדים מסופקות ככלים ארגוניים בלבד:
              </Paragraph>
              <ul>
                <li>אתה אחראי לציות לכל חוקי ותקנות העבודה</li>
                <li>עליך לאמת חישובי שכר עם ספק שכר מוסמך</li>
                <li>איננו אחראים לציות לחוק שכר ושעות</li>
                <li>אתה אחראי לניכוי מס נאות ודיווח</li>
                <li>כלי תזמון עובדים אינם מבטיחים ציות לחוקי תזמון</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>הצהרת אחריות דיוק נתונים</Title>
              <Paragraph>
                בשום נסיבות לא נהיה אחראים לכל אובדן או נזק שנגרם על ידי הסתמכותך על מידע שהתקבל דרך השירות.
                זוהי אחריותך להעריך את הדיוק, השלמות והשימושיות של כל מידע המסופק.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>מגבלות טכניות</Title>
              <Paragraph>
                השירות עשוי להכיל באגים, שגיאות או מגבלות טכניות שעלולות לגרום ל:
              </Paragraph>
              <ul>
                <li>חישובים או תצוגות נתונים שגויים</li>
                <li>אובדן נתונים או הפרעות בשירות</li>
                <li>כשלי מערכת או קריסות</li>
                <li>פרצות אבטחה</li>
              </ul>
              <Paragraph>
                איננו אחראים לכל נזקים הנובעים מבעיות טכניות, כשלי מערכת או אובדן נתונים.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>תוכן ושירותי צד שלישי</Title>
              <Paragraph>
                שירות זה עשוי להסתמך על שירותי צד שלישי (כגון Supabase לאחסון נתונים). איננו אחראים לזמינות, דיוק, אבטחה או
                תוכן של שירותי צד שלישי כאלה. כל בעיות הנובעות משירותי צד שלישי הן מחוץ לשליטתנו ולאחריותנו.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>אין ערבות לתוצאות</Title>
              <Paragraph>
                השימוש בשירות זה אינו מבטיח:
              </Paragraph>
              <ul>
                <li>הצלחה עסקית או רווחיות</li>
                <li>שיפור יעילות תפעולית</li>
                <li>חיסכון בעלויות או עלייה בהכנסות</li>
                <li>ציות לחוקים או תקנות כלשהם</li>
                <li>שביעות רצון או שימור לקוחות</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>קבלת סיכונים</Title>
              <Paragraph>
                על ידי שימוש בשירות זה, אתה מאשר ומקבל את כל הסיכונים הקשורים ל:
              </Paragraph>
              <ul>
                <li>תפעול עסק משאית מזון</li>
                <li>קבלת החלטות עסקיות על סמך נתונים מהשירות</li>
                <li>אחסון נתוני העסק שלך במערכות ענן</li>
                <li>הסתמכות על כלי תוכנה לפעולות עסקיות</li>
                <li>אובדן נתונים פוטנציאלי, כשלי מערכת או פרצות אבטחה</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>בדיקה ואימות</Title>
              <Paragraph>
                לפני הסתמכות על השירות לפעולות עסקיות קריטיות, עליך:
              </Paragraph>
              <ul>
                <li>לבדוק ביסודיות את כל התכונות עם נתוני דגימה</li>
                <li>לאמת חישובים מול מקורות עצמאיים</li>
                <li>לשמור על מערכות גיבוי ורשומות</li>
                <li>ליישם נהלי בקרת איכות משלך</li>
                <li>לבדוק ולאמת דיוק נתונים באופן קבוע</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>ציות רגולטורי</Title>
              <Paragraph>
                אתה אחראי באופן בלעדי להבטיח שהשימוש שלך בשירות והפעילות העסקית שלך עומדים בכל החוקים, התקנות והצווים הרלוונטיים
                הפדרליים, המדינתיים והמקומיים, כולל אך לא רק:
              </Paragraph>
              <ul>
                <li>תקנות בטיחות מזון</li>
                <li>דרישות משרד הבריאות</li>
                <li>רישוי עסקי</li>
                <li>התחייבויות מס</li>
                <li>חוקי עבודה</li>
                <li>חוקי הגנת נתונים</li>
              </ul>

              <Alert
                message="חשוב"
                description="על ידי שימוש בשירות זה, אתה מאשר שקראת, הבנת ומסכים להיות מחויב להצהרת אחריות זו. אם אינך מסכים לכל חלק מהצהרה זו, אינך רשאי להשתמש בשירות."
                type="error"
                showIcon
                style={{ marginTop: 32 }}
              />
            </>
          ) : (
            // English Content
            <>
              <Title level={4} style={{ marginTop: 24 }}>General Disclaimer</Title>
              <Paragraph>
                The information and tools provided by this food truck management application are for general informational
                and business management purposes only. All information provided through the Service is provided in good faith;
                however, we make no representation or warranty of any kind, express or implied, regarding the accuracy,
                adequacy, validity, reliability, availability, or completeness of any information provided through the Service.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>No Professional Relationship</Title>
              <Paragraph>
                Your use of this Service does not create any professional relationship between you and the Service provider.
                The Service is not a substitute for professional advice from qualified accountants, lawyers, tax advisors,
                or business consultants. You should seek professional advice before making any business, financial, legal,
                or tax decisions.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>Financial Information Disclaimer</Title>
              <Paragraph>
                The financial tracking, calculations, analytics, and reports provided by this Service are tools to assist
                you in managing your business. However:
              </Paragraph>
              <ul>
                <li>We do not guarantee the accuracy of any financial calculations or projections</li>
                <li>We are not responsible for any financial decisions made based on the Service's data or recommendations</li>
                <li>You are solely responsible for maintaining accurate financial records for tax and regulatory purposes</li>
                <li>You should verify all financial data with a qualified accountant or bookkeeper</li>
                <li>The Service should not be used as your sole financial record-keeping system</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>Business Operations Disclaimer</Title>
              <Paragraph>
                This Service provides tools for managing business operations, but you are solely responsible for:
              </Paragraph>
              <ul>
                <li>All business decisions and their consequences</li>
                <li>Compliance with health and safety regulations</li>
                <li>Food safety and handling procedures</li>
                <li>Licensing and permitting requirements</li>
                <li>Labor law compliance and employee management</li>
                <li>Tax compliance and reporting</li>
                <li>Insurance and liability coverage</li>
                <li>Customer service and satisfaction</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>Inventory and Menu Management Disclaimer</Title>
              <Paragraph>
                While the Service provides tools for inventory tracking and menu management:
              </Paragraph>
              <ul>
                <li>We are not responsible for inventory discrepancies or losses</li>
                <li>You are responsible for physical inventory counts and reconciliation</li>
                <li>Ingredient costs and calculations are estimates based on your input data</li>
                <li>You must verify food costs, pricing, and profit margins independently</li>
                <li>We are not liable for pricing errors or financial losses from menu pricing</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>Employee Management Disclaimer</Title>
              <Paragraph>
                The employee management features are provided as organizational tools only:
              </Paragraph>
              <ul>
                <li>You are responsible for compliance with all labor laws and regulations</li>
                <li>You must verify payroll calculations with a qualified payroll provider</li>
                <li>We are not responsible for wage and hour law compliance</li>
                <li>You are responsible for proper tax withholding and reporting</li>
                <li>Employee scheduling tools do not guarantee compliance with scheduling laws</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>Data Accuracy Disclaimer</Title>
              <Paragraph>
                UNDER NO CIRCUMSTANCES SHALL WE BE LIABLE FOR ANY LOSS OR DAMAGE CAUSED BY YOUR RELIANCE ON INFORMATION
                OBTAINED THROUGH THE SERVICE. IT IS YOUR RESPONSIBILITY TO EVALUATE THE ACCURACY, COMPLETENESS, AND
                USEFULNESS OF ANY INFORMATION PROVIDED.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>Technical Limitations</Title>
              <Paragraph>
                The Service may contain bugs, errors, or technical limitations that could result in:
              </Paragraph>
              <ul>
                <li>Incorrect calculations or data displays</li>
                <li>Loss of data or service interruptions</li>
                <li>System failures or crashes</li>
                <li>Security vulnerabilities</li>
              </ul>
              <Paragraph>
                We are not liable for any damages resulting from technical issues, system failures, or data loss.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>Third-Party Content and Services</Title>
              <Paragraph>
                This Service may rely on third-party services (such as Supabase for data storage). We are not responsible
                for the availability, accuracy, security, or content of such third-party services. Any issues arising from
                third-party services are beyond our control and responsibility.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>No Guarantee of Results</Title>
              <Paragraph>
                Use of this Service does not guarantee:
              </Paragraph>
              <ul>
                <li>Business success or profitability</li>
                <li>Improved operational efficiency</li>
                <li>Cost savings or revenue increases</li>
                <li>Compliance with any laws or regulations</li>
                <li>Customer satisfaction or retention</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>Assumption of Risk</Title>
              <Paragraph>
                BY USING THIS SERVICE, YOU ACKNOWLEDGE AND ACCEPT ALL RISKS ASSOCIATED WITH:
              </Paragraph>
              <ul>
                <li>Operating a food truck business</li>
                <li>Making business decisions based on data from the Service</li>
                <li>Storing your business data in cloud systems</li>
                <li>Relying on software tools for business operations</li>
                <li>Potential data loss, system failures, or security breaches</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>Testing and Verification</Title>
              <Paragraph>
                Before relying on the Service for critical business operations, you should:
              </Paragraph>
              <ul>
                <li>Thoroughly test all features with sample data</li>
                <li>Verify calculations against independent sources</li>
                <li>Maintain backup systems and records</li>
                <li>Implement your own quality control procedures</li>
                <li>Regularly audit and verify data accuracy</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>Regulatory Compliance</Title>
              <Paragraph>
                You are solely responsible for ensuring that your use of the Service and your business operations comply
                with all applicable federal, state, and local laws, regulations, and ordinances, including but not limited to:
              </Paragraph>
              <ul>
                <li>Food safety regulations</li>
                <li>Health department requirements</li>
                <li>Business licensing</li>
                <li>Tax obligations</li>
                <li>Labor laws</li>
                <li>Data protection laws</li>
              </ul>

              <Alert
                message="IMPORTANT"
                description="BY USING THIS SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS DISCLAIMER. IF YOU DO NOT AGREE WITH ANY PART OF THIS DISCLAIMER, YOU MUST NOT USE THE SERVICE."
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

export default Disclaimer;
