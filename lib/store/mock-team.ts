export type TeamMember = {
    id: number;
    name: string;
    role: string;
    avatarInitial: string;
    avatarColor: string;
    specialty: string;
    cases: number;
    hours: number;
    performance: string;
    email: string;
    phone: string;
    city: string;
    rating: number;
    cases_completed: number;
    experience_years: number;
}

const defaultTeamMembers: TeamMember[] = [
    {
        id: 1,
        name: "أحمد محمود",
        role: "شريك أول",
        avatarInitial: "أ",
        avatarColor: "bg-purple text-white",
        specialty: "قانون العمل",
        cases: 15,
        hours: 156.5,
        performance: "ممتاز",
        email: "ahmed@firm.com",
        phone: "01011112222",
        city: "القاهرة",
        rating: 4.8,
        cases_completed: 124,
        experience_years: 15
    },
    {
        id: 2,
        name: "مصطفى كمال",
        role: "محامي مساعد",
        avatarInitial: "م",
        avatarColor: "bg-accent text-white",
        specialty: "قانون الشركات",
        cases: 12,
        hours: 142.0,
        performance: "جيد جداً",
        email: "mostafa@firm.com",
        phone: "01111113333",
        city: "الجيزة",
        rating: 4.5,
        cases_completed: 89,
        experience_years: 8
    },
    {
        id: 3,
        name: "محمود حسن",
        role: "شريك",
        avatarInitial: "م",
        avatarColor: "bg-magenta text-white",
        specialty: "عقارات",
        cases: 14,
        hours: 168.5,
        performance: "ممتاز",
        email: "mahmoud@firm.com",
        phone: "01211114444",
        city: "الإسكندرية",
        rating: 4.2,
        cases_completed: 56,
        experience_years: 12
    },
    {
        id: 4,
        name: "كريم عبد العزيز",
        role: "محامي متدرب",
        avatarInitial: "ك",
        avatarColor: "bg-orange-500 text-white",
        specialty: "قانون عام",
        cases: 5,
        hours: 110.0,
        performance: "جيد",
        email: "karim@firm.com",
        phone: "01511115555",
        city: "القاهرة",
        rating: 4.9,
        cases_completed: 210,
        experience_years: 2
    },
    {
        id: 5,
        name: "فاطمة الزهراء",
        role: "مساعد قانوني",
        avatarInitial: "ف",
        avatarColor: "bg-blue-500 text-white",
        specialty: "بحوث قانونية",
        cases: 20,
        hours: 180.0,
        performance: "ممتاز",
        email: "fatma@firm.com",
        phone: "01011116666",
        city: "القاهرة",
        rating: 4.7,
        cases_completed: 40,
        experience_years: 5
    }
]

export const getTeam = (): TeamMember[] => {
    if (typeof window === 'undefined') return [...defaultTeamMembers];
    
    const stored = localStorage.getItem('mockTeamMembers');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [...defaultTeamMembers];
        }
    }
    
    return [...defaultTeamMembers];
}

export const saveTeam = (team: TeamMember[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('mockTeamMembers', JSON.stringify(team));
    }
}

export const addMember = (member: TeamMember) => {
    const current = getTeam();
    const newTeam = [member, ...current];
    saveTeam(newTeam);
}

export const deleteMember = (id: number) => {
    const current = getTeam();
    const newTeam = current.filter(m => m.id !== id);
    saveTeam(newTeam);
}
