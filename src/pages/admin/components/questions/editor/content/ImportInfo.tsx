import React from 'react';
import styled from 'styled-components';
import { Card, Typography } from 'antd';

const { Text, Title } = Typography;

const ImportInfoContainer = styled(Card)`
    margin-top: 16px;
`;

const ImportInfoTitle = styled(Title).attrs({ level: 5 })`
    margin-bottom: 8px !important;
`;

const ImportInfoContent = styled.pre`
    background-color: #f5f5f5;
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    font-family: monospace;
    direction: ltr;
    text-align: left;
`;

interface QuestionImportInfoProps {
    importInfo?: {
        system?: string;
        originalId?: string | number;
        importedAt?: string;
        [key: string]: any;  // Allow for additional fields
    };
}

export const QuestionImportInfo: React.FC<QuestionImportInfoProps> = ({ importInfo }) => {
    if (!importInfo) return null;

    return (
        <ImportInfoContainer>
            <ImportInfoTitle>מידע ייבוא</ImportInfoTitle>
            <ImportInfoContent>
                {JSON.stringify(importInfo, null, 2)}
            </ImportInfoContent>
        </ImportInfoContainer>
    );
}; 