/**
 * Botivate HR Support - Login Page
 * Single Entry Point: Role + Company ID + Employee ID + Password
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select, Card } from '../components/ui/Components';
import SupportCard from '../components/SupportCard';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'ceo', label: 'CEO' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [form, setForm] = useState({
    role: 'employee',
    company_id: '',
    employee_id: '',
    password: '',
  });

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(form);
      toast.success(`Welcome, ${userData.employee_name}!`);
      if (form.role === 'hr' || form.role === 'admin') {
        navigate('/onboarding');
      } else {
        navigate('/chat');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials.';
      toast.error(msg);
      setShowSupport(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-[var(--shadow-glow)]">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Botivate <span className="text-gradient">HR Support</span>
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Sign in to your HR portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Role"
              value={form.role}
              onChange={handleChange('role')}
              options={ROLE_OPTIONS}
              required
            />

            <Input
              label="Company ID"
              value={form.company_id}
              onChange={handleChange('company_id')}
              placeholder="Enter your Company ID"
              required
            />

            <Input
              label="Employee ID"
              value={form.employee_id}
              onChange={handleChange('employee_id')}
              placeholder="Enter your Employee ID"
              required
            />

            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="Enter your password"
              required
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              variant="primary"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          {/* Support Link */}
          <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
            <SupportCard companyId={form.company_id} alwaysVisible={showSupport} />
            {!showSupport && (
              <button
                onClick={() => setShowSupport(true)}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              >
                Forgot password or need help? →
              </button>
            )}
          </div>
        </Card>

        {/* Register New Company */}
        <div className="mt-6 text-center animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            Want to onboard your company?
          </p>
          <Button
            onClick={() => navigate('/register')}
            variant="secondary"
            fullWidth
            size="md"
          >
            🏢 Register New Company
          </Button>
        </div>
      </div>
    </div>
  );
}
