'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, Plus, Trash2, Check, Calendar, 
  AlertCircle, Search, CheckCircle, Clock,
  Users as UsersIcon, Building, X
} from 'lucide-react';

export default function TasksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wedding, setWedding] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  const [lieux, setLieux] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [prestataireSearch, setPrestataireSearch] = useState('');
  const [lieuSearch, setLieuSearch] = useState('');
  const [showPrestataireSuggestions, setShowPrestataireSuggestions] = useState(false);
  const [showLieuSuggestions, setShowLieuSuggestions] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    task_type: 'general',
    priority: 'moyenne',
    status: 'a_faire',
    due_date: '',
    estimated_cost: '',
    prestataire_id: '',
    lieu_reception_id: '',
    budget_category_id: '',
    notes: ''
  });

  const fetchTasksData = useCallback(async () => {
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

      // Fetch tasks simplement d'abord pour debug
      const { data: tasksData, error: tasksError } = await supabase
        .from('wedding_tasks')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      console.log('Tasks data:', tasksData);
      console.log('Tasks error:', tasksError);

      // Récupérer tous les prestataires et lieux
      const { data: prestatairesData } = await supabase
        .from('prestataires')
        .select('id, nom_entreprise')
        .order('nom_entreprise');

      const { data: lieuxData } = await supabase
        .from('lieux_reception')
        .select('id, nom')
        .order('nom');

      setPrestataires(prestatairesData || []);
      setLieux(lieuxData || []);

      // Enrichir les tâches manuellement
      const enrichedTasks = (tasksData || []).map(task => {
        const enriched = { ...task };
        
        if (task.prestataire_id && prestatairesData) {
          const prest = prestatairesData.find(p => p.id === task.prestataire_id);
          if (prest) {
            enriched.prestataires = { nom_entreprise: prest.nom_entreprise };
          }
        }
        
        if (task.lieu_reception_id && lieuxData) {
          const lieu = lieuxData.find(l => l.id === task.lieu_reception_id);
          if (lieu) {
            enriched.lieux_reception = { nom: lieu.nom };
          }
        }
        
        return enriched;
      });
      
      setTasks(enrichedTasks);

      const { data: categoriesData } = await supabase
        .from('wedding_budget_categories')
        .select('*')
        .eq('wedding_id', weddingData.id);

      setBudgetCategories(categoriesData || []);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  const handleAddTask = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from('wedding_tasks')
      .insert([{
        wedding_id: wedding.id,
        title: taskForm.title,
        description: taskForm.description,
        task_type: taskForm.task_type,
        priority: taskForm.priority,
        status: taskForm.status,
        due_date: taskForm.due_date || null,
        estimated_cost: taskForm.estimated_cost ? parseFloat(taskForm.estimated_cost) : null,
        prestataire_id: taskForm.prestataire_id || null,
        lieu_reception_id: taskForm.lieu_reception_id || null,
        budget_category_id: taskForm.budget_category_id || null,
        notes: taskForm.notes
      }]);

    if (error) {
      alert('Erreur lors de l\'ajout de la tâche');
      return;
    }

    setShowAddTask(false);
    setTaskForm({
      title: '',
      description: '',
      task_type: 'general',
      priority: 'moyenne',
      status: 'a_faire',
      due_date: '',
      estimated_cost: '',
      prestataire_id: '',
      lieu_reception_id: '',
      budget_category_id: '',
      notes: ''
    });
    setPrestataireSearch('');
    setLieuSearch('');
    fetchTasksData();
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    const updateData: any = { status: newStatus };
    if (newStatus === 'termine') {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from('wedding_tasks')
      .update(updateData)
      .eq('id', taskId);

    if (!error) {
      // Mise à jour locale sans recharger toute la page
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, completed_at: updateData.completed_at }
            : task
        )
      );
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    const { error } = await supabase
      .from('wedding_tasks')
      .delete()
      .eq('id', taskId);

    if (!error) {
      fetchTasksData();
    }
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

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'termine').length;
  const inProgressTasks = tasks.filter(t => t.status === 'en_cours').length;
  const todoTasks = tasks.filter(t => t.status === 'a_faire').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'termine') return false;
    return new Date(t.due_date) < new Date();
  }).length;

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard-wedding')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Retour au dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Tâches du mariage</h1>
              <p className="text-gray-600">{wedding.title}</p>
            </div>
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Nouvelle tâche
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <span className="text-sm font-semibold text-gray-600 block mb-2">Total</span>
            <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <span className="text-sm font-semibold text-gray-600 block mb-2">À faire</span>
            <p className="text-2xl font-bold text-gray-900">{todoTasks}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <span className="text-sm font-semibold text-gray-600 block mb-2">En cours</span>
            <p className="text-2xl font-bold text-blue-600">{inProgressTasks}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <span className="text-sm font-semibold text-gray-600 block mb-2">Terminées</span>
            <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <span className="text-sm font-semibold text-gray-600 block mb-2">En retard</span>
            <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              <option value="all">Tous les statuts</option>
              <option value="a_faire">À faire</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminées</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              <option value="all">Toutes les priorités</option>
              <option value="critique">Critique</option>
              <option value="haute">Haute</option>
              <option value="moyenne">Moyenne</option>
              <option value="basse">Basse</option>
            </select>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const isOverdue = task.due_date && task.status !== 'termine' && new Date(task.due_date) < new Date();
              
              return (
                <div 
                  key={task.id}
                  className={`bg-white rounded-2xl shadow-sm border p-6 ${
                    task.status === 'termine' ? 'border-green-200' : isOverdue ? 'border-red-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-bold text-lg ${task.status === 'termine' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'critique' ? 'bg-red-100 text-red-700' :
                          task.priority === 'haute' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'moyenne' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority === 'critique' ? 'Critique' :
                           task.priority === 'haute' ? 'Haute' :
                           task.priority === 'moyenne' ? 'Moyenne' : 'Basse'}
                        </span>
                      </div>

                      {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 font-medium">Statut:</span>
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-pink-300 ${
                              task.status === 'termine' 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : task.status === 'en_cours'
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <option value="a_faire">À faire</option>
                            <option value="en_cours">En cours</option>
                            <option value="termine">Terminée</option>
                          </select>
                        </div>
                        {task.due_date && (
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                            📅 {new Date(task.due_date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {task.prestataires && <span>👥 {task.prestataires.nom_entreprise}</span>}
                        {task.lieux_reception && <span>🏛️ {task.lieux_reception.nom}</span>}
                        {task.estimated_cost && <span className="font-semibold">💰 {task.estimated_cost.toLocaleString()} DJF</span>}
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucune tâche trouvée</p>
              <button
                onClick={() => setShowAddTask(true)}
                className="px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-full"
              >
                Créer une tâche
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showAddTask && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPrestataireSuggestions(false);
              setShowLieuSuggestions(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-6">
              <h3 className="text-2xl font-bold">Créer une tâche</h3>
              <button onClick={() => setShowAddTask(false)}><X size={24} /></button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Titre de la tâche *
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="ex: Réserver le photographe"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Détails de la tâche..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Type de tâche *
                  </label>
                  <select 
                    value={taskForm.task_type} 
                    onChange={(e) => {
                      setTaskForm({...taskForm, task_type: e.target.value, prestataire_id: '', lieu_reception_id: ''});
                      setPrestataireSearch('');
                      setLieuSearch('');
                    }} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="general">Général</option>
                    <option value="prestataire">Prestataire</option>
                    <option value="lieu">Lieu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Priorité *
                  </label>
                  <select 
                    value={taskForm.priority} 
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="basse">Basse</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="haute">Haute</option>
                    <option value="critique">Critique</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Date d&apos;échéance
                  </label>
                  <input 
                    type="date" 
                    value={taskForm.due_date} 
                    onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Coût estimé (DJF)
                  </label>
                  <input 
                    type="number" 
                    value={taskForm.estimated_cost} 
                    onChange={(e) => setTaskForm({...taskForm, estimated_cost: e.target.value})} 
                    placeholder="0" 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300" 
                  />
                </div>
              </div>
              {taskForm.task_type === 'prestataire' && (
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Rechercher un prestataire
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={prestataireSearch}
                      onChange={(e) => {
                        setPrestataireSearch(e.target.value);
                        setShowPrestataireSuggestions(true);
                      }}
                      onFocus={() => setShowPrestataireSuggestions(true)}
                      placeholder="Tapez le nom d'un prestataire..."
                      className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                    {prestataireSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setPrestataireSearch('');
                          setTaskForm({...taskForm, prestataire_id: ''});
                          setShowPrestataireSuggestions(false);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {showPrestataireSuggestions && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {prestataires
                        .filter(p => p.nom_entreprise.toLowerCase().includes(prestataireSearch.toLowerCase()))
                        .map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setTaskForm({...taskForm, prestataire_id: p.id});
                              setPrestataireSearch(p.nom_entreprise);
                              setShowPrestataireSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <p className="font-medium text-gray-900">{p.nom_entreprise}</p>
                          </button>
                        ))
                      }
                      {prestataires.filter(p => p.nom_entreprise.toLowerCase().includes(prestataireSearch.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          Aucun prestataire trouvé
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {taskForm.task_type === 'lieu' && (
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Rechercher un lieu de réception
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lieuSearch}
                      onChange={(e) => {
                        setLieuSearch(e.target.value);
                        setShowLieuSuggestions(true);
                      }}
                      onFocus={() => setShowLieuSuggestions(true)}
                      placeholder="Tapez le nom d'un lieu..."
                      className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                    {lieuSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setLieuSearch('');
                          setTaskForm({...taskForm, lieu_reception_id: ''});
                          setShowLieuSuggestions(false);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {showLieuSuggestions && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {lieux
                        .filter(l => l.nom.toLowerCase().includes(lieuSearch.toLowerCase()))
                        .map(l => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setTaskForm({...taskForm, lieu_reception_id: l.id});
                              setLieuSearch(l.nom);
                              setShowLieuSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <p className="font-medium text-gray-900">{l.nom}</p>
                          </button>
                        ))
                      }
                      {lieux.filter(l => l.nom.toLowerCase().includes(lieuSearch.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          Aucun lieu trouvé
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notes supplémentaires
                </label>
                <textarea 
                  value={taskForm.notes} 
                  onChange={(e) => setTaskForm({...taskForm, notes: e.target.value})} 
                  placeholder="Ajoutez des notes ou rappels..." 
                  rows={2} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300" 
                />
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddTask(false)} className="flex-1 px-6 py-3 bg-gray-100 rounded-full">Annuler</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-orange-300 text-white rounded-full">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
