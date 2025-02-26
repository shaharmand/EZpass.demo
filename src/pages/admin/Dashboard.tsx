import React from 'react';
import { Card, Space, Typography, Statistic, Row, Col, Button } from 'antd';
import { 
  QuestionCircleOutlined,
  UserOutlined,
  BookOutlined,
  StarOutlined,
  PlusOutlined,
  SettingOutlined
} from '@ant-design/icons/lib/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>לוח בקרה</Title>
          <Space>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/questions/new')}
            >
              צור שאלה חדשה
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => navigate('/admin/settings')}
            >
              הגדרות
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="סה״כ שאלות"
                value={1234}
                prefix={<QuestionCircleOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="משתמשים פעילים"
                value={567}
                prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="מבחנים"
                value={89}
                prefix={<BookOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="דירוג ממוצע"
                value={4.5}
                precision={1}
                prefix={<StarOutlined style={{ color: '#722ed1' }} />}
                suffix="/5"
              />
            </Card>
          </Col>
        </Row>

        {/* Recent Activity */}
        <Card title="פעילות אחרונה">
          <Text>אין פעילות אחרונה להצגה</Text>
        </Card>

        {/* Quick Actions */}
        <Card title="פעולות מהירות">
          <Space wrap>
            <Button icon={<PlusOutlined />}>
              הוסף שאלה
            </Button>
            <Button icon={<BookOutlined />}>
              צור מבחן
            </Button>
            <Button icon={<UserOutlined />}>
              נהל משתמשים
            </Button>
            <Button icon={<SettingOutlined />}>
              הגדרות מערכת
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default Dashboard; 