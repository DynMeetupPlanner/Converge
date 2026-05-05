import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  username: string;
}

export interface Member {
  userId: string;
  name: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  preference?: string;
}

export interface Plan {
  _id: string;
  name: string;
  creatorId: string;
  members: Member[];
  midpoint?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
}

interface PlanContextType {
  plans: Plan[];
  currentPlan: Plan | null;
  selectedUsers: User[];
  setPlans: (plans: Plan[]) => void;
  setCurrentPlan: (plan: Plan | null) => void;
  setSelectedUsers: (users: User[]) => void;
  addSelectedUser: (user: User) => void;
  removeSelectedUser: (userId: string) => void;
  clearSelectedUsers: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const addSelectedUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const clearSelectedUsers = () => {
    setSelectedUsers([]);
  };

  return (
    <PlanContext.Provider
      value={{
        plans,
        currentPlan,
        selectedUsers,
        setPlans,
        setCurrentPlan,
        setSelectedUsers,
        addSelectedUser,
        removeSelectedUser,
        clearSelectedUsers,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlans() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlans must be used within a PlanProvider');
  }
  return context;
}
