import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Stack, 
  Box,
  CircularProgress
} from '@mui/material';
import Chart from 'react-apexcharts';
import { db } from '../../../firebase'; // Remove auth import
import { collection, getDocs, collectionGroup, query } from 'firebase/firestore';

const MonthlyEarnings = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllUsersMonthlyEarnings = async () => {
      try {
        // Use collectionGroup to query orderHistory across all users
        const orderHistoryQuery = query(collectionGroup(db, 'orderHistory'));
        const orderHistorySnapshot = await getDocs(orderHistoryQuery);

        // Group orders by month and calculate earnings
        const earningsByMonth = {};
        let totalAmount = 0;

        orderHistorySnapshot.docs.forEach(doc => {
          const orderData = doc.data();
          
          // Only include completed orders
          if (orderData.paymentStatus === 'completed') {
            const orderDate = orderData.orderedAt?.toDate() || new Date();
            const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
            
            earningsByMonth[monthKey] = (earningsByMonth[monthKey] || 0) + orderData.totalAmount;
            totalAmount += orderData.totalAmount;
          }
        });

        // Convert to chart-friendly format
        const chartData = Object.entries(earningsByMonth)
          .sort((a, b) => {
            const [yearA, monthA] = a[0].split('-').map(Number);
            const [yearB, monthB] = b[0].split('-').map(Number);
            return yearA - yearB || monthA - monthB;
          })
          .map(([month, amount]) => ({
            x: month,
            y: parseFloat(amount.toFixed(2))
          }));

        setMonthlyData(chartData);
        setTotalEarnings(totalAmount);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching monthly earnings for all users:', error);
        setLoading(false);
      }
    };

    fetchAllUsersMonthlyEarnings();
  }, []);

  // The rest of the component remains the same as the previous version
  const chartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      height: 180,
    },
    xaxis: {
      type: 'category',
      categories: monthlyData.map(item => item.x),
      labels: {
        style: {
          colors: '#888',
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (val) => `$${val.toFixed(2)}`,
        style: {
          colors: '#888',
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `$${val.toFixed(2)}`,
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100]
      }
    },
    colors: ['#4CAF50']
  };

  const chartSeries = [{
    name: 'Monthly Earnings',
    data: monthlyData
  }];

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600}>
            Total Monthly Earnings
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" fontWeight={700}>
              ${totalEarnings.toFixed(2)}
            </Typography>
          </Box>

          <Chart 
            options={chartOptions}
            series={chartSeries}
            type="area"
            height={180}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MonthlyEarnings;