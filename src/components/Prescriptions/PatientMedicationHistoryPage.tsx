import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { HeartPulse, ShieldAlert, History, Pill, Plus } from 'lucide-react';

export const PatientMedicationHistoryPage: React.FC<{ patientId?: string }> = ({ patientId = 'demo-patient-1' }) => {
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [allergyForm, setAllergyForm] = useState({
    allergen: '',
    allergen_type: 'INGREDIENT',
    severity: 'MODERATE',
    reaction_text: '',
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients/${patientId}/medication-history`);
      setHistory(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch patient medication history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/patients/${patientId}/allergies`, allergyForm);
      setShowAllergyModal(false);
      setAllergyForm({ allergen: '', allergen_type: 'INGREDIENT', severity: 'MODERATE', reaction_text: '' });
      fetchHistory();
    } catch (err) {
      console.error('Failed to record allergy', err);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted">Loading patient medication history...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-muted tracking-tight flex items-center gap-2">
            <HeartPulse className="w-7 h-7 text-danger" />
            Medication history
          </h1>
          <p className="text-muted text-sm mt-1">
            Patient: <span className="font-semibold text-muted">{history?.patientName}</span> | Complete dispensing timeline and allergy alerts.
          </p>
        </div>
        <Button onClick={() => setShowAllergyModal(true)} className="flex items-center gap-2 bg-danger hover:bg-danger text-on-primary">
          <Plus className="w-4 h-4" /> Record Patient Allergy
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-danger/25">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-muted uppercase font-semibold">Recorded Allergies</span>
              <div className="text-2xl font-bold text-muted mt-1">{history?.allergies?.length || 0}</div>
            </div>
            <ShieldAlert className="w-6 h-6 text-danger" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-primary/25">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-muted uppercase font-semibold">Active Medications (60 Days)</span>
              <div className="text-2xl font-bold text-muted mt-1">{history?.activeMedications?.length || 0}</div>
            </div>
            <Pill className="w-6 h-6 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-success/25">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-muted uppercase font-semibold">Total Dispensing Events</span>
              <div className="text-2xl font-bold text-muted mt-1">{history?.dispensingTimeline?.length || 0}</div>
            </div>
            <History className="w-6 h-6 text-success" />
          </div>
        </Card>
      </div>

      {/* Allergies Banner */}
      {history?.allergies?.length > 0 && (
        <Card className="p-4 bg-danger/8 border border-danger/25 space-y-2">
          <h3 className="font-bold text-danger text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger" /> Active Recorded Patient Allergies
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.allergies.map((alg: any) => (
              <span key={alg.id || alg._local_id} className="bg-danger/8 text-danger text-xs px-2.5 py-1 rounded-md font-semibold border border-danger/25">
                {alg.allergen} ({alg.severity})
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Active Medications List */}
      <Card className="p-5 space-y-4">
        <h3 className="font-bold text-muted text-base flex items-center gap-2">
          <Pill className="w-5 h-5 text-primary" /> Active Medications
        </h3>
        {history?.activeMedications?.length === 0 ? (
          <p className="text-xs text-muted">No active recorded medications in recent 60 days.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {history.activeMedications.map((med: any) => (
              <div key={med.medicineId} className="p-3 bg-surface-alt border border-border rounded-lg text-xs space-y-1">
                <div className="font-bold text-muted text-sm">{med.medicineName}</div>
                <div className="text-muted">Last Dispensed: {new Date(med.lastDispensedAt).toLocaleDateString()}</div>
                <div className="text-muted italic font-mono">{med.sourceLabel}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Allergy Modal */}
      {showAllergyModal && (
        <Modal isOpen={showAllergyModal} onClose={() => setShowAllergyModal(false)} title="Record Patient Allergy">
          <form onSubmit={handleAddAllergy} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Allergen (Substance / Ingredient)</label>
              <Input
                required
                value={allergyForm.allergen}
                onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
                placeholder="e.g. Sulfa, Penicillin, Paracetamol"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Allergen Type</label>
                <select
                  className="w-full border border-border rounded p-2 text-sm bg-surface"
                  value={allergyForm.allergen_type}
                  onChange={(e) => setAllergyForm({ ...allergyForm, allergen_type: e.target.value })}
                >
                  <option value="INGREDIENT">Active Ingredient</option>
                  <option value="DRUG_CLASS">Drug Class</option>
                  <option value="FOOD">Food / Excipient</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Severity</label>
                <select
                  className="w-full border border-border rounded p-2 text-sm bg-surface"
                  value={allergyForm.severity}
                  onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })}
                >
                  <option value="MILD">Mild</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                  <option value="ANAPHYLAXIS">Anaphylaxis</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowAllergyModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-danger hover:bg-danger text-on-primary">Save Allergy</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
