/**
 * Botivate HR Support - Support Card Component
 * Shows company-specific support info. Never hardcoded.
 */

import { useState, useEffect } from 'react';
import { companyAPI } from '../api';
import { Card } from './ui/Components';
import { HiOutlineMail, HiOutlinePhone, HiOutlineChat } from 'react-icons/hi';

export default function SupportCard({ companyId, alwaysVisible = false }) {
  const [support, setSupport] = useState(null);
  const [isOpen, setIsOpen] = useState(alwaysVisible);

  useEffect(() => {
    if (companyId) {
      companyAPI.getSupport(companyId)
        .then((res) => setSupport(res.data))
        .catch(() => {});
    }
  }, [companyId]);

  if (!support && !alwaysVisible) return null;

  return (
    <div className="animate-fadeInUp">
      {!alwaysVisible && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-[var(--color-primary)] hover:underline cursor-pointer mb-2"
        >
          {isOpen ? 'Hide Support Info' : 'Need Help? Contact Support'}
        </button>
      )}

      {isOpen && support && (
        <Card className="border-l-4 border-l-[var(--color-primary)]">
          <h4 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3">
            {support.company_name} — Support
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            {support.support_message || 'If you face any issue, contact your company support.'}
          </p>

          <div className="space-y-2">
            {support.support_email && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <HiOutlineMail className="w-4 h-4 text-[var(--color-primary)]" />
                <a href={`mailto:${support.support_email}`} className="hover:text-[var(--color-primary)]">
                  {support.support_email}
                </a>
              </div>
            )}
            {support.support_phone && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <HiOutlinePhone className="w-4 h-4 text-[var(--color-primary)]" />
                <span>{support.support_phone}</span>
              </div>
            )}
            {support.support_whatsapp && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <HiOutlineChat className="w-4 h-4 text-[var(--color-accent)]" />
                <span>{support.support_whatsapp}</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
