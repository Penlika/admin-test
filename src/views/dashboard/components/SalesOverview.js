import React, { useState, useEffect } from 'react';
import { 
  Select, 
  MenuItem, 
  CircularProgress, 
  Typography, 
  Box 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import { db } from '../../../firebase'; // Import Firestore from firebase.js
import { collection, getDocs, query, where } from 'firebase/firestore';
import DashboardCard from '../../../components/shared/DashboardCard';

const AdminSalesOverview = () => {
  // State for month selection and data
  const [month, setMonth] = useState('1');
  const [salesData, setSalesData] = useState({
    earnings: [],
    expenses: [],
    categories: []
  });
  const [loading, setLoading] = useState(true);

  // Theme and color setup
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;


  useEffect(() => {
    const fetchAllUsersSalesData = async () => {
      try {
        setLoading(true);
  
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
  
        // Aggregate order data
        const earningsByDay = {};
        const expensesByDay = {};
        const categories = new Set();
  
        // Iterate through all users
        for (const userDoc of usersSnapshot.docs) {
          const orderHistoryRef = collection(userDoc.ref, 'orderHistory');
          const q = query(orderHistoryRef, where('paymentStatus', '==', 'completed'));
          const orderHistorySnapshot = await getDocs(q);
  
          orderHistorySnapshot.docs.forEach(doc => {
            const orderData = doc.data();
            const orderDate = orderData.orderedAt?.toDate() || new Date();
            
            // Format date as DD/MM
            const dateKey = orderDate.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit' 
            }).replace(/\//g, '/');
  
            // Accumulate earnings
            earningsByDay[dateKey] = (earningsByDay[dateKey] || 0) + orderData.totalAmount;
            
            // Calculate expenses as 42% of each item's total price
            const orderExpenses = orderData.items.reduce((total, item) => 
              total + (item.totalPrice * 0.42), 0);
            expensesByDay[dateKey] = (expensesByDay[dateKey] || 0) + orderExpenses;
  
            // Collect unique categories
            categories.add(dateKey);
          });
        }
  
        // Sort categories chronologically
        const sortedCategories = Array.from(categories).sort((a, b) => {
          const [dayA, monthA] = a.split('/').map(Number);
          const [dayB, monthB] = b.split('/').map(Number);
          return dayA - dayB;
        });
  
        // Convert to chart data series
        const earnings = sortedCategories.map(cat => 
          earningsByDay[cat] ? parseFloat(earningsByDay[cat].toFixed(2)) : 0
        );
        const expenses = sortedCategories.map(cat => 
          expensesByDay[cat] ? parseFloat(expensesByDay[cat].toFixed(2)) : 0
        );
  
        setSalesData({
          earnings,
          expenses,
          categories: sortedCategories
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin sales data:', error);
        setLoading(false);
      }
    };
  
    fetchAllUsersSalesData();
  }, [month]);
  

  // Chart configuration (same as previous version)
  const optionscolumnchart = {
    chart: {
      type: 'bar',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: '#adb0bb',
      toolbar: { show: true },
      height: 370,
    },
    colors: [primary, secondary],
    plotOptions: {
      bar: {
        horizontal: false,
        barHeight: '60%',
        columnWidth: '42%',
        borderRadius: [6],
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all',
      },
    },
    stroke: {
      show: true,
      width: 5,
      lineCap: "butt",
      colors: ["transparent"],
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
    },
    yaxis: {
      tickAmount: 4,
      labels: {
        formatter: (val) => `$${val.toFixed(2)}`
      }
    },
    xaxis: {
      categories: salesData.categories,
      axisBorder: { show: false },
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      fillSeriesColor: false,
      y: {
        formatter: (val) => `$${val.toFixed(2)}`
      }
    },
  };

  const seriescolumnchart = [
    {
      name: 'Total Earnings',
      data: salesData.earnings,
    },
    {
      name: 'Total Expenses',
      data: salesData.expenses,
    },
  ];

  if (loading) {
    return (
      <DashboardCard title="Admin Sales Overview">
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height={370}
        >
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard 
      title="Sales Overview" 
    >
      <Chart
        options={optionscolumnchart}
        series={seriescolumnchart}
        type="bar"
        height="370px"
      />
      <Box mt={2} display="flex" justifyContent="space-between">
        <Typography variant="body2">
          Total Earnings: ${salesData.earnings.reduce((a, b) => a + b, 0).toFixed(2)}
        </Typography>
        <Typography variant="body2">
          Total Expenses: ${salesData.expenses.reduce((a, b) => a + b, 0).toFixed(2)}
        </Typography>
      </Box>
    </DashboardCard>
  );
};

export default AdminSalesOverview;
