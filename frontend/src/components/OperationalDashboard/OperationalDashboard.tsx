import React from 'react';
import ChatInterface from '../ChatInterface/ChatInterface';
import DisasterMap from '../DisasterMap/DisasterMap';

const OperationalDashboard: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-1/3 p-4">
        <ChatInterface />
      </div>
      <div className="w-2/3 p-4">
        <DisasterMap />
      </div>
    </div>
  );
};

export default OperationalDashboard;
