import React from 'react';
import { Typography, Card } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;

const PrivacyPolicy: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      <Card>
        <Typography>
          <Title level={2}>{t('privacy_policy')}</Title>
          <Text type="secondary">
            {t('last_updated')}: {new Date().toLocaleDateString()}
          </Text>

          {isHebrew ? (
            // Hebrew Content
            <>
              <Title level={4} style={{ marginTop: 24 }}>1. מידע שאנו אוספים</Title>
              <Paragraph>
                האפליקציה שלנו אוספת ושומרת את המידע הבא שאתה מספק:
              </Paragraph>
              <ul>
                <li>מידע עסקי (פרטי משאית מזון, מיקומים)</li>
                <li>נתוני מלאי (מרכיבים, ציוד, רמות מלאי)</li>
                <li>רשומות פיננסיות (הכנסות, הוצאות, עסקאות)</li>
                <li>מידע עובדים (שמות, משמרות, נתוני שכר)</li>
                <li>נתוני לקוחות (שמות, פרטי קשר, נתוני תוכנית נאמנות)</li>
                <li>פריטי תפריט ומידע תמחור</li>
                <li>אנליטיקה ונתוני שימוש</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>2. כיצד אנו שומרים את הנתונים שלך</Title>
              <Paragraph>
                כל הנתונים מאוחסנים באמצעות Supabase (ספק מסד נתונים בענן צד שלישי) עם הצפנה בתעבורה ובמנוחה.
                הנתונים שלך מאוחסנים בשרתים מאובטחים ואנו מיישמים אמצעי אבטחה בסטנדרטים בתעשייה להגנה על המידע שלך.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>3. כיצד אנו משתמשים במידע שלך</Title>
              <Paragraph>
                אנו משתמשים במידע שאתה מספק אך ורק כדי:
              </Paragraph>
              <ul>
                <li>לספק ולתחזק את פונקציונליות האפליקציה</li>
                <li>לאפשר לך לנהל את פעילות העסק שלך</li>
                <li>ליצור אנליטיקה ותובנות עבור העסק שלך</li>
                <li>לשפר ולייעל את האפליקציה</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>4. שיתוף נתונים</Title>
              <Paragraph>
                איננו מוכרים, סוחרים או משכירים את המידע האישי שלך לצדדים שלישיים. הנתונים שלך עשויים להיות משותפים עם:
              </Paragraph>
              <ul>
                <li>Supabase (ספק אחסון מסד הנתונים שלנו) כנדרש לספק את השירות</li>
                <li>רשויות אכיפת חוק או רגולטוריות אם נדרש על פי חוק</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>5. שמירת נתונים</Title>
              <Paragraph>
                אנו שומרים את הנתונים שלך כל עוד החשבון שלך פעיל או כנדרש לספק לך שירותים.
                באפשרותך לבקש מחיקת הנתונים שלך בכל עת על ידי יצירת קשר איתנו.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>6. קובצי Cookie ומעקב</Title>
              <Paragraph>
                אפליקציה זו עשויה להשתמש באחסון מקומי בדפדפן ובאחסון הפעלה כדי לשמור את מצב הכניסה שלך והעדפות האפליקציה.
                איננו משתמשים בקובצי Cookie מעקב של צד שלישי.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>7. הזכויות שלך</Title>
              <Paragraph>
                יש לך את הזכות:
              </Paragraph>
              <ul>
                <li>לגשת לנתונים האישיים שלך</li>
                <li>לתקן נתונים לא מדויקים</li>
                <li>לבקש מחיקת הנתונים שלך</li>
                <li>לייצא את הנתונים שלך</li>
                <li>למשוך הסכמה לעיבוד נתונים</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>8. אבטחת נתונים</Title>
              <Paragraph>
                בעוד שאנו מיישמים אמצעי אבטחה סבירים להגנה על הנתונים שלך, אין שיטת העברה דרך האינטרנט או אחסון אלקטרוני
                שהיא 100% מאובטחת. איננו יכולים להבטיח אבטחה מוחלטת של הנתונים שלך.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>9. פרטיות ילדים</Title>
              <Paragraph>
                אפליקציה זו אינה מיועדת לשימוש על ידי אנשים מתחת לגיל 18. איננו אוספים ביודעין מידע אישי מילדים מתחת לגיל 18.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>10. שינויים למדיניות זו</Title>
              <Paragraph>
                אנו שומרים לעצמנו את הזכות לשנות מדיניות פרטיות זו בכל עת. שינויים יפורסמו בעמוד זה עם תאריך עדכון מעודכן.
                המשך השימוש שלך באפליקציה לאחר שינויים מהווה קבלה של המדיניות המעודכנת.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>11. משתמשים בינלאומיים</Title>
              <Paragraph>
                הנתונים שלך עשויים להיות מועברים ומעובדים במדינות שאינן שלך. על ידי שימוש באפליקציה זו,
                אתה מסכים להעברת המידע שלך למדינות אחרות.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>12. שירותי צד שלישי</Title>
              <Paragraph>
                אפליקציה זו משתמשת ב-Supabase לאחסון נתונים ואימות. אנא עיין במדיניות הפרטיות של Supabase
                ב-https://supabase.com/privacy למידע על האופן שבו הם מטפלים בנתונים.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>13. פרטי יצירת קשר</Title>
              <Paragraph>
                אם יש לך שאלות לגבי מדיניות פרטיות זו או ברצונך לממש את זכויות הנתונים שלך, אנא צור קשר איתנו
                דרך ערוצי התמיכה של האפליקציה.
              </Paragraph>
            </>
          ) : (
            // English Content
            <>
              <Title level={4} style={{ marginTop: 24 }}>1. Information We Collect</Title>
              <Paragraph>
                Our application collects and stores the following information you provide:
              </Paragraph>
              <ul>
                <li>Business information (food truck details, locations)</li>
                <li>Inventory data (ingredients, supplies, stock levels)</li>
                <li>Financial records (revenue, expenses, transactions)</li>
                <li>Employee information (names, schedules, payroll data)</li>
                <li>Customer data (names, contact information, loyalty program data)</li>
                <li>Menu items and pricing information</li>
                <li>Analytics and usage data</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>2. How We Store Your Data</Title>
              <Paragraph>
                All data is stored using Supabase (a third-party cloud database provider) with encryption in transit and at rest.
                Your data is stored on secure servers and we implement industry-standard security measures to protect your information.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>3. How We Use Your Information</Title>
              <Paragraph>
                We use the information you provide solely to:
              </Paragraph>
              <ul>
                <li>Provide and maintain the application functionality</li>
                <li>Enable you to manage your food truck business operations</li>
                <li>Generate analytics and insights for your business</li>
                <li>Improve and optimize the application</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>4. Data Sharing</Title>
              <Paragraph>
                We do not sell, trade, or rent your personal information to third parties. Your data may be shared with:
              </Paragraph>
              <ul>
                <li>Supabase (our database hosting provider) as necessary to provide the service</li>
                <li>Law enforcement or regulatory agencies if required by law</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>5. Data Retention</Title>
              <Paragraph>
                We retain your data for as long as your account is active or as needed to provide you services.
                You may request deletion of your data at any time by contacting us.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>6. Cookies and Tracking</Title>
              <Paragraph>
                This application may use browser local storage and session storage to maintain your login state and
                application preferences. We do not use third-party tracking cookies.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>7. Your Rights</Title>
              <Paragraph>
                You have the right to:
              </Paragraph>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Withdraw consent for data processing</li>
              </ul>

              <Title level={4} style={{ marginTop: 24 }}>8. Data Security</Title>
              <Paragraph>
                While we implement reasonable security measures to protect your data, no method of transmission over the internet
                or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>9. Children's Privacy</Title>
              <Paragraph>
                This application is not intended for use by individuals under the age of 18. We do not knowingly collect
                personal information from children under 18.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>10. Changes to This Policy</Title>
              <Paragraph>
                We reserve the right to modify this privacy policy at any time. Changes will be posted on this page with
                an updated revision date. Your continued use of the application after changes constitutes acceptance of the updated policy.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>11. International Users</Title>
              <Paragraph>
                Your data may be transferred to and processed in countries other than your own. By using this application,
                you consent to the transfer of your information to other countries.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>12. Third-Party Services</Title>
              <Paragraph>
                This application uses Supabase for data storage and authentication. Please review Supabase's privacy policy
                at https://supabase.com/privacy for information about how they handle data.
              </Paragraph>

              <Title level={4} style={{ marginTop: 24 }}>13. Contact Information</Title>
              <Paragraph>
                If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us
                through the application support channels.
              </Paragraph>
            </>
          )}
        </Typography>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
