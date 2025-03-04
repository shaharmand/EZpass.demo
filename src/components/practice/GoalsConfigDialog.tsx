import React from 'react';
import { Modal, Form, InputNumber, Typography, notification } from 'antd';
import { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';
import './GoalsConfigDialog.css';
import moment from 'moment';

const { Text } = Typography;

interface GoalsConfigDialogProps {
  open: boolean;
  onClose: () => void;
  prep: StudentPrep;
}

export const GoalsConfigDialog: React.FC<GoalsConfigDialogProps> = ({
  open,
  onClose,
  prep,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const updatedPrep: StudentPrep = {
        ...prep,
        goals: {
          ...prep.goals,
          examDate: values.examDate.valueOf()
        }
      };

      PrepStateManager.updatePrep(updatedPrep);
      
      notification.success({
        message: 'יעדי הלמידה עודכנו',
        placement: 'topLeft',
        duration: 2,
      });

      onClose();
    } catch (error) {
      console.error('Failed to update goals:', error);
    }
  };

  return (
    <Modal
      title={<div style={{ textAlign: 'right' }}>הגדרת יעדי למידה</div>}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="שמור"
      cancelText="ביטול"
      wrapClassName="rtl-modal"
      style={{ textAlign: 'right' }}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          examDate: moment(prep.goals.examDate)
        }}
        style={{ textAlign: 'right' }}
      >
        <Form.Item
          name="examDate"
          label={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <Text>תאריך הבחינה</Text>
            </div>
          }
          rules={[
            { required: true, message: 'נא להזין תאריך הבחינה' },
          ]}
        >
          <InputNumber min={1} style={{ width: '100%', textAlign: 'right' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}; 