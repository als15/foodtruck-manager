import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { Business, UserBusiness } from '../types';

interface UserBusinessWithBusiness extends UserBusiness {
  business?: Business;
}

interface BusinessContextType {
  currentBusiness: Business | null;
  userBusinesses: UserBusinessWithBusiness[];
  userRole: 'owner' | 'admin' | 'member' | 'viewer' | null;
  loading: boolean;
  error: string | null;
  switchBusiness: (businessId: string) => Promise<void>;
  createBusiness: (businessData: Partial<Business>) => Promise<Business>;
  updateBusiness: (businessId: string, updates: Partial<Business>) => Promise<void>;
  refetchBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<UserBusinessWithBusiness[]>([]);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | 'viewer' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousUserIdRef = React.useRef<string | null>(null);

  // Load user's businesses
  const loadUserBusinesses = async () => {
    if (!user) {
      setUserBusinesses([]);
      setCurrentBusiness(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all businesses the user has access to
      const { data: userBusinessData, error: userBusinessError } = await supabase
        .from('user_businesses')
        .select(`
          *,
          business:businesses(*)
        `)
        .eq('user_id', user.id);

      if (userBusinessError) throw userBusinessError;

      const formattedUserBusinesses = userBusinessData?.map(ub => ({
        id: ub.id,
        userId: ub.user_id,
        businessId: ub.business_id,
        role: ub.role,
        joinedAt: new Date(ub.joined_at),
        permissions: ub.permissions,
        business: {
          id: ub.business.id,
          name: ub.business.name,
          createdAt: new Date(ub.business.created_at),
          updatedAt: new Date(ub.business.updated_at),
          settings: ub.business.settings,
          address: ub.business.address,
          phone: ub.business.phone,
          email: ub.business.email,
          taxId: ub.business.tax_id,
          currency: ub.business.currency,
          timezone: ub.business.timezone,
          subscriptionTier: ub.business.subscription_tier,
          subscriptionStatus: ub.business.subscription_status,
        }
      })) || [];

      setUserBusinesses(formattedUserBusinesses);

      // If there's a saved business ID in localStorage, try to use it
      const savedBusinessId = localStorage.getItem('currentBusinessId');
      const savedBusiness = formattedUserBusinesses.find(ub => ub.businessId === savedBusinessId);

      if (savedBusiness) {
        setCurrentBusiness(savedBusiness.business);
        setUserRole(savedBusiness.role);
      } else if (formattedUserBusinesses.length > 0) {
        // Otherwise, use the first business
        setCurrentBusiness(formattedUserBusinesses[0].business);
        setUserRole(formattedUserBusinesses[0].role);
        localStorage.setItem('currentBusinessId', formattedUserBusinesses[0].businessId);
      }
    } catch (err) {
      console.error('Error loading user businesses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  // Switch to a different business
  const switchBusiness = async (businessId: string) => {
    const userBusiness = userBusinesses.find(ub => ub.businessId === businessId);
    if (!userBusiness || !userBusiness.business) {
      throw new Error('You do not have access to this business');
    }

    setCurrentBusiness(userBusiness.business);
    setUserRole(userBusiness.role);
    localStorage.setItem('currentBusinessId', businessId);
  };

  // Create a new business
  const createBusiness = async (businessData: Partial<Business>) => {
    if (!user) throw new Error('Must be authenticated to create a business');

    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          name: businessData.name,
          address: businessData.address,
          phone: businessData.phone,
          email: businessData.email,
          tax_id: businessData.taxId,
          currency: businessData.currency || 'USD',
          timezone: businessData.timezone || 'UTC',
          settings: businessData.settings || {},
        })
        .select()
        .single();

      if (error) throw error;

      const newBusiness: Business = {
        id: data.id,
        name: data.name,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        settings: data.settings,
        address: data.address,
        phone: data.phone,
        email: data.email,
        taxId: data.tax_id,
        currency: data.currency,
        timezone: data.timezone,
        subscriptionTier: data.subscription_tier,
        subscriptionStatus: data.subscription_status,
      };

      // Reload businesses to get the updated list with user association
      await loadUserBusinesses();

      return newBusiness;
    } catch (err) {
      console.error('Error creating business:', err);
      throw err;
    }
  };

  // Update business details
  const updateBusiness = async (businessId: string, updates: Partial<Business>) => {
    const userBusiness = userBusinesses.find(ub => ub.businessId === businessId);
    if (!userBusiness || !['owner', 'admin'].includes(userBusiness.role)) {
      throw new Error('You do not have permission to update this business');
    }

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: updates.name,
          address: updates.address,
          phone: updates.phone,
          email: updates.email,
          tax_id: updates.taxId,
          currency: updates.currency,
          timezone: updates.timezone,
          settings: updates.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (error) throw error;

      // Reload businesses to get the updated data
      await loadUserBusinesses();
    } catch (err) {
      console.error('Error updating business:', err);
      throw err;
    }
  };

  const refetchBusinesses = async () => {
    await loadUserBusinesses();
  };

  useEffect(() => {
    // Only reload if the user ID actually changed (not just a reconnection)
    const currentUserId = user?.id || null;
    if (currentUserId !== previousUserIdRef.current) {
      previousUserIdRef.current = currentUserId;
      loadUserBusinesses();
    }
  }, [user]);

  return (
    <BusinessContext.Provider
      value={{
        currentBusiness,
        userBusinesses,
        userRole,
        loading,
        error,
        switchBusiness,
        createBusiness,
        updateBusiness,
        refetchBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};