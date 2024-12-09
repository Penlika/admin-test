import React, { useState, useEffect } from 'react';
import DashboardCard from '../../../components/shared/DashboardCard';
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  timelineOppositeContentClasses,
} from '@mui/lab';
import { Link, Typography, Alert, CircularProgress, Box } from '@mui/material';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from '../../../firebase'; // Import the Firestore instance from firebase.js

const RecentTransactions = () => {
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllOrderHistory = async () => {
      try {
        // Get all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        const allOrders = [];

        // Iterate through each user and fetch their order history
        for (const userDoc of usersSnapshot.docs) {
          const orderHistorySnapshot = await getDocs(
            collection(doc(db, 'users', userDoc.id), 'orderHistory')
          );

          // Transform orders and add user information
          const userOrders = orderHistorySnapshot.docs.map(orderDoc => ({
            id: orderDoc.id,
            userId: userDoc.id,
            userName: userDoc.data().username || 'Unknown User', // Assuming there's a name field
            ...orderDoc.data(),
          }));

          allOrders.push(...userOrders);
        }

        // Sort all orders by timestamp in descending order
        const sortedOrders = allOrders.sort((a, b) => {
          const timeA = a.orderedAt?.toDate ? a.orderedAt.toDate().getTime() : 0;
          const timeB = b.orderedAt?.toDate ? b.orderedAt.toDate().getTime() : 0;
          return timeB - timeA;
        });

        // Limit to most recent 20 orders
        setOrderHistory(sortedOrders.slice(0, 20));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching all order history:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAllOrderHistory();
  }, []);

  // Color mapping for timeline dots
  const getTimelineDotColor = (index) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'error'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <DashboardCard title="All Recent Transactions">
        <Box display="flex" justifyContent="center" alignItems="center" p={2}>
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="All Recent Transactions">
        <Alert severity="error">{error}</Alert>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="All Recent Transactions">
      <Box
        sx={{
          maxHeight: 400, // Limit the height of the container
          overflowY: 'auto', // Enable vertical scrolling
          px: 2, // Padding for horizontal spacing
        }}
      >
        {orderHistory.length === 0 ? (
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ py: 2 }}
          >
            No recent transactions found
          </Typography>
        ) : (
          <Timeline
            sx={{
              p: 0,
              '& .MuiTimelineConnector-root': {
                width: '2px',
                backgroundColor: '#e0e0e0',
              },
              [`& .${timelineOppositeContentClasses.root}`]: {
                flex: 0.3, // Balance spacing
                paddingLeft: 0,
                textAlign: 'right', // Align text to the right for symmetry
              },
            }}
          >
            {orderHistory.map((order, index) => (
              <TimelineItem key={`${order.userId}-${order.id}`}>
                <TimelineOppositeContent>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontWeight: 500 }}
                  >
                    {order.orderedAt &&
                      new Date(order.orderedAt.toDate()).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot
                    color={getTimelineDotColor(index)}
                    variant="outlined"
                    sx={{
                      borderWidth: 2,
                    }}
                  />
                  {index < orderHistory.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography fontWeight="600">
                    {order.userName} - Payment {order.paymentStatus}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total: ${order.totalAmount.toFixed(2)} via {order.paymentMethod}
                  </Typography>
                  <Link href="#" underline="none">
                    #{order.id.slice(3)}
                  </Link>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Box>
    </DashboardCard>
  );
};

export default RecentTransactions;
