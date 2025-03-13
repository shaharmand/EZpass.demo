import React, { useState } from 'react';
import { Card, Space, Typography, Upload, Button, Alert, Steps } from 'antd';
import { 
  UploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons/lib/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;

export const QuestionImport: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    // TODO: Implement file upload
    setTimeout(() => {
      setUploading(false);
      setCurrentStep(1);
    }, 2000);
  };

  const steps = [
    {
      title: 'העלאת קובץ',
      description: 'העלה קובץ אקסל עם השאלות',
      icon: uploading ? <LoadingOutlined /> : <UploadOutlined />
    },
    {
      title: 'אימות נתונים',
      description: 'בדיקת תקינות הנתונים',
      icon: <InfoCircleOutlined />
    },
    {
      title: 'ייבוא',
      description: 'ייבוא השאלות למערכת',
      icon: <CheckCircleOutlined />
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>ייבוא שאלות</Title>

      <Steps
        current={currentStep}
        items={steps}
        style={{ maxWidth: 800, margin: '0 auto' }}
      />

      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="הנחיות לייבוא שאלות"
            description={
              <ul>
                <li>יש להשתמש בתבנית האקסל הייעודית</li>
                <li>כל שאלה צריכה להיות בשורה נפרדת</li>
                <li>יש למלא את כל השדות החובה</li>
                <li>ניתן לייבא עד 100 שאלות בבת אחת</li>
              </ul>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />

          <Upload
            accept=".xlsx,.xls"
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            maxCount={1}
            beforeUpload={() => false}
          >
            <Button 
              icon={<FileExcelOutlined />}
              disabled={fileList.length > 0}
            >
              בחר קובץ
            </Button>
          </Upload>

          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={uploading}
            icon={<UploadOutlined />}
          >
            התחל ייבוא
          </Button>

          <Button type="link" icon={<FileExcelOutlined />}>
            הורד תבנית אקסל
          </Button>
        </Space>
      </Card>
    </Space>
  );
}; 