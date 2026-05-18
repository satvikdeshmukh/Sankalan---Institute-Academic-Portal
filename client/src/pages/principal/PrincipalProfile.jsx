import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ProfessionalProfile from '../../components/ProfessionalProfile.jsx';

export default function PrincipalProfile() {
    const { user } = useAuth();
    return <ProfessionalProfile user={user} />;
}
