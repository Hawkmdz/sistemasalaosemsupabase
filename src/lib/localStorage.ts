// Local storage utilities for managing data without Supabase
import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  user_metadata?: {
    role?: UserRole;
    needsProfile?: boolean;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_name: string;
  service_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface AvailableDate {
  id: string;
  date: string;
  created_at: string;
}

export interface AvailableTime {
  id: string;
  date_id: string;
  time: string;
  is_available: boolean;
  created_at: string;
}

export interface ServiceAvailability {
  id: string;
  service_id: string;
  date_id: string;
  time: string;
  is_available: boolean;
  created_at: string;
}

export interface SalonSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}

// Storage keys
const STORAGE_KEYS = {
  USERS: 'salon_users',
  PROFILES: 'salon_profiles',
  APPOINTMENTS: 'salon_appointments',
  SERVICES: 'salon_services',
  AVAILABLE_DATES: 'salon_available_dates',
  AVAILABLE_TIMES: 'salon_available_times',
  SERVICE_AVAILABILITY: 'salon_service_availability',
  SALON_SETTINGS: 'salon_settings',
  CURRENT_USER: 'salon_current_user',
  PAYMENT_SETTINGS: 'paymentSettings'
};

// Initialize default data
const initializeDefaultData = () => {
  // Default admin user
  const defaultUsers: User[] = [
    {
      id: 'admin-user-id',
      email: 'admin@salon.com',
      role: 'admin',
      user_metadata: { role: 'admin' }
    }
  ];

  // Default admin profile
  const defaultProfiles: Profile[] = [
    {
      id: 'admin-profile-id',
      user_id: 'admin-user-id',
      full_name: 'Administrador do Salon',
      phone: '81996763099',
      email: 'admin@salon.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Default services
  const defaultServices: Service[] = [
    { id: uuidv4(), name: 'Corte Feminino', duration: '45min', price: 80, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Escova e Prancha', duration: '60min', price: 60, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Coloração', duration: '120min', price: 150, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Manicure', duration: '30min', price: 35, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Pedicure', duration: '45min', price: 45, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Sobrancelha', duration: '20min', price: 25, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  // Default salon settings
  const defaultSalonSettings: SalonSetting[] = [
    {
      id: uuidv4(),
      setting_key: 'salon_address',
      setting_value: 'Rua das Flores, 123 - Centro, Recife - PE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      setting_key: 'about_me_text',
      setting_value: 'Profissional especializada em beleza e bem-estar, com anos de experiência em transformar sonhos em realidade. Apaixonada por criar looks únicos que realçam a beleza natural de cada cliente.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Initialize storage if empty
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(defaultProfiles));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(defaultServices));
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AVAILABLE_DATES)) {
    localStorage.setItem(STORAGE_KEYS.AVAILABLE_DATES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AVAILABLE_TIMES)) {
    localStorage.setItem(STORAGE_KEYS.AVAILABLE_TIMES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SERVICE_AVAILABILITY)) {
    localStorage.setItem(STORAGE_KEYS.SERVICE_AVAILABILITY, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALON_SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SALON_SETTINGS, JSON.stringify(defaultSalonSettings));
  }
};

// Generic storage functions
export const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from storage key ${key}:`, error);
    return [];
  }
};

export const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to storage key ${key}:`, error);
  }
};

// Authentication functions
export const signUp = async (email: string, password: string, role: UserRole = 'client') => {
  initializeDefaultData();
  
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    throw new Error('Este email já está cadastrado. Por favor, faça login.');
  }

  const newUser: User = {
    id: uuidv4(),
    email,
    role,
    user_metadata: { role }
  };

  users.push(newUser);
  saveToStorage(STORAGE_KEYS.USERS, users);

  return { user: newUser };
};

export const signIn = async (email: string, password: string) => {
  initializeDefaultData();
  
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  const user = users.find(u => u.email === email);

  if (!user) {
    throw new Error('Email ou senha incorretos');
  }

  // For admin user, check password
  if (email === 'admin@salon.com' && password !== 'Admin@123') {
    throw new Error('Email ou senha incorretos');
  }

  // Set current user
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

  return { user, session: { user } };
};

