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
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useStatTotalDonors } from '../../hooks/useStatTotalDonors';
import { useStatTotalUsers } from '../../hooks/useStatTotalUsers';
import { useStatTotalShuraMembers } from '../../hooks/useStatTotalShuraMembers';
import { useStatTotalDonationAmount } from '../../hooks/useStatTotalDonationAmount';
import { useStatAppealsByShura } from '../../hooks/useStatAppealsByShura';
import { useStatCancelledAppeals } from '../../hooks/useStatCancelledAppeals';
import { useWalletStats } from '../../hooks/useWalletStats';

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
  
  // Real API hooks
  const { stats: dashboardStats, loading: dashboardLoading, error: dashboardError } = useDashboardStats();
  const { data: totalDonors, loading: donorsLoading, error: donorsError } = useStatTotalDonors();
  const { data: totalUsers, loading: usersLoading, error: usersError } = useStatTotalUsers();
  const { data: totalShuraMembers, loading: shuraLoading, error: shuraError } = useStatTotalShuraMembers();
  const { data: totalDonationAmount, loading: donationLoading, error: donationError } = useStatTotalDonationAmount();
  const { data: appealsByShura, loading: appealsLoading, error: appealsError } = useStatAppealsByShura();
  const { data: cancelledAppeals, loading: cancelledLoading, error: cancelledError } = useStatCancelledAppeals();
  const { data: walletStats, loading: walletLoading, error: walletError } = useWalletStats();

  // Combine loading states
  const loading = dashboardLoading || donorsLoading || usersLoading || shuraLoading || 
                  donationLoading || appealsLoading || cancelledLoading || walletLoading;
  
  // Combine error states
  const error = dashboardError || donorsError || usersError || shuraError || 
                donationError || appealsError || cancelledError || walletError;

  // Calculate stats from real data
  const stats = {
    totalAppeals: dashboardStats?.total_appeals || appealsByShura?.total || 0,
    approvedAppeals: dashboardStats?.approved_appeals || appealsByShura?.approved || 0,
    disbursedDonations: totalDonationAmount || 0,
    pendingApprovals: dashboardStats?.pending_approvals || appealsByShura?.pending || 0,
    activeDonors: totalDonors || 0,
    totalWalletBalance: walletStats?.total_balance || 0,
    shuraMembers: totalShuraMembers || 0,
    blockedUsers: dashboardStats?.blocked_users || 0
  };

  // Generate charts data from real API data
  const charts = {
    donationsOverTime: dashboardStats?.donations_over_time || [
      { month: 'Jan', donations: 0 },
      { month: 'Feb', donations: 0 },
      { month: 'Mar', donations: 0 },
      { month: 'Apr', donations: 0 },
      { month: 'May', donations: 0 },
      { month: 'Jun', donations: 0 }
    ],
    appealStatus: [
      { name: 'Approved', value: stats.approvedAppeals },
      { name: 'Pending', value: stats.pendingApprovals },
      { name: 'Rejected', value: cancelledAppeals || 0 }
    ],
    userRoles: [
      { role: 'Donors', count: stats.activeDonors },
      { role: 'Recipients', count: totalUsers - stats.activeDonors - stats.shuraMembers },
      { role: 'Shura', count: stats.shuraMembers },
      { role: 'Admin', count: 1 }
    ],
    walletActivity: walletStats?.activity || [
      { day: 'Mon', credit: 0, debit: 0 },
      { day: 'Tue', credit: 0, debit: 0 },
      { day: 'Wed', credit: 0, debit: 0 },
      { day: 'Thu', credit: 0, debit: 0 },
      { day: 'Fri', credit: 0, debit: 0 },
      { day: 'Sat', credit: 0, debit: 0 },
      { day: 'Sun', credit: 0, debit: 0 }
    ]
  };

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