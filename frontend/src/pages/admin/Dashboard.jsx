import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  MegaphoneIcon,
  CheckCircleIcon,
  HandRaisedIcon,
  ClockIcon,
  UserIcon,
  WalletIcon,
  ScaleIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Utility function for Rs formatting
const formatRs = (amount) => {
  if (amount >= 1000000) {
    return `Rs ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `Rs ${(amount / 1000).toFixed(0)}k`;
  }
  return `Rs ${amount}`;
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, bgColor, textColor, isLoading, error }) => {
  const { isDark } = useTheme();
  
  if (isLoading) {
    return (
      <div className={`p-6 rounded-lg ${bgColor} ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`}>
        <div className="flex items-center justify-between">
          <div className={`h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded w-24`}></div>
          <div className={`h-8 w-8 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
        </div>
        <div className={`mt-4 h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded w-16`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg ${bgColor} ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-red-200'} border`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</h3>
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
        </div>
        <p className="mt-2 text-xs text-red-600">Error loading data</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : bgColor} shadow-sm`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</h3>
        <Icon className={`h-6 w-6 ${textColor}`} />
      </div>
      <p className={`mt-2 text-2xl font-semibold ${textColor}`}>
        {typeof value === 'number' && title.toLowerCase().includes('donation') || title.toLowerCase().includes('wallet') || title.toLowerCase().includes('disbursed')
          ? formatRs(value)
          : value}
      </p>
    </div>
  );
};

// Chart Components
const DonationsOverTimeChart = ({ data, isLoading, error }) => {
  const { isDark } = useTheme();
  
  if (isLoading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
        <div className={`h-64 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error loading chart data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Donations Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="month" stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <Tooltip 
            formatter={(value) => formatRs(value)}
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              color: isDark ? '#f3f4f6' : '#111827'
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="donations" stroke="#3B82F6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const AppealStatusChart = ({ data, isLoading, error }) => {
  const { isDark } = useTheme();
  
  if (isLoading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
        <div className={`h-64 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error loading chart data</p>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Appeal Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              color: isDark ? '#f3f4f6' : '#111827'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const UserRolesChart = ({ data, isLoading, error }) => {
  const { isDark } = useTheme();
  
  if (isLoading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
        <div className={`h-64 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error loading chart data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Users by Role</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="role" stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <Tooltip 
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              color: isDark ? '#f3f4f6' : '#111827'
            }}
          />
          <Bar dataKey="count" fill="#8B5CF6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const WalletActivityChart = ({ data, isLoading, error }) => {
  const { isDark } = useTheme();
  
  if (isLoading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
        <div className={`h-64 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error loading chart data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Wallet Activity (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="day" stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <Tooltip 
            formatter={(value) => formatRs(value)}
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              color: isDark ? '#f3f4f6' : '#111827'
            }}
          />
          <Legend />
          <Bar dataKey="credit" stackId="a" fill="#10B981" />
          <Bar dataKey="debit" stackId="a" fill="#EF4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    totalAppeals: 0,
    approvedAppeals: 0,
    disbursedDonations: 0,
    pendingApprovals: 0,
    activeDonors: 0,
    totalWalletBalance: 0,
    shuraMembers: 0,
    blockedUsers: 0
  });
  const [charts, setCharts] = useState({
    donationsOverTime: [],
    appealStatus: [],
    userRoles: [],
    walletActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for demonstration
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock stats data
        setStats({
          totalAppeals: 45,
          approvedAppeals: 30,
          disbursedDonations: 254000,
          pendingApprovals: 12,
          activeDonors: 61,
          totalWalletBalance: 381000,
          shuraMembers: 5,
          blockedUsers: 1
        });

        // Mock charts data
        setCharts({
          donationsOverTime: [
            { month: 'Jan', donations: 15000 },
            { month: 'Feb', donations: 18000 },
            { month: 'Mar', donations: 22000 },
            { month: 'Apr', donations: 17000 },
            { month: 'May', donations: 23000 },
            { month: 'Jun', donations: 28000 }
          ],
          appealStatus: [
            { name: 'Approved', value: 30 },
            { name: 'Pending', value: 12 },
            { name: 'Rejected', value: 3 }
          ],
          userRoles: [
            { role: 'Donors', count: 45 },
            { role: 'Recipients', count: 32 },
            { role: 'Shura', count: 5 },
            { role: 'Admin', count: 3 }
          ],
          walletActivity: [
            { day: 'Mon', credit: 5000, debit: 2000 },
            { day: 'Tue', credit: 3000, debit: 1500 },
            { day: 'Wed', credit: 7000, debit: 3000 },
            { day: 'Thu', credit: 4000, debit: 2500 },
            { day: 'Fri', credit: 6000, debit: 1800 },
            { day: 'Sat', credit: 2000, debit: 1000 },
            { day: 'Sun', credit: 3500, debit: 2200 }
          ]
        });

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Total Appeals',
      value: stats.totalAppeals,
      icon: MegaphoneIcon,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Approved Appeals',
      value: stats.approvedAppeals,
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Disbursed Donations',
      value: stats.disbursedDonations,
      icon: HandRaisedIcon,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: ClockIcon,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'Active Donors',
      value: stats.activeDonors,
      icon: UserIcon,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Total Wallet Balance',
      value: stats.totalWalletBalance,
      icon: WalletIcon,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600'
    },
    {
      title: 'Shura Members',
      value: stats.shuraMembers,
      icon: ScaleIcon,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Blocked Users',
      value: stats.blockedUsers,
      icon: NoSymbolIcon,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Dashboard</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Overview of Mawaddah platform statistics</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            bgColor={card.bgColor}
            textColor={card.textColor}
            isLoading={loading}
            error={error}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonationsOverTimeChart
          data={charts.donationsOverTime}
          isLoading={loading}
          error={error}
        />
        <AppealStatusChart
          data={charts.appealStatus}
          isLoading={loading}
          error={error}
        />
        <UserRolesChart
          data={charts.userRoles}
          isLoading={loading}
          error={error}
        />
        <WalletActivityChart
          data={charts.walletActivity}
          isLoading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default Dashboard; 