export const signOut = async () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const currentUserData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!currentUserData) return null;

    const user = JSON.parse(currentUserData);
    
    // Check if user has a profile
    const profiles = getFromStorage<Profile>(STORAGE_KEYS.PROFILES);
    const profile = profiles.find(p => p.user_id === user.id);
    
    if (!profile && user.role !== 'admin') {
      user.user_metadata = { ...user.user_metadata, needsProfile: true };
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Services functions
export const getServices = async () => {
  initializeDefaultData();
  return { data: getFromStorage<Service>(STORAGE_KEYS.SERVICES), error: null };
};

export const createService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
  const services = getFromStorage<Service>(STORAGE_KEYS.SERVICES);
  const newService: Service = {
    ...service,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  services.push(newService);
  saveToStorage(STORAGE_KEYS.SERVICES, services);
  
  return { data: newService, error: null };
};

export const updateService = async (id: string, updates: Partial<Service>) => {
  const services = getFromStorage<Service>(STORAGE_KEYS.SERVICES);
  const index = services.findIndex(s => s.id === id);
  
  if (index === -1) {
    return { data: null, error: new Error('Service not found') };
  }
  
  services[index] = {
    ...services[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  saveToStorage(STORAGE_KEYS.SERVICES, services);
  return { data: services[index], error: null };
};

export const deleteService = async (id: string) => {
  const services = getFromStorage<Service>(STORAGE_KEYS.SERVICES);
  const filteredServices = services.filter(s => s.id !== id);
  saveToStorage(STORAGE_KEYS.SERVICES, filteredServices);
  return { error: null };
};

// Appointments functions
export const createAppointment = async (appointmentData: {
  client_name: string;
  service_id: string;
  date: string;
  time: string;
}) => {
  const appointments = getFromStorage<Appointment>(STORAGE_KEYS.APPOINTMENTS);
  const newAppointment: Appointment = {
    id: uuidv4(),
    ...appointmentData,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  appointments.push(newAppointment);
  saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);
  
  return { data: newAppointment, error: null };
};

// Profiles functions
export const getProfile = async (userId: string) => {
  const profiles = getFromStorage<Profile>(STORAGE_KEYS.PROFILES);
  const profile = profiles.find(p => p.user_id === userId);
  return { data: profile || null, error: null };
};

export const upsertProfile = async (profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
  const profiles = getFromStorage<Profile>(STORAGE_KEYS.PROFILES);
  const existingIndex = profiles.findIndex(p => p.user_id === profileData.user_id);
  
  if (existingIndex >= 0) {
    // Update existing profile
    profiles[existingIndex] = {
      ...profiles[existingIndex],
      ...profileData,
      updated_at: new Date().toISOString()
    };
  } else {
    // Create new profile
    const newProfile: Profile = {
      ...profileData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    profiles.push(newProfile);
  }
  
  saveToStorage(STORAGE_KEYS.PROFILES, profiles);
  return { error: null };
};

// Available dates functions
export const getAvailableDates = async () => {
  return { data: getFromStorage<AvailableDate>(STORAGE_KEYS.AVAILABLE_DATES), error: null };
};

export const createAvailableDate = async (date: string) => {
  const dates = getFromStorage<AvailableDate>(STORAGE_KEYS.AVAILABLE_DATES);
  
  // Check if date already exists
  if (dates.find(d => d.date === date)) {
    return { data: dates.find(d => d.date === date), error: null };
  }
  
  const newDate: AvailableDate = {
    id: uuidv4(),
    date,
    created_at: new Date().toISOString()
  };
  
  dates.push(newDate);
  saveToStorage(STORAGE_KEYS.AVAILABLE_DATES, dates);
  
  return { data: newDate, error: null };
};

// Available times functions
export const getAvailableTimes = async (dateId: string) => {
  const times = getFromStorage<AvailableTime>(STORAGE_KEYS.AVAILABLE_TIMES);
  return { data: times.filter(t => t.date_id === dateId), error: null };
};

export const createAvailableTime = async (timeData: Omit<AvailableTime, 'id' | 'created_at'>) => {
  const times = getFromStorage<AvailableTime>(STORAGE_KEYS.AVAILABLE_TIMES);
  
  // Check if time already exists
  if (times.find(t => t.date_id === timeData.date_id && t.time === timeData.time)) {
    throw new Error('Este horário já está cadastrado');
  }
  
  const newTime: AvailableTime = {
    ...timeData,
    id: uuidv4(),
    created_at: new Date().toISOString()
  };
  
  times.push(newTime);
  saveToStorage(STORAGE_KEYS.AVAILABLE_TIMES, times);
  
  return { data: newTime, error: null };
};

export const updateAvailableTime = async (id: string, updates: Partial<AvailableTime>) => {
  const times = getFromStorage<AvailableTime>(STORAGE_KEYS.AVAILABLE_TIMES);
  const index = times.findIndex(t => t.id === id);
  
  if (index === -1) {
    return { error: new Error('Time not found') };
  }
  
  times[index] = { ...times[index], ...updates };
  saveToStorage(STORAGE_KEYS.AVAILABLE_TIMES, times);
  
  return { error: null };
};

export const deleteAvailableTime = async (id: string) => {
  const times = getFromStorage<AvailableTime>(STORAGE_KEYS.AVAILABLE_TIMES);
  const filteredTimes = times.filter(t => t.id !== id);
  saveToStorage(STORAGE_KEYS.AVAILABLE_TIMES, filteredTimes);
  return { error: null };
};

// Service availability functions
export const getServiceAvailability = async (serviceId: string, dateId: string) => {
  const availability = getFromStorage<ServiceAvailability>(STORAGE_KEYS.SERVICE_AVAILABILITY);
  return { 
    data: availability.filter(a => a.service_id === serviceId && a.date_id === dateId), 
    error: null 
  };
};

export const createServiceAvailability = async (availabilityData: Omit<ServiceAvailability, 'id' | 'created_at'>) => {
  const availability = getFromStorage<ServiceAvailability>(STORAGE_KEYS.SERVICE_AVAILABILITY);
  
  // Check if already exists
  if (availability.find(a => 
    a.service_id === availabilityData.service_id && 
    a.date_id === availabilityData.date_id && 
    a.time === availabilityData.time
  )) {
    throw new Error('Este horário já está cadastrado para este serviço');
  }
  
  const newAvailability: ServiceAvailability = {
    ...availabilityData,
    id: uuidv4(),
    created_at: new Date().toISOString()
  };
  
  availability.push(newAvailability);
  saveToStorage(STORAGE_KEYS.SERVICE_AVAILABILITY, availability);
  
  return { data: newAvailability, error: null };
};

export const updateServiceAvailability = async (id: string, updates: Partial<ServiceAvailability>) => {
  const availability = getFromStorage<ServiceAvailability>(STORAGE_KEYS.SERVICE_AVAILABILITY);
  const index = availability.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { error: new Error('Service availability not found') };
  }
  
  availability[index] = { ...availability[index], ...updates };
  saveToStorage(STORAGE_KEYS.SERVICE_AVAILABILITY, availability);
  
  return { error: null };
};

export const deleteServiceAvailability = async (id: string) => {
  const availability = getFromStorage<ServiceAvailability>(STORAGE_KEYS.SERVICE_AVAILABILITY);
  const filteredAvailability = availability.filter(a => a.id !== id);
  saveToStorage(STORAGE_KEYS.SERVICE_AVAILABILITY, filteredAvailability);
  return { error: null };
};

// Salon settings functions
export const getSalonSettings = async () => {
  initializeDefaultData();
  return { data: getFromStorage<SalonSetting>(STORAGE_KEYS.SALON_SETTINGS), error: null };
};

export const upsertSalonSetting = async (settingKey: string, settingValue: string) => {
  const settings = getFromStorage<SalonSetting>(STORAGE_KEYS.SALON_SETTINGS);
  const existingIndex = settings.findIndex(s => s.setting_key === settingKey);
  
  if (existingIndex >= 0) {
    // Update existing setting
    settings[existingIndex] = {
      ...settings[existingIndex],
      setting_value: settingValue,
      updated_at: new Date().toISOString()
    };
  } else {
    // Create new setting
    const newSetting: SalonSetting = {
      id: uuidv4(),
      setting_key: settingKey,
      setting_value: settingValue,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    settings.push(newSetting);
  }
  
  saveToStorage(STORAGE_KEYS.SALON_SETTINGS, settings);
  return { error: null };
};

// Initialize data on module load
initializeDefaultData();