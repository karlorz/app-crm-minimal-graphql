import React from "react";
import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export const HelloWorldPage = () => {
  return (
    <div className="page-container">
      <Card>
        <Title level={2}>Hello World</Title>
        <Paragraph>
          Welcome to the Hello World page! This is a simple component integrated into the Refine CRM application.
        </Paragraph>
      </Card>
    </div>
  );
};