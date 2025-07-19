import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, Clock, Trash2, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { 
  getAvailableDates, 
  createAvailableDate, 
  getServiceAvailability, 
  createServiceAvailability, 
  updateServiceAvailability, 
  deleteServiceAvailability,
  getAvailableTimes,
  deleteAvailableTime,
  createAvailableTime
} from '../lib/localStorage';
import { Service } from '../types';

interface ServiceAvailabilityManagerProps {
  onClose: () => void;
  services: Service[];
}

const ServiceAvailabilityManager = ({ onClose, services }: ServiceAvailabilityManagerProps) => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serviceAvailability, setServiceAvailability] = useState<Array<{ 
    id: string; 
    time: string; 
    is_available: boolean;
    service_name: string;
  }>>([]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchServiceAvailability();
    }
  }, [selectedService, selectedDate]);

  const fetchServiceAvailability = async () => {
    try {
      const { data: allDates } = await getAvailableDates();
      const dateData = allDates?.find(d => d.date === selectedDate);

      if (dateData) {
        const { data: availability } = await getServiceAvailability(selectedService, dateData.id);
        const serviceName = services.find(s => s.id === selectedService)?.name || '';

        setServiceAvailability((availability || []).map(item => ({
          id: item.id,
          time: item.time,
          is_available: item.is_available,
          service_name: serviceName
        })).sort((a, b) => a.time.localeCompare(b.time)));
      } else {
        setServiceAvailability([]);
      }
    } catch (err) {
      console.error('Error fetching service availability:', err);
      setServiceAvailability([]);
    }
  };

  const removeFromGeneralAvailability = async (dateId: string, timeToRemove: string) => {
    try {
      // Get general times for this date
      const { data: generalTimes } = await getAvailableTimes(dateId);
      const generalTime = generalTimes?.find(gt => gt.time === timeToRemove);

      if (generalTime) {
        // Remove from general availability
        const { error: deleteError } = await deleteAvailableTime(generalTime.id);

        if (deleteError) {
          console.error('Error removing from general availability:', deleteError);
        } else {
          setSuccess(`Horário ${timeToRemove} removido dos horários gerais automaticamente`);
        }
      }
    } catch (err) {
      console.error('Error removing from general availability:', err);
    }
  };

  const handleAddTime = async () => {
    if (!selectedService || !selectedDate || !time) {
      setError('Selecione um serviço, data e horário');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get or create the date entry
      const { data: allDates } = await getAvailableDates();
      let dateData = allDates?.find(d => d.date === selectedDate);

      if (!dateData) {
        const { data: newDate, error: dateError } = await createAvailableDate(selectedDate);

        if (dateError) throw dateError;
        dateData = newDate;
      }

      if (!dateData) {
        throw new Error('Erro ao criar/obter data');
      }

      // Add the new time for the service
      try {
        await createServiceAvailability({
          service_id: selectedService,
          date_id: dateData.id,
          time,
          is_available: true
        });
      } catch (timeError: any) {
        if (timeError.message.includes('já está cadastrado')) {
          setError('Este horário já está cadastrado para este serviço');
          return;
        }
        throw timeError;
      }

      // Remove this time from general availability
      await removeFromGeneralAvailability(dateData.id, time);

      await fetchServiceAvailability();
      setTime('');
      setSuccess('Horário adicionado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar horário');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTime = async (timeId: string, timeValue: string) => {
    if (!confirm('Tem certeza que deseja remover este horário? Ele será adicionado de volta aos horários gerais.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Remove from service availability
      await deleteServiceAvailability(timeId);

      // Add back to general availability
      const { data: allDates } = await getAvailableDates();
      const dateData = allDates?.find(d => d.date === selectedDate);

      if (dateData) {
        // Check if it already exists in general availability
        const { data: generalTimes } = await getAvailableTimes(dateData.id);
        const existingGeneral = generalTimes?.find(gt => gt.time === timeValue);

        if (!existingGeneral) {
          // Add back to general availability
          await createAvailableTime({
            date_id: dateData.id,
            time: timeValue,
            is_available: true
          });
        }
      }

      await fetchServiceAvailability();
      setSuccess('Horário removido e adicionado de volta aos horários gerais');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover horário');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (timeId: string, currentAvailability: boolean) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const { error: updateError } = await updateServiceAvailability(timeId, {
        is_available: !currentAvailability
      });

      if (updateError) throw updateError;

      await fetchServiceAvailability();
      setSuccess(`Horário ${!currentAvailability ? 'ativado' : 'desativado'} com sucesso`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar disponibilidade');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const selectedServiceName = services.find(s => s.id === selectedService)?.name || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Horários por Serviço</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alert about automatic removal */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Importante</h4>
              <p className="text-blue-800 text-sm mt-1">
                Quando você adiciona um horário específico para um serviço, ele é automaticamente removido dos horários gerais. 
                Ao remover um horário específico, ele volta para os horários gerais.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 text-green-600 p-3 rounded-md text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serviço
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
              required
            >
              <option value="">Selecione um serviço</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - R$ {service.price} ({service.duration})
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getTodayDate()}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                required
              />
            </div>
            {selectedDate && (
              <p className="mt-1 text-sm text-gray-600">
                Data selecionada: {formatDateForDisplay(selectedDate)}
              </p>
            )}
          </div>

          {/* Time Addition */}
          {selectedService && selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adicionar Horário para {selectedServiceName}
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                  />
                </div>
                <button
                  onClick={handleAddTime}
                  disabled={loading || !selectedService || !selectedDate || !time}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Service Availability Display */}
          {selectedService && selectedDate && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Horários para {selectedServiceName} em {formatDateForDisplay(selectedDate)}
              </h4>
              
              {serviceAvailability.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Available Times */}
                  <div>
                    <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Disponíveis ({serviceAvailability.filter(t => t.is_available).length})
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {serviceAvailability
                        .filter(t => t.is_available)
                        .map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between bg-green-50 p-3 rounded-md border border-green-200"
                          >
                            <span className="text-sm font-medium text-green-800">{t.time}</span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleToggleAvailability(t.id, t.is_available)}
                                className="text-orange-600 hover:text-orange-700"
                                title="Marcar como indisponível"
                                disabled={loading}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveTime(t.id, t.time)}
                                className="text-red-600 hover:text-red-700"
                                title="Remover horário"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      {serviceAvailability.filter(t => t.is_available).length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-md">
                          Nenhum horário disponível
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Unavailable Times */}
                  <div>
                    <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Indisponíveis ({serviceAvailability.filter(t => !t.is_available).length})
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {serviceAvailability
                        .filter(t => !t.is_available)
                        .map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between bg-red-50 p-3 rounded-md border border-red-200"
                          >
                            <span className="text-sm font-medium text-red-800">{t.time}</span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleToggleAvailability(t.id, t.is_available)}
                                className="text-green-600 hover:text-green-700"
                                title="Marcar como disponível"
                                disabled={loading}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveTime(t.id, t.time)}
                                className="text-red-600 hover:text-red-700"
                                title="Remover horário"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      {serviceAvailability.filter(t => !t.is_available).length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-md">
                          Nenhum horário indisponível
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum horário configurado para este serviço nesta data
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Adicione horários usando o formulário acima
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceAvailabilityManager;