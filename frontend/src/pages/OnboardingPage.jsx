/**
 * Botivate HR Support - HR Onboarding Dashboard
 * Multi-step wizard: Company Details → Policies → Database → Provision
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Button, Input, Textarea, Select, Card, Modal } from '../components/ui/Components';
import { companyAPI } from '../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineUpload, HiOutlineCheck } from 'react-icons/hi';

const STEPS = ['Company Details', 'Text Policies', 'Document Policies', 'Database', 'Provision'];

const DB_TYPE_OPTIONS = [
  { value: 'google_sheets', label: 'Google Sheets' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'supabase', label: 'Supabase' },
  { value: 'excel', label: 'Excel Sheets' },
];

export default function OnboardingPage({ isPublic = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState(user?.company_id || '');
  const [registrationDone, setRegistrationDone] = useState(false);

  // Step 1: Company
  const [company, setCompany] = useState({
    name: '', industry: '', hr_name: '', hr_email: '',
    hr_email_password: '', support_email: '', support_phone: '',
    support_whatsapp: '', support_message: '',
  });

  // Step 2: Text Policies
  const [textPolicies, setTextPolicies] = useState([{ title: '', description: '', content: '' }]);

  // Step 3: Doc Policies
  const [docFiles, setDocFiles] = useState([]);

  // Step 4: Database
  const [dbConfig, setDbConfig] = useState({
    title: 'Employee Database',
    description: 'Main employee data',
    db_type: 'google_sheets',
    spreadsheet_id: '',
    sheet_name: '',
  });

  const [dbConnectionId, setDbConnectionId] = useState('');

  // ── Step 1: Register Company ──────────────────────────

  const handleRegisterCompany = async () => {
    setLoading(true);
    try {
      const res = await companyAPI.register(company);
      setCompanyId(res.data.id);
      toast.success(`Company "${res.data.name}" registered! ID: ${res.data.id}`);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Add Text Policies ─────────────────────────

  const addTextPolicy = () => {
    setTextPolicies([...textPolicies, { title: '', description: '', content: '' }]);
  };

  const removeTextPolicy = (idx) => {
    setTextPolicies(textPolicies.filter((_, i) => i !== idx));
  };

  const updateTextPolicy = (idx, field, value) => {
    const updated = [...textPolicies];
    updated[idx][field] = value;
    setTextPolicies(updated);
  };

  const handleSaveTextPolicies = async () => {
    setLoading(true);
    try {
      for (const policy of textPolicies) {
        if (policy.title && policy.content) {
          await companyAPI.addTextPolicy(companyId, {
            title: policy.title,
            description: policy.description,
            policy_type: 'text',
            content: policy.content,
          });
        }
      }
      toast.success('Text policies saved!');
      setStep(2);
    } catch (err) {
      toast.error('Failed to save policies');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Upload Doc Policies ───────────────────────

  const handleFileChange = (e) => {
    setDocFiles([...docFiles, ...Array.from(e.target.files)]);
  };

  const handleUploadDocs = async () => {
    setLoading(true);
    try {
      for (const file of docFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        formData.append('description', '');
        await companyAPI.uploadDocPolicy(companyId, formData);
      }
      toast.success('Documents uploaded!');
      setStep(3);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: Connect Database ──────────────────────────

  const handleConnectDB = async () => {
    setLoading(true);
    try {
      const payload = {
        title: dbConfig.title,
        description: dbConfig.description,
        db_type: dbConfig.db_type,
        connection_config: {
          spreadsheet_id: dbConfig.spreadsheet_id,
          sheet_name: dbConfig.sheet_name || undefined,
        },
      };
      const res = await companyAPI.addDatabase(companyId, payload);
      setDbConnectionId(res.data.id);
      toast.success('Database connected & schema analyzed by AI!');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 5: Provision Employees ───────────────────────

  const handleProvision = async () => {
    setLoading(true);
    try {
      const res = await companyAPI.provisionEmployees(companyId, dbConnectionId);
      toast.success(
        `Done! ${res.data.passwords_generated} passwords generated, ${res.data.emails_sent} emails sent.`
      );
      setRegistrationDone(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Provisioning failed');
    } finally {
      setLoading(false);
    }
  };

  const Wrapper = isPublic ? ({ children }) => (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/login')}>
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-lg font-bold text-[var(--color-text-primary)]">
              Botivate <span className="text-[var(--color-primary)]">HR</span>
            </span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-[var(--color-primary)] hover:underline cursor-pointer"
          >
            ← Back to Login
          </button>
        </div>
      </div>
      {children}
    </div>
  ) : Layout;

  return (
    <Wrapper>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          {isPublic ? '🏢 Register Your Company' : 'Company Onboarding'}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          Set up your company in a few easy steps
        </p>

        {/* ── Step Indicator ──────────────────────────── */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300
                  ${i < step ? 'gradient-primary text-white' : ''}
                  ${i === step ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-glow)]' : ''}
                  ${i > step ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]' : ''}
                `}
              >
                {i < step ? <HiOutlineCheck className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap hidden sm:inline ${i === step ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step Content ────────────────────────────── */}
        <div className="animate-fadeInUp">

          {/* STEP 1: Company Details */}
          {step === 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Company Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Company Name" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} required />
                <Input label="Industry" value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })} />
                <Input label="HR Name" value={company.hr_name} onChange={(e) => setCompany({ ...company, hr_name: e.target.value })} required />
                <Input label="HR Email" type="email" value={company.hr_email} onChange={(e) => setCompany({ ...company, hr_email: e.target.value })} required />
                <Input label="HR Email Password (SMTP)" type="password" value={company.hr_email_password} onChange={(e) => setCompany({ ...company, hr_email_password: e.target.value })} />
                <Input label="Support Email" type="email" value={company.support_email} onChange={(e) => setCompany({ ...company, support_email: e.target.value })} />
                <Input label="Support Phone" value={company.support_phone} onChange={(e) => setCompany({ ...company, support_phone: e.target.value })} />
                <Input label="Support WhatsApp" value={company.support_whatsapp} onChange={(e) => setCompany({ ...company, support_whatsapp: e.target.value })} />
              </div>
              <Textarea label="Support Message" value={company.support_message} onChange={(e) => setCompany({ ...company, support_message: e.target.value })} placeholder="Message shown to employees who need help" className="mt-4" />
              <Button onClick={handleRegisterCompany} loading={loading} className="mt-6" fullWidth>
                Register Company & Continue
              </Button>
            </Card>
          )}

          {/* STEP 2: Text Policies */}
          {step === 1 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Text Policies & Rules</h2>
                <Button onClick={addTextPolicy} variant="secondary" size="sm" icon={<HiOutlinePlus />}>
                  Add Policy
                </Button>
              </div>
              <div className="space-y-6">
                {textPolicies.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] space-y-3 relative">
                    {textPolicies.length > 1 && (
                      <button onClick={() => removeTextPolicy(idx)} className="absolute top-3 right-3 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] cursor-pointer">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    )}
                    <Input label="Title" value={p.title} onChange={(e) => updateTextPolicy(idx, 'title', e.target.value)} placeholder="e.g. Leave Policy" required />
                    <Input label="Description" value={p.description} onChange={(e) => updateTextPolicy(idx, 'description', e.target.value)} placeholder="Brief description" />
                    <Textarea label="Policy Content" value={p.content} onChange={(e) => updateTextPolicy(idx, 'content', e.target.value)} placeholder="Write the full policy rules here..." rows={5} required />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setStep(0)} variant="secondary">Back</Button>
                <Button onClick={handleSaveTextPolicies} loading={loading} fullWidth>Save & Continue</Button>
              </div>
            </Card>
          )}

          {/* STEP 3: Document Policies */}
          {step === 2 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Upload Policy Documents</h2>
              <div
                className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center
                           hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                onClick={() => document.getElementById('doc-upload').click()}
              >
                <HiOutlineUpload className="w-10 h-10 mx-auto text-[var(--color-text-secondary)] mb-3" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Click or drag files here (PDF, DOC, DOCX)
                </p>
                <input id="doc-upload" type="file" multiple accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
              </div>
              {docFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {docFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)] px-3 py-2 rounded-lg">
                      <span>📄</span>
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {(file.size / 1024).toFixed(1)}KB
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setStep(1)} variant="secondary">Back</Button>
                <Button onClick={handleUploadDocs} loading={loading} fullWidth>
                  {docFiles.length > 0 ? 'Upload & Continue' : 'Skip & Continue'}
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 4: Database Connection */}
          {step === 3 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Connect Employee Database</h2>
              <div className="space-y-4">
                <Input label="Connection Title" value={dbConfig.title} onChange={(e) => setDbConfig({ ...dbConfig, title: e.target.value })} />
                <Select
                  label="Database Type"
                  value={dbConfig.db_type}
                  onChange={(e) => setDbConfig({ ...dbConfig, db_type: e.target.value })}
                  options={DB_TYPE_OPTIONS}
                />
                {dbConfig.db_type === 'google_sheets' && (
                  <>
                    <Input label="Google Sheet ID" value={dbConfig.spreadsheet_id} onChange={(e) => setDbConfig({ ...dbConfig, spreadsheet_id: e.target.value })} placeholder="From the Sheet URL" required />
                    <Input label="Sheet Name (optional)" value={dbConfig.sheet_name} onChange={(e) => setDbConfig({ ...dbConfig, sheet_name: e.target.value })} placeholder="Default: first sheet" />
                  </>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-4 bg-[var(--color-surface-secondary)] p-3 rounded-lg">
                🤖 AI will automatically analyze the column headers and identify employee fields — no manual mapping required.
              </p>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setStep(2)} variant="secondary">Back</Button>
                <Button onClick={handleConnectDB} loading={loading} fullWidth>Connect & Analyze</Button>
              </div>
            </Card>
          )}

          {/* STEP 5: Provision */}
          {step === 4 && (
            <Card className="text-center">
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4">
                <HiOutlineCheck className="w-8 h-8 text-white" />
              </div>
              {!registrationDone ? (
                <>
                  <h2 className="text-xl font-bold mb-2">Almost Done!</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
                    Ready to auto-generate passwords for all employees and send them their login credentials via email.
                  </p>
                  <Button onClick={handleProvision} loading={loading} size="lg" fullWidth variant="accent">
                    🚀 Generate Passwords & Send Emails
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-2 text-green-600">🎉 Registration Complete!</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4 max-w-md mx-auto">
                    Your company has been successfully registered. Passwords have been generated and emails have been sent to all employees.
                  </p>
                </>  
              )}
              <div className="mt-4 p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">Your Company ID</p>
                <p className="text-2xl font-bold text-[var(--color-primary)] font-mono tracking-wider select-all">{companyId}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">⚠️ Save this ID! Employees will need it to log in.</p>
              </div>
              {isPublic && (
                <Button onClick={() => navigate('/login')} size="lg" fullWidth className="mt-6">
                  Go to Login →
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
