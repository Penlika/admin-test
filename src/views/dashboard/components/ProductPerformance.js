import React, { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import DashboardCard from '../../../components/shared/DashboardCard';
import { db } from '../../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';

const ProductPerformance = () => {
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllItems = async () => {
            try {
                const itemOccurrences = {};

                // Query all users to get order history
                const usersSnapshot = await getDocs(collection(db, 'users'));

                for (const userDoc of usersSnapshot.docs) {
                    const orderHistoryRef = collection(db, 'users', userDoc.id, 'orderHistory');
                    const orderHistorySnapshot = await getDocs(orderHistoryRef);

                    for (const orderDoc of orderHistorySnapshot.docs) {
                        const orderData = orderDoc.data();

                        if (orderData.items && Array.isArray(orderData.items)) {
                            orderData.items.forEach((item) => {
                                // Unique key for each item
                                const itemKey = `${item.itemId}-${item.name}`;

                                // Parse item price and quantity
                                const price = parseFloat(item.prices?.[0]?.price || 0);
                                const quantity = item.prices?.[0]?.quantity || 1;

                                if (itemOccurrences[itemKey]) {
                                    // Update existing item data
                                    itemOccurrences[itemKey].count += 1;
                                    itemOccurrences[itemKey].totalRevenue += price * quantity;
                                } else {
                                    // Add new item entry
                                    itemOccurrences[itemKey] = {
                                        name: item.name,
                                        itemId: item.itemId,
                                        count: 1,
                                        totalRevenue: price * quantity,
                                        image: item.imagelink_square || '', // Image link if available
                                    };
                                }
                            });
                        }
                    }
                }

                // Convert occurrences object to array and sort by count
                const sortedItems = Object.values(itemOccurrences).sort(
                    (a, b) => b.count - a.count
                );

                setAllItems(sortedItems);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching items:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchAllItems();
    }, []);

    if (loading) {
        return (
            <DashboardCard title="Product Performance">
                <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                    <CircularProgress />
                </Box>
            </DashboardCard>
        );
    }

    if (error) {
        return (
            <DashboardCard title="Product Performance">
                <Alert severity="error">{error}</Alert>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard title="Product Performance">
            <Box sx={{ overflow: 'auto', width: { xs: '280px', sm: 'auto' } }}>
                <Table
                    aria-label="product performance table"
                    sx={{
                        whiteSpace: "nowrap",
                        mt: 2
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Rank
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Item Name
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Times Sold
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Total Revenue
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    Priority
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allItems.map((item, index) => {
                            const getPriority = (count) => {
                                if (count > 10) return { label: 'High', color: 'warning.main' };
                                if (count > 5) return { label: 'Medium', color: 'secondary.main' };
                                return { label: 'Low', color: 'primary.main' };
                            };

                            const priority = getPriority(item.count);

                            return (
                                <TableRow key={item.itemId}>
                                    <TableCell>
                                        <Typography sx={{ fontSize: "15px", fontWeight: "500" }}>
                                            {index + 1}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                style={{ width: 80, height: 50, marginRight: 10 }}
                                            />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {item.name}
                                                </Typography>
                                                <Typography
                                                    color="textSecondary"
                                                    sx={{ fontSize: "13px" }}
                                                >
                                                    {item.itemId}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color="textSecondary" variant="subtitle2" fontWeight={400}>
                                            {item.count}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6">
                                            ${item.totalRevenue.toFixed(2)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            sx={{
                                                px: "4px",
                                                backgroundColor: priority.color,
                                                color: "#fff",
                                            }}
                                            size="small"
                                            label={priority.label}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
        </DashboardCard>
    );
};

export default ProductPerformance;
