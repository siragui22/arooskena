'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, Plus, Clock, MapPin, Phone, User,
  Edit2, Trash2, X, Check, AlertCircle, Calendar
} from 'lucide-react';

export default function TimelinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wedding, setWedding] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    scheduled_time: '',
    duration_minutes: 30,
    location: '',
    contact_person: '',
    contact_phone: '',
    notes: ''
  });

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    setLoading(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/sign-in');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (!userData) return;

    const { data: weddingData } = await supabase
      .from('weddings')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'planification')
      .single();

    if (weddingData) {
      setWedding(weddingData);

      const { data: milestonesData } = await supabase
        .from('wedding_milestones')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('scheduled_time', { ascending: true, nullsFirst: false });

      setMilestones(milestonesData || []);
    }

    setLoading(false);
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();

    const dataToInsert = {
      wedding_id: wedding.id,
      ...milestoneForm,
      duration_minutes: parseInt(milestoneForm.duration_minutes) || 30
    };

    if (editingMilestone) {
      // Update
      const { error } = await supabase
        .from('wedding_milestones')
        .update(dataToInsert)
        .eq('id', editingMilestone.id);

      if (error) {
        alert('Erreur lors de la modification');
        return;
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('wedding_milestones')
        .insert([dataToInsert]);

      if (error) {
        alert('Erreur lors de l\'ajout');
        return;
      }
    }

    setShowAddModal(false);
    setEditingMilestone(null);
    setMilestoneForm({
      title: '',
      description: '',
      scheduled_time: '',
      duration_minutes: 30,
      location: '',
      contact_person: '',
      contact_phone: '',
      notes: ''
    });
    fetchTimelineData();
  };

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      title: milestone.title || '',
      description: milestone.description || '',
      scheduled_time: milestone.scheduled_time || '',
      duration_minutes: milestone.duration_minutes || 30,
      location: milestone.location || '',
      contact_person: milestone.contact_person || '',
      contact_phone: milestone.contact_phone || '',
      notes: milestone.notes || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteMilestone = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    const { error } = await supabase
      .from('wedding_milestones')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchTimelineData();
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    return milestones.reduce((sum, m) => sum + (m.duration_minutes || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Aucun mariage trouvé</p>
          <button
            onClick={() => router.push('/dashboard-wedding/new')}
            className="px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full"
          >
            Créer un mariage
          </button>
        </div>
      </div>
    );
  }

  const totalDuration = getTotalDuration();

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard-wedding')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Retour au dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Timeline du Jour J
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                <span className="block sm:inline">{wedding.title}</span>
                {wedding.date && (
                  <>
                    <span className="hidden sm:inline"> • </span>
                    <span className="block sm:inline">📅 {new Date(wedding.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Plus size={20} />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-pink-500" size={20} />
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600">Événements</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{milestones.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-blue-500" size={20} />
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600">Durée totale</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {Math.floor(totalDuration / 60)}h{totalDuration % 60 > 0 && `${totalDuration % 60}m`}
            </p>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-orange-500" size={20} />
              <h3 className="text-xs sm:text-sm font-semibold text-gray-600">Dernier événement</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {milestones.length > 0 && milestones[milestones.length - 1]?.scheduled_time
                ? formatTime(milestones[milestones.length - 1].scheduled_time)
                : '--:--'}
            </p>
          </div>
        </div>

        {/* Timeline */}
        {milestones.length > 0 ? (
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative">
                {/* Connector Line (except for last item) */}
                {index < milestones.length - 1 && (
                  <div className="absolute left-6 top-20 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 to-orange-200 transform translate-y-4 hidden sm:block" />
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all">
                  <div className="flex gap-4">
                    {/* Time Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-pink-400 to-orange-300 flex items-center justify-center text-white font-bold shadow-md">
                        <div className="text-center">
                          <div className="text-xs sm:text-sm">{formatTime(milestone.scheduled_time)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{milestone.title}</h3>
                          {milestone.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">{milestone.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditMilestone(milestone)}
                            className="p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-all"
                          >
                            <Edit2 size={16} className="sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg text-red-600 transition-all"
                          >
                            <Trash2 size={16} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {milestone.duration_minutes} min
                          {milestone.scheduled_time && (
                            <span className="text-gray-400">
                              → {calculateEndTime(milestone.scheduled_time, milestone.duration_minutes || 0)}
                            </span>
                          )}
                        </span>
                        {milestone.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} />
                            {milestone.location}
                          </span>
                        )}
                        {milestone.contact_person && (
                          <span className="flex items-center gap-1.5">
                            <User size={14} />
                            {milestone.contact_person}
                          </span>
                        )}
                        {milestone.contact_phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone size={14} />
                            {milestone.contact_phone}
                          </span>
                        )}
                      </div>

                      {milestone.notes && (
                        <div className="mt-3 p-3 bg-pink-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-700">{milestone.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 sm:p-16 text-center">
            <Clock className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Aucun événement planifié</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Créez votre timeline du jour J en ajoutant vos premiers événements
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter un événement
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 my-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingMilestone ? 'Modifier l\'événement' : 'Ajouter un événement'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMilestone(null);
                  setMilestoneForm({
                    title: '',
                    description: '',
                    scheduled_time: '',
                    duration_minutes: 30,
                    location: '',
                    contact_person: '',
                    contact_phone: '',
                    notes: ''
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Titre de l'événement *
                  </label>
                  <input
                    type="text"
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    placeholder="ex: Cérémonie civile"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Heure *
                  </label>
                  <input
                    type="time"
                    value={milestoneForm.scheduled_time}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, scheduled_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    value={milestoneForm.duration_minutes}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, duration_minutes: e.target.value })}
                    placeholder="30"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                    placeholder="Détails de l'événement..."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Lieu
                  </label>
                  <input
                    type="text"
                    value={milestoneForm.location}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, location: e.target.value })}
                    placeholder="ex: Mairie de Djibouti"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Personne de contact
                  </label>
                  <input
                    type="text"
                    value={milestoneForm.contact_person}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, contact_person: e.target.value })}
                    placeholder="Nom du contact"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Téléphone de contact
                  </label>
                  <input
                    type="tel"
                    value={milestoneForm.contact_phone}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, contact_phone: e.target.value })}
                    placeholder="+253 XX XX XX XX"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={milestoneForm.notes}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                    placeholder="Notes supplémentaires..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMilestone(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {editingMilestone ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
