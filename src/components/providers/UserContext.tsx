"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface User {
    id: string;
    name: string;
    role: string;
    organizationId?: string;
}

interface UserContextType {
    user: User | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ user, children }: { user: User | null; children: ReactNode }) {
    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
