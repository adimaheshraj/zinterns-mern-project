import React, { useState } from 'react';
import EmployeeDirectory from '../components/org/EmployeeDirectory';
import AddEmployeeModal from '../components/org/AddEmployeeModal';
import EmployeeProfileDrawer from '../components/org/EmployeeProfileDrawer';

export default function DirectoryPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);

  return (
    <div className="space-y-6">
      <EmployeeDirectory
        onOpenAddEmployee={() => setIsAddModalOpen(true)}
        onSelectEmployee={(empId) => setSelectedEmpId(empId)}
      />

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={() => {
          // Re-trigger directory reload if needed
        }}
      />

      <EmployeeProfileDrawer
        isOpen={!!selectedEmpId}
        employeeId={selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
      />
    </div>
  );
}
