import type { Deal, DealFormData } from '../../types';
import Modal from '../common/Modal';
import DealForm from './DealForm';

interface DealFormModalProps {
  isOpen: boolean;
  deal?: Deal;
  departments: string[];
  salesPersons: string[];
  presetDepartment?: string;
  onClose: () => void;
  onSubmit: (data: DealFormData) => void;
  onDelete?: (id: string) => void;
}

export default function DealFormModal({
  isOpen,
  deal,
  departments,
  salesPersons,
  presetDepartment,
  onClose,
  onSubmit,
  onDelete,
}: DealFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={deal ? '案件編集' : '案件登録'}
    >
      <DealForm
        initialData={deal}
        departments={departments}
        salesPersons={salesPersons}
        presetDepartment={presetDepartment}
        onSubmit={(data) => {
          onSubmit(data);
          onClose();
        }}
        onCancel={onClose}
        onDelete={
          deal && onDelete
            ? () => {
                onDelete(deal.id);
                onClose();
              }
            : undefined
        }
      />
    </Modal>
  );
}
